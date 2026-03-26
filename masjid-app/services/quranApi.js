import AsyncStorage from '@react-native-async-storage/async-storage'
import { QURAN_API } from '../constants/config'

// Get list of all 114 surahs (cached permanently)
export async function getSurahList() {
  const cacheKey = 'quran_surah_list'

  try {
    const cached = await AsyncStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch (e) {}

  try {
    const res = await fetch(`${QURAN_API}/surah`)
    const data = await res.json()

    if (data.code === 200) {
      const surahs = data.data.map((s) => ({
        number: s.number,
        name: s.name,              // Arabic name
        englishName: s.englishName,
        englishNameTranslation: s.englishNameTranslation,
        numberOfAyahs: s.numberOfAyahs,
        revelationType: s.revelationType, // Meccan or Medinan
      }))

      await AsyncStorage.setItem(cacheKey, JSON.stringify(surahs))
      return surahs
    }
  } catch (e) {
    console.error('Failed to fetch surah list:', e)
  }

  return []
}

// Strip Bismillah prefix from the first ayah's Arabic text
// The API prepends "Bismillah ir-Rahman ir-Rahim" (4 Arabic words) to ayah 1
// for all surahs except Al-Fatihah (1) and At-Tawbah (9)
function stripBismillah(text) {
  // Bismillah always starts with Ba (U+0628) and is 4 words
  if (text.charCodeAt(0) !== 0x0628) return text
  const spaces = []
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') spaces.push(i)
  }
  // After 4 words (3 inner spaces + 1 trailing space), the actual ayah starts
  if (spaces.length >= 4) {
    return text.substring(spaces[3] + 1)
  }
  return text
}

// Get a specific surah with Arabic text + Bengali + English translations
// Cached after first fetch for offline reading
export async function getSurahDetail(surahNumber) {
  const cacheKey = `quran_surah_v3_${surahNumber}`

  try {
    const cached = await AsyncStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch (e) {}

  try {
    // Fetch Arabic + Bengali + English in parallel
    const [arabicRes, bengaliRes, englishRes] = await Promise.all([
      fetch(`${QURAN_API}/surah/${surahNumber}/ar.alafasy`),
      fetch(`${QURAN_API}/surah/${surahNumber}/bn.bengali`),
      fetch(`${QURAN_API}/surah/${surahNumber}/en.asad`),
    ])

    const [arabicData, bengaliData, englishData] = await Promise.all([
      arabicRes.json(),
      bengaliRes.json(),
      englishRes.json(),
    ])

    if (arabicData.code === 200) {
      const surah = {
        number: arabicData.data.number,
        name: arabicData.data.name,
        englishName: arabicData.data.englishName,
        englishNameTranslation: arabicData.data.englishNameTranslation,
        revelationType: arabicData.data.revelationType,
        numberOfAyahs: arabicData.data.numberOfAyahs,
        ayahs: arabicData.data.ayahs.map((ayah, index) => {
          let arabicText = ayah.text
          // Strip Bismillah from ayah 1 for surahs 2-114 (except 9)
          // The API prepends it but the app shows Bismillah separately
          if (ayah.numberInSurah === 1 && surahNumber !== 1 && surahNumber !== 9) {
            arabicText = stripBismillah(arabicText)
          }
          return {
            number: ayah.numberInSurah,
            arabic: arabicText,
            bengali: bengaliData.data?.ayahs?.[index]?.text || '',
            english: englishData.data?.ayahs?.[index]?.text || '',
            juz: ayah.juz,
            page: ayah.page,
          }
        }),
      }

      // Cache for offline reading
      await AsyncStorage.setItem(cacheKey, JSON.stringify(surah))
      return surah
    }
  } catch (e) {
    console.error(`Failed to fetch surah ${surahNumber}:`, e)
  }

  return null
}

// Search surahs by name
export function searchSurahs(surahs, query) {
  if (!query.trim()) return surahs
  const q = query.toLowerCase()
  return surahs.filter(
    (s) =>
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      s.name.includes(query) ||
      String(s.number) === q
  )
}

// Clear all cached Quran data (useful for settings)
export async function clearQuranCache() {
  const keys = await AsyncStorage.getAllKeys()
  const quranKeys = keys.filter((k) => k.startsWith('quran_'))
  await AsyncStorage.multiRemove(quranKeys)
}
