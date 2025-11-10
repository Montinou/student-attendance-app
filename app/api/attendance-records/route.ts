import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { AttendanceRecordService } from "@/lib/services/attendance-record.service"
import { AttendanceSessionService } from "@/lib/services/attendance-session.service"
import { EnrollmentService } from "@/lib/services/enrollment.service"

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const teacherId = searchParams.get("teacherId")
    const sessionId = searchParams.get("sessionId")
    const subjectId = searchParams.get("subjectId")
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")

    let records

    if (studentId) {
      // Get records for a student
      records = await AttendanceRecordService.getRecordsByStudent(studentId)
    } else if (teacherId) {
      // Get records for a teacher (with optional filters)
      records = await AttendanceRecordService.getRecordsByTeacher(
        teacherId,
        {
          subjectId: subjectId || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        }
      )
    } else if (sessionId) {
      // Get records for a specific session (real-time attendance count)
      records = await AttendanceRecordService.getRecordsBySession(sessionId)
    } else {
      return NextResponse.json(
        { error: "studentId, teacherId, or sessionId parameter required" },
        { status: 400 }
      )
    }

    return NextResponse.json({ records })
  } catch (error) {
    console.error("Get attendance records error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch records",
      },
      { status: 500 }
    )
  }
}

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
    if (!qrCode) {
      return NextResponse.json(
        { error: "qrCode is required" },
        { status: 400 }
      )
    }

    // Use the provided studentId or the current user's ID
    const finalStudentId = studentId || user.id

    // Get session by QR code
    const session = await AttendanceSessionService.getSessionByQRCode(qrCode)

    if (!session) {
      return NextResponse.json(
        { error: "Invalid QR code: session not found" },
        { status: 404 }
      )
    }

    // Check if session is still valid (not expired)
    const now = new Date()
    const expiresAt = new Date(session.expires_at)

    if (expiresAt <= now) {
      return NextResponse.json(
        { error: "Session has expired" },
        { status: 410 } // 410 Gone
      )
    }

    // Check if student is enrolled in the subject
    const isEnrolled = await EnrollmentService.isStudentEnrolled(
      finalStudentId,
      session.subject_id
    )

    if (!isEnrolled) {
      return NextResponse.json(
        { error: "Student is not enrolled in this subject" },
        { status: 403 }
      )
    }

    // Check if student has already attended this session
    const hasAttended = await AttendanceRecordService.hasAttendedSession(
      session.id,
      finalStudentId
    )

    if (hasAttended) {
      return NextResponse.json(
        { error: "Attendance already recorded for this session" },
        { status: 409 } // 409 Conflict
      )
    }

    // Record attendance
    const record = await AttendanceRecordService.recordAttendance({
      session_id: session.id,
      student_id: finalStudentId,
      subject_id: session.subject_id,
    })

    return NextResponse.json({
      success: true,
      message: "Attendance recorded successfully",
      record,
    })
  } catch (error) {
    console.error("Record attendance error:", error)

    // Check if error is duplicate attendance (from unique constraint)
    if (error instanceof Error && error.message.includes("already recorded")) {
      return NextResponse.json(
        { error: "Attendance already recorded for this session" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to record attendance",
      },
      { status: 500 }
    )
  }
}
