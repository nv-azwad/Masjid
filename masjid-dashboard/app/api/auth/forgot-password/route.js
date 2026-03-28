import { prisma } from '../../../../lib/prisma'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { username } })

    // Always return success to prevent username enumeration
    if (!user || !user.recoveryEmail) {
      return NextResponse.json({ message: 'If an account with a recovery email exists, a reset link has been sent.' })
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    })

    // Send email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${request.headers.get('host')}`
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"Gausul Azam Jameh Masjid" <${process.env.GMAIL_USER}>`,
      to: user.recoveryEmail,
      subject: 'Dashboard Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #d4af77;">Password Reset</h2>
          <p>A password reset was requested for the account <strong>${user.username}</strong>.</p>
          <p>Click the link below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #00ff7f; color: #0a0c0a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #888; font-size: 12px;">If you did not request this, ignore this email.</p>
        </div>
      `,
    })

    return NextResponse.json({ message: 'If an account with a recovery email exists, a reset link has been sent.' })
  } catch (error) {
    console.error('Forgot password error:', error.message)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
