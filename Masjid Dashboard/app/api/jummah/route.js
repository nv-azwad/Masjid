import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../lib/auth'
import { validate, jummahUpdateSchema } from '../../../lib/validations'
import { NextResponse } from 'next/server'

// GET /api/jummah - public for mobile app
export async function GET() {
  try {
    const jummah = await prisma.jummahSetting.findFirst()
    return NextResponse.json(jummah)
  } catch (error) {
    console.error('Database error:', error.message)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function PUT(request) {
  const user = await requireAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { success, data, error } = validate(jummahUpdateSchema, body)
    if (!success) return NextResponse.json({ error }, { status: 400 })

    if (user.role === 'ADMIN') {
      const existing = await prisma.jummahSetting.findFirst()
      const jummah = existing
        ? await prisma.jummahSetting.update({ where: { id: existing.id }, data })
        : await prisma.jummahSetting.create({ data })
      return NextResponse.json(jummah)
    }

    const pending = await prisma.pendingChange.create({
      data: {
        resourceType: 'JUMMAH',
        action: 'UPDATE',
        data,
        submittedBy: user.id,
      },
    })
    return NextResponse.json({ pending: true, message: 'Changes submitted for admin approval', pendingChange: pending })
  } catch (error) {
    console.error('Database error:', error.message)
    return NextResponse.json({ error: 'Failed to update jummah' }, { status: 500 })
  }
}
