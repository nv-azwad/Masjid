import { SignJWT, jwtVerify } from 'jose'
import { prisma } from './prisma'

// Fail hard if JWT_SECRET is not configured
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Generate one with: openssl rand -base64 32')
}

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(SECRET)
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload
  } catch {
    return null
  }
}

export async function getCurrentUser(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/auth-token=([^;]+)/)
  const token = match ? match[1] : null

  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, name: true, role: true },
  })

  return user
}

export async function requireAuth(request) {
  const user = await getCurrentUser(request)
  if (!user) return null
  return user
}

export async function requireAdmin(request) {
  const user = await requireAuth(request)
  if (!user || user.role !== 'ADMIN') return null
  return user
}
