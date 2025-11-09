// QR Code Validator
// Based on claude-code-qr-integration.xml specification

import { createClient } from "@/lib/supabase/server"
import { QRDataSchema, type ValidationResult, type QRData } from "./qrTypes"

/**
 * Validate and parse QR code data
 * @param scannedText - Raw QR code text (format: sessionId|subjectId|teacherId|timestamp)
 * @returns ValidationResult with parsed data or error
 */
export function validateQRData(scannedText: string): ValidationResult {
  try {
    // Parse QR data format: sessionId|subjectId|teacherId|timestamp
    const parts = scannedText.split("|")

    if (parts.length !== 4) {
      return {
        valid: false,
        error: "Invalid QR format: expected 4 parts separated by |",
      }
    }

    const [sessionId, subjectId, teacherId, timestampStr] = parts
    const timestamp = parseInt(timestampStr, 10)

    if (isNaN(timestamp)) {
      return {
        valid: false,
        error: "Invalid timestamp in QR code",
      }
    }

    // Validate using Zod schema
    const validationResult = QRDataSchema.safeParse({
      sessionId,
      subjectId,
      teacherId,
      timestamp,
    })

    if (!validationResult.success) {
      return {
        valid: false,
        error: `Invalid QR data: ${validationResult.error.message}`,
      }
    }

    return {
      valid: true,
      data: validationResult.data,
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown validation error",
    }
  }
}

/**
 * Check if an attendance session is active
 * @param sessionId - Session ID (format: SESS_xxx)
 * @returns Promise<boolean> - True if session is active and not expired
 */
export async function isSessionActive(sessionId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data: session, error } = await supabase
      .from("attendance_sessions")
      .select("id, status, expires_at")
      .eq("id", sessionId)
      .eq("status", "active")
      .single()

    if (error || !session) {
      return false
    }

    // Check if session has expired
    const expiryTime = new Date(session.expires_at).getTime()
    const now = Date.now()

    return now <= expiryTime
  } catch (error) {
    console.error("Error checking session active status:", error)
    return false
  }
}

/**
 * Check if student has already recorded attendance for this session
 * @param sessionId - Session ID
 * @param studentId - Student user ID
 * @returns Promise<boolean> - True if already attended
 */
export async function hasAlreadyAttended(
  sessionId: string,
  studentId: string
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("session_id", sessionId)
      .eq("student_id", studentId)
      .maybeSingle()

    if (error) {
      console.error("Error checking attendance:", error)
      return false
    }

    return data !== null
  } catch (error) {
    console.error("Error in hasAlreadyAttended:", error)
    return false
  }
}

/**
 * Check if student is enrolled in the subject
 * @param studentId - Student user ID
 * @param subjectId - Subject UUID
 * @returns Promise<boolean> - True if enrolled
 */
export async function isStudentEnrolled(
  studentId: string,
  subjectId: string
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("subject_id", subjectId)
      .maybeSingle()

    if (error) {
      console.error("Error checking enrollment:", error)
      return false
    }

    return data !== null
  } catch (error) {
    console.error("Error in isStudentEnrolled:", error)
    return false
  }
}
