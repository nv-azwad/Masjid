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

      // Send web push to PWA subscribers
      const webSubs = await prisma.webPushSubscription.findMany({
        where: { active: true },
        select: { id: true, endpoint: true, p256dh: true, auth: true },
      })
      if (webSubs.length > 0) {
        await sendWebPush(webSubs, data.title, data.message)
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

// DELETE /api/notifications — admin can delete a notification
export async function DELETE(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    await prisma.notification.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete notification error:', error.message)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}

async function sendWebPush(subscriptions, title, message) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('Web push skipped: VAPID keys not configured')
    return
  }
  try {
    const webpush = require('web-push')
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@gausulazammasjid.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )

    const payload = JSON.stringify({ title, body: message })
    const expired = []

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          expired.push(sub.id)
        }
        console.error('Web push send error:', err.message)
      }
    }

    if (expired.length > 0) {
      await prisma.webPushSubscription.deleteMany({ where: { id: { in: expired } } })
    }
  } catch (e) {
    console.error('Web push error:', e.message)
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
