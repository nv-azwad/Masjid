import { prisma } from '../../../../lib/prisma'
import { getFullPrayerSchedule } from '../../../../lib/prayer-times'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/cron/update-prayers — Daily auto-update of prayer times
// Called by Vercel Cron at midnight Dhaka time
export async function GET(request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const schedule = getFullPrayerSchedule()
    const prayers = await prisma.prayer.findMany({ orderBy: { order: 'asc' } })

    const updates = []
    for (const prayer of prayers) {
      const calc = schedule[prayer.name]
      if (calc) {
        updates.push(
          prisma.prayer.update({
            where: { id: prayer.id },
            data: { adhan: calc.adhan, time: calc.jamaat },
          })
        )
      }
    }

    await Promise.all(updates)

    return NextResponse.json({
      ok: true,
      updated: Object.fromEntries(
        Object.entries(schedule).map(([name, times]) => [name, `Adhan: ${times.adhan}, Jamaat: ${times.jamaat}`])
      ),
    })
  } catch (error) {
    console.error('Cron update-prayers error:', error.message)
    return NextResponse.json({ error: 'Failed to update prayer times' }, { status: 500 })
  }
}
