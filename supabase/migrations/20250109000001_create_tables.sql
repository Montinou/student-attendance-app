-- Create profiles table extending auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('teacher', 'student')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Profiles policies
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Create subjects table
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  schedule text,
  description text,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subjects enable row level security;

-- Subjects policies - teachers can CRUD their own subjects
create policy "subjects_select_own"
  on public.subjects for select
  using (auth.uid() = teacher_id);

create policy "subjects_insert_own"
  on public.subjects for insert
  with check (auth.uid() = teacher_id);

create policy "subjects_update_own"
  on public.subjects for update
  using (auth.uid() = teacher_id);

create policy "subjects_delete_own"
  on public.subjects for delete
  using (auth.uid() = teacher_id);

-- Create enrollments table (many-to-many between students and subjects)
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, subject_id)
);

alter table public.enrollments enable row level security;

-- Enrollments policies
create policy "teachers_manage_enrollments"
  on public.enrollments for all
  using (
    exists (
      select 1 from public.subjects
      where id = enrollments.subject_id
      and teacher_id = auth.uid()
    )
  );

create policy "students_view_own_enrollments"
  on public.enrollments for select
  using (auth.uid() = student_id);

-- Create attendance sessions table (QR codes)
create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  qr_code text not null unique,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.attendance_sessions enable row level security;

-- Attendance sessions policies
create policy "teachers_manage_sessions"
  on public.attendance_sessions for all
  using (
    exists (
      select 1 from public.subjects
      where id = attendance_sessions.subject_id
      and teacher_id = auth.uid()
    )
  );

create policy "students_view_active_sessions"
  on public.attendance_sessions for select
  using (
    expires_at > now() and exists (
      select 1 from public.enrollments
      where subject_id = attendance_sessions.subject_id
      and student_id = auth.uid()
    )
  );

-- Create attendance records table
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  scanned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, student_id)
);

alter table public.attendance_records enable row level security;

-- Attendance records policies
create policy "students_insert_own_attendance"
  on public.attendance_records for insert
  with check (auth.uid() = student_id);

create policy "students_view_own_attendance"
  on public.attendance_records for select
  using (auth.uid() = student_id);

create policy "teachers_view_attendance"
  on public.attendance_records for select
  using (
    exists (
      select 1 from public.subjects
      where id = attendance_records.subject_id
      and teacher_id = auth.uid()
    )
  );
