# Gausul Azam Jameh Mosjid — Management System

A full-stack mosque management system built for **Gausul Azam Jameh Mosjid, Uttara, Dhaka**. It consists of a web-based admin dashboard and a cross-platform mobile app for the community.

---

## Projects

| Sub-project | Stack | Purpose |
|---|---|---|
| `masjid-dashboard/` | Next.js 14, PostgreSQL, Prisma | Admin panel for managing mosque data |
| `masjid-app/` | React Native, Expo | Community mobile app |

---

## Features

### Admin Dashboard
- Manage daily **prayer times** (Fajr, Dhuhr, Asr, Maghrib, Isha)
- Manage **Jummah** settings (time, khateeb name)
- Manage **imam profiles** with bio and contact info
- **Push notification** broadcasting to community members
- **Role-based access control** — Admin and Moderator roles
- **Content approval workflow** — Moderators submit changes, Admins approve/deny
- Member management with language preferences (Bengali, English, Arabic)
- JWT authentication + Firebase phone auth for members
- Rate-limited, validated API endpoints

### Mobile App
- Live prayer times synced from dashboard, with offline fallback
- Full **Quran** — 114 surahs with Arabic text + Bengali & English translations (cached offline)
- **Qibla compass** using device sensors
- Push notification support for prayer reminders
- Light / dark theme
- Multi-language support (Bengali, English, Arabic)

---

## Tech Stack

**Dashboard**
- [Next.js 14](https://nextjs.org/) (App Router)
- [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase Admin SDK](https://firebase.google.com/) — push notifications & phone auth
- [jose](https://github.com/panva/jose) — JWT auth
- [Zod](https://zod.dev/) — input validation
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — password hashing

**Mobile App**
- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/)
- [Expo Router](https://expo.github.io/router/) — file-based navigation
- [Adhan](https://github.com/batoulapps/adhan-js) — prayer time calculations
- [expo-sensors](https://docs.expo.dev/versions/latest/sdk/sensors/) — Qibla compass
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) — offline Quran caching
- [Al Quran Cloud API](https://alquran.cloud/api) — Quran text & translations

---

## Architecture

```
Mobile App  ──►  /api/mosque  ──►  Dashboard  ──►  PostgreSQL (Neon)
                 (single endpoint:
                  prayers, jummah,
                  imams, mosque info)
```

- The mobile app fetches all mosque data from a single `/api/mosque` endpoint
- Falls back to hardcoded sample data if the API is unreachable
- Dashboard API routes are protected by JWT middleware
- All write operations are rate-limited and validated with Zod

---

## Database Schema

```
User          — Admin / Moderator accounts
PendingChange — Approval workflow for content changes
Mosque        — Mosque name, address, contact
Prayer        — 5 daily prayer times
JummahSetting — Friday prayer configuration
Imam          — Imam profiles
Notification  — Sent push notifications
Member        — Community members (Firebase phone auth)
PushToken     — Firebase FCM tokens for push notifications
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)
- Firebase project (for push notifications)

### Dashboard Setup

```bash
cd masjid-dashboard
npm install

# Copy and fill in environment variables
cp .env.example .env

# Push schema to database and seed initial data
npm run db:push
npm run db:seed

# Start dev server
npm run dev
```

The seed script creates:
- Admin account: `admin@gausulazam.org`
- Moderator account: `moderator@gausulazam.org`
- Default prayer times, Jummah settings, and imam profiles

### Mobile App Setup

```bash
cd masjid-app
npm install

# Update API_BASE in constants/config.js to point to your dashboard URL
npx expo start
```

---

## Environment Variables

Create `masjid-dashboard/.env` based on `.env.example`:

```env
DATABASE_URL=             # PostgreSQL connection string
JWT_SECRET=               # Random 32+ character secret
ALLOWED_ORIGIN=           # Dashboard URL (for CORS)
FIREBASE_PROJECT_ID=      # Firebase project ID
FIREBASE_CLIENT_EMAIL=    # Firebase service account email
FIREBASE_PRIVATE_KEY=     # Firebase service account private key
```

---

## Deployment

| Target | Platform |
|---|---|
| Dashboard | [Vercel](https://vercel.com) |
| Mobile (Android) | APK / Google Play |
| Database | [Neon](https://neon.tech) (PostgreSQL, free tier) |
