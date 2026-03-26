import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../lib/auth'
import { validate, passwordChangeSchema } from '../../../../lib/validations'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// PUT /api/users/password - Change own password
export async function PUT(request) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { success, data, error } = validate(passwordChangeSchema, body)
    if (!success) return NextResponse.json({ error }, { status: 400 })

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const validCurrent = await bcrypt.compare(data.currentPassword, dbUser.password)
    if (!validCurrent) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    console.error('Password change error:', error.message)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}
