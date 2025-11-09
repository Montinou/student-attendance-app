import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
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
    const subjectId = searchParams.get("subjectId")

    // Validate required fields
    if (!studentId || !subjectId) {
      return NextResponse.json(
        { error: "studentId and subjectId are required" },
        { status: 400 }
      )
    }

    // Check enrollment
    const enrollment = await EnrollmentService.checkEnrollment(
      studentId,
      subjectId
    )

    return NextResponse.json({
      isEnrolled: enrollment !== null,
      enrollment: enrollment || undefined,
    })
  } catch (error) {
    console.error("Check enrollment error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check enrollment",
      },
      { status: 500 }
    )
  }
}
