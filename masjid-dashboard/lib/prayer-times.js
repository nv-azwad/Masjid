import { Coordinates, PrayerTimes, CalculationMethod, Madhab } from 'adhan'

// Gausul Azam Jameh Mosjid — Road 9, Sector 13, Uttara, Dhaka
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

// Default jamaat offset (minutes after adhan)
const JAMAAT_OFFSETS = {
  Fajr: 15,
  Dhuhr: 15,
  Asr: 15,
  Maghrib: 5,
  Isha: 15,
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
