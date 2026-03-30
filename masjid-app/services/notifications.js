import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { API_BASE, VAPID_PUBLIC_KEY } from '../constants/config'

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

// ─── Android Notification Channels ───

async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return
  try {
    const Notifications = await import('expo-notifications')
    // Default channel for server-sent push notifications
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance?.MAX ?? 5,
      vibrationPattern: [0, 250, 250, 250],
    })
    // Dedicated channel for prayer reminders — high priority ensures pop-up
    await Notifications.setNotificationChannelAsync('prayer-reminders', {
      name: 'Prayer Reminders',
      description: 'Reminders before prayer jamaat times',
      importance: Notifications.AndroidImportance?.MAX ?? 5,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
    })
  } catch (e) {
    console.log('Channel setup failed:', e)
  }
}

// ─── Push Token Registration ───

export async function registerForPushNotifications() {
  try {
    // Push notifications not supported on web
    if (Platform.OS === 'web') return { token: null, reason: 'web' }

    const Notifications = await import('expo-notifications')
    const Device = await import('expo-device')

    const isPhysical = Device.isDevice ?? Device.default?.isDevice ?? true
    if (!isPhysical) {
      return { token: null, reason: 'not_physical_device' }
    }

    // Check/request permission
    const { status: existing } = await Notifications.getPermissionsAsync()
    let finalStatus = existing
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      return { token: null, reason: 'permission_denied' }
    }

    // Get Expo push token
    const Constants = await import('expo-constants')
    const projectId = Constants.default?.expoConfig?.extra?.eas?.projectId
      ?? Constants.expoConfig?.extra?.eas?.projectId
    if (!projectId) {
      return { token: null, reason: 'no_project_id' }
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
    const token = tokenData.data

    // Set up Android notification channels
    await setupAndroidChannels()

    // Store token locally
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token)

    return { token, reason: null }
  } catch (e) {
    console.log('Push token registration failed:', e)
    return { token: null, reason: 'error', message: e.message }
  }
}

// Send token to backend
export async function sendTokenToServer(token) {
  try {
    const deviceId = await AsyncStorage.getItem('device_id')
    await fetch(`${API_BASE}/api/push-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, deviceId }),
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
  } catch (e) {
    console.log('Failed to load notification prefs:', e.message)
  }
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

    // Ensure Android channels exist before scheduling
    await setupAndroidChannels()

    const now = new Date()

    for (const prayer of prayers) {
      const prayerKey = prayer.name.toLowerCase()
      if (!prefs.prayers[prayerKey]) continue

      // Use jamaat time (prayer.time) — that's what the congregation follows
      const timeStr = prayer.time
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (!match) continue

      let hours = parseInt(match[1])
      const minutes = parseInt(match[2])
      const period = match[3].toUpperCase()
      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0

      // Schedule for today if time hasn't passed, otherwise skip
      const jamaatDate = new Date(now)
      jamaatDate.setHours(hours, minutes, 0, 0)

      if (jamaatDate.getTime() <= now.getTime()) continue

      // Schedule notification 15 minutes before jamaat
      const triggerDate = new Date(jamaatDate.getTime() - 15 * 60000)
      if (triggerDate.getTime() <= now.getTime()) continue

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayer.name} Prayer`,
          body: `${prayer.name} jamaat in 15 minutes (${timeStr}). Time to prepare for prayer.`,
          sound: 'default',
          priority: 'max',
          ...(Platform.OS === 'android' ? { channelId: 'prayer-reminders' } : {}),
          data: { type: 'prayer_reminder', prayer: prayerKey },
        },
        trigger: {
          type: 'date',
          date: triggerDate,
        },
      })
    }
  } catch (e) {
    console.log('Failed to schedule prayer reminders:', e)
  }
}

// ─── Web Push (PWA only) ───

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export async function registerForWebPush() {
  if (Platform.OS !== 'web') return { subscription: null, reason: 'not_web' }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { subscription: null, reason: 'not_supported' }
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { subscription: null, reason: 'permission_denied' }
    }

    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, subscription.endpoint)
    return { subscription, reason: null }
  } catch (e) {
    console.log('Web push registration failed:', e.message)
    return { subscription: null, reason: 'error', message: e.message }
  }
}

export async function sendWebSubToServer(subscription) {
  try {
    const deviceId = await AsyncStorage.getItem('device_id')
    const json = subscription.toJSON()
    await fetch(`${API_BASE}/api/web-push-subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        deviceId,
      }),
    })
  } catch (e) {
    console.log('Failed to send web push subscription to server:', e.message)
  }
}

export async function deactivateWebSubOnServer() {
  try {
    const endpoint = await AsyncStorage.getItem(PUSH_TOKEN_KEY)
    if (!endpoint) return
    await fetch(`${API_BASE}/api/web-push-subscriptions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    })
  } catch (e) {
    console.log('Failed to deactivate web push subscription:', e.message)
  }
}
