import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { EnrollmentService } from "@/lib/services/enrollment.service"

export async function DELETE(
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

    // TODO: Add authorization check
    // Either the student themselves or the teacher of the subject should be able to delete
    // For now, we'll allow authenticated users

    // Delete enrollment
    await EnrollmentService.unenrollStudent(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete enrollment error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete enrollment",
      },
      { status: 500 }
    )
  }
}
