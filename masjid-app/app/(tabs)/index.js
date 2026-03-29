import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, Platform, Image, Modal, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { fetchMosqueData } from '../../services/api'
import { toHijri, getHijriMonthName, formatHijri, getMonthDays } from '../../services/hijriDate'
import {
  getNotificationPrefs,
  saveNotificationPrefs,
  schedulePrayerReminders,
  registerForPushNotifications,
  sendTokenToServer,
} from '../../services/notifications'
import { usePreloadedData } from '../_layout'
import AsyncStorage from '@react-native-async-storage/async-storage'

const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`)
  } else {
    Alert.alert(title, message)
  }
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function CalendarModal({ visible, onClose, events, colors, isDark, calMonth, calYear, setCalMonth, setCalYear }) {
  const screenW = Dimensions.get('window').width
  const cellSize = Math.floor((screenW - 64) / 7)

  const days = getMonthDays(calYear, calMonth)
  const firstDow = days[0]?.date.getDay() || 0
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`

  // Map events by date string for quick lookup
  const eventMap = {}
  events.forEach(e => {
    const d = new Date(e.date)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!eventMap[key]) eventMap[key] = []
    eventMap[key].push(e)
  })

  const [selectedDay, setSelectedDay] = useState(null)
  const selectedEvents = selectedDay ? (eventMap[`${calYear}-${calMonth}-${selectedDay}`] || []) : []

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
    else setCalMonth(calMonth - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
    else setCalMonth(calMonth + 1)
    setSelectedDay(null)
  }

  // Hijri month for the 15th of this Gregorian month (representative)
  const midHijri = toHijri(new Date(calYear, calMonth, 15))

  const typeColors = { event: '#3b82f6', special_prayer: colors.green, holiday: colors.gold, reminder: '#a855f7' }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', borderWidth: 1, borderColor: colors.border }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View>
              <Text style={{ color: colors.gold, fontSize: 18, fontWeight: '600' }}>Islamic Calendar</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                {getHijriMonthName(midHijri.month)} {midHijri.year} AH
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Month navigation */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <TouchableOpacity onPress={prevMonth} style={{ padding: 8 }}>
                <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                {MONTHS[calMonth]} {calYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }}>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {DAYS.map(d => (
                <View key={d} style={{ width: cellSize, alignItems: 'center' }}>
                  <Text style={{ color: d === 'Fri' ? colors.gold : colors.textMuted, fontSize: 11, fontWeight: '600' }}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDow }).map((_, i) => (
                <View key={`e${i}`} style={{ width: cellSize, height: cellSize }} />
              ))}
              {days.map(({ date, hijri }) => {
                const dayNum = date.getDate()
                const dayKey = `${calYear}-${calMonth}-${dayNum}`
                const isToday = dayKey === todayStr
                const hasEvent = !!eventMap[dayKey]
                const isSelected = selectedDay === dayNum
                const isFriday = date.getDay() === 5

                return (
                  <TouchableOpacity
                    key={dayNum}
                    onPress={() => setSelectedDay(isSelected ? null : dayNum)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: cellSize / 2,
                      backgroundColor: isSelected ? colors.green + '30' : isToday ? colors.gold + '20' : 'transparent',
                    }}
                  >
                    <Text style={{
                      color: isSelected ? colors.green : isToday ? colors.gold : isFriday ? colors.gold : colors.text,
                      fontSize: 14,
                      fontWeight: isToday || isSelected ? '700' : '400',
                    }}>
                      {dayNum}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 8, marginTop: -1 }}>{hijri.day}</Text>
                    {hasEvent && (
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green, position: 'absolute', bottom: 4 }} />
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Selected day events */}
            {selectedDay && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ color: colors.gold, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  {new Date(calYear, calMonth, selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  {' — '}{formatHijri(new Date(calYear, calMonth, selectedDay))}
                </Text>
                {selectedEvents.length > 0 ? selectedEvents.map((e, i) => (
                  <View key={i} style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: typeColors[e.type] || colors.green }}>
                    <Text style={{ color: typeColors[e.type] || colors.green, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {e.type === 'special_prayer' ? 'Special Prayer' : e.type}
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 4 }}>{e.title}</Text>
                    {e.description ? <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{e.description}</Text> : null}
                  </View>
                )) : (
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>No events on this date</Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme()
  const { preloadedData } = usePreloadedData() || {}
  const [data, setData] = useState(preloadedData || null)
  const [refreshing, setRefreshing] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [lastSeenEvent, setLastSeenEvent] = useState(null)

  // Track if there are unseen calendar events
  useEffect(() => {
    AsyncStorage.getItem('last_seen_calendar').then(v => setLastSeenEvent(v))
  }, [])

  const hasUnseenEvents = data?.calendarEvents?.some(e => {
    if (!lastSeenEvent) return true
    return new Date(e.createdAt || e.date) > new Date(lastSeenEvent)
  })

  const openCalendar = async () => {
    setShowCalendar(true)
    const now = new Date().toISOString()
    await AsyncStorage.setItem('last_seen_calendar', now)
    setLastSeenEvent(now)
  }

  const load = useCallback(async () => {
    const [d, prefs] = await Promise.all([
      fetchMosqueData(),
      getNotificationPrefs(),
    ])
    setData(d)
    setNotifPrefs(prefs)

    // Reschedule prayer reminders with fresh data
    if (prefs?.enabled && d?.prayers && Platform.OS !== 'web') {
      schedulePrayerReminders(d.prayers, prefs).catch(() => {})
    }
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
            <TouchableOpacity onPress={openCalendar} style={[styles.refreshBtn, { backgroundColor: colors.gold + '20' }]}>
              <Ionicons name="calendar" size={18} color={colors.gold} />
              {hasUnseenEvents && <View style={styles.calendarBadge} />}
            </TouchableOpacity>
            {Platform.OS === 'web' && (
              <TouchableOpacity
                onPress={onRefresh}
                style={[styles.refreshBtn, { backgroundColor: colors.green + '20' }]}
              >
                <Ionicons name="refresh" size={18} color={colors.green} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 6 }}>{today}</Text>
          </View>
          <View style={[styles.dateRow, { marginTop: 4 }]}>
            <Ionicons name="moon-outline" size={14} color={colors.gold} />
            <Text style={{ color: colors.gold, fontSize: 12, marginLeft: 6 }}>{formatHijri(new Date())}</Text>
          </View>
        </View>

        {/* Calendar Modal */}
        <CalendarModal
          visible={showCalendar}
          onClose={() => setShowCalendar(false)}
          events={data?.calendarEvents || []}
          colors={colors}
          isDark={isDark}
          calMonth={calMonth}
          calYear={calYear}
          setCalMonth={setCalMonth}
          setCalYear={setCalYear}
        />

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
  refreshBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  calendarBadge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
})
