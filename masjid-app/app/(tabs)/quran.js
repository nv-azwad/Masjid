import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'
import { getSurahList, searchSurahs } from '../../services/quranApi'

export default function QuranScreen() {
  const { colors, isDark } = useTheme()
  const router = useRouter()
  const [surahs, setSurahs] = useState([])
  const [filtered, setFiltered] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSurahList().then((data) => {
      setSurahs(data)
      setFiltered(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    setFiltered(searchSurahs(surahs, query))
  }, [query, surahs])

  const renderSurah = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/surah/${item.number}`)}
      style={[styles.surahCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={[styles.surahNumber, { backgroundColor: isDark ? colors.green + '20' : colors.green + '15' }]}>
        <Text style={[styles.surahNumberText, { color: colors.green }]}>{item.number}</Text>
      </View>
      <View style={styles.surahInfo}>
        <Text style={[styles.surahEnglishName, { color: colors.text }]}>{item.englishName}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
          {item.englishNameTranslation} · {item.numberOfAyahs} Ayahs
        </Text>
      </View>
      <View style={styles.surahRight}>
        <Text style={[styles.surahArabicName, { color: colors.gold }]}>{item.name}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>{item.revelationType}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.green }]}>
            <Ionicons name="book" size={22} color={isDark ? '#0f1210' : '#fff'} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.gold }]}>Al-Quran</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              114 Surahs · Bengali & English
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search surah name or number..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}><Text style={{ color: colors.textSecondary }}>Loading Quran...</Text></View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderSurah}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.loading}>
              <Text style={{ color: colors.textSecondary }}>No surahs found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '600' },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 44, gap: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  surahCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1 },
  surahNumber: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  surahNumberText: { fontSize: 14, fontWeight: '700' },
  surahInfo: { flex: 1, marginLeft: 14 },
  surahEnglishName: { fontSize: 15, fontWeight: '600' },
  surahRight: { alignItems: 'flex-end' },
  surahArabicName: { fontSize: 18, fontFamily: undefined }, // system Arabic font
})
