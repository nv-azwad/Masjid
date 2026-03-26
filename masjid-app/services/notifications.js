import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { API_BASE } from '../constants/config'

const NOTIF_PREFS_KEY = 'notification_prefs'
const PUSH_TOKEN_KEY = 'push_token'

// Default preferences
const DEFAULT_PREFS = {
  enabled: false,
  prayers: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
    jummah: true,
  },
}

// ─── Push Token Registration ───

export async function registerForPushNotifications() {
  try {
    // Push notifications not supported on web
    if (Platform.OS === 'web') return null

    const Notifications = await import('expo-notifications')
    const Device = await import('expo-device')

    // Must be a physical device
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device')
      return null
    }

    // Check/request permission
    const { status: existing } = await Notifications.getPermissionsAsync()
    let finalStatus = existing
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied')
      return null
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // Uses project from app.json
    })
    const token = tokenData.data

    // Configure notification appearance on Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance?.MAX,
        vibrationPattern: [0, 250, 250, 250],
      })
    }

    // Store token locally
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token)

    return token
  } catch (e) {
    console.log('Push token registration failed:', e)
    return null
  }
}

// Send token to backend
export async function sendTokenToServer(token) {
  try {
    await fetch(`${API_BASE}/api/push-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  } catch (e) {
    console.log('Failed to send token to server:', e)
  }
}

// Deactivate token on server (user turned off notifications)
export async function deactivateTokenOnServer() {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY)
    if (!token) return

    await fetch(`${API_BASE}/api/push-tokens`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  } catch (e) {
    console.log('Failed to deactivate token:', e)
  }
}

// ─── Notification Preferences ───

export async function getNotificationPrefs() {
  try {
    const stored = await AsyncStorage.getItem(NOTIF_PREFS_KEY)
    if (stored) return JSON.parse(stored)
  } catch (e) {}
  return DEFAULT_PREFS
}

export async function saveNotificationPrefs(prefs) {
  await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs))
}

// ─── Local Prayer Reminders ───

export async function schedulePrayerReminders(prayers, prefs) {
  try {
    // Local notifications not supported on web
    if (Platform.OS === 'web') return

    const Notifications = await import('expo-notifications')

    // Cancel all existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync()

    if (!prefs.enabled) return

    const now = new Date()

    for (const prayer of prayers) {
      const prayerKey = prayer.name.toLowerCase()
      if (!prefs.prayers[prayerKey]) continue

      // Parse prayer time
      const timeStr = prayer.adhan || prayer.time
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (!match) continue

      let hours = parseInt(match[1])
      const minutes = parseInt(match[2])
      const period = match[3].toUpperCase()
      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0

      // Schedule for today if time hasn't passed, otherwise skip
      const prayerDate = new Date(now)
      prayerDate.setHours(hours, minutes, 0, 0)

      if (prayerDate.getTime() <= now.getTime()) continue

      // Schedule notification 5 minutes before adhan
      const triggerDate = new Date(prayerDate.getTime() - 5 * 60000)
      if (triggerDate.getTime() <= now.getTime()) continue

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayer.name} Prayer`,
          body: `${prayer.name} adhan at ${timeStr}. Time to prepare for prayer.`,
          sound: 'default',
          data: { type: 'prayer_reminder', prayer: prayerKey },
        },
        trigger: { date: triggerDate },
      })
    }
  } catch (e) {
    console.log('Failed to schedule prayer reminders:', e)
  }
}
