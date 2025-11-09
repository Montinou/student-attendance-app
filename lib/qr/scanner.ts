import {
  BrowserMultiFormatReader,
  IScannerControls,
} from "@zxing/browser"

export class QRScanner {
  /**
   * Initialize QR scanner with camera
   * Client-side only - requires access to navigator.mediaDevices
   * @param videoElement HTML video element to render camera feed
   * @param onDecode Callback when QR code is successfully decoded
   * @param onError Callback for errors during scanning
   * @returns Scanner controls for stopping/pausing
   */
  static async initScanner(
    videoElement: HTMLVideoElement,
    onDecode: (result: string) => void,
    onError: (error: Error) => void
  ): Promise<IScannerControls> {
    try {
      const codeReader = new BrowserMultiFormatReader()

      // Get available cameras
      const cameras = await this.getCameras()

      if (cameras.length === 0) {
        throw new Error("No cameras found on this device")
      }

      // Prefer back camera on mobile devices
      const backCamera = cameras.find((device) =>
        device.label.toLowerCase().includes("back")
      )

      const deviceId = backCamera?.deviceId || cameras[0].deviceId

      // Start decoding from video device
      const controls = await codeReader.decodeFromVideoDevice(
        deviceId,
        videoElement,
        (result, error) => {
          if (result) {
            onDecode(result.getText())
          }
          if (error && error.name !== "NotFoundException") {
            // NotFoundException is thrown continuously when no QR is detected
            // Only report actual errors
            onError(error)
          }
        }
      )

      return controls
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to initialize scanner"
      onError(new Error(errorMessage))
      throw error
    }
  }

  /**
   * Stop scanner and release camera
   * @param controls Scanner controls from initScanner
   */
  static stopScanner(controls: IScannerControls): void {
    try {
      controls.stop()
    } catch (error) {
      console.error("Error stopping scanner:", error)
    }
  }

  /**
   * Get list of available cameras
   * @returns Array of video input devices
   */
  static async getCameras(): Promise<MediaDeviceInfo[]> {
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ video: true })

      // Get all devices
      const devices = await navigator.mediaDevices.enumerateDevices()

      // Filter only video inputs
      return devices.filter((device) => device.kind === "videoinput")
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to access cameras"

      throw new Error(errorMessage)
    }
  }

  /**
   * Check if browser supports camera access
   * @returns True if getUserMedia is available
   */
  static isCameraSupported(): boolean {
    return !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    )
  }

  /**
   * Request camera permissions
   * @returns True if permission granted
   */
  static async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      })

      // Stop the stream immediately - we just wanted to check permissions
      stream.getTracks().forEach((track) => track.stop())

      return true
    } catch (error) {
      console.error("Camera permission denied:", error)
      return false
    }
  }

  /**
   * Get preferred camera (back camera on mobile, first camera otherwise)
   * @returns Device ID of preferred camera
   */
  static async getPreferredCamera(): Promise<string | undefined> {
    const cameras = await this.getCameras()

    if (cameras.length === 0) {
      return undefined
    }

    // Try to find back camera (for mobile devices)
    const backCamera = cameras.find((device) =>
      device.label.toLowerCase().includes("back")
    )

    return backCamera?.deviceId || cameras[0].deviceId
  }
}
