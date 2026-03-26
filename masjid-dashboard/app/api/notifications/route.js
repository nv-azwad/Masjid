import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../lib/auth'
import { validate, notificationSchema } from '../../../lib/validations'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/notifications - public (used by dashboard)
export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { sentAt: 'desc' },
      take: 20,
    })
    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Database error:', error.message)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { success, data, error } = validate(notificationSchema, body)
    if (!success) return NextResponse.json({ error }, { status: 400 })

    if (user.role === 'ADMIN') {
      const notification = await prisma.notification.create({
        data: { title: data.title, message: data.message },
      })

      const tokens = await prisma.pushToken.findMany({
        where: { active: true },
        select: { token: true },
      })

      if (tokens.length > 0) {
        await sendExpoPush(tokens.map(t => t.token), data.title, data.message)
      }

      return NextResponse.json(notification)
    }

    const pending = await prisma.pendingChange.create({
      data: {
        resourceType: 'NOTIFICATION',
        action: 'CREATE',
        data: { title: data.title, message: data.message },
        submittedBy: user.id,
      },
    })
    return NextResponse.json({ pending: true, message: 'Notification submitted for admin approval', pendingChange: pending })
  } catch (error) {
    console.error('Notification error:', error.message)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}

async function sendExpoPush(tokens, title, body) {
  const messages = tokens.map(token => ({
    to: token, sound: 'default', title, body, data: { type: 'announcement' },
  }))

  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100)
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      })
      const data = await res.json()
      if (data.data) {
        const invalid = []
        data.data.forEach((item, idx) => {
          if (item.status === 'error' && item.details?.error === 'DeviceNotRegistered') {
            invalid.push(batch[idx].to)
          }
        })
        if (invalid.length > 0) {
          await prisma.pushToken.deleteMany({ where: { token: { in: invalid } } })
        }
      }
    } catch (e) {
      console.error('Expo Push error:', e.message)
    }
  }
}
