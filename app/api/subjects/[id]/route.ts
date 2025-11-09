import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { SubjectService } from "@/lib/services/subject.service"

export async function GET(
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

    // Get subject
    const subject = await SubjectService.getSubjectById(id)

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ subject })
  } catch (error) {
    console.error("Get subject error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch subject",
      },
      { status: 500 }
    )
  }
}

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

    // Verify teacher owns this subject
    const isOwner = await SubjectService.verifyTeacherOwnsSubject(
      user.id,
      id
    )

    if (!isOwner) {
      return NextResponse.json(
        { error: "You do not own this subject" },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const { name, code, schedule, description } = body

    // Update subject
    const subject = await SubjectService.updateSubject(id, {
      name,
      code,
      schedule,
      description,
    })

    return NextResponse.json({ subject })
  } catch (error) {
    console.error("Update subject error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update subject",
      },
      { status: 500 }
    )
  }
}

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

    // Verify teacher owns this subject
    const isOwner = await SubjectService.verifyTeacherOwnsSubject(
      user.id,
      id
    )

    if (!isOwner) {
      return NextResponse.json(
        { error: "You do not own this subject" },
        { status: 403 }
      )
    }

    // Delete subject (cascades to enrollments, sessions, records)
    await SubjectService.deleteSubject(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete subject error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete subject",
      },
      { status: 500 }
    )
  }
}
