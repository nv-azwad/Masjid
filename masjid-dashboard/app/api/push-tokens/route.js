import { prisma } from '../../../lib/prisma'
import { verifyFirebaseToken } from '../../../lib/firebase-admin'
import { NextResponse } from 'next/server'

// POST /api/push-tokens — Register or reactivate a push token
export async function POST(request) {
  try {
    const { token } = await request.json()
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
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
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    await prisma.pushToken.updateMany({
      where: { token },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push token error:', error.message)
    return NextResponse.json({ error: 'Failed to deactivate token' }, { status: 500 })
  }
}
