import { prisma } from '../../../lib/prisma'
import { computeNextPrayer } from '../../../lib/next-prayer'
import { getCalculatedTimes } from '../../../lib/prayer-times'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/mosque - Get all data the mobile app needs in one call
export async function GET() {
  try {
    // Fetch calendar events for current month ± 1 month
    const now = new Date()
    const calStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const calEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)

    const [mosque, prayers, jummah, imams, calendarEvents] = await Promise.all([
      prisma.mosque.findFirst(),
      prisma.prayer.findMany({ orderBy: { order: 'asc' } }),
      prisma.jummahSetting.findFirst(),
      prisma.imam.findMany({ orderBy: { order: 'asc' } }),
      prisma.calendarEvent.findMany({
        where: { date: { gte: calStart, lte: calEnd } },
        orderBy: { date: 'asc' },
      }),
    ])

    // Merge calculated adhan times into prayer data
    let calculated = null
    try { calculated = getCalculatedTimes() } catch (e) { console.error('Adhan calc error:', e.message) }

    const prayersWithCalc = computeNextPrayer(prayers).map(p => ({
      ...p,
      calculatedAdhan: calculated ? calculated[p.name] || null : null,
    }))

    const response = NextResponse.json({ mosque, prayers: prayersWithCalc, jummah, imams, calculated, calendarEvents })
    // CDN caches for 30s so burst traffic (e.g. Maghrib time) only hits DB once
    response.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    return response
  } catch (error) {
    console.error('Database error:', error.message)
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
}
