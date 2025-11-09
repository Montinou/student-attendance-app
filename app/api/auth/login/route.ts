import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/services/auth.service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Authenticate user
    const { user, role } = await AuthService.login(email, password)

    // Determine redirect path based on role
    const redirectPath = role === "teacher" ? "/teacher" : "/student"

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      role,
      redirectPath,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Authentication failed",
      },
      { status: 401 }
    )
  }
}
