# Gausul Azam Jameh Mosjid — Mobile App

React Native Expo app for the community of Gausul Azam Jameh Mosjid, Road 9, Sector 13, Uttara, Dhaka.

## Features

- **Prayer Times** — Daily salah times synced from the dashboard
- **Jummah Prayer** — Friday prayer time & khateeb info
- **Imam Profiles** — Meet the imams with bios & contact
- **Full Quran** — 114 Surahs with Arabic text + Bengali & English translations
- **Qibla Compass** — Direction to Kaaba (282° from Dhaka)
- **Light/Dark Theme** — Toggle in Settings
- **Offline Quran** — Surahs cached after first read via AsyncStorage
- **Pull to Refresh** — Sync latest data from dashboard

## Tech Stack

- **React Native** (Expo SDK 52)
- **Expo Router** (file-based navigation)
- **AsyncStorage** (offline caching)
- **Al Quran Cloud API** (free, no key needed)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure API URL
# Edit constants/config.js and set API_BASE to your dashboard URL
# Local: http://localhost:3000
# Production: https://your-dashboard-domain.com

# 3. Start development
npx expo start

# 4. Run on device
# Scan QR code with Expo Go app (Android/iOS)
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

## Project Structure

```
app/
├── _layout.js              # Root layout (ThemeProvider wrapper)
├── (tabs)/
│   ├── _layout.js          # Tab navigator (4 tabs)
│   ├── index.js            # Home — prayers, jummah, imams
│   ├── quran.js            # Quran — surah list with search
│   ├── qibla.js            # Qibla compass
│   └── settings.js         # Theme, notifications, language
├── surah/
│   └── [id].js             # Surah detail — ayahs + translations
constants/
│   └── config.js           # Colors, API URLs
context/
│   └── ThemeContext.js      # Light/dark theme state
services/
│   ├── api.js              # Dashboard API client
│   └── quranApi.js         # Quran API + offline caching
```

## Quran Integration

Uses the free **Al Quran Cloud API** (`alquran.cloud`):
- Arabic text: `ar.alafasy` edition
- Bengali: `bn.bengali` edition
- English: `en.asad` edition

**Offline Strategy**: First time a surah is opened, it fetches from the API and caches the entire surah in AsyncStorage. Subsequent reads are instant and work offline.

## Theme Colors

| Property | Dark Mode | Light Mode |
|----------|-----------|------------|
| Background | `#0f1210` | `#f5f1e8` |
| Card | `#1a1d1a` | `#ffffff` |
| Green | `#00ff7f` | `#2d8659` |
| Gold | `#d4af77` | `#8b6f47` |

## Build for Production

```bash
# Android APK
npx expo build:android

# Or use EAS Build (recommended)
npx eas build --platform android
npx eas build --platform ios
```

## Connecting to Dashboard

The app reads data from the dashboard API. Make sure:
1. Dashboard is running and accessible
2. `API_BASE` in `constants/config.js` points to the dashboard URL
3. The `/api/mosque` endpoint returns prayers, jummah, and imam data

If the API is unreachable, the app falls back to hardcoded sample data.

---
© 2026 Gausul Azam Jameh Mosjid
