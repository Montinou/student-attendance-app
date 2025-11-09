// API Route for Attendance Records
// Based on claude-code-qr-integration.xml specification

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateQRData, isStudentEnrolled } from "@/lib/qr/qrValidator"

/**
 * POST /api/attendance-records
 * Record student attendance by scanning QR code
 *
 * Request body: {
 *   qr_data: string,  // Format: sessionId|subjectId|teacherId|timestamp
 *   latitude?: number,
 *   longitude?: number
 * }
 * Response: { success: boolean, attendance: { ... } }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate student
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Get QR data from request
    const { qr_data, latitude, longitude } = await request.json()

    if (!qr_data) {
      return NextResponse.json(
        { error: "qr_data is required" },
        { status: 400 }
      )
    }

    // 3. Parse and validate QR data
    const validationResult = validateQRData(qr_data)

    if (!validationResult.valid || !validationResult.data) {
      return NextResponse.json(
        { error: validationResult.error || "Invalid QR format" },
        { status: 400 }
      )
    }

    const qrData = validationResult.data

    // 4. Verify that the session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from("attendance_sessions")
      .select("*, subjects(*)")
      .eq("id", qrData.sessionId)
      .eq("status", "active")
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      )
    }

    // 5. Validate that session hasn't expired
    const expiryTime = new Date(session.expires_at).getTime()
    if (Date.now() > expiryTime) {
      return NextResponse.json(
        { error: "QR code has expired" },
        { status: 410 }
      )
    }

    // 6. Verify that student is enrolled in the subject
    const enrolled = await isStudentEnrolled(user.id, session.subject_id)

    if (!enrolled) {
      return NextResponse.json(
        { error: "Student not enrolled in this subject" },
        { status: 403 }
      )
    }

    // 7. Check if student already recorded attendance
    const { data: existingRecord } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("session_id", qrData.sessionId)
      .eq("student_id", user.id)
      .maybeSingle()

    if (existingRecord) {
      return NextResponse.json(
        { error: "Already checked in for this session" },
        { status: 409 }
      )
    }

    // 8. Get client IP address for audit
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown"

    // 9. Record attendance
    const { data: record, error: insertError } = await supabase
      .from("attendance_records")
      .insert({
        session_id: qrData.sessionId,
        student_id: user.id,
        subject_id: session.subject_id,
        checked_in_at: new Date().toISOString(),
        ip_address: clientIp,
        latitude: latitude || null,
        longitude: longitude || null,
      })
      .select()
      .single()

    if (insertError) {
      // Check if it's a unique constraint violation
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Already checked in for this session" },
          { status: 409 }
        )
      }

      console.error("Database error:", insertError)
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      )
    }

    // 10. Get student profile for confirmation
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      success: true,
      message: "Attendance recorded successfully",
      attendance: {
        id: record.id,
        student_name: profile?.full_name,
        checked_in_at: record.checked_in_at,
        subject_name: session.subjects?.name,
      },
    })
  } catch (error) {
    console.error("Error in POST /api/attendance-records:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/attendance-records
 * Get attendance records for authenticated user
 *
 * Query params:
 *   ?subject_id=xxx (optional) - filter by subject
 *   ?session_id=xxx (optional) - filter by session
 *
 * Response: { records: [...] }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get("subject_id")
    const sessionId = searchParams.get("session_id")

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    // Build query based on role
    let query = supabase
      .from("attendance_records")
      .select("*, profiles(*), subjects(*), attendance_sessions(*)")
      .order("checked_in_at", { ascending: false })

    if (profile?.role === "student") {
      // Students see only their own records
      query = query.eq("student_id", user.id)
    } else if (profile?.role === "teacher") {
      // Teachers see records for their subjects
      query = query.eq("subjects.teacher_id", user.id)
    }

    if (subjectId) {
      query = query.eq("subject_id", subjectId)
    }

    if (sessionId) {
      query = query.eq("session_id", sessionId)
    }

    const { data: records, error } = await query

    if (error) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ records })
  } catch (error) {
    console.error("Error in GET /api/attendance-records:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
