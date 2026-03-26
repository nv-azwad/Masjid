import { prisma } from '../../../lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/mosque - Get all data the mobile app needs in one call
export async function GET() {
  try {
    const [mosque, prayers, jummah, imams] = await Promise.all([
      prisma.mosque.findFirst(),
      prisma.prayer.findMany({ orderBy: { order: 'asc' } }),
      prisma.jummahSetting.findFirst(),
      prisma.imam.findMany({ orderBy: { order: 'asc' } }),
    ])

    return NextResponse.json({ mosque, prayers, jummah, imams })
  } catch (error) {
    console.error('Database error:', error.message)
    return NextResponse.json(
      { error: 'Database connection failed. Check DATABASE_URL in .env' },
      { status: 500 }
    )
  }
}
