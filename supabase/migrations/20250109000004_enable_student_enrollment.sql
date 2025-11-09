-- Allow students to view all subjects (to browse and self-enroll)
create policy "students_view_all_subjects"
  on public.subjects for select
  using (true);

-- Allow students to self-enroll in subjects
create policy "students_insert_own_enrollments"
  on public.enrollments for insert
  with check (auth.uid() = student_id);
