import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'
import { getSurahDetail } from '../../services/quranApi'

export default function SurahDetailScreen() {
  const { id } = useLocalSearchParams()
  const { colors, isDark } = useTheme()
  const router = useRouter()
  const [surah, setSurah] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBengali, setShowBengali] = useState(true)
  const [showEnglish, setShowEnglish] = useState(true)

  useEffect(() => {
    getSurahDetail(Number(id)).then((data) => {
      setSurah(data)
      setLoading(false)
    })
  }, [id])

  const renderAyah = ({ item }) => (
    <View style={[styles.ayahCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Ayah number badge */}
      <View style={[styles.ayahBadge, { backgroundColor: isDark ? colors.green + '20' : colors.green + '15' }]}>
        <Text style={{ color: colors.green, fontSize: 12, fontWeight: '700' }}>{item.number}</Text>
      </View>

      {/* Arabic text */}
      <Text style={[styles.arabicText, { color: colors.text }]}>
        {item.arabic}
      </Text>

      {/* Bengali translation */}
      {showBengali && item.bengali && (
        <View style={[styles.translationBlock, { borderColor: colors.border }]}>
          <Text style={[styles.langLabel, { color: colors.gold }]}>বাংলা</Text>
          <Text style={[styles.translationText, { color: colors.textSecondary }]}>
            {item.bengali}
          </Text>
        </View>
      )}

      {/* English translation */}
      {showEnglish && item.english && (
        <View style={[styles.translationBlock, { borderColor: colors.border }]}>
          <Text style={[styles.langLabel, { color: colors.gold }]}>English</Text>
          <Text style={[styles.translationText, { color: colors.textSecondary }]}>
            {item.english}
          </Text>
        </View>
      )}
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingView}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={{ color: colors.textSecondary, marginTop: 16 }}>Loading Surah...</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>First load fetches from API, then cached offline</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!surah) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingView}><Text style={{ color: colors.textSecondary }}>Failed to load surah</Text></View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.surahName, { color: colors.gold }]}>{surah.name}</Text>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16, marginTop: 2 }}>{surah.englishName}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              {surah.englishNameTranslation} · {surah.numberOfAyahs} Ayahs · {surah.revelationType}
            </Text>
          </View>
          <View style={{ width: 32 }} />
        </View>

        {/* Translation toggles */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            onPress={() => setShowBengali(!showBengali)}
            style={[styles.toggleBtn, { backgroundColor: showBengali ? colors.green + '20' : 'transparent', borderColor: showBengali ? colors.green : colors.border }]}
          >
            <Text style={{ color: showBengali ? colors.green : colors.textMuted, fontSize: 12, fontWeight: '500' }}>বাংলা</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowEnglish(!showEnglish)}
            style={[styles.toggleBtn, { backgroundColor: showEnglish ? colors.green + '20' : 'transparent', borderColor: showEnglish ? colors.green : colors.border }]}
          >
            <Text style={{ color: showEnglish ? colors.green : colors.textMuted, fontSize: 12, fontWeight: '500' }}>English</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bismillah (except Surah 1 - Al-Fatihah where it's ayah 1, and Surah 9 - At-Tawbah) */}
      {surah.number !== 1 && surah.number !== 9 && (
        <View style={[styles.bismillah, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.gold, fontSize: 24, textAlign: 'center' }}>
            بِسْمِ ٱللَّٰهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </Text>
        </View>
      )}

      {/* Ayahs list */}
      <FlatList
        data={surah.ayahs}
        renderItem={renderAyah}
        keyExtractor={(item) => String(item.number)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  surahName: { fontSize: 26, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', gap: 10, marginTop: 14, justifyContent: 'center' },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  bismillah: { marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 14, borderWidth: 1 },
  ayahCard: { borderRadius: 14, padding: 16, borderWidth: 1 },
  ayahBadge: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  arabicText: { fontSize: 22, lineHeight: 38, textAlign: 'right', marginBottom: 12 },
  translationBlock: { borderTopWidth: 1, paddingTop: 10, marginTop: 4, marginBottom: 4 },
  langLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  translationText: { fontSize: 14, lineHeight: 22 },
})
