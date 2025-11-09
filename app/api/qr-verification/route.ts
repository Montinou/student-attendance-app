// API Route for QR Verification
// Based on claude-code-qr-integration.xml specification

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateQRData } from "@/lib/qr/qrValidator"

/**
 * POST /api/qr-verification
 * Verify that a QR code is valid before recording attendance
 *
 * Request body: { qr_data: string }
 * Response: {
 *   valid: boolean,
 *   sessionId?: string,
 *   subjectId?: string,
 *   subjectName?: string,
 *   timeRemaining?: number,
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Get QR data from request
    const { qr_data } = await request.json()

    if (!qr_data) {
      return NextResponse.json(
        {
          valid: false,
          error: "qr_data is required",
        },
        { status: 400 }
      )
    }

    // 3. Validate QR format
    const validationResult = validateQRData(qr_data)

    if (!validationResult.valid || !validationResult.data) {
      return NextResponse.json({
        valid: false,
        error: validationResult.error || "Invalid QR format",
      })
    }

    const qrData = validationResult.data

    // 4. Verify that the session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from("attendance_sessions")
      .select("*, subjects(id, name)")
      .eq("id", qrData.sessionId)
      .eq("status", "active")
      .single()

    if (sessionError || !session) {
      return NextResponse.json({
        valid: false,
        error: "Session not found or inactive",
      })
    }

    // 5. Check if session has expired
    const expiryTime = new Date(session.expires_at).getTime()
    const now = Date.now()

    if (now > expiryTime) {
      return NextResponse.json({
        valid: false,
        error: "QR code has expired",
      })
    }

    // 6. Calculate time remaining in minutes
    const timeRemainingMs = expiryTime - now
    const timeRemainingMinutes = Math.floor(timeRemainingMs / 1000 / 60)

    // 7. Check if student is enrolled (if user is a student)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role === "student") {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", user.id)
        .eq("subject_id", session.subject_id)
        .maybeSingle()

      if (!enrollment) {
        return NextResponse.json({
          valid: false,
          error: "Student not enrolled in this subject",
        })
      }

      // 8. Check if already recorded attendance
      const { data: existingRecord } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("session_id", qrData.sessionId)
        .eq("student_id", user.id)
        .maybeSingle()

      if (existingRecord) {
        return NextResponse.json({
          valid: false,
          error: "Already checked in for this session",
        })
      }
    }

    // 9. Return valid response with session details
    return NextResponse.json({
      valid: true,
      sessionId: session.id,
      subjectId: session.subject_id,
      subjectName: session.subjects?.name,
      timeRemaining: timeRemainingMinutes,
      expiresAt: session.expires_at,
    })
  } catch (error) {
    console.error("Error in POST /api/qr-verification:", error)
    return NextResponse.json(
      {
        valid: false,
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}
