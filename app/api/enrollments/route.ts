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

    let enrollments

    if (studentId) {
      // Get enrollments for a student
      enrollments = await EnrollmentService.getEnrollmentsByStudent(
        studentId
      )
    } else if (subjectId) {
      // Get enrollments for a subject (with student profiles)
      enrollments = await EnrollmentService.getEnrollmentsBySubject(
        subjectId
      )
    } else {
      return NextResponse.json(
        { error: "studentId or subjectId parameter required" },
        { status: 400 }
      )
    }

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error("Get enrollments error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch enrollments",
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
    const { studentId, email, subjectId } = body

    // Validate required fields
    if (!subjectId) {
      return NextResponse.json(
        { error: "subjectId is required" },
        { status: 400 }
      )
    }

    if (!studentId && !email) {
      return NextResponse.json(
        { error: "Either studentId or email is required" },
        { status: 400 }
      )
    }

    let enrollment

    if (email) {
      // Enroll student by email (for teachers adding students)
      enrollment = await EnrollmentService.enrollStudentByEmail(
        email,
        subjectId
      )
    } else {
      // Enroll student directly (for self-enrollment)
      enrollment = await EnrollmentService.enrollStudent(
        studentId,
        subjectId
      )
    }

    return NextResponse.json({ enrollment })
  } catch (error) {
    console.error("Create enrollment error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create enrollment",
      },
      { status: 400 }
    )
  }
}
