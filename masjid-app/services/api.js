import { API_BASE } from '../constants/config'
import { calculatePrayerTimes } from './prayerTimes'
import AsyncStorage from '@react-native-async-storage/async-storage'

const CACHE_KEY = 'mosque_data_cache'

// Fetch with timeout (8 seconds to allow slower networks)
function fetchWithTimeout(url, timeout = 8000) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ])
}

// Save data to cache (offline fallback only)
async function setCachedData(data) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {}
}

// Fetch all mosque data (prayers, jummah, imams) in one call
// Always hits the API first so dashboard changes appear immediately.
// Cache is only used as fallback when the API is unreachable.
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

    // Cache for offline fallback
    await setCachedData(data)

    return data
  } catch (error) {
    console.log('Dashboard unavailable, using fallback')

    // Try returning cached data before falling back to calculated
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY)
      if (raw) {
        const { data } = JSON.parse(raw)
        if (data.prayers) data.prayers = markNextPrayer(data.prayers)
        return data
      }
    } catch {}

    // Use fully calculated times (adhan + estimated jamaat)
    return {
      mosque: {
        name: 'Gausul Azam Jameh Masjid',
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
