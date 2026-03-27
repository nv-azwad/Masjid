import { prisma } from '../../../lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST /api/app-open — track app opens (no auth needed)
export async function POST(request) {
  try {
    const { deviceId, platform } = await request.json()
    if (!deviceId) return NextResponse.json({ error: 'deviceId required' }, { status: 400 })

    await prisma.appInstall.upsert({
      where: { deviceId },
      update: { lastSeenAt: new Date(), platform: platform || 'android' },
      create: { deviceId, platform: platform || 'android' },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('App open tracking error:', error.message)
    return NextResponse.json({ ok: true }) // don't fail the app
  }
}
