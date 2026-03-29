// Lightweight Gregorian-to-Hijri converter using the Umm al-Qura algorithm approximation
// Accurate to ±1 day (which is normal — Hijri dates depend on moon sighting)

export function toHijri(date) {
  const gd = date.getDate()
  const gm = date.getMonth() + 1
  const gy = date.getFullYear()

  let jd = Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4)
    + Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12)
    - Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4)
    + gd - 32075

  const l = jd - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  const l2 = l - 10631 * n + 354
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
    + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238)
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29
  const hm = Math.floor((24 * l3) / 709)
  const hd = l3 - Math.floor((709 * hm) / 24)
  const hy = 30 * n + j - 30

  return { day: hd, month: hm, year: hy }
}

const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Shaban',
  'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'
]

export function getHijriMonthName(month) {
  return HIJRI_MONTHS[month - 1] || ''
}

export function formatHijri(date) {
  const h = toHijri(date)
  return `${h.day} ${getHijriMonthName(h.month)} ${h.year} AH`
}

// Get all days in a Gregorian month as array of { date, hijri }
export function getMonthDays(year, month) {
  const days = []
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    days.push({ date, hijri: toHijri(date) })
  }
  return days
}
