# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mosque management system for Gausul Azam Jameh Masjid (Uttara, Dhaka) with three sub-projects:

- **`masjid-dashboard/`** — Next.js 14 admin dashboard for managing prayer times, imams, Jummah details, and notifications
- **`masjid-app/`** — React Native Expo mobile app + PWA for the mosque community (prayer times, Quran reader, Qibla compass)

## Deployment

- **Dashboard:** Live at `https://masjid-dun.vercel.app/` (Vercel, Hobby plan)
- **PWA (Web App):** Live at `https://gausul-azam-masjid.vercel.app/` (separate Vercel project, root dir: `masjid-app`)
- **Database:** PostgreSQL on Neon free tier (neondb, ap-southeast-1). Keepalive ping via cron-job.org every 5 min.
- **Cron:** Vercel cron at `0 18 * * *` (midnight BD time) auto-syncs prayer times. Protected by `CRON_SECRET` env var.
- **Android APK:** Built via EAS (Expo account: nv-azwad). Firebase FCM for push notifications.
- **GitHub:** Private repo at github.com/nv-azwad/Masjid

## Auth System

- Login uses **username + password** (not email)
- Default usernames: `admin_tt` (ADMIN), `mod_tt` (MODERATOR)
- Passwords are bcrypt-hashed, generated during `db:seed`
- Password recovery via email: `/forgot-password` page sends reset link to `recoveryEmail` field on User model
- Recovery email requires `GMAIL_USER` and `GMAIL_APP_PASSWORD` env vars on Vercel
- Reset tokens expire after 1 hour
- Rate limiting on login endpoint by IP

## Vercel Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Signs auth tokens |
| `CRON_SECRET` | Protects daily prayer sync cron |
| `GMAIL_USER` | Gmail address for password recovery emails (optional until set up) |
| `GMAIL_APP_PASSWORD` | Gmail App Password for nodemailer (optional until set up) |
| `RECOVERY_EMAIL` | Used by seed script to set admin recovery email (optional) |

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
npm run build:web    # Build Expo Web PWA (output: dist/)
```

## Architecture

### Data Flow
The mobile app and PWA fetch all mosque data from the dashboard's `/api/mosque` endpoint (prayers, jummah settings, imams, mosque info in one call). If the API is unreachable, the app falls back to locally calculated prayer times via adhan.js.

### Dashboard (Next.js App Router)
- Single-page dashboard: entire UI is in `app/page.js` as a client component with section-based navigation (Overview, Prayers, Jummah, Imams, Notifications, Users)
- API routes in `app/api/` — each resource has its own `route.js`
- Database: PostgreSQL via Prisma ORM. Schema in `prisma/schema.prisma`
- Models: User, Mosque, Prayer, JummahSetting, Imam, Notification, PushToken, AppInstall, Member, PendingChange
- Prisma client singleton in `lib/prisma.js` (cached in `globalThis` for dev hot reload)
- Input validation via Zod schemas in `lib/validations.js`
- Custom Tailwind colors under the `masjid` namespace (green, gold, card, bg, border, dark) defined in `tailwind.config.js`
- Auth pages: `/login`, `/forgot-password`, `/reset-password`

### Mobile App (Expo Router)
- File-based routing via Expo Router: tabs in `app/(tabs)/`, dynamic route `app/surah/[id].js`
- `services/api.js` — dashboard API client using `API_BASE` from `constants/config.js`
- `services/quranApi.js` — Al Quran Cloud API client with AsyncStorage caching (surahs cached permanently after first fetch)
- `context/ThemeContext.js` — light/dark theme provider
- `constants/config.js` — color palette (light/dark), `API_BASE` URL, and Quran API URL
- Web (PWA): native features (push notifications, compass) gracefully skip on web platform

### Key Configuration
- Dashboard requires `DATABASE_URL` env var (PostgreSQL)
- Mobile app's `API_BASE` in `constants/config.js` points to `https://masjid-dun.vercel.app`
- Quran API: `https://api.alquran.cloud/v1` (free, no key needed) — fetches Arabic (ar.alafasy), Bengali (bn.bengali), and English (en.asad) editions

## Migration Notes (for future company account transfer)
- **Vercel:** Invite company account as team member, transfer projects
- **GitHub:** Transfer repo to company org
- **Neon DB:** Transfer or update `DATABASE_URL`
- **Firebase:** Add company email as project owner
- **Domain:** Point custom domain to Vercel projects
- All services support account/project transfers — nothing is permanently locked to a personal account
