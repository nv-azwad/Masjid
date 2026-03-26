# Gausul Azam Jameh Mosjid — Dashboard

Admin dashboard for managing prayer times, imams, Jummah details, and push notifications.

## Tech Stack
- **Next.js 14** (App Router + API Routes)
- **Prisma ORM** + **PostgreSQL**
- **Tailwind CSS**

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and add your PostgreSQL URL
cp .env.example .env
# Edit .env with your database URL

# 3. Push database schema
npx prisma db push

# 4. Seed with initial data
node prisma/seed.mjs

# 5. Run development server
npm run dev
```

Opens at `http://localhost:3000`

## API Endpoints (for the mobile app)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mosque` | All data in one call (prayers, jummah, imams, mosque info) |
| GET | `/api/prayers` | Get prayer times |
| PUT | `/api/prayers` | Update a prayer time |
| GET | `/api/imams` | Get all imams |
| POST | `/api/imams` | Add new imam |
| PUT | `/api/imams` | Update imam |
| DELETE | `/api/imams?id=xxx` | Delete imam |
| GET | `/api/jummah` | Get Jummah settings |
| PUT | `/api/jummah` | Update Jummah settings |
| GET | `/api/notifications` | Get sent notifications |
| POST | `/api/notifications` | Send a notification |

## Database

Run `npx prisma studio` to open the database GUI at `http://localhost:5555`

## Deployment

Deploy to Vercel with a PostgreSQL database (Neon, Supabase, or Railway):

```bash
npm run build
```

---
© 2026 Gausul Azam Jameh Mosjid
