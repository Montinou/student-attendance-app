import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import type { UserRole } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, role } = body

    // Validate input
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        {
          error:
            "Email, password, full name, and role are required",
        },
        { status: 400 }
      )
    }

    // Validate role
    if (role !== "teacher" && role !== "student") {
      return NextResponse.json(
        { error: "Invalid role. Must be 'teacher' or 'student'" },
        { status: 400 }
      )
    }

    // Register user
    await AuthService.register(email, password, fullName, role as UserRole)

    return NextResponse.json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Registration failed",
      },
      { status: 400 }
    )
  }
}
