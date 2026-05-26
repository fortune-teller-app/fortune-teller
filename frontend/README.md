# Forune-Teller Frontend


## Architecture

```
frontend/
├─ app/                     Next.js App Router pages
│  ├─ page.jsx              Landing page (/)
│  ├─ layout.jsx            Root layout (fonts, global CSS)
│  ├─ (app)/                Authenticated app screens
│  │  ├─ home/              Home dashboard
│  │  ├─ history/           Reading ledger
│  │  ├─ profile/           User profile
│  │  ├─ settings/          Account settings
│  │  ├─ plans/             Plan selection
│  │  ├─ current-plan/      Active plan detail
│  │  └─ tarot|palmistry|astrology|dream|daily/   Practice stubs
│  └─ (auth)/               Auth screens
│     ├─ login/
│     ├─ register/
│     ├─ forgot-password/
│     └─ onboarding/
├─ components/
│  ├─ decorations/          SVG decorations (StarField, Mandala, etc.)
│  ├─ layout/               AppShell, AuthLayout, BottomNav
│  └─ ui/                   Reusable UI widgets
├─ hooks/                   useBreakpoint
├─ lib/
│  ├─ api/                  Frontend API layer — pages import from here only
│  └─ mock-backend/         Local fake backend — data and session logic
├─ public/                  favicon.svg, icons.svg
└─ styles/                  globals.css (design tokens, animations, utilities)
```

## Mock Backend

All backend data lives in `lib/mock-backend/`. Pages call `lib/api/*`, which calls the mock backend internally. No page or component should import directly from `lib/mock-backend/`.


## Test Users

| User        | Email                 | Password    | Plan   |
|-------------|-----------------------|-------------|--------|
| Liora Vance | liora@example.com     | seeker123   | Free   |
| Fiora Vance | fiora@example.com     | oracle123   | Oracle |

Log in with either account to test the free vs. paid experience. The session is stored as an httpOnly cookie (`mock_user_id`) and persists across page refreshes within the browser session.

Registered users are held in memory for the current server session only — they disappear on server restart.
