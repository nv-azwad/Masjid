// Simple in-memory rate limiter (no external dependencies needed)
// For production with multiple instances, use Redis instead.

const attempts = new Map()

const DEFAULT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const DEFAULT_MAX_ATTEMPTS = 5

// Configurable limits per prefix
const LIMITS = {
  'app-open':    { windowMs: 60 * 1000, max: 10 },     // 10 per minute
  'push-token':  { windowMs: 60 * 1000, max: 10 },     // 10 per minute
  'member-reg':  { windowMs: 15 * 60 * 1000, max: 10 }, // 10 per 15 minutes
}

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of attempts) {
    const prefix = key.split(':')[0]
    const windowMs = LIMITS[prefix]?.windowMs || DEFAULT_WINDOW_MS
    if (now - entry.windowStart > windowMs) {
      attempts.delete(key)
    }
  }
}, 10 * 60 * 1000)

export function checkRateLimit(identifier) {
  const now = Date.now()
  const prefix = identifier.split(':')[0]
  const windowMs = LIMITS[prefix]?.windowMs || DEFAULT_WINDOW_MS
  const maxAttempts = LIMITS[prefix]?.max || DEFAULT_MAX_ATTEMPTS

  const entry = attempts.get(identifier)

  if (!entry || now - entry.windowStart > windowMs) {
    attempts.set(identifier, { count: 1, windowStart: now })
    return { allowed: true, remaining: maxAttempts - 1 }
  }

  if (entry.count >= maxAttempts) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  entry.count++
  return { allowed: true, remaining: maxAttempts - entry.count }
}

export function resetRateLimit(identifier) {
  attempts.delete(identifier)
}
