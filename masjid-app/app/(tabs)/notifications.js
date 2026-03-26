import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { API_BASE } from '../../constants/config'

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme()
  const [notifications, setNotifications] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setNotifications(data)
      }
    } catch (e) {
      console.log('Failed to load notifications:', e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.gold }]}>Notifications</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Announcements from the mosque</Text>
        </View>

        {loading ? (
          <View style={styles.empty}>
            <Text style={{ color: colors.textSecondary }}>Loading...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
            <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 12 }}>No announcements yet</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>Pull down to refresh</Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <View key={notif.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: colors.green + '20' }]}>
                  <Ionicons name="megaphone" size={18} color={colors.green} />
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{formatDate(notif.sentAt)}</Text>
              </View>
              <Text style={[styles.notifTitle, { color: colors.gold }]}>{notif.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6 }}>{notif.message}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },
  header: { alignItems: 'center', paddingTop: 10, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '600' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  notifTitle: { fontSize: 16, fontWeight: '600' },
})
