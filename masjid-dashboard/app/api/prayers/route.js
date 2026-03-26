import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../lib/auth'
import { validate, prayerUpdateSchema } from '../../../lib/validations'
import { computeNextPrayer } from '../../../lib/next-prayer'
import { getCalculatedTimes } from '../../../lib/prayer-times'
import { NextResponse } from 'next/server'

// GET /api/prayers - Get all prayer times (public for mobile app)
export async function GET(request) {
  try {
    const prayers = await prisma.prayer.findMany({ orderBy: { order: 'asc' } })
    const result = computeNextPrayer(prayers)

    // Include calculated adhan times if requested (dashboard use)
    const { searchParams } = new URL(request.url)
    if (searchParams.get('calculated') === '1') {
      let calculated = null
      try { calculated = getCalculatedTimes() } catch (e) { console.error('Adhan calc error:', e.message) }
      return NextResponse.json({ prayers: result, calculated })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Database error:', error.message)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

// PUT /api/prayers - Update a prayer time
export async function PUT(request) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { success, data, error } = validate(prayerUpdateSchema, body)
    if (!success) return NextResponse.json({ error }, { status: 400 })

    const { id, ...fields } = data

    // Build update object — only include fields that were actually sent
    const updateData = {}
    if (fields.name !== undefined) updateData.name = fields.name
    if (fields.adhan !== undefined) updateData.adhan = fields.adhan
    if (fields.time !== undefined) updateData.time = fields.time
    if (fields.isNext !== undefined) updateData.isNext = fields.isNext

    // Admin: apply directly
    if (user.role === 'ADMIN') {
      if (updateData.isNext) {
        await prisma.prayer.updateMany({ data: { isNext: false } })
      }
      const prayer = await prisma.prayer.update({
        where: { id },
        data: updateData,
      })
      return NextResponse.json(prayer)
    }

    // Moderator: create pending change
    const pending = await prisma.pendingChange.create({
      data: {
        resourceType: 'PRAYER',
        action: 'UPDATE',
        resourceId: id,
        data: updateData,
        submittedBy: user.id,
      },
    })

    return NextResponse.json({ pending: true, message: 'Change submitted for admin approval', pendingChange: pending })
  } catch (error) {
    console.error('Database error:', error.message)
    return NextResponse.json({ error: 'Failed to update prayer' }, { status: 500 })
  }
}
