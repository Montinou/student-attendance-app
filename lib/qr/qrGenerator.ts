// QR Code Generator
// Based on claude-code-qr-integration.xml specification

import QRCode from "qrcode"
import type { QRSessionPayload, QRGenerationOptions } from "./qrTypes"

/**
 * Generate QR data string from session information
 * Format: sessionId|subjectId|teacherId|timestamp
 * Example: "SESS_abc123|uuid-subject|uuid-teacher|1699460640000"
 */
export function generateSessionQRData(
  sessionId: string,
  subjectId: string,
  teacherId: string
): string {
  const payload: QRSessionPayload = {
    sessionId,
    subjectId,
    teacherId,
    timestamp: Date.now(),
  }

  // Encoding: sessionId|subjectId|teacherId|timestamp
  return `${payload.sessionId}|${payload.subjectId}|${payload.teacherId}|${payload.timestamp}`
}

/**
 * Generate QR code as base64 image
 * @param data - The QR data string
 * @param options - QR generation options
 * @returns Promise<string> - Base64 image data URL
 */
export async function generateQRImage(
  data: string,
  options: QRGenerationOptions = {}
): Promise<string> {
  try {
    const qrImage = await QRCode.toDataURL(data, {
      width: options.width || 300,
      margin: options.margin || 2,
      errorCorrectionLevel: options.errorCorrectionLevel || "M",
      type: "image/png",
      quality: 0.95,
    })
    return qrImage // Returns base64 data URL
  } catch (error) {
    console.error("Error generating QR:", error)
    throw new Error("Failed to generate QR code")
  }
}

/**
 * Generate QR code as SVG string (optional, for better print quality)
 * @param data - The QR data string
 * @returns Promise<string> - SVG string
 */
export async function generateQRSVG(data: string): Promise<string> {
  try {
    const qrSvg = await QRCode.toString(data, {
      type: "svg",
      width: 300,
      margin: 2,
      errorCorrectionLevel: "M",
    })
    return qrSvg
  } catch (error) {
    console.error("Error generating QR SVG:", error)
    throw new Error("Failed to generate QR SVG")
  }
}

/**
 * Generate unique session ID with SESS_ prefix
 * @returns string - Format: "SESS_abc12345"
 */
export function generateSessionId(): string {
  // Generate random string (8 characters)
  const randomStr = Math.random().toString(36).substring(2, 10)
  return `SESS_${randomStr}`
}
