import { prisma } from '../../../lib/prisma'
import { requireAuth, requireAdmin } from '../../../lib/auth'
import { validate, pendingReviewSchema } from '../../../lib/validations'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/pending - Get pending changes
export async function GET(request) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const where = user.role === 'ADMIN' ? {} : { submittedBy: user.id }

    const changes = await prisma.pendingChange.findMany({
      where,
      include: {
        submitter: { select: { id: true, name: true, role: true } },
        reviewer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(changes)
  } catch (error) {
    console.error('Pending changes error:', error.message)
    return NextResponse.json({ error: 'Failed to load pending changes' }, { status: 500 })
  }
}

// PUT /api/pending - Approve or deny a pending change (admin only)
export async function PUT(request) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { success, data, error } = validate(pendingReviewSchema, body)
    if (!success) return NextResponse.json({ error }, { status: 400 })

    const change = await prisma.pendingChange.findUnique({ where: { id: data.id } })
    if (!change) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (change.status !== 'PENDING') {
      return NextResponse.json({ error: 'Already reviewed' }, { status: 400 })
    }

    // If approved, apply the change
    if (data.status === 'APPROVED') {
      await applyChange(change)
    }

    const updated = await prisma.pendingChange.update({
      where: { id: data.id },
      data: { status: data.status, reason: data.reason || null, reviewedBy: admin.id },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Pending change error:', error.message)
    return NextResponse.json({ error: 'Failed to process change' }, { status: 500 })
  }
}

// Apply an approved change to the database
async function applyChange(change) {
  const { resourceType, action, resourceId, data } = change

  switch (resourceType) {
    case 'PRAYER':
      if (action === 'UPDATE') {
        if (data.isNext) {
          await prisma.prayer.updateMany({ data: { isNext: false } })
        }
        await prisma.prayer.update({
          where: { id: resourceId },
          data: { name: data.name, adhan: data.adhan ?? undefined, time: data.time, isNext: data.isNext ?? undefined },
        })
      }
      break

    case 'IMAM':
      if (action === 'CREATE') {
        const count = await prisma.imam.count()
        await prisma.imam.create({
          data: { name: data.name, role: data.role, bio: data.bio, contact: data.contact, order: count + 1 },
        })
      } else if (action === 'UPDATE') {
        const { id: _, ...updateData } = data
        await prisma.imam.update({ where: { id: resourceId }, data: updateData })
      } else if (action === 'DELETE') {
        await prisma.imam.delete({ where: { id: resourceId } })
      }
      break

    case 'JUMMAH':
      if (action === 'UPDATE') {
        const existing = await prisma.jummahSetting.findFirst()
        if (existing) {
          await prisma.jummahSetting.update({ where: { id: existing.id }, data })
        } else {
          await prisma.jummahSetting.create({ data })
        }
      }
      break

    case 'NOTIFICATION':
      if (action === 'CREATE') {
        await prisma.notification.create({
          data: { title: data.title, message: data.message },
        })

        const tokens = await prisma.pushToken.findMany({
          where: { active: true },
          select: { token: true },
        })

        if (tokens.length > 0) {
          await sendExpoPush(tokens.map(t => t.token), data.title, data.message)
        }
      }
      break
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
