import { API_BASE } from '../constants/config'
import { calculatePrayerTimes } from './prayerTimes'

// Fetch with timeout (5 seconds instead of default ~30s)
function fetchWithTimeout(url, timeout = 5000) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ])
}

// Fetch all mosque data (prayers, jummah, imams) in one call
// Dashboard connected → adhan times (calculated) + jamaat times (from admin)
// Dashboard unavailable → adhan times + estimated jamaat times (both calculated)
export async function fetchMosqueData() {
  // Always calculate adhan times — these are accurate
  const calculated = calculatePrayerTimes()

  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/mosque`)
    if (!res.ok) throw new Error('Network error')
    const data = await res.json()
    if (data.error) throw new Error(data.error)

    // Use dashboard adhan + jamaat times directly (admin controls both)
    // Fall back to locally calculated adhan if dashboard doesn't have one
    if (data.prayers && data.prayers.length > 0) {
      data.prayers = markNextPrayer(data.prayers.map((p) => {
        const calc = calculated.find(
          (c) => c.name.toLowerCase() === p.name.toLowerCase()
        )
        return {
          ...p,
          adhan: p.adhan || (calc ? calc.adhan : null),
        }
      }))
    }

    return data
  } catch (error) {
    console.log('Dashboard unavailable, using auto-calculated prayer times')
    // Use fully calculated times (adhan + estimated jamaat)
    return {
      mosque: {
        name: 'Gausul Azam Jameh Mosjid',
        address: 'Road 9, Sector 13, Uttara, Dhaka',
      },
      prayers: calculated,
      jummah: { name: 'Friday Jummah', time: '1:15 PM', khateeb: '' },
      imams: [],
      isOffline: true,
    }
  }
}

// Parse "h:mm AM/PM" to minutes since midnight for comparison
function parseTimeToMinutes(timeStr) {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return 0
  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const period = match[3].toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return hours * 60 + minutes
}

// Mark which prayer is next based on current time
function markNextPrayer(prayers) {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  let nextIndex = -1
  const sorted = [...prayers].sort((a, b) => a.order - b.order)

  for (let i = 0; i < sorted.length; i++) {
    const prayerMinutes = parseTimeToMinutes(sorted[i].time)
    if (prayerMinutes > currentMinutes) {
      nextIndex = i
      break
    }
  }

  // If all prayers passed, next is Fajr (tomorrow)
  if (nextIndex === -1) nextIndex = 0

  return sorted.map((p, i) => ({
    ...p,
    isNext: i === nextIndex,
  }))
}
