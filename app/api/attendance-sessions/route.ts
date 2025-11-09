// API Route for Attendance Sessions
// Based on claude-code-qr-integration.xml specification

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  generateSessionQRData,
  generateQRImage,
  generateSessionId,
} from "@/lib/qr/qrGenerator"

/**
 * POST /api/attendance-sessions
 * Create a new attendance session with QR code
 *
 * Request body: { subject_id: string }
 * Response: { success: boolean, session: { ... } }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (must be teacher)
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Validate that user is a teacher
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || profile?.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can create sessions" },
        { status: 403 }
      )
    }

    // 3. Get request data
    const { subject_id } = await request.json()

    if (!subject_id) {
      return NextResponse.json(
        { error: "subject_id is required" },
        { status: 400 }
      )
    }

    // 4. Verify that subject belongs to teacher
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .select("id")
      .eq("id", subject_id)
      .eq("teacher_id", user.id)
      .single()

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: "Subject not found or unauthorized" },
        { status: 404 }
      )
    }

    // 5. Close any existing active sessions for this subject (optional)
    await supabase
      .from("attendance_sessions")
      .update({ status: "closed" })
      .eq("subject_id", subject_id)
      .eq("teacher_id", user.id)
      .eq("status", "active")

    // 6. Generate unique session ID with SESS_ prefix
    const sessionId = generateSessionId()

    // 7. Generate QR data string (sessionId|subjectId|teacherId|timestamp)
    const qrData = generateSessionQRData(sessionId, subject_id, user.id)
    const qrImage = await generateQRImage(qrData)

    // 8. Calculate expiration (30 minutes by default)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    // 9. Insert session into database
    const { data: session, error: insertError } = await supabase
      .from("attendance_sessions")
      .insert({
        id: sessionId,
        subject_id,
        teacher_id: user.id,
        qr_code: qrData,
        status: "active",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("Database error:", insertError)
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      )
    }

    // 10. Return response with QR data
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        subject_id: session.subject_id,
        qr_code: qrData,
        qr_image: qrImage,
        expires_at: session.expires_at,
        status: session.status,
      },
    })
  } catch (error) {
    console.error("Error in POST /api/attendance-sessions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/attendance-sessions
 * List active sessions for authenticated teacher
 *
 * Query params: ?subject_id=xxx (optional)
 * Response: { sessions: [...] }
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

    // Build query
    let query = supabase
      .from("attendance_sessions")
      .select("*, subjects(*)")
      .eq("teacher_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (subjectId) {
      query = query.eq("subject_id", subjectId)
    }

    const { data: sessions, error } = await query

    if (error) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Error in GET /api/attendance-sessions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/attendance-sessions/:id
 * Update session status (close session)
 *
 * Request body: { status: 'closed' }
 * Response: { success: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { session_id, status } = await request.json()

    if (!session_id || !status) {
      return NextResponse.json(
        { error: "session_id and status are required" },
        { status: 400 }
      )
    }

    if (status !== "closed" && status !== "active") {
      return NextResponse.json(
        { error: "status must be 'active' or 'closed'" },
        { status: 400 }
      )
    }

    // Update session (only if teacher owns it)
    const { data, error } = await supabase
      .from("attendance_sessions")
      .update({ status })
      .eq("id", session_id)
      .eq("teacher_id", user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, session: data })
  } catch (error) {
    console.error("Error in PATCH /api/attendance-sessions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
