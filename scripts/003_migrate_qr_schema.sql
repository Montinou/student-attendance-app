-- Migration script to align attendance tables with claude-code-qr-integration.xml specification
-- This script modifies attendance_sessions and attendance_records to match the required schema

-- STEP 1: Modify attendance_sessions table
-- Add missing columns: teacher_id and status
-- Note: We keep id as UUID for now to avoid breaking existing data
-- In a fresh install, you would use TEXT with "SESS_" prefix

-- Add teacher_id column (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'attendance_sessions'
    AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE public.attendance_sessions
    ADD COLUMN teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Populate teacher_id from subjects table for existing records
    UPDATE public.attendance_sessions
    SET teacher_id = subjects.teacher_id
    FROM public.subjects
    WHERE attendance_sessions.subject_id = subjects.id;

    -- Make it NOT NULL after populating
    ALTER TABLE public.attendance_sessions
    ALTER COLUMN teacher_id SET NOT NULL;
  END IF;
END $$;

-- Add status column (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'attendance_sessions'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.attendance_sessions
    ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed'));

    -- Mark expired sessions as closed
    UPDATE public.attendance_sessions
    SET status = 'closed'
    WHERE expires_at < NOW();
  END IF;
END $$;

-- Add index for teacher_id
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher_id
  ON public.attendance_sessions(teacher_id);

-- Add index for status
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_status
  ON public.attendance_sessions(status);

-- Add index for expires_at (for performance)
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_expires_at
  ON public.attendance_sessions(expires_at);

-- STEP 2: Modify attendance_records table
-- Add missing columns: ip_address, latitude, longitude
-- Rename scanned_at to checked_in_at

-- Add ip_address column (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'attendance_records'
    AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE public.attendance_records
    ADD COLUMN ip_address text;
  END IF;
END $$;

-- Add latitude column (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'attendance_records'
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE public.attendance_records
    ADD COLUMN latitude double precision;
  END IF;
END $$;

-- Add longitude column (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'attendance_records'
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.attendance_records
    ADD COLUMN longitude double precision;
  END IF;
END $$;

-- Rename scanned_at to checked_in_at (if not already renamed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'attendance_records'
    AND column_name = 'scanned_at'
  ) THEN
    ALTER TABLE public.attendance_records
    RENAME COLUMN scanned_at TO checked_in_at;
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_checked_in_at
  ON public.attendance_records(checked_in_at);

CREATE INDEX IF NOT EXISTS idx_attendance_records_subject_id
  ON public.attendance_records(subject_id);

-- STEP 3: Update RLS policies to include new validations

-- Drop old policy and create new one with status check
DROP POLICY IF EXISTS "students_view_active_sessions" ON public.attendance_sessions;

CREATE POLICY "students_view_active_sessions"
  ON public.attendance_sessions FOR SELECT
  USING (
    status = 'active'
    AND expires_at > now()
    AND EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE subject_id = attendance_sessions.subject_id
      AND student_id = auth.uid()
    )
  );

-- Add policy for teachers to see their own sessions
DROP POLICY IF EXISTS "teachers_manage_sessions" ON public.attendance_sessions;

CREATE POLICY "teachers_view_own_sessions"
  ON public.attendance_sessions FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "teachers_insert_own_sessions"
  ON public.attendance_sessions FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "teachers_update_own_sessions"
  ON public.attendance_sessions FOR UPDATE
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "teachers_delete_own_sessions"
  ON public.attendance_sessions FOR DELETE
  USING (auth.uid() = teacher_id);

-- STEP 4: Add helpful comments
COMMENT ON COLUMN public.attendance_sessions.status IS 'Session status: active or closed';
COMMENT ON COLUMN public.attendance_sessions.teacher_id IS 'Teacher who created the session';
COMMENT ON COLUMN public.attendance_records.ip_address IS 'IP address of student when recording attendance';
COMMENT ON COLUMN public.attendance_records.latitude IS 'GPS latitude when recording attendance (optional)';
COMMENT ON COLUMN public.attendance_records.longitude IS 'GPS longitude when recording attendance (optional)';
COMMENT ON COLUMN public.attendance_records.checked_in_at IS 'Timestamp when student checked in';

-- Migration complete
