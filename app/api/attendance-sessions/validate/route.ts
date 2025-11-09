import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { AttendanceSessionService } from "@/lib/services/attendance-session.service"
import { EnrollmentService } from "@/lib/services/enrollment.service"
import { AttendanceRecordService } from "@/lib/services/attendance-record.service"

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { qrCode, studentId } = body

    // Validate required fields
    if (!qrCode || !studentId) {
      return NextResponse.json(
        { error: "qrCode and studentId are required" },
        { status: 400 }
      )
    }

    const errors: string[] = []

    // 1. Check if session exists
    const session = await AttendanceSessionService.getSessionByQRCode(qrCode)

    if (!session) {
      errors.push("Session not found")
      return NextResponse.json({
        valid: false,
        errors,
      })
    }

    // 2. Check if session is still valid (not expired)
    const now = new Date()
    const expiresAt = new Date(session.expires_at)

    if (expiresAt <= now) {
      errors.push("Session has expired")
    }

    // 3. Check if student is enrolled in the subject
    const isEnrolled = await EnrollmentService.isStudentEnrolled(
      studentId,
      session.subject_id
    )

    if (!isEnrolled) {
      errors.push("Student is not enrolled in this subject")
    }

    // 4. Check if student has already attended this session
    const hasAttended = await AttendanceRecordService.hasAttendedSession(
      session.id,
      studentId
    )

    if (hasAttended) {
      errors.push("Attendance already recorded for this session")
    }

    // Return validation result
    if (errors.length > 0) {
      return NextResponse.json({
        valid: false,
        errors,
      })
    }

    return NextResponse.json({
      valid: true,
      session,
    })
  } catch (error) {
    console.error("Validate session error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to validate session",
      },
      { status: 500 }
    )
  }
}
