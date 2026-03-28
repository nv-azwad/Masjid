import { prisma } from '../../../lib/prisma'
import { verifyFirebaseToken } from '../../../lib/firebase-admin'
import { checkRateLimit } from '../../../lib/rate-limit'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST /api/push-tokens — Register or reactivate a push token
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateCheck = checkRateLimit(`push-token:${ip}`)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { token } = await request.json()
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }
    if (!token.startsWith('ExponentPushToken[') || token.length > 200) {
      return NextResponse.json({ error: 'Invalid push token format' }, { status: 400 })
    }

    // If authenticated, link push token to member
    const decoded = await verifyFirebaseToken(request).catch(() => null)
    let memberId = null
    if (decoded) {
      const member = await prisma.member.findUnique({
        where: { firebaseUid: decoded.uid },
        select: { id: true },
      })
      memberId = member?.id || null
    }

    // Upsert: create if new, reactivate if exists
    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      update: { active: true, ...(memberId && { memberId }) },
      create: { token, ...(memberId && { memberId }) },
    })

    return NextResponse.json(pushToken)
  } catch (error) {
    console.error('Push token error:', error.message)
    return NextResponse.json({ error: 'Failed to register token' }, { status: 500 })
  }
}

// DELETE /api/push-tokens — Deactivate a push token (user turned off notifications)
export async function DELETE(request) {
  try {
    const { token } = await request.json()
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    await prisma.pushToken.update({
      where: { token },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push token error:', error.message)
    return NextResponse.json({ error: 'Failed to deactivate token' }, { status: 500 })
  }
}
