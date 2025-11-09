import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { AttendanceSessionService } from "@/lib/services/attendance-session.service"
import { SubjectService } from "@/lib/services/subject.service"
import { QRService } from "@/lib/qr/generator"

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
    const teacherId = searchParams.get("teacherId")

    if (!teacherId) {
      return NextResponse.json(
        { error: "teacherId parameter required" },
        { status: 400 }
      )
    }

    // Get active sessions for teacher
    const sessions = await AttendanceSessionService.getActiveSessionsByTeacher(
      teacherId
    )

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Get attendance sessions error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch sessions",
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

    // Verify user is a teacher
    const isTeacher = await AuthService.verifyUserRole(user.id, "teacher")

    if (!isTeacher) {
      return NextResponse.json(
        { error: "Only teachers can create attendance sessions" },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const { subjectId, expiresInMinutes = 30 } = body

    // Validate required fields
    if (!subjectId) {
      return NextResponse.json(
        { error: "subjectId is required" },
        { status: 400 }
      )
    }

    // Verify teacher owns the subject
    const isOwner = await SubjectService.verifyTeacherOwnsSubject(
      user.id,
      subjectId
    )

    if (!isOwner) {
      return NextResponse.json(
        { error: "You do not own this subject" },
        { status: 403 }
      )
    }

    // Generate QR code
    const qrCode = QRService.generateQRCode(subjectId)

    // Create session
    const session = await AttendanceSessionService.createSession(
      subjectId,
      qrCode,
      expiresInMinutes
    )

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Create attendance session error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create session",
      },
      { status: 500 }
    )
  }
}
