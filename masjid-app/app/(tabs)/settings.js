import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Switch, StyleSheet, Alert, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import {
  registerForPushNotifications,
  sendTokenToServer,
  deactivateTokenOnServer,
  getNotificationPrefs,
  saveNotificationPrefs,
  schedulePrayerReminders,
} from '../../services/notifications'
import { fetchMosqueData } from '../../services/api'


export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme()

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`)
    } else {
      Alert.alert(title, message)
    }
  }
  const [notificationsOn, setNotificationsOn] = useState(false)
  const [togglingNotif, setTogglingNotif] = useState(false)

  // Load saved preferences on mount
  useEffect(() => {
    loadPrefs()
  }, [])

  async function loadPrefs() {
    try {
      const notifPrefs = await getNotificationPrefs()
      setNotificationsOn(notifPrefs.enabled)
    } catch (e) {
      console.log('Failed to load prefs:', e)
    }
  }

  async function handleNotificationToggle(value) {
    setTogglingNotif(true)
    setNotificationsOn(value)

    try {
      const prefs = await getNotificationPrefs()
      prefs.enabled = value
      await saveNotificationPrefs(prefs)

      if (value) {
        // Push notifications not available on web
        if (Platform.OS === 'web') {
          prefs.enabled = false
          await saveNotificationPrefs(prefs)
          setNotificationsOn(false)
          showAlert(
            'Not Available on Web',
            'Push notifications are only available on the mobile app.',
          )
          setTogglingNotif(false)
          return
        }

        // Enable: register push token + schedule reminders
        const result = await registerForPushNotifications()
        if (result.token) {
          await sendTokenToServer(result.token)
        } else {
          prefs.enabled = false
          await saveNotificationPrefs(prefs)
          setNotificationsOn(false)
          const messages = {
            web: 'Push notifications are only available on the mobile app.',
            permission_denied: 'Please enable notification permissions in your device settings.',
            not_physical_device: 'Push notifications are only available on physical devices.',
            no_project_id: 'App configuration error. Please reinstall the app.',
            error: `Something went wrong: ${result.message || 'Unknown error'}`,
          }
          showAlert('Notifications Unavailable', messages[result.reason] || messages.error)
          setTogglingNotif(false)
          return
        }

        // Schedule local prayer reminders
        const data = await fetchMosqueData()
        if (data?.prayers) {
          await schedulePrayerReminders(data.prayers, prefs)
        }
      } else {
        // Disable: deactivate token + cancel reminders
        await deactivateTokenOnServer()
        await schedulePrayerReminders([], prefs) // cancels all
      }
    } catch (e) {
      console.log('Notification toggle error:', e)
    }

    setTogglingNotif(false)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.gold }]}>Settings</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Manage your preferences</Text>
        </View>

        {/* Appearance */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.green} />
            <Text style={[styles.sectionTitle, { color: colors.gold }]}>Appearance</Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 14 }}>
            Switch between light and dark mode
          </Text>
          <View style={[styles.settingRow, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View>
              <Text style={{ color: colors.text, fontWeight: '500' }}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                {isDark ? 'Easier on the eyes at night' : 'Bright and clear display'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#d1d5db', true: colors.green + '60' }}
              thumbColor={isDark ? colors.green : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={20} color={colors.green} />
            <Text style={[styles.sectionTitle, { color: colors.gold }]}>Notifications</Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 14 }}>
            Get reminders 5 minutes before each prayer
          </Text>
          <View style={[styles.settingRow, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: colors.text, fontWeight: '500' }}>Prayer Reminders</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                {notificationsOn ? 'You will be notified before each prayer' : 'Enable to receive prayer reminders'}
              </Text>
            </View>
            <Switch
              value={notificationsOn}
              onValueChange={handleNotificationToggle}
              disabled={togglingNotif}
              trackColor={{ false: '#d1d5db', true: colors.green + '60' }}
              thumbColor={notificationsOn ? colors.green : '#f4f3f4'}
            />
          </View>
        </View>

        {/* About */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.gold, marginBottom: 10 }]}>About</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Gausul Azam Jameh Masjid</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Road 9, Sector 13, Uttara, Dhaka</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Version 1.0.0</Text>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 12 }}>
            © 2026 Gausul Azam Jameh Masjid
          </Text>
          <Text style={{ color: colors.gold, fontSize: 10, marginTop: 6, fontWeight: '600' }}>
            Powered by Trinovent Tech
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100, gap: 16 },
  header: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '600' },
  card: { borderRadius: 16, padding: 20, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '500' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1 },
})
