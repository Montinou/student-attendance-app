import { createClient } from "@/lib/supabase/server"
import type { AttendanceRecord, Profile, Subject } from "@/lib/types"

export type AttendanceRecordWithSubject = AttendanceRecord & {
  subjects: Subject
}

export type AttendanceRecordFull = AttendanceRecord & {
  subjects: Subject
  profiles: Profile
}

export type RecordAttendanceDTO = {
  session_id: string
  student_id: string
  subject_id: string
}

export type AttendanceFilters = {
  subjectId?: string
  fromDate?: string
  toDate?: string
}

export class AttendanceRecordService {
  /**
   * Get all attendance records for a student
   * @param studentId Student's user ID
   * @returns Array of attendance records with subject details
   */
  static async getRecordsByStudent(
    studentId: string
  ): Promise<AttendanceRecordWithSubject[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("attendance_records")
      .select("*, subjects(name, code)")
      .eq("student_id", studentId)
      .order("scanned_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch attendance records: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get attendance records for a teacher's subjects with filters
   * @param teacherId Teacher's user ID
   * @param filters Optional filters (subject, date range)
   * @returns Array of attendance records with student and subject details
   */
  static async getRecordsByTeacher(
    teacherId: string,
    filters?: AttendanceFilters
  ): Promise<AttendanceRecordFull[]> {
    const supabase = await createClient()

    // Start building query
    let query = supabase
      .from("attendance_records")
      .select("*, subjects(name, code, teacher_id), profiles(full_name, email)")
      .eq("subjects.teacher_id", teacherId)

    // Apply filters
    if (filters?.subjectId) {
      query = query.eq("subject_id", filters.subjectId)
    }

    if (filters?.fromDate) {
      query = query.gte("scanned_at", filters.fromDate)
    }

    if (filters?.toDate) {
      // Add one day to include the entire end date
      const toDate = new Date(filters.toDate)
      toDate.setDate(toDate.getDate() + 1)
      query = query.lt("scanned_at", toDate.toISOString())
    }

    const { data, error } = await query.order("scanned_at", {
      ascending: false,
    })

    if (error) {
      throw new Error(`Failed to fetch attendance records: ${error.message}`)
    }

    return data || []
  }

  /**
   * Check if attendance record exists for a session and student
   * @param sessionId Session ID
   * @param studentId Student's user ID
   * @returns Attendance record or null if not found
   */
  static async checkAttendance(
    sessionId: string,
    studentId: string
  ): Promise<AttendanceRecord | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("session_id", sessionId)
      .eq("student_id", studentId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to check attendance: ${error.message}`)
    }

    return data
  }

  /**
   * Record attendance for a student
   * @param data Attendance record data
   * @returns Created attendance record
   */
  static async recordAttendance(
    data: RecordAttendanceDTO
  ): Promise<AttendanceRecord> {
    const supabase = await createClient()

    // Check if already recorded (UNIQUE constraint will also prevent this)
    const existing = await this.checkAttendance(
      data.session_id,
      data.student_id
    )

    if (existing) {
      throw new Error("Attendance already recorded for this session")
    }

    const { data: record, error } = await supabase
      .from("attendance_records")
      .insert({
        session_id: data.session_id,
        student_id: data.student_id,
        subject_id: data.subject_id,
        scanned_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      // Check if error is due to unique constraint
      if (error.code === "23505") {
        throw new Error("Attendance already recorded for this session")
      }
      throw new Error(`Failed to record attendance: ${error.message}`)
    }

    return record
  }

  /**
   * Check if student has attended a session (boolean only)
   * @param sessionId Session ID
   * @param studentId Student's user ID
   * @returns True if attended
   */
  static async hasAttendedSession(
    sessionId: string,
    studentId: string
  ): Promise<boolean> {
    const record = await this.checkAttendance(sessionId, studentId)
    return record !== null
  }

  /**
   * Get attendance statistics for a subject
   * @param subjectId Subject ID
   * @returns Object with total sessions and total attendance records
   */
  static async getSubjectAttendanceStats(
    subjectId: string
  ): Promise<{ totalSessions: number; totalRecords: number }> {
    const supabase = await createClient()

    const [sessionsResult, recordsResult] = await Promise.all([
      supabase
        .from("attendance_sessions")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subjectId),
      supabase
        .from("attendance_records")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subjectId),
    ])

    if (sessionsResult.error || recordsResult.error) {
      throw new Error("Failed to fetch attendance statistics")
    }

    return {
      totalSessions: sessionsResult.count || 0,
      totalRecords: recordsResult.count || 0,
    }
  }

  /**
   * Get student attendance percentage for a subject
   * @param studentId Student's user ID
   * @param subjectId Subject ID
   * @returns Attendance percentage (0-100)
   */
  static async getStudentAttendancePercentage(
    studentId: string,
    subjectId: string
  ): Promise<number> {
    const supabase = await createClient()

    // Get total sessions for subject (including expired)
    const { count: totalSessions, error: sessionsError } = await supabase
      .from("attendance_sessions")
      .select("*", { count: "exact", head: true })
      .eq("subject_id", subjectId)
      .lt("expires_at", new Date().toISOString()) // Only count past sessions

    // Get student's attendance records for subject
    const { count: attendedSessions, error: recordsError } = await supabase
      .from("attendance_records")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("subject_id", subjectId)

    if (sessionsError || recordsError) {
      throw new Error("Failed to calculate attendance percentage")
    }

    if (!totalSessions || totalSessions === 0) {
      return 0
    }

    return Math.round(((attendedSessions || 0) / totalSessions) * 100)
  }

  /**
   * Get records for a specific session
   * @param sessionId Session ID
   * @returns Array of attendance records with student details
   */
  static async getRecordsBySession(
    sessionId: string
  ): Promise<(AttendanceRecord & { profiles: Profile })[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("attendance_records")
      .select("*, profiles(full_name, email)")
      .eq("session_id", sessionId)
      .order("scanned_at", { ascending: true })

    if (error) {
      throw new Error(
        `Failed to fetch session records: ${error.message}`
      )
    }

    return data || []
  }
}
