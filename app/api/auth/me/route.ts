import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/services/auth.service"

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get user profile
    const profile = await AuthService.getUserProfile(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
    })
  } catch (error) {
    console.error("Get current user error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get user info",
      },
      { status: 500 }
    )
  }
}
