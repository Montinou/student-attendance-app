# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Student Attendance App - A QR-based attendance tracking system for educational institutions built with Next.js 16, React 19, and Supabase. The application enables teachers to generate QR codes for class sessions and students to register attendance by scanning them.

## Development Commands

```bash
# Development
npm run dev              # Start Next.js dev server (default: http://localhost:3000)

# Production
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
```

## Tech Stack & Architecture

### Core Technologies
- **Framework**: Next.js 16.0.0 with App Router
- **React**: 19.2.0 (React Server Components by default)
- **Language**: TypeScript (strict mode)
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security)
- **Styling**: Tailwind CSS 4.1.9 + shadcn/ui components
- **QR**: `qrcode` (generation), `@zxing/library` (scanning)
- **Deployment**: Vercel

### MVC Architecture Pattern

**Models** (`lib/types.ts`):
- `Profile` - User profiles with roles (teacher/student)
- `Subject` - Course/class information
- `Enrollment` - Student-subject relationships (M2M)
- `AttendanceSession` - QR session with expiration
- `AttendanceRecord` - Individual attendance entries

**Views** (App Router):
```
/app
  /auth
    /login         - Authentication page
  /teacher         - Teacher dashboard
    /qr            - QR code generation
    /reports       - Attendance reports
  /student         - Student dashboard
    /history       - Attendance history
```

**Controllers**:
- Server-side logic implemented via React Server Components
- Supabase client handles data operations
- Middleware (`middleware.ts` + `lib/supabase/middleware.ts`) manages auth routing

## Supabase Configuration

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

### Database Schema
- `profiles` - Extended user data (linked to Supabase Auth)
- `subjects` - Courses taught by teachers
- `enrollments` - Student enrollment in subjects
- `attendance_sessions` - Active QR sessions
- `attendance_records` - Attendance logs

### Authentication Flow
1. Supabase Auth handles login/signup
2. Middleware (`middleware.ts`) intercepts all routes
3. Unauthenticated users → `/auth/login`
4. Authenticated users → `/teacher` or `/student` based on `profiles.role`
5. Auth state managed via HttpOnly cookies (handled by `@supabase/ssr`)

### Supabase Client Patterns
- **Browser**: `lib/supabase/client.ts` - Use in Client Components
- **Server**: `lib/supabase/server.ts` - Use in Server Components/Actions
- **Middleware**: `lib/supabase/middleware.ts` - Route protection

## Component Architecture

### UI Components (`components/ui/`)
shadcn/ui components using Radix UI primitives:
- button, card, dialog, input, label, select, textarea

### Feature Components (`components/`)
- `qr-generator-card.tsx` - Teacher QR generation interface
- `qr-scanner-dialog.tsx` - Student camera-based QR scanner
- `qr-scanner-button.tsx` - Trigger for scanner modal
- `attendance-history.tsx` - Student attendance records
- `attendance-report-table.tsx` - Teacher attendance analytics
- `subjects-list.tsx` - Teacher subject management
- `enrolled-subjects-list.tsx` - Student enrolled courses
- `active-sessions-card.tsx` - Live QR sessions display
- Navigation: `teacher-nav.tsx`, `student-nav.tsx`

## Key Implementation Details

### QR Code Flow
1. **Generation** (Teacher):
   - Teacher creates session for a subject
   - System generates unique QR code with expiration
   - Code stored in `attendance_sessions` table
   - QR displayed via `qrcode` npm package

2. **Scanning** (Student):
   - Student opens camera via `@zxing/library`
   - Scans QR to extract session ID
   - System validates: session active, student enrolled, not duplicate
   - Creates record in `attendance_records`

### Authentication Guards
Middleware automatically redirects:
- Unauthenticated → `/auth/login`
- Teachers → `/teacher`
- Students → `/student`

Role-based access enforced via Supabase RLS policies.

### Styling System
- CSS variables in `app/globals.css` for theming
- Tailwind utility classes
- Dark mode via `next-themes` (`components/theme-provider.tsx`)
- `tailwind-merge` + `class-variance-authority` for component variants

## Development Best Practices

### Adding New Features
1. Define TypeScript types in `lib/types.ts`
2. Create Supabase table/policies if needed
3. Build UI components using shadcn/ui CLI: `npx shadcn@latest add [component]`
4. Use Server Components by default, only add `'use client'` when necessary
5. Implement data fetching in Server Components or Server Actions

### Data Fetching Patterns
```tsx
// Server Component (default)
export default async function Page() {
  const supabase = createClient() // from lib/supabase/server
  const { data } = await supabase.from('subjects').select()
  return <div>{/* render */}</div>
}

// Client Component (when interactivity needed)
'use client'
export default function Interactive() {
  const supabase = createClient() // from lib/supabase/client
  // Use useEffect, state, etc.
}
```

### Supabase RLS
All tables use Row Level Security. Common patterns:
- Teachers see only their subjects: `teacher_id = auth.uid()`
- Students see only their enrollments: `student_id = auth.uid()`
- Test policies with different user roles before deployment

## Build Configuration

`next.config.mjs`:
- `ignoreDuringBuilds: true` for ESLint/TypeScript (v0.app compatibility)
- `images.unoptimized: true` (Vercel handles optimization)

## Deployment

Deployed on Vercel with automatic deployments from main branch:
- Environment variables set in Vercel dashboard
- Supabase Integration recommended for seamless env sync
- Build time: ~100 seconds

## Critical Architecture Notes

1. **No API Routes Directory**: Logic handled by Server Components and Server Actions (modern Next.js pattern)

2. **Middleware Pattern**: Route protection via `lib/supabase/middleware.ts` exports `updateSession()` imported by root `middleware.ts`

3. **Type Safety**: All Supabase types defined in `lib/types.ts` - update when schema changes

4. **QR Expiration**: Sessions have `expires_at` field - implement cleanup cron or Edge Function

5. **Real-time Potential**: Supabase Realtime not yet implemented but available for live attendance updates

## Documentation References

For architectural details and database schema, see:
- `docs/architecture-doc.md` - Complete MVC architecture
- `docs/v0-attendance-prompt.md` - Original design requirements
