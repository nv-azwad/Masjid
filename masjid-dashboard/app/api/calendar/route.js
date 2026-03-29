import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../lib/auth'
import { validate, calendarEventSchema } from '../../../lib/validations'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/calendar — public, returns events for a date range
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where = {}
    if (from && to) {
      where.date = { gte: new Date(from), lte: new Date(to) }
    } else {
      // Default: current month ± 1 month
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)
      where.date = { gte: start, lte: end }
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { date: 'asc' },
    })
    return NextResponse.json(events)
  } catch (error) {
    console.error('Calendar error:', error.message)
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 })
  }
}

// POST /api/calendar — admin only, create event
export async function POST(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { success, data, error } = validate(calendarEventSchema, body)
    if (!success) return NextResponse.json({ error }, { status: 400 })

    const event = await prisma.calendarEvent.create({
      data: {
        date: new Date(data.date),
        title: data.title,
        description: data.description || '',
        type: data.type,
        createdBy: user.id,
      },
    })
    return NextResponse.json(event)
  } catch (error) {
    console.error('Calendar create error:', error.message)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

// PUT /api/calendar — admin only, update event
export async function PUT(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })

    const updateData = {}
    if (body.date) updateData.date = new Date(body.date)
    if (body.title) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.type) updateData.type = body.type

    const event = await prisma.calendarEvent.update({
      where: { id: body.id },
      data: updateData,
    })
    return NextResponse.json(event)
  } catch (error) {
    console.error('Calendar update error:', error.message)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

// DELETE /api/calendar — admin only
export async function DELETE(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })

    await prisma.calendarEvent.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Calendar delete error:', error.message)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
