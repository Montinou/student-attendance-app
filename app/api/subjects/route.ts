import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { SubjectService } from "@/lib/services/subject.service"

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

    let subjects

    if (teacherId) {
      // Get subjects for specific teacher
      subjects = await SubjectService.getSubjectsByTeacher(teacherId)
    } else {
      // Get all subjects (for students to browse)
      subjects = await SubjectService.getAllSubjects()
    }

    return NextResponse.json({ subjects })
  } catch (error) {
    console.error("Get subjects error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch subjects",
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
        { error: "Only teachers can create subjects" },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const { name, code, schedule, description } = body

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: "Name and code are required" },
        { status: 400 }
      )
    }

    // Create subject
    const subject = await SubjectService.createSubject({
      name,
      code,
      schedule: schedule || null,
      description: description || null,
      teacher_id: user.id,
    })

    return NextResponse.json({ subject })
  } catch (error) {
    console.error("Create subject error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create subject",
      },
      { status: 500 }
    )
  }
}
