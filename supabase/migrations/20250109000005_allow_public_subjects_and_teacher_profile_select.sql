-- Allow students to read subjects and allow teachers to lookup student profiles

-- Subjects: allow any authenticated user to select subjects so students can explore and enroll
create policy "subjects_select_public"
  on public.subjects for select
  using (auth.role() = 'authenticated');

create policy "profiles_select_for_teachers"
  on public.profiles for select
  using (
    -- requester can always select their own profile
    auth.uid() = id
    -- or, if the requester is a teacher (checked via their profile), allow selecting profiles with role = 'student'
    OR (
      exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'
      )
      and role = 'student'
    )
  );
