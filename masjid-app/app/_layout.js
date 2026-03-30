import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import {
  registerForPushNotifications,
  sendTokenToServer,
  getNotificationPrefs,
  schedulePrayerReminders,
  registerForWebPush,
  sendWebSubToServer,
} from '../services/notifications'
import { fetchMosqueData } from '../services/api'
import { API_BASE } from '../constants/config'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Tell expo-notifications how to display notifications (required for local scheduled notifications)
if (Platform.OS !== 'web') {
  import('expo-notifications').then(Notifications => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    })
  }).catch(e => console.log('Notification handler setup skipped:', e.message))
}

// Shared context so preloaded data flows to home screen without re-fetch
const PreloadContext = createContext(null)
export function usePreloadedData() { return useContext(PreloadContext) }

function LoaderBar({ color, delay }) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 60],
  })

  return (
    <Animated.View
      style={{
        width,
        height: 4,
        borderRadius: 2,
        backgroundColor: color,
      }}
    />
  )
}

function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start()
  }, [])

  // onFinish is called externally when data is ready
  // but show splash for at least 2 seconds for the animation
  useEffect(() => {
    const min = setTimeout(() => {
      // Mark minimum time passed — parent controls actual dismiss
    }, 2000)
    return () => clearTimeout(min)
  }, [])

  return (
    <View style={splashStyles.container}>
      <StatusBar style="light" />
      <Animated.View style={[splashStyles.content, { opacity: fadeAnim }]}>
        <Text style={splashStyles.bismillahArabic}>
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </Text>
        <Text style={splashStyles.bismillahEnglish}>
          In the name of Allah, the Most Gracious, the Most Merciful
        </Text>
        <View style={splashStyles.loaderRow}>
          <LoaderBar color="#00ff7f" delay={0} />
          <LoaderBar color="#d4af77" delay={200} />
          <LoaderBar color="#00ff7f" delay={400} />
        </View>
        <Text style={splashStyles.poweredBy}>Powered by Trinovent Tech</Text>
      </Animated.View>
    </View>
  )
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1210',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  bismillahArabic: {
    fontSize: 32,
    color: '#d4af77',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 60,
  },
  bismillahEnglish: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  poweredBy: {
    color: '#d4af77',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 24,
    letterSpacing: 0.5,
  },
})

// Generate and persist a unique device ID for install tracking
async function trackAppOpen() {
  try {
    let deviceId = await AsyncStorage.getItem('device_id')
    if (!deviceId) {
      deviceId = 'dev_' + (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'xxxx-xxxx-xxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)) + '-' + Date.now().toString(36))
      await AsyncStorage.setItem('device_id', deviceId)
    }
    const platform = Platform.OS // 'android', 'ios', or 'web'
    fetch(`${API_BASE}/api/app-open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, platform }),
    }).catch(() => {}) // fire and forget
  } catch (e) {
    console.log('App open tracking failed:', e.message)
  }
}

function RootLayoutInner() {
  const { isDark, colors } = useTheme()
  const [showSplash, setShowSplash] = useState(true)
  const [preloadedData, setPreloadedData] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadPosts, setUnreadPosts] = useState(0)
  const dataReady = useRef(false)
  const minTimePassed = useRef(false)

  // Preload data during splash screen
  useEffect(() => {
    const minTimer = setTimeout(() => {
      minTimePassed.current = true
      if (dataReady.current) setShowSplash(false)
    }, 2000)

    // Track app open (fire and forget)
    trackAppOpen()

    // Fetch data in parallel during splash
    Promise.all([
      fetchMosqueData().catch(() => null),
      getNotificationPrefs().catch(() => null),
      loadUnreadCount(),
      loadUnreadPosts(),
    ]).then(([mosqueData, prefs]) => {
      if (mosqueData) setPreloadedData(mosqueData)
      dataReady.current = true
      if (minTimePassed.current) setShowSplash(false)

      // Init push notifications in background
      if (prefs?.enabled) {
        initNotifications(mosqueData, prefs)
      }
    })

    return () => clearTimeout(minTimer)
  }, [])

  async function loadUnreadCount() {
    try {
      const lastSeen = await AsyncStorage.getItem('notifications_last_seen')
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(`${API_BASE}/api/notifications`, { signal: controller.signal })
      clearTimeout(timer)
      if (res.ok) {
        const notifs = await res.json()
        if (Array.isArray(notifs) && lastSeen) {
          const count = notifs.filter(n => new Date(n.sentAt) > new Date(lastSeen)).length
          setUnreadCount(count)
        } else if (Array.isArray(notifs)) {
          setUnreadCount(notifs.length)
        }
      }
    } catch (e) {
      console.log('Unread count check failed:', e.message)
    }
  }

  async function loadUnreadPosts() {
    try {
      const lastSeen = await AsyncStorage.getItem('community_posts_last_seen')
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(`${API_BASE}/api/community-posts`, { signal: controller.signal })
      clearTimeout(timer)
      if (res.ok) {
        const posts = await res.json()
        if (Array.isArray(posts) && lastSeen) {
          const count = posts.filter(p => new Date(p.createdAt) > new Date(lastSeen)).length
          setUnreadPosts(count)
        } else if (Array.isArray(posts)) {
          setUnreadPosts(posts.length)
        }
      }
    } catch (e) {
      console.log('Unread posts check failed:', e.message)
    }
  }

  async function initNotifications(mosqueData, prefs) {
    try {
      if (Platform.OS === 'web') {
        const result = await registerForWebPush()
        if (result.subscription) await sendWebSubToServer(result.subscription)
      } else {
        const result = await registerForPushNotifications()
        if (result.token) await sendTokenToServer(result.token)
        if (mosqueData?.prayers) {
          await schedulePrayerReminders(mosqueData.prayers, prefs)
        }
      }
    } catch (e) {
      console.log('Notification init skipped:', e.message)
    }
  }

  const markNotificationsRead = async () => {
    setUnreadCount(0)
    await AsyncStorage.setItem('notifications_last_seen', new Date().toISOString())
  }

  const markPostsRead = async () => {
    setUnreadPosts(0)
    await AsyncStorage.setItem('community_posts_last_seen', new Date().toISOString())
  }

  if (showSplash) {
    return <SplashScreen />
  }

  return (
    <PreloadContext.Provider value={{ preloadedData, unreadCount, unreadPosts, markNotificationsRead, markPostsRead }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="surah/[id]" options={{ headerShown: false }} />
      </Stack>
    </PreloadContext.Provider>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  )
}
