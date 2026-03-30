import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../lib/auth'
import { validate, communityPostSchema } from '../../../lib/validations'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/community-posts — public gets approved, admin gets all
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // If requesting pending/rejected, must be admin
    if (status && status !== 'approved') {
      const user = await requireAuth(request)
      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const posts = await prisma.communityPost.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return NextResponse.json(posts)
    }

    // Public: approved posts only
    const posts = await prisma.communityPost.findMany({
      where: { status: 'approved' },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    return NextResponse.json(posts)
  } catch (error) {
    console.error('Community posts error:', error.message)
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 })
  }
}

// POST /api/community-posts — anyone can submit (rate limited by deviceId)
export async function POST(request) {
  try {
    const body = await request.json()
    const { success, data, error } = validate(communityPostSchema, body)
    if (!success) return NextResponse.json({ error }, { status: 400 })

    // Rate limit: max 3 posts per device per day
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const todayCount = await prisma.communityPost.count({
      where: {
        deviceId: data.deviceId,
        createdAt: { gte: dayStart },
      },
    })
    if (todayCount >= 3) {
      return NextResponse.json(
        { error: 'You can submit up to 3 messages per day. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    const post = await prisma.communityPost.create({
      data: {
        authorName: data.authorName || null,
        content: data.content,
        deviceId: data.deviceId,
      },
    })
    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Community post create error:', error.message)
    return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 })
  }
}

// PUT /api/community-posts — admin only, approve/reject
export async function PUT(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status } = await request.json()
    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Valid ID and status (approved/rejected) required' }, { status: 400 })
    }

    const post = await prisma.communityPost.update({
      where: { id },
      data: {
        status,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
    })

    // Notify the user who submitted the post
    await notifyPostAuthor(post.deviceId, status)

    return NextResponse.json(post)
  } catch (error) {
    console.error('Community post review error:', error.message)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// DELETE /api/community-posts — admin only
export async function DELETE(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })

    await prisma.communityPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Community post delete error:', error.message)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}

// Send a notification to the post author's device
async function notifyPostAuthor(deviceId, status) {
  if (!deviceId) return

  const title = status === 'approved' ? 'Post Approved' : 'Post Not Approved'
  const body = status === 'approved'
    ? 'Your community message has been approved and is now visible to everyone.'
    : 'Your community message was reviewed and not approved by the admin.'

  // Try Expo push token first (Android app)
  const pushToken = await prisma.pushToken.findFirst({
    where: { deviceId, active: true },
    select: { token: true },
  })

  if (pushToken) {
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ to: pushToken.token, sound: 'default', title, body }),
      })
    } catch (e) {
      console.error('Expo push to author failed:', e.message)
    }
  }

  // Try web push subscription (PWA)
  const webSub = await prisma.webPushSubscription.findFirst({
    where: { deviceId, active: true },
    select: { endpoint: true, p256dh: true, auth: true },
  })

  if (webSub && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
      const webpush = require('web-push')
      webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@gausulazammasjid.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      )
      await webpush.sendNotification(
        { endpoint: webSub.endpoint, keys: { p256dh: webSub.p256dh, auth: webSub.auth } },
        JSON.stringify({ title, body })
      )
    } catch (e) {
      console.error('Web push to author failed:', e.message)
    }
  }
}
