export type UserRole = "teacher" | "student"

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface Subject {
  id: string
  name: string
  code: string
  schedule: string | null
  description: string | null
  teacher_id: string
  created_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  subject_id: string
  enrolled_at: string
  profiles?: Profile
}

export interface AttendanceSession {
  id: string
  subject_id: string
  qr_code: string
  expires_at: string
  created_at: string
}

export interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  subject_id: string
  scanned_at: string
  profiles?: Profile
  subjects?: Subject
}
