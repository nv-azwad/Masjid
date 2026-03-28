import { prisma } from '../../../lib/prisma'
import { computeNextPrayer } from '../../../lib/next-prayer'
import { getCalculatedTimes } from '../../../lib/prayer-times'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/mosque - Get all data the mobile app needs in one call
export async function GET() {
  try {
    const [mosque, prayers, jummah, imams] = await Promise.all([
      prisma.mosque.findFirst(),
      prisma.prayer.findMany({ orderBy: { order: 'asc' } }),
      prisma.jummahSetting.findFirst(),
      prisma.imam.findMany({ orderBy: { order: 'asc' } }),
    ])

    // Merge calculated adhan times into prayer data
    let calculated = null
    try { calculated = getCalculatedTimes() } catch (e) { console.error('Adhan calc error:', e.message) }

    const prayersWithCalc = computeNextPrayer(prayers).map(p => ({
      ...p,
      calculatedAdhan: calculated ? calculated[p.name] || null : null,
    }))

    return NextResponse.json({ mosque, prayers: prayersWithCalc, jummah, imams, calculated })
  } catch (error) {
    console.error('Database error:', error.message)
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
}
