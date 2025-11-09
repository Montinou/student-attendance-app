# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Student Attendance App** built with Next.js 16, React 19, TypeScript, and Supabase. It uses QR code generation and scanning to manage student attendance in classes.

**Production URL:** https://v0-student-attendance-app-fawn.vercel.app
**Supabase Project:** https://supabase.com/dashboard/project/elthoicbggstbrjsxuog

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# TypeScript type checking (no script, run directly)
npx tsc --noEmit
```

## Architecture

### Core Stack
- **Framework:** Next.js 16 with App Router (React Server Components)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Auth:** Supabase Auth with cookie-based sessions
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **QR:** `qrcode` (generation) + `@zxing/browser` (scanning)

### Directory Structure

```
app/
├── auth/          # Authentication pages (login, register, verify-email)
├── teacher/       # Teacher dashboard, QR generation, reports
├── student/       # Student dashboard, QR scanning, enrollment, history
├── layout.tsx     # Root layout
└── page.tsx       # Landing page

components/
├── ui/            # shadcn/ui components (button, card, dialog, etc.)
└── *.tsx          # Feature components (qr-generator-card, qr-scanner-dialog, etc.)

lib/
├── supabase/
│   ├── client.ts     # Browser client (use in client components)
│   ├── server.ts     # Server client (use in Server Components/Actions)
│   └── middleware.ts # Session refresh middleware
├── types.ts          # TypeScript type definitions
└── utils.ts          # Utility functions

supabase/
├── migrations/       # Database migrations (apply via SQL Editor)
└── APPLY_ALL_MIGRATIONS.sql  # Complete migration script
```

### Authentication & Authorization

**Two user roles:** `teacher` and `student`

**Important patterns:**
1. **Login redirects based on actual DB role**, not URL parameter
2. **Profile creation:** Automatic via trigger on `auth.users` INSERT
3. **Session management:** Cookie-based via middleware
4. **Role validation:** Each protected page validates user role and redirects if incorrect

**Supabase client usage:**
- Client Components: `import { createClient } from "@/lib/supabase/client"`
- Server Components: `import { createClient } from "@/lib/supabase/server"`
- Middleware: Uses `lib/supabase/middleware.ts`

### Database Schema

**5 main tables with Row Level Security (RLS):**

1. **profiles** - User profiles (extends auth.users)
   - RLS: Users can only view/edit their own profile

2. **subjects** - Classes/courses created by teachers
   - RLS: Teachers manage their own subjects; Students view all subjects (for enrollment)

3. **enrollments** - Student enrollment in subjects (many-to-many)
   - RLS: Teachers manage enrollments for their subjects; Students insert/view their own

4. **attendance_sessions** - QR code sessions with expiration
   - RLS: Teachers manage sessions for their subjects; Students view active sessions

5. **attendance_records** - Student attendance records
   - RLS: Students insert their own; Teachers view records for their subjects

**Critical constraint:** Use `.maybeSingle()` instead of `.single()` for optional queries to avoid errors.

### Key Flows

**Teacher Flow:**
1. Create subjects
2. Manage student enrollments (add/remove by email)
3. Generate time-limited QR codes for attendance
4. View real-time attendance counts
5. Export attendance reports to CSV

**Student Flow:**
1. Browse available subjects and self-enroll
2. View enrolled subjects
3. Scan QR codes with device camera
4. View attendance history

**QR Code Flow:**
1. Teacher generates QR → Creates `attendance_session` record with unique code
2. Student scans QR → Validates: session exists, not expired, student enrolled, no duplicate
3. Records attendance → Inserts into `attendance_records`
4. Session auto-expires → Filter by `expires_at > now()`

### Database Migrations

**All migrations must be applied manually via Supabase SQL Editor:**

1. Go to: https://supabase.com/dashboard/project/elthoicbggstbrjsxuog/sql
2. Copy contents of `supabase/APPLY_ALL_MIGRATIONS.sql`
3. Paste and Run

**Never use `.single()` in Supabase queries** - always use `.maybeSingle()` for optional results to prevent PGRST116 errors.

### Common Patterns

**1. Protected pages must validate user role:**
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .maybeSingle()

if (!profile || profile.role !== "expected_role") {
  redirect("/correct-dashboard")
}
```

**2. Client-side Supabase queries use `.maybeSingle()`:**
```typescript
const { data, error } = await supabase
  .from("table")
  .select("*")
  .eq("id", id)
  .maybeSingle()  // NOT .single()

if (error) {
  console.error("Error:", error)
  // handle error
}
```

**3. useEffect cleanup for Supabase Realtime:**
```typescript
useEffect(() => {
  const channel = supabase
    .channel('room')
    .on('postgres_changes', { ... }, (payload) => {
      setData(prev => [...prev, payload.new])
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

### Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://elthoicbggstbrjsxuog.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### QR Code Implementation

**Generation (Server-side):**
- Uses `qrcode` library
- Renders to canvas in browser
- Format: `{subject_id}-{timestamp}-{random}`

**Scanning (Client-side):**
- Uses `@zxing/browser` with `BrowserMultiFormatReader`
- Camera access via `navigator.mediaDevices`
- Must use `IScannerControls.stop()` for cleanup (not `.reset()`)

### shadcn/ui Components

Install new components via:
```bash
npx shadcn@latest add <component-name>
```

Components are in `components/ui/` and use Tailwind CSS v4.

## Critical Notes

1. **Avoid redirect loops:** Always validate actual user role from DB, never from URL params
2. **Profile trigger:** Automatically creates profile on user signup (see migration 002)
3. **RLS policies:** Students can now view all subjects and self-enroll (see migration 004)
4. **Email verification:** Redirects to `/auth/login?role={role}` after verification
5. **TypeScript strict mode:** No errors allowed - run `npx tsc --noEmit` before committing
6. **Middleware:** Handles session refresh and auth redirects (see `middleware.ts`)

## Deployment

Deployed on Vercel, automatically synced from this repository.

**Vercel Project:** https://vercel.com/agustin-montoyas-projects-554f9f37/v0-student-attendance-app

Database migrations must be applied manually to Supabase before deploying code that depends on them.
