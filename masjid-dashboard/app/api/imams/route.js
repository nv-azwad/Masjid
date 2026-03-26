import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../lib/auth'
import { validate, imamCreateSchema, imamUpdateSchema } from '../../../lib/validations'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/imams - public for mobile app
export async function GET() {
  try {
    const imams = await prisma.imam.findMany({ orderBy: { order: 'asc' } })
    return NextResponse.json(imams)
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
    const { success, data, error } = validate(imamCreateSchema, body)
    if (!success) return NextResponse.json({ error }, { status: 400 })

    if (user.role === 'ADMIN') {
      const count = await prisma.imam.count()
      const imam = await prisma.imam.create({ data: { ...data, order: count + 1 } })
      return NextResponse.json(imam)
    }

    const pending = await prisma.pendingChange.create({
      data: {
        resourceType: 'IMAM',
        action: 'CREATE',
        data,
        submittedBy: user.id,
      },
    })
    return NextResponse.json({ pending: true, message: 'New imam submitted for admin approval', pendingChange: pending })
  } catch (error) {
    console.error('Database error:', error.message)
    return NextResponse.json({ error: 'Failed to create imam' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { success, data, error } = validate(imamUpdateSchema, body)
    if (!success) return NextResponse.json({ error }, { status: 400 })

    const { id, ...updateData } = data

    if (user.role === 'ADMIN') {
      const imam = await prisma.imam.update({ where: { id }, data: updateData })
      return NextResponse.json(imam)
    }

    const pending = await prisma.pendingChange.create({
      data: {
        resourceType: 'IMAM',
        action: 'UPDATE',
        resourceId: id,
        data,
        submittedBy: user.id,
      },
    })
    return NextResponse.json({ pending: true, message: 'Changes submitted for admin approval', pendingChange: pending })
  } catch (error) {
    console.error('Database error:', error.message)
    return NextResponse.json({ error: 'Failed to update imam' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Imam ID is required' }, { status: 400 })

    if (user.role === 'ADMIN') {
      await prisma.imam.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    const pending = await prisma.pendingChange.create({
      data: {
        resourceType: 'IMAM',
        action: 'DELETE',
        resourceId: id,
        data: { id },
        submittedBy: user.id,
      },
    })
    return NextResponse.json({ pending: true, message: 'Deletion submitted for admin approval', pendingChange: pending })
  } catch (error) {
    console.error('Database error:', error.message)
    return NextResponse.json({ error: 'Failed to process imam request' }, { status: 500 })
  }
}
