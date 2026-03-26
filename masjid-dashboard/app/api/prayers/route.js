import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../lib/auth'
import { validate, prayerUpdateSchema } from '../../../lib/validations'
import { computeNextPrayer } from '../../../lib/next-prayer'
import { NextResponse } from 'next/server'

// GET /api/prayers - Get all prayer times (public for mobile app)
export async function GET() {
  try {
    const prayers = await prisma.prayer.findMany({ orderBy: { order: 'asc' } })
    return NextResponse.json(computeNextPrayer(prayers))
  } catch (error) {
    console.error('Database error:', error.message)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

// PUT /api/prayers - Update a prayer time
export async function PUT(request) {
  const user = await requireAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { success, data, error } = validate(prayerUpdateSchema, body)
    if (!success) return NextResponse.json({ error }, { status: 400 })

    const { id, name, adhan, time, isNext } = data

    // Admin: apply directly
    if (user.role === 'ADMIN') {
      if (isNext) {
        await prisma.prayer.updateMany({ data: { isNext: false } })
      }
      const prayer = await prisma.prayer.update({
        where: { id },
        data: { name, adhan: adhan ?? undefined, time, isNext: isNext ?? undefined },
      })
      return NextResponse.json(prayer)
    }

    // Moderator: create pending change
    const pending = await prisma.pendingChange.create({
      data: {
        resourceType: 'PRAYER',
        action: 'UPDATE',
        resourceId: id,
        data: { name, adhan, time, isNext },
        submittedBy: user.id,
      },
    })

    return NextResponse.json({ pending: true, message: 'Change submitted for admin approval', pendingChange: pending })
  } catch (error) {
    console.error('Database error:', error.message)
    return NextResponse.json({ error: 'Failed to update prayer' }, { status: 500 })
  }
}
