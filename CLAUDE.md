# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mosque management system for Gausul Azam Jameh Masjid (Uttara, Dhaka) with two sub-projects:

- **`masjid-dashboard/`** — Next.js 14 admin dashboard for managing prayer times, imams, Jummah details, notifications, calendar events, and community posts
- **`masjid-app/`** — React Native Expo mobile app + PWA for the mosque community (prayer times, Quran reader, Qibla compass, Islamic calendar, community posts, web push notifications)

## Deployment

- **Dashboard:** Live at `https://masjid-dun.vercel.app/` (Vercel, Hobby plan)
- **PWA (Web App):** Live at `https://gausul-azam-masjid.vercel.app/` (separate Vercel project, root dir: `masjid-app`)
- **Database:** PostgreSQL on Neon free tier (neondb, ap-southeast-1). Keepalive ping via cron-job.org every 5 min.
- **Cron:** Vercel cron at `0 18 * * *` (midnight BD time) auto-syncs prayer times. Protected by `CRON_SECRET` env var.
- **Android APK:** Built via EAS (Expo account: nv-azwad). Build command: `npx eas-cli@latest build --platform android --profile preview`. Firebase FCM for push notifications.
- **Android AAB (Play Store):** Build command: `npx eas-cli@latest build --platform android --profile production`
- **GitHub:** Public repo at github.com/nv-azwad/Masjid

## Auth System

- Login uses **username + password** (not email)
- Default usernames: `admin_tt` (ADMIN), `mod_tt` (MODERATOR)
- Passwords are bcrypt-hashed, generated during `db:seed`
- Password recovery via email: `/forgot-password` page sends reset link to `recoveryEmail` field on User model
- Recovery email requires `GMAIL_USER` and `GMAIL_APP_PASSWORD` env vars on Vercel
- Reset tokens expire after 1 hour
- Rate limiting on login endpoint by IP

## Vercel Environment Variables (Dashboard Project)

| Variable | Purpose | Status |
|----------|---------|--------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Set |
| `JWT_SECRET` | Signs auth tokens | Set |
| `CRON_SECRET` | Protects daily prayer sync cron | Set |
| `VAPID_PUBLIC_KEY` | Web push notifications (public key) | Set |
| `VAPID_PRIVATE_KEY` | Web push notifications (private key) | Set |
| `GMAIL_USER` | Gmail address for password recovery emails | Not set (no mosque Gmail yet) |
| `GMAIL_APP_PASSWORD` | Gmail App Password for nodemailer | Not set |

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
npx eas-cli@latest build --platform android --profile preview      # APK (sideload)
npx eas-cli@latest build --platform android --profile production   # AAB (Play Store)
```

## Architecture

### Data Flow
The mobile app and PWA fetch all mosque data from the dashboard's `/api/mosque` endpoint (prayers, jummah settings, imams, mosque info, calendar events in one call). CDN cached with `s-maxage=30, stale-while-revalidate=60`. Dashboard bypasses CDN cache with `?t=Date.now()`. If the API is unreachable, the app falls back to cached data in AsyncStorage, then locally calculated prayer times via adhan.js (network-first strategy).

### Notifications
- **Android push:** Firebase FCM via Expo Push API. Tokens stored in `PushToken` model with `deviceId`.
- **Web push (PWA):** W3C Push API with VAPID keys. Service worker at `public/sw.js`. Subscriptions stored in `WebPushSubscription` model with `deviceId`.
- **Prayer reminders:** Local scheduled notifications 15min before jamaat (Android only, not possible on web). Uses `setNotificationHandler` in `_layout.js` for foreground display. Android channel: `prayer-reminders` with MAX importance.
- **Community post notifications:** When admin approves/rejects a post, the author's device is notified via their linked `deviceId` (both Expo push and web push).
- **Admin announcements:** Sent to ALL active push tokens + web subscriptions simultaneously.

### Features (v1.1.0)
- **Islamic Calendar:** Hijri date on home screen header, calendar modal with month navigation, admin-managed events (types: event, special_prayer, holiday, reminder), red badge for unseen events
- **Community Posts:** Two-tab Updates screen (Announcements + Community), users submit messages (anonymous or named, 750 char limit), admin approves/rejects in dashboard, rate limited to 3 posts/device/day, author notified on approval/rejection
- **Qibla Compass:** Animated.Value with native driver, 0.06 smoothing factor, 1.5° dead zone, cumulative rotation tracking, calibration prompt after 3s of no data. DO NOT modify compass logic — issues are hardware calibration, not code.
- **Unread Badges:** Combined count of unseen announcements + community posts on Updates tab. Red dot on Community tab header for unseen posts.

### Dashboard (Next.js App Router)
- Single-page dashboard: entire UI is in `app/page.js` as a client component with section-based navigation (Overview, Prayers, Jummah, Imams, Notifications, Calendar Events, Community Posts, Users)
- API routes in `app/api/` — each resource has its own `route.js`
- Database: PostgreSQL via Prisma ORM. Schema in `prisma/schema.prisma`
- Models: User, Mosque, Prayer, JummahSetting, Imam, Notification, PushToken, WebPushSubscription, AppInstall, Member, PendingChange, CalendarEvent, CommunityPost
- Prisma client singleton in `lib/prisma.js` (cached in `globalThis` for dev hot reload)
- Input validation via Zod schemas in `lib/validations.js`
- Custom Tailwind colors under the `masjid` namespace (green, gold, card, bg, border, dark) defined in `tailwind.config.js`
- Auth pages: `/login`, `/forgot-password`, `/reset-password`

### Mobile App (Expo Router)
- File-based routing via Expo Router: tabs in `app/(tabs)/`, dynamic route `app/surah/[id].js`
- `services/api.js` — dashboard API client, network-first with AsyncStorage fallback
- `services/quranApi.js` — Al Quran Cloud API client with AsyncStorage caching
- `services/notifications.js` — push token registration (native + web), Android channels, local prayer reminders, web push subscription (VAPID)
- `services/hijriDate.js` — Gregorian-to-Hijri converter (Umm al-Qura algorithm, ±1 day accuracy)
- `context/ThemeContext.js` — light/dark theme provider
- `constants/config.js` — color palette, `API_BASE` URL, Quran API URL, `VAPID_PUBLIC_KEY`
- `public/sw.js` — service worker for web push (excluded from SPA rewrite in vercel.json)
- Web (PWA): web push works, compass/prayer reminders gracefully skip on web

### Key Configuration
- Dashboard requires `DATABASE_URL` env var (PostgreSQL)
- Mobile app's `API_BASE` in `constants/config.js` points to `https://masjid-dun.vercel.app`
- Quran API: `https://api.alquran.cloud/v1` (free, no key needed) — Arabic (ar.alafasy), Bengali (bn.bengali), English (en.asad)
- Firebase API key restricted by package name in Google Cloud Console

## Services & Costs

| Service | Purpose | Cost |
|---------|---------|------|
| Vercel | Hosts dashboard + PWA | Free (Hobby) |
| Neon | PostgreSQL database | Free tier |
| GitHub | Source code (public repo) | Free |
| Firebase | FCM push notifications for Android | Free (Spark) |
| EAS (Expo) | Android APK/AAB builds | Free tier |
| cron-job.org | DB keepalive pings every 5min | Free |
| Al Quran Cloud API | Quran text | Free, no key |
| Web Push (VAPID) | PWA browser notifications | Free (W3C standard) |

## Next Steps

### Phase 1: Launch (immediate)
- [ ] Reset test install data in AppInstall table before launch
- [ ] Build landing page on PWA for QR code scanning (device detection: iOS→PWA, Android→APK download)
- [ ] Upload final APK to GitHub Releases for download link
- [ ] Generate and print QR codes for the mosque

### Phase 2: Play Store
- [ ] Create Google Play Developer account ($25 one-time)
- [ ] Build AAB: `npx eas-cli@latest build --platform android --profile production`
- [ ] Prepare store listing (screenshots, description, privacy policy page)
- [ ] Submit for review (1-3 days)

### Phase 3: Future Enhancements
- [ ] Set up mosque Gmail for password recovery (GMAIL_USER + GMAIL_APP_PASSWORD)
- [ ] Custom domain for PWA (e.g., app.gausulazammasjid.com)
- [ ] Apple App Store ($99/yr) — only if community demands it, iOS users have PWA

## Migration Notes (for future company account transfer)
- **Vercel:** Invite company account as team member, transfer projects
- **GitHub:** Transfer repo to company org
- **Neon DB:** Transfer or update `DATABASE_URL`
- **Firebase:** Add company email as project owner
- **Domain:** Point custom domain to Vercel projects
- All services support account/project transfers — nothing is permanently locked to a personal account
