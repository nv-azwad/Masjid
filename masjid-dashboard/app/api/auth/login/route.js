import { prisma } from '../../../../lib/prisma'
import { signToken } from '../../../../lib/auth'
import { checkRateLimit, resetRateLimit } from '../../../../lib/rate-limit'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateCheck = checkRateLimit(ip)

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${rateCheck.retryAfter} seconds.` },
        { status: 429 }
      )
    }

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    // Successful login — reset rate limit for this IP
    resetRateLimit(ip)

    const token = await signToken({ userId: user.id, role: user.role })

    const response = NextResponse.json({
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error.message)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
