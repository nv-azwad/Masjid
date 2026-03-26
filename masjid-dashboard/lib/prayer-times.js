import { Coordinates, PrayerTimes, CalculationMethod, Shafaq } from 'adhan'

// Gausul Azam Jameh Mosjid — Road 9, Sector 13, Uttara, Dhaka
const UTTARA_COORDS = new Coordinates(23.8759, 90.3795)

// Karachi method is standard for Bangladesh (Hanafi)
function getParams() {
  const params = CalculationMethod.Karachi()
  params.madhab = 'Hanafi' // Hanafi Asr calculation (shadow = 2x)
  return params
}

// Get today's calculated prayer times for Uttara, Dhaka
export function getCalculatedTimes() {
  const now = new Date()
  const pt = new PrayerTimes(UTTARA_COORDS, now, getParams())

  // Format to "h:mm AM/PM" in Dhaka timezone
  const fmt = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Dhaka',
    })
  }

  return {
    Fajr: fmt(pt.fajr),
    Dhuhr: fmt(pt.dhuhr),
    Asr: fmt(pt.asr),
    Maghrib: fmt(pt.maghrib),
    Isha: fmt(pt.isha),
  }
}
