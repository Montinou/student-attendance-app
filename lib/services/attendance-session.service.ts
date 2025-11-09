import { createClient } from "@/lib/supabase/server"
import type { AttendanceSession, Subject } from "@/lib/types"

export type AttendanceSessionWithSubject = AttendanceSession & {
  subjects: Subject
}

export class AttendanceSessionService {
  /**
   * Get active sessions for a teacher (via their subjects)
   * @param teacherId Teacher's user ID
   * @returns Array of active sessions with subject details
   */
  static async getActiveSessionsByTeacher(
    teacherId: string
  ): Promise<AttendanceSessionWithSubject[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("*, subjects(*)")
      .eq("subjects.teacher_id", teacherId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(
        `Failed to fetch active sessions: ${error.message}`
      )
    }

    return data || []
  }

  /**
   * Get session by QR code
   * @param qrCode QR code string
   * @returns Session with subject details or null if not found
   */
  static async getSessionByQRCode(
    qrCode: string
  ): Promise<AttendanceSessionWithSubject | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("*, subjects(*)")
      .eq("qr_code", qrCode)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch session: ${error.message}`)
    }

    return data
  }

  /**
   * Get session by ID
   * @param sessionId Session ID
   * @returns Session or null if not found
   */
  static async getSessionById(
    sessionId: string
  ): Promise<AttendanceSession | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch session: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new attendance session
   * @param subjectId Subject ID
   * @param qrCode Generated QR code string
   * @param expiresInMinutes Number of minutes until expiration
   * @returns Created session
   */
  static async createSession(
    subjectId: string,
    qrCode: string,
    expiresInMinutes: number
  ): Promise<AttendanceSession> {
    const supabase = await createClient()

    // Calculate expiration time
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes)

    const { data, error } = await supabase
      .from("attendance_sessions")
      .insert({
        subject_id: subjectId,
        qr_code: qrCode,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`)
    }

    return data
  }

  /**
   * End a session early by setting expires_at to now
   * @param sessionId Session ID
   */
  static async endSession(sessionId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from("attendance_sessions")
      .update({
        expires_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    if (error) {
      throw new Error(`Failed to end session: ${error.message}`)
    }
  }

  /**
   * Check if a session is still valid (not expired)
   * @param sessionId Session ID
   * @returns True if session is valid
   */
  static async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.getSessionById(sessionId)

    if (!session) {
      return false
    }

    const now = new Date()
    const expiresAt = new Date(session.expires_at)

    return expiresAt > now
  }

  /**
   * Get attendance count for a session
   * @param sessionId Session ID
   * @returns Number of students who have checked in
   */
  static async getAttendanceCount(sessionId: string): Promise<number> {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from("attendance_records")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)

    if (error) {
      throw new Error(`Failed to count attendance: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Get all sessions for a subject
   * @param subjectId Subject ID
   * @param includeExpired Whether to include expired sessions
   * @returns Array of sessions
   */
  static async getSessionsBySubject(
    subjectId: string,
    includeExpired: boolean = false
  ): Promise<AttendanceSession[]> {
    const supabase = await createClient()

    let query = supabase
      .from("attendance_sessions")
      .select("*")
      .eq("subject_id", subjectId)

    if (!includeExpired) {
      query = query.gt("expires_at", new Date().toISOString())
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    })

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get time remaining for a session in minutes
   * @param sessionId Session ID
   * @returns Minutes remaining (0 if expired)
   */
  static async getTimeRemaining(sessionId: string): Promise<number> {
    const session = await this.getSessionById(sessionId)

    if (!session) {
      return 0
    }

    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    const diff = expiresAt.getTime() - now.getTime()

    if (diff <= 0) {
      return 0
    }

    return Math.ceil(diff / (1000 * 60)) // Convert to minutes
  }
}
