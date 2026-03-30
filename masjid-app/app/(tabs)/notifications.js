import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, TextInput, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { API_BASE } from '../../constants/config'
import { usePreloadedData } from '../_layout'
import AsyncStorage from '@react-native-async-storage/async-storage'

const showAlert = (title, message) => {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`)
  else Alert.alert(title, message)
}

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme()
  const { markNotificationsRead, markPostsRead, unreadPosts } = usePreloadedData() || {}
  const [tab, setTab] = useState('announcements')
  const [notifications, setNotifications] = useState([])
  const [posts, setPosts] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  // Community post form
  const [showForm, setShowForm] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadNotifications = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(`${API_BASE}/api/notifications`, { signal: controller.signal })
      clearTimeout(timer)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setNotifications(data)
      }
    } catch (e) {
      console.log('Failed to load notifications:', e.message)
    }
  }, [])

  const loadPosts = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(`${API_BASE}/api/community-posts`, { signal: controller.signal })
      clearTimeout(timer)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setPosts(data)
      }
    } catch (e) {
      console.log('Failed to load posts:', e.message)
    }
  }, [])

  const load = useCallback(async () => {
    await Promise.all([loadNotifications(), loadPosts()])
    setLoading(false)
  }, [loadNotifications, loadPosts])

  useEffect(() => {
    load()
    if (markNotificationsRead) markNotificationsRead()
  }, [load, markNotificationsRead])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const submitPost = async () => {
    if (!postContent.trim()) return
    setSubmitting(true)
    try {
      let deviceId = await AsyncStorage.getItem('device_id')
      if (!deviceId) deviceId = 'web_' + Date.now()

      const res = await fetch(`${API_BASE}/api/community-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postContent.trim(),
          authorName: isAnonymous ? null : authorName.trim() || null,
          deviceId,
        }),
      })
      const data = await res.json()
      if (data.error) {
        showAlert('Error', data.error)
      } else {
        showAlert('Message Sent', 'Your message has been submitted for review. It will appear once approved by the mosque admin.')
        setPostContent('')
        setAuthorName('')
        setShowForm(false)
      }
    } catch (e) {
      showAlert('Error', 'Failed to submit message. Please try again.')
    }
    setSubmitting(false)
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

  const tabStyle = (t) => ({
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: tab === t ? colors.green + '20' : 'transparent',
    alignItems: 'center',
  })

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.gold }]}>Updates</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Announcements & Community</Text>
        </View>

        {/* Tab switcher */}
        <View style={[styles.tabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={tabStyle('announcements')} onPress={() => setTab('announcements')}>
            <Text style={{ color: tab === 'announcements' ? colors.green : colors.textMuted, fontSize: 13, fontWeight: '600' }}>
              Announcements
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={tabStyle('community')} onPress={() => { setTab('community'); if (markPostsRead) markPostsRead() }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: tab === 'community' ? colors.green : colors.textMuted, fontSize: 13, fontWeight: '600' }}>
                Community
              </Text>
              {tab !== 'community' && unreadPosts > 0 && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.empty}>
            <Text style={{ color: colors.textSecondary }}>Loading...</Text>
          </View>
        ) : tab === 'announcements' ? (
          /* Announcements tab */
          notifications.length === 0 ? (
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
          )
        ) : (
          /* Community tab */
          <>
            {/* Write a message button / form */}
            {!showForm ? (
              <TouchableOpacity
                onPress={() => setShowForm(true)}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.gold + '20' }]}>
                  <Ionicons name="create-outline" size={18} color={colors.gold} />
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 14, flex: 1 }}>Share a message with the community...</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.gold, fontSize: 15, fontWeight: '600', marginBottom: 12 }}>Share a Message</Text>

                {/* Anonymous toggle */}
                <TouchableOpacity
                  onPress={() => setIsAnonymous(!isAnonymous)}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
                >
                  <View style={{
                    width: 20, height: 20, borderRadius: 4, borderWidth: 2,
                    borderColor: isAnonymous ? colors.green : colors.border,
                    backgroundColor: isAnonymous ? colors.green : 'transparent',
                    justifyContent: 'center', alignItems: 'center', marginRight: 8,
                  }}>
                    {isAnonymous && <Ionicons name="checkmark" size={14} color={isDark ? '#0f1210' : '#fff'} />}
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Post anonymously</Text>
                </TouchableOpacity>

                {/* Name field (if not anonymous) */}
                {!isAnonymous && (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                    placeholder="Your name"
                    placeholderTextColor={colors.textMuted}
                    value={authorName}
                    onChangeText={setAuthorName}
                    maxLength={100}
                  />
                )}

                {/* Message */}
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                  placeholder="Write your message..."
                  placeholderTextColor={colors.textMuted}
                  value={postContent}
                  onChangeText={setPostContent}
                  multiline
                  maxLength={750}
                />
                <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 2 }}>
                  {postContent.length}/750
                </Text>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={submitPost}
                    disabled={submitting || !postContent.trim()}
                    style={[styles.submitBtn, { backgroundColor: colors.green, opacity: submitting || !postContent.trim() ? 0.5 : 1 }]}
                  >
                    <Ionicons name="send" size={14} color={isDark ? '#0f1210' : '#fff'} />
                    <Text style={{ color: isDark ? '#0f1210' : '#fff', fontWeight: '600', fontSize: 13 }}>
                      {submitting ? 'Sending...' : 'Submit'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setShowForm(false); setPostContent('') }} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Approved posts */}
            {posts.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
                <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 12 }}>No community messages yet</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>Be the first to share!</Text>
              </View>
            ) : (
              posts.map((p) => (
                <View key={p.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.iconCircle, { backgroundColor: colors.green + '20' }]}>
                        <Ionicons name="person" size={14} color={colors.green} />
                      </View>
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>
                        {p.authorName || 'Anonymous'}
                      </Text>
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>{formatDate(p.createdAt)}</Text>
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>{p.content}</Text>
                </View>
              ))
            )}
          </>
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
  tabRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 16 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  notifTitle: { fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 8 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  cancelBtn: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
})
