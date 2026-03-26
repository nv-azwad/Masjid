// Determine which prayer is "next" based on current time in Dhaka (UTC+6)

function parseTime(timeStr) {
  // Parse "5:15 AM" or "12:30 PM" into minutes since midnight
  if (!timeStr) return null
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i)
  if (!match) return null

  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const period = match[3].toUpperCase()

  if (period === 'AM' && hours === 12) hours = 0
  if (period === 'PM' && hours !== 12) hours += 12

  return hours * 60 + minutes
}

export function computeNextPrayer(prayers) {
  if (!prayers || prayers.length === 0) return prayers

  // Get current time in Dhaka (UTC+6)
  const now = new Date()
  const dhakaOffset = 6 * 60 // UTC+6 in minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  const dhakaMinutes = (utcMinutes + dhakaOffset) % (24 * 60)

  // Find the next prayer: first prayer whose jamaat time hasn't passed yet
  let nextId = null

  // Sort by order to ensure correct sequence
  const sorted = [...prayers].sort((a, b) => a.order - b.order)

  for (const prayer of sorted) {
    const prayerMinutes = parseTime(prayer.time)
    if (prayerMinutes !== null && prayerMinutes > dhakaMinutes) {
      nextId = prayer.id
      break
    }
  }

  // If no prayer found (all have passed today), next is the first prayer (Fajr tomorrow)
  if (!nextId && sorted.length > 0) {
    nextId = sorted[0].id
  }

  // Return prayers with updated isNext
  return prayers.map(p => ({
    ...p,
    isNext: p.id === nextId,
  }))
}
