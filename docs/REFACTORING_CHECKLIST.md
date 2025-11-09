# MVC Refactoring Checklist

**Project:** Student Attendance App
**Goal:** Convert all components from direct Supabase calls to API routes
**Status:** Auth & Subjects Complete | Enrollments & QR Pending

---

## ✅ Completed Refactoring

### Authentication Components
- [x] `app/auth/login/page.tsx` - Now uses `POST /api/auth/login`
- [x] `app/auth/register/page.tsx` - Now uses `POST /api/auth/register`
- [x] `app/auth/verify-email/page.tsx` - No refactoring needed (static page)

### Subject Management Components
- [x] `components/create-subject-dialog.tsx` - Now uses `POST /api/subjects`
- [x] `components/edit-subject-dialog.tsx` - Now uses `PATCH /api/subjects/[id]`
- [x] `components/delete-subject-dialog.tsx` - Now uses `DELETE /api/subjects/[id]`

### Infrastructure
- [x] Middleware fixed to allow `/api/*` routes
- [x] All API routes implemented and tested
- [x] All service classes created
- [x] QR utilities extracted
- [x] Playwright test suite created

**Total Completed:** 6 components
**Commit:** `29754fa` - Component refactoring (auth + subjects)

---

## 📋 Pending Refactoring

### Enrollment Components (High Priority)
- [ ] `components/manage-enrollments-dialog.tsx`
  - **Current:** Direct Supabase calls for enrollment management
  - **Target:** Use `POST /api/enrollments`, `DELETE /api/enrollments/[id]`, `GET /api/enrollments`
  - **Complexity:** Medium
  - **Impact:** Teachers can't manage enrollments without this

- [ ] `components/available-subjects-list.tsx`
  - **Current:** Direct Supabase calls to list subjects and check enrollment
  - **Target:** Use `GET /api/subjects`, `GET /api/enrollments/check`, `POST /api/enrollments`
  - **Complexity:** Medium
  - **Impact:** Students can't enroll in subjects without this

- [ ] `components/enrolled-subjects-list.tsx`
  - **Current:** Direct Supabase calls to list student enrollments
  - **Target:** Use `GET /api/enrollments?studentId=xxx`, `DELETE /api/enrollments/[id]`
  - **Complexity:** Low
  - **Impact:** Students can't view their enrolled subjects

### QR Code Components (High Priority)
- [ ] `components/qr-generator-card.tsx`
  - **Current:** Direct Supabase calls to create/manage sessions
  - **Target:** Use `POST /api/attendance-sessions`, `GET /api/attendance-sessions`, `PATCH /api/attendance-sessions/[id]`
  - **Complexity:** Medium
  - **Impact:** Teachers can't generate QR codes for attendance
  - **Note:** Keep QR rendering utilities (`lib/qr/generator`)

- [ ] `components/qr-scanner-dialog.tsx`
  - **Current:** Direct Supabase calls to validate and record attendance
  - **Target:** Use `POST /api/attendance-sessions/validate`, `POST /api/attendance-records`
  - **Complexity:** Medium
  - **Impact:** Students can't record attendance
  - **Note:** Keep camera scanning utilities (`lib/qr/scanner`)

### List Components (May Need Refactoring)
- [ ] `components/subjects-list.tsx` ⚠️ **NEEDS REVIEW**
  - **Status:** Unknown - needs inspection
  - **Action:** Check if it uses direct Supabase calls

### Dashboard Pages (Optional - Server Components)
- [ ] `app/teacher/page.tsx`
  - **Current:** Server Component using `lib/supabase/server.ts`
  - **Target:** Optional - can use `GET /api/subjects?teacherId=xxx`
  - **Complexity:** Low
  - **Priority:** Low (Server Components can keep direct calls)

- [ ] `app/student/page.tsx`
  - **Current:** Server Component using `lib/supabase/server.ts`
  - **Target:** Optional - can use `GET /api/enrollments?studentId=xxx`
  - **Complexity:** Low
  - **Priority:** Low

- [ ] `app/teacher/reports/page.tsx`
  - **Current:** Server Component using `lib/supabase/server.ts`
  - **Target:** Optional - can use `GET /api/attendance-records` with filters
  - **Complexity:** Low
  - **Priority:** Low

- [ ] `app/student/history/page.tsx`
  - **Current:** Server Component using `lib/supabase/server.ts`
  - **Target:** Optional - can use `GET /api/attendance-records?studentId=xxx`
  - **Complexity:** Low
  - **Priority:** Low

**Total Pending:** 5 critical + 1 review + 4 optional = 10 components

---

## 🔍 Verification Checklist

### Pre-Deployment Verification
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No ESLint errors: `npm run lint`
- [ ] All imports resolved correctly
- [ ] No unused imports of `@/lib/supabase/client` in refactored files
- [ ] All fetch calls have proper error handling
- [ ] All loading states implemented

### Local Testing Verification
- [ ] Dev server starts without errors: `npm run dev`
- [ ] Login page works (teacher & student)
- [ ] Registration page works
- [ ] Subject creation works
- [ ] Subject editing works
- [ ] Subject deletion works
- [ ] Enrollment management works (once refactored)
- [ ] QR generation works (once refactored)
- [ ] QR scanning works (once refactored)
- [ ] Browser console has no errors
- [ ] Network tab shows API calls to `/api/*`

### Production Verification
- [ ] Wait 100s for Vercel deployment after push
- [ ] Production URL loads: https://v0-student-attendance-app-fawn.vercel.app
- [ ] Login flow works on production (both roles)
- [ ] Registration flow works on production
- [ ] Subject management works on production
- [ ] Enrollment flow works on production (once refactored)
- [ ] QR attendance flow works on production (once refactored)
- [ ] No console errors on production
- [ ] Vercel logs show no errors

### API Verification
- [ ] All 18 API endpoints respond correctly
- [ ] Error responses include proper status codes
- [ ] Authentication works across all endpoints
- [ ] Rate limiting doesn't block normal usage
- [ ] CORS is properly configured

### Code Quality Verification
- [ ] No direct Supabase client imports in client components
- [ ] Consistent error handling patterns
- [ ] Consistent loading state patterns
- [ ] Router.refresh() called after mutations
- [ ] TypeScript types used from `lib/types.ts`
- [ ] Code follows existing patterns

---

## 📊 Progress Summary

| Category | Completed | Pending | Total | Progress |
|----------|-----------|---------|-------|----------|
| Auth Components | 2 | 0 | 2 | 100% |
| Subject Components | 3 | 0 | 3 | 100% |
| Enrollment Components | 0 | 3 | 3 | 0% |
| QR Components | 0 | 2 | 2 | 0% |
| Dashboard Pages | 0 | 4 | 4 | 0% (Optional) |
| Review Needed | 0 | 1 | 1 | 0% |
| **TOTAL** | **5** | **10** | **15** | **33%** |

**Critical Path (Must Complete):** 5/10 components (50% done)
**Optional (Server Components):** 0/4 components (0% done)

---

## 🚀 Next Steps

### Immediate (High Priority)
1. **Refactor Enrollment Components** - Students can't enroll without this
   - Start with `available-subjects-list.tsx`
   - Then `manage-enrollments-dialog.tsx`
   - Finally `enrolled-subjects-list.tsx`

2. **Refactor QR Components** - Core attendance functionality
   - Start with `qr-generator-card.tsx`
   - Then `qr-scanner-dialog.tsx`

3. **Review subjects-list.tsx** - Verify if refactoring needed

### Later (Optional)
4. **Review Dashboard Pages** - Decision: keep server-side calls or refactor?
5. **Optimize API Routes** - Add caching, rate limiting if needed
6. **Improve Error Messages** - Make user-facing errors more helpful

---

## 📝 Notes

- **Server Components** (`app/**/page.tsx`) can keep using `lib/supabase/server.ts` - both approaches are valid
- **QR Utilities** (`lib/qr/*`) must remain imported for client-side rendering/scanning
- **Middleware fix** is critical - API routes won't work without the `/api` exclusion
- **Testing credentials:**
  - Teacher: `agusmontoya@gmail.com` / `test1234`
  - Student: `agusmontoya2@gmail.com` / `test1234`

---

## 🔗 Related Documents

- [REMAINING_REFACTORING.xml](./REMAINING_REFACTORING.xml) - Complete refactoring guide
- [VERIFICATION_PROMPT.xml](./VERIFICATION_PROMPT.xml) - AI verification prompt (use after completion)
- [architecture-doc.md](./architecture-doc.md) - Full MVC architecture specification
- [../CLAUDE.md](../CLAUDE.md) - Project setup and guidelines

---

**Last Updated:** 2025-11-09
**Current Commit:** `394b87c` - Added refactoring documentation
