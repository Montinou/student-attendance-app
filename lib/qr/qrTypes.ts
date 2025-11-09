// QR Types and Validation Schemas
// Based on claude-code-qr-integration.xml specification

import { z } from "zod"

// QR Data Schema - validates QR code format
// Format: sessionId|subjectId|teacherId|timestamp
export const QRDataSchema = z.object({
  sessionId: z.string().startsWith("SESS_"),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  timestamp: z.number(),
})

export type QRData = z.infer<typeof QRDataSchema>

// QR Session Payload interface
export interface QRSessionPayload {
  sessionId: string
  subjectId: string
  teacherId: string
  timestamp: number
}

// Attendance Session Record (database)
export interface AttendanceSessionRecord {
  id: string // Format: "SESS_abc123"
  subject_id: string
  teacher_id: string
  qr_code: string
  status: "active" | "closed"
  created_at: string
  expires_at: string // 30 minutes after creation by default
}

// Attendance Record (database)
export interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  checked_in_at: string
  ip_address: string | null
  latitude: number | null
  longitude: number | null
}

// Validation result type
export interface ValidationResult {
  valid: boolean
  data?: QRData
  error?: string
}

// QR Generation options
export interface QRGenerationOptions {
  width?: number
  margin?: number
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
}
