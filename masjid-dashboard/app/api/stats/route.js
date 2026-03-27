import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../lib/auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/stats — admin-only app usage stats
export async function GET(request) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // "Active" = opened app in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [totalInstalls, activeUsers, notificationsEnabled, notificationCount] = await Promise.all([
      prisma.appInstall.count(),
      prisma.appInstall.count({ where: { lastSeenAt: { gte: sevenDaysAgo } } }),
      prisma.pushToken.count({ where: { active: true } }),
      prisma.notification.count(),
    ])

    return NextResponse.json({
      totalInstalls,
      activeUsers,
      notificationsEnabled,
      notificationsSent: notificationCount,
    })
  } catch (error) {
    console.error('Stats error:', error.message)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
