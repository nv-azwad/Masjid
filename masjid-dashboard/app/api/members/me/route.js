import { prisma } from '../../../../lib/prisma'
import { verifyFirebaseToken } from '../../../../lib/firebase-admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/members/me — Get current member's profile
export async function GET(request) {
  try {
    const decoded = await verifyFirebaseToken(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const member = await prisma.member.findUnique({
      where: { firebaseUid: decoded.uid },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Get member error:', error.message)
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 })
  }
}

// PUT /api/members/me — Update current member's profile
export async function PUT(request) {
  try {
    const decoded = await verifyFirebaseToken(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, language, notifyAll, prayerPrefs } = body

    // Validate input types and values
    const updateData = {}
    if (name !== undefined) {
      if (typeof name !== 'string' || name.length > 100) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
      }
      updateData.name = name.trim()
    }
    if (language !== undefined) {
      if (!['bn', 'en', 'ar'].includes(language)) {
        return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
      }
      updateData.language = language
    }
    if (notifyAll !== undefined) {
      if (typeof notifyAll !== 'boolean') {
        return NextResponse.json({ error: 'Invalid notifyAll value' }, { status: 400 })
      }
      updateData.notifyAll = notifyAll
    }
    if (prayerPrefs !== undefined) {
      if (typeof prayerPrefs !== 'object' || prayerPrefs === null || Array.isArray(prayerPrefs)) {
        return NextResponse.json({ error: 'Invalid prayerPrefs' }, { status: 400 })
      }
      const validKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jummah']
      for (const [key, val] of Object.entries(prayerPrefs)) {
        if (!validKeys.includes(key) || typeof val !== 'boolean') {
          return NextResponse.json({ error: 'Invalid prayerPrefs' }, { status: 400 })
        }
      }
      updateData.prayerPrefs = prayerPrefs
    }

    const member = await prisma.member.update({
      where: { firebaseUid: decoded.uid },
      data: updateData,
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error('Update member error:', error.message)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

// DELETE /api/members/me — Deactivate member account
export async function DELETE(request) {
  try {
    const decoded = await verifyFirebaseToken(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.member.update({
      where: { firebaseUid: decoded.uid },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete member error:', error.message)
    return NextResponse.json({ error: 'Failed to deactivate account' }, { status: 500 })
  }
}
