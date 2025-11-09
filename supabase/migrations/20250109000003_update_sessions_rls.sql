-- Drop the old restrictive policy
drop policy if exists "students_view_active_sessions" on public.attendance_sessions;

-- Create new policy that allows students to view any active session
-- This allows the application code to provide more specific error messages
-- (e.g., "not enrolled" vs "invalid QR code")
create policy "students_view_active_sessions"
  on public.attendance_sessions for select
  using (expires_at > now());

-- Note: Security is still maintained because:
-- 1. Students can only INSERT their own attendance records (via RLS on attendance_records)
-- 2. The application validates enrollment before allowing attendance registration
-- 3. Sessions are time-limited and automatically become invisible once expired
