import { prisma } from '../../../lib/prisma'
import { verifyFirebaseToken } from '../../../lib/firebase-admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST /api/members — Register or login a member after Firebase phone auth
export async function POST(request) {
  try {
    const decoded = await verifyFirebaseToken(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or missing token' }, { status: 401 })
    }

    const { name } = await request.json().catch(() => ({}))
    const phone = decoded.phone_number

    if (!phone) {
      return NextResponse.json({ error: 'Phone number not found in token' }, { status: 400 })
    }

    // Upsert: create if new, return existing if already registered
    const member = await prisma.member.upsert({
      where: { firebaseUid: decoded.uid },
      update: { active: true }, // reactivate if previously deactivated
      create: {
        firebaseUid: decoded.uid,
        phone,
        name: name || null,
      },
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error('Member registration error:', error.message)
    return NextResponse.json({ error: 'Failed to register member' }, { status: 500 })
  }
}
