import QRCode from "qrcode"

export class QRService {
  /**
   * Generate a unique QR code string
   * Format: ${subjectId}-${timestamp}-${random}
   * @param subjectId Subject ID
   * @returns QR code string
   */
  static generateQRCode(subjectId: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    return `${subjectId}-${timestamp}-${random}`
  }

  /**
   * Generate QR code as base64 data URL
   * For display in frontend
   * @param qrCode QR code string to encode
   * @returns Promise with base64 data URL
   */
  static async generateQRImage(qrCode: string): Promise<string> {
    try {
      const dataUrl = await QRCode.toDataURL(qrCode, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "M",
        type: "image/png",
      })

      return dataUrl
    } catch (error) {
      throw new Error(
        `Failed to generate QR image: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Parse a QR code to extract components
   * @param qrCode QR code string
   * @returns Object with subject ID and timestamp
   */
  static parseQRCode(
    qrCode: string
  ): { subjectId: string; timestamp: number; random: string } {
    const parts = qrCode.split("-")

    if (parts.length !== 3) {
      throw new Error("Invalid QR code format")
    }

    const [subjectId, timestampStr, random] = parts

    const timestamp = parseInt(timestampStr, 10)

    if (isNaN(timestamp)) {
      throw new Error("Invalid timestamp in QR code")
    }

    return {
      subjectId,
      timestamp,
      random,
    }
  }

  /**
   * Validate QR code format
   * @param qrCode QR code string
   * @returns True if valid format
   */
  static isValidQRFormat(qrCode: string): boolean {
    try {
      const parts = qrCode.split("-")

      if (parts.length !== 3) {
        return false
      }

      const timestamp = parseInt(parts[1], 10)

      return !isNaN(timestamp)
    } catch {
      return false
    }
  }

  /**
   * Generate QR code as SVG string
   * Alternative to data URL for better quality
   * @param qrCode QR code string
   * @returns Promise with SVG string
   */
  static async generateQRSVG(qrCode: string): Promise<string> {
    try {
      const svg = await QRCode.toString(qrCode, {
        type: "svg",
        width: 300,
        margin: 2,
        errorCorrectionLevel: "M",
      })

      return svg
    } catch (error) {
      throw new Error(
        `Failed to generate QR SVG: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Generate QR code with custom options
   * @param qrCode QR code string
   * @param options Custom options for QR generation
   * @returns Promise with base64 data URL
   */
  static async generateQRImageWithOptions(
    qrCode: string,
    options: {
      width?: number
      margin?: number
      color?: {
        dark?: string
        light?: string
      }
    }
  ): Promise<string> {
    try {
      const dataUrl = await QRCode.toDataURL(qrCode, {
        width: options.width || 300,
        margin: options.margin || 2,
        errorCorrectionLevel: "M",
        type: "image/png",
        color: options.color || {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })

      return dataUrl
    } catch (error) {
      throw new Error(
        `Failed to generate QR image: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }
}
