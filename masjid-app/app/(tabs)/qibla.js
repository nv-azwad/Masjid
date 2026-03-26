import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'

// Qibla bearing from Dhaka, Bangladesh ≈ 282° (West-Northwest)
const QIBLA_BEARING = 282
const isWeb = Platform.OS === 'web'

export default function QiblaScreen() {
  const { colors, isDark } = useTheme()
  const [heading, setHeading] = useState(0)
  const [status, setStatus] = useState(isWeb ? 'web' : 'loading')
  const prevHeading = useRef(0)

  useEffect(() => {
    if (isWeb) return // No compass on web

    let headingSub

    async function startHeading() {
      try {
        const Location = await import('expo-location')

        const { status: perm } = await Location.requestForegroundPermissionsAsync()
        if (perm !== 'granted') {
          setStatus('denied')
          return
        }

        const available = await Location.hasServicesEnabledAsync()
        if (!available) {
          setStatus('unavailable')
          return
        }

        setStatus('active')

        headingSub = await Location.watchHeadingAsync((data) => {
          const newHeading = data.trueHeading >= 0 ? data.trueHeading : data.magHeading

          let diff = newHeading - prevHeading.current
          if (diff > 180) diff -= 360
          if (diff < -180) diff += 360
          const smooth = (prevHeading.current + 0.3 * diff + 360) % 360
          prevHeading.current = smooth

          setHeading(smooth)
        })
      } catch (e) {
        console.log('Heading error:', e)
        setStatus('unavailable')
      }
    }

    startHeading()
    return () => headingSub?.remove()
  }, [])

  const size = Dimensions.get('window').width - 80

  // Compass rose rotates opposite to heading so N points to real North
  const compassRotation = -heading
  // Qibla arrow: difference between Qibla bearing and current heading
  const qiblaRotation = QIBLA_BEARING - heading

  // Check if roughly pointing at Qibla (within ±5°)
  const qiblaOffset = ((QIBLA_BEARING - heading + 360) % 360)
  const isPointingQibla = qiblaOffset < 5 || qiblaOffset > 355

  // Cardinal & intercardinal labels
  const cardinals = [
    { label: 'N', deg: 0, major: true },
    { label: 'NE', deg: 45 },
    { label: 'E', deg: 90, major: true },
    { label: 'SE', deg: 135 },
    { label: 'S', deg: 180, major: true },
    { label: 'SW', deg: 225 },
    { label: 'W', deg: 270, major: true },
    { label: 'NW', deg: 315 },
  ]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.green }]}>
            <Ionicons name="navigate" size={22} color={isDark ? '#0f1210' : '#fff'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, color: colors.gold, fontWeight: '600' }}>Qibla Direction</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              {isPointingQibla && status === 'active'
                ? 'You are facing the Kaaba!'
                : 'Rotate to find the Qibla'}
            </Text>
          </View>
        </View>
        {/* Heading readout */}
        <View style={[styles.headingRow, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <View style={styles.headingItem}>
            <Text style={{ color: colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Heading</Text>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>{Math.round(heading)}°</Text>
          </View>
          <View style={[styles.headingDivider, { backgroundColor: colors.border }]} />
          <View style={styles.headingItem}>
            <Text style={{ color: colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Qibla</Text>
            <Text style={{ color: colors.green, fontSize: 18, fontWeight: '600' }}>{QIBLA_BEARING}°</Text>
          </View>
        </View>
      </View>

      {/* Compass */}
      <View style={[styles.compassCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Fixed North indicator at top */}
        <View style={styles.northPointer}>
          <Ionicons name="caret-down" size={20} color={colors.gold} />
        </View>

        <View style={[styles.compassOuter, { width: size, height: size }]}>
          {/* Rotating compass rose */}
          <View style={[
            styles.compassRose,
            { width: size, height: size, transform: [{ rotate: `${compassRotation}deg` }] },
          ]}>
            {/* Outer ring */}
            <View style={[styles.outerRing, { width: size - 4, height: size - 4, borderColor: colors.border + '80' }]} />

            {/* Tick marks every 5° */}
            {Array.from({ length: 72 }).map((_, i) => {
              const deg = i * 5
              const isMajor = deg % 90 === 0
              const isMid = deg % 30 === 0
              return (
                <View
                  key={i}
                  style={[
                    styles.tick,
                    {
                      height: isMajor ? 14 : isMid ? 9 : 4,
                      width: isMajor ? 2.5 : 1.5,
                      backgroundColor: isMajor ? colors.gold : isMid ? colors.textMuted : colors.border,
                      transform: [
                        { rotate: `${deg}deg` },
                        { translateY: -(size / 2 - 4) },
                      ],
                    },
                  ]}
                />
              )
            })}

            {/* Cardinal labels */}
            {cardinals.map(({ label, deg, major }) => {
              const r = size / 2 - 32
              const rad = (deg - 90) * (Math.PI / 180)
              const x = r * Math.cos(rad)
              const y = r * Math.sin(rad)
              return (
                <View
                  key={label}
                  style={[styles.cardinalLabel, { left: size / 2 + x - 14, top: size / 2 + y - 10 }]}
                >
                  <Text style={{
                    color: label === 'N' ? colors.gold : major ? colors.text : colors.textMuted,
                    fontSize: label === 'N' ? 18 : major ? 14 : 11,
                    fontWeight: major ? '700' : '500',
                    textAlign: 'center',
                  }}>
                    {label}
                  </Text>
                </View>
              )
            })}

            {/* Inner ring */}
            <View style={[styles.innerRing, { width: size - 70, height: size - 70, borderColor: colors.border + '40' }]} />
          </View>

          {/* Qibla arrow (rotates independently over the compass) */}
          <View
            style={[
              styles.qiblaOverlay,
              { transform: [{ rotate: `${qiblaRotation}deg` }] },
            ]}
          >
            <View style={styles.qiblaArrowColumn}>
              {/* Line from near-center toward edge */}
              <View style={[styles.qiblaLine, { height: size / 2 - 40, backgroundColor: colors.green }]} />
              {/* Circle at tip */}
              <View style={[styles.kaabaCircle, { backgroundColor: colors.green }]}>
                <Ionicons name="locate" size={18} color={isDark ? '#0f1210' : '#fff'} />
              </View>
            </View>
          </View>

          {/* Center dot */}
          <View style={[styles.centerDot, { backgroundColor: colors.gold }]} />
        </View>

        {/* Facing Qibla badge */}
        {isPointingQibla && status === 'active' && (
          <View style={[styles.statusBadge, { backgroundColor: colors.green + '20', borderColor: colors.green + '40' }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.green} />
            <Text style={{ color: colors.green, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>Facing Qibla</Text>
          </View>
        )}
      </View>

      {/* Bottom info */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {status === 'web' ? (
          <View style={[styles.warning, { backgroundColor: colors.green + '15', borderColor: colors.green + '40' }]}>
            <Ionicons name="information-circle" size={16} color={colors.green} />
            <Text style={{ color: colors.textSecondary, fontSize: 12, flex: 1, marginLeft: 8 }}>
              Live compass is not available on web. The Qibla direction from Dhaka is {QIBLA_BEARING}° (West-Northwest). Use a physical compass or the mobile app for real-time guidance.
            </Text>
          </View>
        ) : status === 'denied' ? (
          <View style={[styles.warning, { backgroundColor: colors.gold + '15', borderColor: colors.gold + '40' }]}>
            <Ionicons name="alert-circle" size={16} color={colors.gold} />
            <Text style={{ color: colors.gold, fontSize: 12, flex: 1, marginLeft: 8 }}>
              Location permission is required for the compass. Please enable it in your device settings.
            </Text>
          </View>
        ) : status === 'unavailable' ? (
          <View style={[styles.warning, { backgroundColor: colors.gold + '15', borderColor: colors.gold + '40' }]}>
            <Ionicons name="alert-circle" size={16} color={colors.gold} />
            <Text style={{ color: colors.gold, fontSize: 12, flex: 1, marginLeft: 8 }}>
              Compass sensor not available on this device
            </Text>
          </View>
        ) : (
          <>
            <Text style={{ color: colors.gold, fontWeight: '500', fontSize: 14, marginBottom: 10 }}>How to use</Text>
            {[
              'Hold your device flat and level',
              'The compass rose rotates to show North',
              'The green arrow always points toward the Kaaba',
            ].map((text, i) => (
              <View key={i} style={styles.instructionRow}>
                <View style={[styles.stepDot, { backgroundColor: colors.green }]}>
                  <Text style={{ color: isDark ? '#0f1210' : '#fff', fontSize: 9, fontWeight: '700' }}>{i + 1}</Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1 }}>{text}</Text>
              </View>
            ))}
          </>
        )}
        <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 10 }}>
          Qibla bearing from Dhaka: {QIBLA_BEARING}° WNW
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 14 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headingRow: { flexDirection: 'row', marginTop: 14, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  headingItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  headingDivider: { width: 1, marginVertical: 8 },
  compassCard: { borderRadius: 16, padding: 16, borderWidth: 1, alignItems: 'center' },
  northPointer: { marginBottom: -4, zIndex: 10 },
  compassOuter: { justifyContent: 'center', alignItems: 'center' },
  compassRose: { justifyContent: 'center', alignItems: 'center' },
  outerRing: { position: 'absolute', borderRadius: 999, borderWidth: 1.5 },
  tick: { position: 'absolute', borderRadius: 1 },
  cardinalLabel: { position: 'absolute', width: 28, alignItems: 'center' },
  innerRing: { position: 'absolute', borderRadius: 999, borderWidth: 1 },
  qiblaOverlay: { position: 'absolute', alignItems: 'center', width: '100%', height: '100%', justifyContent: 'flex-start', paddingTop: 20 },
  qiblaArrowColumn: { alignItems: 'center' },
  qiblaLine: { width: 3, borderRadius: 2 },
  kaabaCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: -2 },
  centerDot: { width: 10, height: 10, borderRadius: 5, position: 'absolute' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginTop: 12 },
  instructionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  stepDot: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  warning: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1 },
})
