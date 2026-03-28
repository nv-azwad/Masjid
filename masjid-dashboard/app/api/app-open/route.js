import { prisma } from '../../../lib/prisma'
import { checkRateLimit } from '../../../lib/rate-limit'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST /api/app-open — track app opens (no auth needed)
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateCheck = checkRateLimit(`app-open:${ip}`)
    if (!rateCheck.allowed) {
      return NextResponse.json({ ok: true }) // silently ignore spam
    }

    const { deviceId, platform } = await request.json()
    if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 100) {
      return NextResponse.json({ error: 'Invalid deviceId' }, { status: 400 })
    }
    const validPlatforms = ['android', 'ios', 'web']
    const safePlatform = validPlatforms.includes(platform) ? platform : 'android'

    await prisma.appInstall.upsert({
      where: { deviceId },
      update: { lastSeenAt: new Date(), platform: safePlatform },
      create: { deviceId, platform: safePlatform },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('App open tracking error:', error.message)
    return NextResponse.json({ ok: true }) // don't fail the app
  }
}
