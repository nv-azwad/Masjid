import { z } from 'zod'

// Reusable patterns — flexible to match various time formats
const timePattern = /^\d{1,2}:\d{2}\s?(AM|PM|am|pm)$/

// Prayer validation
export const prayerUpdateSchema = z.object({
  id: z.string().min(1, 'Prayer ID is required'),
  name: z.string().min(1).max(50).optional(),
  adhan: z.string().max(20).optional().nullable(),
  time: z.string().max(20).optional(),
  isNext: z.boolean().optional(),
}).passthrough()

// Imam validation
export const imamCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  role: z.string().min(1, 'Role is required').max(100),
  bio: z.string().max(2000).optional().default(''),
  contact: z.string().max(200).optional().default(''),
})

export const imamUpdateSchema = z.object({
  id: z.string().min(1, 'Imam ID is required'),
  name: z.string().min(1).max(100).optional(),
  role: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).optional(),
  contact: z.string().max(200).optional(),
})

// Jummah validation
export const jummahUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  time: z.string().max(20).optional(),
  khateeb: z.string().max(200).optional(),
})

// Notification validation
export const notificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().min(1, 'Message is required').max(2000),
})

// User validation
export const PASSWORD_MIN_LENGTH = 8
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export const userCreateSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(['ADMIN', 'MODERATOR']).default('MODERATOR'),
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
})

// Calendar event validation
export const calendarEventSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().default(''),
  type: z.enum(['event', 'special_prayer', 'holiday', 'reminder']).default('event'),
})

// Community post validation
export const communityPostSchema = z.object({
  authorName: z.string().max(100).optional().nullable(),
  content: z.string().min(1, 'Message is required').max(750),
  deviceId: z.string().min(1, 'Device ID is required'),
})

// Pending change validation
export const pendingReviewSchema = z.object({
  id: z.string().min(1, 'Change ID is required'),
  status: z.enum(['APPROVED', 'DENIED']),
  reason: z.string().max(500).optional(),
})

// Helper to validate and return clean error responses
export function validate(schema, data) {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.errors.map(e => e.message).join(', ')
    return { success: false, error: errors }
  }
  return { success: true, data: result.data }
}
