// Server Actions for Attendance Operations
// Based on claude-code-qr-integration.xml specification

"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  generateSessionId,
  generateSessionQRData,
  generateQRImage,
} from "@/lib/qr/qrGenerator"
import { validateQRData, isStudentEnrolled } from "@/lib/qr/qrValidator"

/**
 * Create a new attendance session with QR code
 * @param subjectId - Subject UUID
 * @returns Promise with session data or error
 */
export async function createAttendanceSession(subjectId: string): Promise<{
  success: boolean
  message: string
  data?: {
    sessionId: string
    qrCode: string
    qrImage: string
    expiresAt: string
  }
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: "Not authenticated",
        error: "Unauthorized",
      }
    }

    // Verify teacher owns the subject
    const { data: subject } = await supabase
      .from("subjects")
      .select("id")
      .eq("id", subjectId)
      .eq("teacher_id", user.id)
      .single()

    if (!subject) {
      return {
        success: false,
        message: "Subject not found or unauthorized",
        error: "Not found",
      }
    }

    // Close existing active sessions for this subject
    await supabase
      .from("attendance_sessions")
      .update({ status: "closed" })
      .eq("subject_id", subjectId)
      .eq("teacher_id", user.id)
      .eq("status", "active")

    // Generate session ID and QR data
    const sessionId = generateSessionId()
    const qrData = generateSessionQRData(sessionId, subjectId, user.id)
    const qrImage = await generateQRImage(qrData)

    // Calculate expiration (30 minutes)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    // Insert session
    const { error: insertError } = await supabase
      .from("attendance_sessions")
      .insert({
        id: sessionId,
        subject_id: subjectId,
        teacher_id: user.id,
        qr_code: qrData,
        status: "active",
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      return {
        success: false,
        message: "Failed to create session",
        error: insertError.message,
      }
    }

    // Revalidate teacher pages
    revalidatePath("/teacher")
    revalidatePath("/teacher/qr")

    return {
      success: true,
      message: "Session created successfully",
      data: {
        sessionId,
        qrCode: qrData,
        qrImage,
        expiresAt: expiresAt.toISOString(),
      },
    }
  } catch (error) {
    console.error("Error in createAttendanceSession:", error)
    return {
      success: false,
      message: "An error occurred",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Record attendance from scanned QR code
 * @param qrData - QR code data (format: sessionId|subjectId|teacherId|timestamp)
 * @param latitude - Optional GPS latitude
 * @param longitude - Optional GPS longitude
 * @returns Promise with attendance data or error
 */
export async function recordAttendanceFromQR(
  qrData: string,
  latitude?: number,
  longitude?: number
): Promise<{
  success: boolean
  message: string
  data?: {
    attendanceId: string
    studentName: string
    subjectName: string
    checkedInAt: string
  }
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: "Not authenticated",
        error: "Unauthorized",
      }
    }

    // Validate QR data
    const validationResult = validateQRData(qrData)
    if (!validationResult.valid || !validationResult.data) {
      return {
        success: false,
        message: validationResult.error || "Invalid QR code",
        error: "Invalid QR",
      }
    }

    const qrParsed = validationResult.data

    // Verify session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from("attendance_sessions")
      .select("*, subjects(name)")
      .eq("id", qrParsed.sessionId)
      .eq("status", "active")
      .single()

    if (sessionError || !session) {
      return {
        success: false,
        message: "Session not found or expired",
        error: "Session invalid",
      }
    }

    // Check if session has expired
    const expiryTime = new Date(session.expires_at).getTime()
    if (Date.now() > expiryTime) {
      return {
        success: false,
        message: "QR code has expired",
        error: "Expired",
      }
    }

    // Verify student is enrolled
    const enrolled = await isStudentEnrolled(user.id, session.subject_id)
    if (!enrolled) {
      return {
        success: false,
        message: "You are not enrolled in this subject",
        error: "Not enrolled",
      }
    }

    // Check for duplicate attendance
    const { data: existingRecord } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("session_id", qrParsed.sessionId)
      .eq("student_id", user.id)
      .maybeSingle()

    if (existingRecord) {
      return {
        success: false,
        message: "You have already checked in for this session",
        error: "Duplicate",
      }
    }

    // Record attendance
    const { data: record, error: insertError } = await supabase
      .from("attendance_records")
      .insert({
        session_id: qrParsed.sessionId,
        student_id: user.id,
        subject_id: session.subject_id,
        checked_in_at: new Date().toISOString(),
        ip_address: null, // Will be set by API route if available
        latitude: latitude || null,
        longitude: longitude || null,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === "23505") {
        return {
          success: false,
          message: "You have already checked in for this session",
          error: "Duplicate",
        }
      }

      return {
        success: false,
        message: "Failed to record attendance",
        error: insertError.message,
      }
    }

    // Get student name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    // Revalidate student pages
    revalidatePath("/student")
    revalidatePath("/student/history")

    return {
      success: true,
      message: "Attendance recorded successfully! Welcome.",
      data: {
        attendanceId: record.id,
        studentName: profile?.full_name || "Student",
        subjectName: session.subjects?.name || "Subject",
        checkedInAt: record.checked_in_at,
      },
    }
  } catch (error) {
    console.error("Error in recordAttendanceFromQR:", error)
    return {
      success: false,
      message: "An error occurred while recording attendance",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Close an active attendance session
 * @param sessionId - Session ID to close
 * @returns Promise with success status
 */
export async function closeAttendanceSession(sessionId: string): Promise<{
  success: boolean
  message: string
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: "Not authenticated",
        error: "Unauthorized",
      }
    }

    // Update session status
    const { error } = await supabase
      .from("attendance_sessions")
      .update({ status: "closed" })
      .eq("id", sessionId)
      .eq("teacher_id", user.id)

    if (error) {
      return {
        success: false,
        message: "Failed to close session",
        error: error.message,
      }
    }

    // Revalidate teacher pages
    revalidatePath("/teacher")
    revalidatePath("/teacher/qr")

    return {
      success: true,
      message: "Session closed successfully",
    }
  } catch (error) {
    console.error("Error in closeAttendanceSession:", error)
    return {
      success: false,
      message: "An error occurred",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
