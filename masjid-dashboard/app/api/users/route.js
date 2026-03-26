import { prisma } from '../../../lib/prisma'
import { requireAdmin } from '../../../lib/auth'
import { validate, userCreateSchema } from '../../../lib/validations'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// GET /api/users - List all users (admin only)
export async function GET(request) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(users)
}

// POST /api/users - Create a new user (admin only)
export async function POST(request) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  try {
    const body = await request.json()
    const { success, data, error } = validate(userCreateSchema, body)
    if (!success) return NextResponse.json({ error }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: { email: data.email, password: hashedPassword, name: data.name, role: data.role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Create user error:', error.message)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// DELETE /api/users - Delete a user (admin only)
export async function DELETE(request) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 })

    if (id === admin.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    }

    await prisma.pendingChange.deleteMany({ where: { submittedBy: id } })
    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error.message)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
