import { prisma } from '../../../../lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { passwordSchema, validate } from '../../../../lib/validations'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const resetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
})

export async function POST(request) {
  try {
    const body = await request.json()
    const { success, data, error } = validate(resetSchema, body)
    if (!success) return NextResponse.json({ error }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { resetToken: data.token } })

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json({ message: 'Password has been reset successfully. You can now log in.' })
  } catch (error) {
    console.error('Reset password error:', error.message)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
