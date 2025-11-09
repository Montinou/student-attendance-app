-- Fix profiles policy to avoid infinite recursion by using a SECURITY DEFINER function

-- Drop the problematic policy if it exists
DROP POLICY IF EXISTS profiles_select_for_teachers ON public.profiles;

-- Create a helper function that checks if the current authenticated user is a teacher.
-- Declared SECURITY DEFINER so it runs with the owner's privileges and bypasses RLS,
-- preventing recursive policy evaluation when checking the profiles table.
CREATE OR REPLACE FUNCTION public.is_current_user_teacher()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'
  );
$$;

-- Recreate the profiles policy using the helper function.
-- Allows selecting own profile, or if the requester is a teacher, they can select rows
-- where role = 'student' (so teachers can lookup students by email).
CREATE POLICY "profiles_select_for_teachers"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR (public.is_current_user_teacher() AND role = 'student')
  );
