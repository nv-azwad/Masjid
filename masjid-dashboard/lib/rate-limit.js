// Simple in-memory rate limiter (no external dependencies needed)
// For production with multiple instances, use Redis instead.

const attempts = new Map()

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of attempts) {
    if (now - entry.windowStart > WINDOW_MS) {
      attempts.delete(key)
    }
  }
}, 10 * 60 * 1000)

export function checkRateLimit(identifier) {
  const now = Date.now()
  const entry = attempts.get(identifier)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(identifier, { count: 1, windowStart: now })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  entry.count++
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count }
}

export function resetRateLimit(identifier) {
  attempts.delete(identifier)
}
