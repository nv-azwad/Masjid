import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, Platform, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { fetchMosqueData } from '../../services/api'
import {
  getNotificationPrefs,
  saveNotificationPrefs,
  schedulePrayerReminders,
  registerForPushNotifications,
  sendTokenToServer,
} from '../../services/notifications'
import { usePreloadedData } from '../_layout'

const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`)
  } else {
    Alert.alert(title, message)
  }
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme()
  const { preloadedData } = usePreloadedData() || {}
  const [data, setData] = useState(preloadedData || null)
  const [refreshing, setRefreshing] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState(null)

  const load = useCallback(async () => {
    const [d, prefs] = await Promise.all([
      fetchMosqueData(),
      getNotificationPrefs(),
    ])
    setData(d)
    setNotifPrefs(prefs)
  }, [])

  // Use preloaded data immediately, then load prefs
  useEffect(() => {
    if (preloadedData) {
      setData(preloadedData)
      getNotificationPrefs().then(setNotifPrefs)
    } else {
      load()
    }
  }, [preloadedData, load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const togglePrayerNotif = async (prayerName) => {
    if (!notifPrefs) return

    const key = prayerName.toLowerCase()

    // Auto-enable master toggle if it's off
    let base = notifPrefs
    if (!base.enabled) {
      const result = await registerForPushNotifications()
      if (!result.token) {
        const messages = {
          web: 'Push notifications are only available on the mobile app. Download the app for prayer reminders.',
          permission_denied: 'Please enable notification permissions in your device settings.',
          not_physical_device: 'Push notifications are only available on physical devices.',
          no_project_id: 'App configuration error. Please reinstall the app.',
          error: `Something went wrong: ${result.message || 'Unknown error'}`,
        }
        showAlert('Notifications Unavailable', messages[result.reason] || messages.error)
        return
      }
      await sendTokenToServer(result.token)
      base = { ...base, enabled: true }
    }

    const updated = {
      ...base,
      prayers: {
        ...base.prayers,
        [key]: !base.prayers[key],
      },
    }

    setNotifPrefs(updated)
    await saveNotificationPrefs(updated)

    if (data?.prayers) {
      await schedulePrayerReminders(data.prayers, updated)
    }
  }

  const isPrayerNotifOn = (prayerName) => {
    if (!notifPrefs?.enabled) return false
    return notifPrefs.prayers[prayerName.toLowerCase()] ?? false
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  if (!data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loading}><Text style={{ color: colors.textSecondary }}>Loading...</Text></View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
      >
        {/* Header */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <Image source={require('../../assets/icon.png')} style={{ width: 44, height: 44, borderRadius: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.mosqueName, { color: colors.gold }]}>{data.mosque?.name || 'Gausul Azam Jameh Masjid'}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{data.mosque?.address || 'Road 9, Sector 13, Uttara, Dhaka'}</Text>
            </View>
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 6 }}>{today}</Text>
          </View>
        </View>

        {/* Jummah Prayer */}
        {data.jummah && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.gold }]}>Jummah Prayer</Text>
            <View style={[styles.jummahCard, { borderColor: colors.gold + '80' }]}>
              <View style={styles.jummahHeader}>
                <View style={styles.row}>
                  <Ionicons name="star" size={18} color={colors.jummahText} />
                  <Text style={[styles.jummahTitle, { color: colors.jummahText }]}>{data.jummah.name}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.bellBtn, { backgroundColor: isPrayerNotifOn('jummah') ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)' }]}
                  onPress={() => togglePrayerNotif('jummah')}
                >
                  <Ionicons
                    name={isPrayerNotifOn('jummah') ? 'notifications' : 'notifications-outline'}
                    size={16}
                    color={colors.jummahText}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.jummahDetail}>
                <Ionicons name="time-outline" size={16} color={colors.jummahText} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={{ fontSize: 11, color: colors.jummahText + 'cc' }}>Prayer Time</Text>
                  <Text style={{ color: colors.jummahText, fontWeight: '500' }}>{data.jummah.time}</Text>
                </View>
              </View>
              {data.jummah.khateeb ? (
                <View style={styles.jummahDetail}>
                  <Ionicons name="person-outline" size={16} color={colors.jummahText} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={{ fontSize: 11, color: colors.jummahText + 'cc' }}>Khateeb</Text>
                    <Text style={{ color: colors.jummahText, fontWeight: '500' }}>{data.jummah.khateeb}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Daily Prayers */}
        <View style={[styles.row, { justifyContent: 'space-between', marginTop: 8, marginBottom: 12, paddingHorizontal: 4 }]}>
          <Text style={[styles.sectionTitle, { color: colors.gold, marginTop: 0, marginBottom: 0 }]}>Daily Prayers</Text>
          {data.isOffline && (
            <View style={[styles.offlineBadge, { backgroundColor: colors.gold + '20', borderColor: colors.gold + '40' }]}>
              <Ionicons name="calculator-outline" size={12} color={colors.gold} />
              <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '600', marginLeft: 4 }}>Auto</Text>
            </View>
          )}
        </View>
        {data.prayers?.map((prayer) => {
          const isNext = prayer.isNext
          const activeText = isNext ? (isDark ? '#0f1210' : '#fff') : colors.text
          const dimText = isNext ? (isDark ? '#0f121099' : '#ffffffcc') : colors.textSecondary
          const labelText = isNext ? (isDark ? '#0f121080' : '#ffffff99') : colors.textMuted
          const bellActive = isPrayerNotifOn(prayer.name)

          return (
            <View
              key={prayer.id}
              style={[
                styles.prayerCard,
                {
                  backgroundColor: isNext ? colors.green : colors.card,
                  borderColor: isNext ? colors.green : colors.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Text style={{ fontWeight: '600', fontSize: 16, color: isNext ? activeText : colors.gold }}>
                    {prayer.name}
                  </Text>
                  {isNext && (
                    <View style={[styles.nextBadge, { backgroundColor: colors.nextBadgeBg }]}>
                      <Text style={{ color: colors.nextBadgeText, fontSize: 10, fontWeight: '700' }}>NEXT</Text>
                    </View>
                  )}
                </View>
                {/* Two-line: Adhan + Jamaat */}
                <View style={[styles.timesRow, { marginTop: 6 }]}>
                  {prayer.adhan && (
                    <View style={styles.timeItem}>
                      <Text style={{ fontSize: 10, color: labelText, fontWeight: '600', letterSpacing: 0.5 }}>ADHAN</Text>
                      <Text style={{ fontSize: 14, color: dimText, fontWeight: '500', marginTop: 1 }}>{prayer.adhan}</Text>
                    </View>
                  )}
                  <View style={styles.timeItem}>
                    <Text style={{ fontSize: 10, color: labelText, fontWeight: '600', letterSpacing: 0.5 }}>
                      {prayer.adhan ? 'JAMAAT' : 'TIME'}
                    </Text>
                    <Text style={{ fontSize: 14, color: activeText, fontWeight: '600', marginTop: 1 }}>{prayer.time}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.bellCircle, {
                  backgroundColor: bellActive
                    ? (isNext ? colors.nextBadgeBg : colors.green + '25')
                    : (isNext ? colors.nextBadgeBg : colors.border),
                }]}
                onPress={() => togglePrayerNotif(prayer.name)}
              >
                <Ionicons
                  name={bellActive ? 'notifications' : 'notifications-outline'}
                  size={16}
                  color={bellActive
                    ? (isNext ? (isDark ? '#fff' : colors.green) : colors.green)
                    : (isNext ? (isDark ? '#fff' : colors.green) : colors.textMuted)
                  }
                />
              </TouchableOpacity>
            </View>
          )
        })}

        {/* Imams */}
        {data.imams?.length > 0 && (
          <Text style={[styles.sectionTitle, { color: colors.gold }]}>Meet Our Imams</Text>
        )}
        {data.imams?.map((imam) => (
          <View key={imam.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
            <View style={[styles.row, { alignItems: 'flex-start', marginBottom: 10 }]}>
              <View style={[styles.imamAvatar, { backgroundColor: colors.green }]}>
                <Ionicons name="person" size={24} color={isDark ? '#0f1210' : '#fff'} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.gold, fontSize: 16, fontWeight: '600' }}>{imam.name}</Text>
                <Text style={{ color: colors.green, fontSize: 13, marginTop: 2 }}>{imam.role}</Text>
              </View>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>{imam.bio}</Text>
            {imam.contact && (
              <View style={[styles.row, { marginTop: 10 }]}>
                <Ionicons name="mail-outline" size={14} color={colors.green} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 8 }}>{imam.contact}</Text>
              </View>
            )}
          </View>
        ))}

        <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 13, paddingVertical: 20 }}>
          May Allah accept our prayers
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mosqueName: { fontSize: 18, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '500', marginBottom: 12, marginTop: 8, paddingLeft: 4 },
  jummahCard: { borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 16, backgroundColor: '#d4af77' },
  jummahHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  jummahTitle: { fontWeight: '600', fontSize: 16, marginLeft: 8 },
  jummahDetail: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  bellBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  prayerCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
  bellCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  imamAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  timesRow: { flexDirection: 'row', gap: 20 },
  timeItem: {},
  offlineBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
})
