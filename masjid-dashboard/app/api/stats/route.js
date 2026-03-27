import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../lib/auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/stats — admin-only app usage stats
export async function GET(request) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [activeTokens, totalTokens, notificationCount] = await Promise.all([
      prisma.pushToken.count({ where: { active: true } }),
      prisma.pushToken.count(),
      prisma.notification.count(),
    ])

    return NextResponse.json({
      activeUsers: activeTokens,
      totalInstalls: totalTokens,
      notificationsSent: notificationCount,
    })
  } catch (error) {
    console.error('Stats error:', error.message)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
