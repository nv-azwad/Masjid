# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mosque management system for Gausul Azam Jameh Mosjid (Uttara, Dhaka) with two sub-projects:

- **`masjid-dashboard/`** — Next.js 14 admin dashboard for managing prayer times, imams, Jummah details, and notifications
- **`masjid-app/`** — React Native Expo mobile app for the mosque community (prayer times, Quran reader, Qibla compass)

## Commands

### Dashboard (`cd masjid-dashboard`)
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run db:push      # Push Prisma schema to PostgreSQL
npm run db:seed      # Seed database (node prisma/seed.mjs)
npm run db:studio    # Open Prisma Studio (localhost:5555)
```

### Mobile App (`cd masjid-app`)
```bash
npx expo start       # Start Expo dev server
npx expo start --android   # Launch on Android emulator
npx expo start --ios       # Launch on iOS simulator
```

## Architecture

### Data Flow
The mobile app fetches all mosque data from the dashboard's `/api/mosque` endpoint (prayers, jummah settings, imams, mosque info in one call). If the API is unreachable, the app falls back to hardcoded sample data in `masjid-app/services/api.js`.

### Dashboard (Next.js App Router)
- Single-page dashboard: entire UI is in `app/page.js` as a client component with section-based navigation (Overview, Prayers, Jummah, Imams, Notifications)
- API routes in `app/api/` — each resource (prayers, imams, jummah, notifications, mosque) has its own `route.js`
- Database: PostgreSQL via Prisma ORM. Schema in `prisma/schema.prisma` with 5 models: Mosque, Prayer, JummahSetting, Imam, Notification
- Prisma client singleton in `lib/prisma.js` (cached in `globalThis` for dev hot reload)
- Custom Tailwind colors under the `masjid` namespace (green, gold, card, bg, border, dark) defined in `tailwind.config.js`

### Mobile App (Expo Router)
- File-based routing via Expo Router: tabs in `app/(tabs)/`, dynamic route `app/surah/[id].js`
- `services/api.js` — dashboard API client using `API_BASE` from `constants/config.js`
- `services/quranApi.js` — Al Quran Cloud API client with AsyncStorage caching (surahs cached permanently after first fetch)
- `context/ThemeContext.js` — light/dark theme provider
- `constants/config.js` — color palette (light/dark), `API_BASE` URL, and Quran API URL

### Key Configuration
- Dashboard requires `DATABASE_URL` env var (PostgreSQL). See `.env.example`
- Mobile app's `API_BASE` in `constants/config.js` must point to the running dashboard URL
- Quran API: `https://api.alquran.cloud/v1` (free, no key needed) — fetches Arabic (ar.alafasy), Bengali (bn.bengali), and English (en.asad) editions
