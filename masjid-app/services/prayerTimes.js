import { Coordinates, PrayerTimes, CalculationMethod, Madhab } from 'adhan'

// Gausul Azam Jameh Mosjid — Uttara, Dhaka, Bangladesh
const DHAKA_COORDS = new Coordinates(23.8759, 90.3795)

// Karachi method is standard in Bangladesh
// Hanafi madhab (standard in Bangladesh) for Asr timing
const PARAMS = CalculationMethod.Karachi()
PARAMS.madhab = Madhab.Hanafi

// Approximate jamaat offsets (minutes after adhan)
// Leaning early so people arrive on time
const JAMAAT_OFFSETS = {
  fajr: 15,
  dhuhr: 25,
  asr: 25,
  maghrib: 5,
  isha: 40,
}

// Format a Date object to "h:mm AM/PM"
function formatTime(date) {
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  const mins = minutes < 10 ? '0' + minutes : minutes
  return `${hours}:${mins} ${ampm}`
}

// Add minutes to a Date and format
function addMinutesAndFormat(date, minutes) {
  const d = new Date(date.getTime() + minutes * 60000)
  return formatTime(d)
}

// Calculate prayer times for a given date (defaults to today)
export function calculatePrayerTimes(date = new Date()) {
  const pt = new PrayerTimes(DHAKA_COORDS, date, PARAMS)

  const prayerData = [
    { key: 'fajr', name: 'Fajr', date: pt.fajr, order: 1 },
    { key: 'dhuhr', name: 'Dhuhr', date: pt.dhuhr, order: 2 },
    { key: 'asr', name: 'Asr', date: pt.asr, order: 3 },
    { key: 'maghrib', name: 'Maghrib', date: pt.maghrib, order: 4 },
    { key: 'isha', name: 'Isha', date: pt.isha, order: 5 },
  ]

  // Determine which prayer is next (based on jamaat time)
  const now = date.getTime()
  let nextIndex = -1
  for (let i = 0; i < prayerData.length; i++) {
    const jamaatTime = prayerData[i].date.getTime() + JAMAAT_OFFSETS[prayerData[i].key] * 60000
    if (jamaatTime > now) {
      nextIndex = i
      break
    }
  }

  // If all prayers have passed today, next prayer is tomorrow's Fajr
  if (nextIndex === -1) nextIndex = 0

  return prayerData.map((p, i) => ({
    id: p.key,
    name: p.name,
    adhan: formatTime(p.date),
    time: addMinutesAndFormat(p.date, JAMAAT_OFFSETS[p.key]),
    order: p.order,
    isNext: i === nextIndex,
  }))
}

// Get sunrise time
export function getSunrise(date = new Date()) {
  const pt = new PrayerTimes(DHAKA_COORDS, date, PARAMS)
  return formatTime(pt.sunrise)
}
