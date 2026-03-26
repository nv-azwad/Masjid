import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import {
  registerForPushNotifications,
  sendTokenToServer,
  getNotificationPrefs,
  schedulePrayerReminders,
} from '../services/notifications'
import { fetchMosqueData } from '../services/api'

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
      useNativeDriver: true,
    }).start()

    const timer = setTimeout(onFinish, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={splashStyles.container}>
      <StatusBar style="light" />
      <Animated.View style={[splashStyles.content, { opacity: fadeAnim }]}>
        {/* Bismillah Arabic */}
        <Text style={splashStyles.bismillahArabic}>
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </Text>

        {/* English translation */}
        <Text style={splashStyles.bismillahEnglish}>
          In the name of Allah, the Most Gracious, the Most Merciful
        </Text>

        {/* Animated loader bars */}
        <View style={splashStyles.loaderRow}>
          <LoaderBar color="#00ff7f" delay={0} />
          <LoaderBar color="#d4af77" delay={200} />
          <LoaderBar color="#00ff7f" delay={400} />
        </View>
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
})

function RootLayoutInner() {
  const { isDark, colors } = useTheme()
  const [showSplash, setShowSplash] = useState(true)

  // Initialize notifications after splash
  useEffect(() => {
    if (!showSplash) {
      initNotifications()
    }
  }, [showSplash])

  async function initNotifications() {
    try {
      const prefs = await getNotificationPrefs()
      if (!prefs.enabled) return

      const token = await registerForPushNotifications()
      if (token) await sendTokenToServer(token)

      const data = await fetchMosqueData()
      if (data?.prayers) {
        await schedulePrayerReminders(data.prayers, prefs)
      }
    } catch (e) {
      console.log('Notification init skipped:', e.message)
    }
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />
  }

  return (
    <>
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
    </>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  )
}
