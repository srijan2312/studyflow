# StudyFlow

A premium Student Skill Progress Tracker and Daily Study Management System built with React, Vite, TailwindCSS, GSAP, Supabase, and Express.

## Features

- **Dashboard** — Daily study stats, weekly chart, goals overview, skill summary, daily quote
- **Study Tracker** — Log sessions with topic, subject, duration, difficulty; timeline view grouped by date
- **Goals** — Priority-based goals with deadline countdowns and progress tracking
- **Skills** — Proficiency tracking with circular progress rings and level labels
- **Analytics** — 30-day trends, subject distribution, skill breakdown via Recharts
- **Calendar** — Monthly heatmap with session intensity, goal deadline markers
- **Notes** — Rich note-taking with tags, search, and instant filtering
- **Resources** — Bookmark articles, videos, courses, books by category
- **Settings** — Profile editing, password change, notifications, CSV export

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite 5, TailwindCSS 3, GSAP 3, React Router v6, Recharts |
| Auth & DB | Supabase (PostgreSQL + Auth + Row Level Security) |
| Icons | Lucide React |
| Backend | Express.js 4, Helmet, CORS, express-rate-limit |

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd study-tracker-vs-code

# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Supabase setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Copy your **Project URL** and **anon key** from Project Settings → API

### 3. Configure environment variables

**Frontend** — create `frontend/.env`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Backend** — create `backend/.env`:
```
PORT=5000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLIENT_ORIGIN=http://localhost:3000
```

> ⚠️ Never commit `.env` files. The service role key bypasses RLS — keep it server-side only.

### 4. Run the app

```bash
# Terminal 1 — frontend dev server
cd frontend && npm run dev

# Terminal 2 — backend API (optional)
cd backend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
study-tracker-vs-code/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/      # Sidebar, Navbar, AppLayout, ProtectedRoute
│   │   │   └── ui/          # Button, Card, Input, Badge, Modal, Progress, Skeleton
│   │   ├── context/         # AuthContext
│   │   ├── hooks/           # useStudySessions, useGoals, useSkills, useNotes, useResources
│   │   ├── lib/             # supabase.js, utils.js
│   │   └── pages/
│   │       ├── Landing.jsx
│   │       ├── auth/        # Login, Signup, ForgotPassword
│   │       └── app/         # Dashboard, StudyTracker, Goals, Skills, Analytics,
│   │                        # CalendarPage, Notes, Resources, Settings
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/
│   ├── server.js
│   └── package.json
└── supabase/
    └── schema.sql
```

## Database Schema

| Table | Key columns |
|-------|-------------|
| `profiles` | id (→ auth.users), full_name, username, avatar_url |
| `study_sessions` | topic, subject, start_time, end_time, duration (min), difficulty 1-5 |
| `goals` | title, priority (low/medium/high/urgent), progress 0-100, target_date |
| `skills` | name, category, proficiency 0-100, hours_spent, difficulty |
| `notes` | title, content, tags (text[]) |
| `resources` | title, url, category (Video/Article/Course/Book/PDF/Tool/Other) |

All tables enforce Row Level Security — users can only read/write their own rows.

## License

MIT
