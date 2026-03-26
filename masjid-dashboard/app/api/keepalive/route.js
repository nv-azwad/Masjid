import { prisma } from '../../../lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/keepalive - Lightweight ping to keep Neon DB connection warm
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
