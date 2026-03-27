import { Coordinates, PrayerTimes, CalculationMethod, Madhab } from 'adhan'

// Gausul Azam Jameh Masjid — Road 9, Sector 13, Uttara, Dhaka
const UTTARA_COORDS = new Coordinates(23.8759, 90.3795)

// Karachi method is standard for Bangladesh (Hanafi)
function getParams() {
  const params = CalculationMethod.Karachi()
  params.madhab = Madhab.Hanafi
  return params
}

// Format Date to "h:mm AM/PM" in Dhaka timezone
function fmt(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dhaka',
  })
}

// Add minutes to a Date
function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60000)
}

// Get today's calculated prayer times for Uttara, Dhaka
export function getCalculatedTimes() {
  const now = new Date()
  const pt = new PrayerTimes(UTTARA_COORDS, now, getParams())

  return {
    Fajr: fmt(pt.fajr),
    Dhuhr: fmt(pt.dhuhr),
    Asr: fmt(pt.asr),
    Maghrib: fmt(pt.maghrib),
    Isha: fmt(pt.isha),
  }
}

// Jamaat offset (minutes after adhan) — typical for Bangladesh mosques
const JAMAAT_OFFSETS = {
  Fajr: 25,     // people need time to arrive early morning
  Dhuhr: 20,    // midday, standard gap
  Asr: 20,      // afternoon, standard gap
  Maghrib: 7,   // short gap — just enough for sunnah after sunset
  Isha: 20,     // evening, standard gap
}

// Get both adhan and jamaat times for daily auto-update
export function getFullPrayerSchedule() {
  const now = new Date()
  const pt = new PrayerTimes(UTTARA_COORDS, now, getParams())

  const prayers = {
    Fajr: pt.fajr,
    Dhuhr: pt.dhuhr,
    Asr: pt.asr,
    Maghrib: pt.maghrib,
    Isha: pt.isha,
  }

  const schedule = {}
  for (const [name, adhanDate] of Object.entries(prayers)) {
    const offset = JAMAAT_OFFSETS[name]
    schedule[name] = {
      adhan: fmt(adhanDate),
      jamaat: fmt(addMinutes(adhanDate, offset)),
    }
  }

  return schedule
}
