import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { AttendanceSessionService } from "@/lib/services/attendance-session.service"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
        { error: "Only teachers can modify sessions" },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const { action } = body

    if (action === "end") {
      // End the session early
      await AttendanceSessionService.endSession(id)

      return NextResponse.json({ success: true, message: "Session ended" })
    } else {
      return NextResponse.json(
        { error: "Invalid action. Supported: 'end'" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Update attendance session error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update session",
      },
      { status: 500 }
    )
  }
}
