import { prisma } from '../../../lib/prisma'
import { checkRateLimit } from '../../../lib/rate-limit'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST /api/web-push-subscriptions — Register a web push subscription
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateCheck = checkRateLimit(`web-push:${ip}`)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { endpoint, p256dh, auth, deviceId } = await request.json()
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'endpoint, p256dh, and auth are required' }, { status: 400 })
    }
    if (!endpoint.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 })
    }

    const sub = await prisma.webPushSubscription.upsert({
      where: { endpoint },
      update: { p256dh, auth, active: true, ...(deviceId && { deviceId }) },
      create: { endpoint, p256dh, auth, ...(deviceId && { deviceId }) },
    })

    return NextResponse.json(sub)
  } catch (error) {
    console.error('Web push subscription error:', error.message)
    return NextResponse.json({ error: 'Failed to register subscription' }, { status: 500 })
  }
}

// DELETE /api/web-push-subscriptions — Deactivate a subscription
export async function DELETE(request) {
  try {
    const { endpoint } = await request.json()
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
    }

    await prisma.webPushSubscription.updateMany({
      where: { endpoint },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Web push deactivate error:', error.message)
    return NextResponse.json({ error: 'Failed to deactivate subscription' }, { status: 500 })
  }
}
