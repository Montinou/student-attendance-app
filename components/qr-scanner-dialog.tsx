"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { recordAttendanceFromQR } from "@/actions/attendanceActions"
import { Camera, CheckCircle2, XCircle, AlertCircle, QrCode, Loader2 } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"

interface QRScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRScannerDialog({ open, onOpenChange }: QRScannerDialogProps) {
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{
    studentName: string
    subjectName: string
  } | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (open && !success) {
      initializeScanner()
    }

    return () => {
      cleanupScanner()
    }
  }, [open, success])

  const initializeScanner = async () => {
    try {
      setLoading(true)
      setCameraError(null)

      // Create Html5Qrcode scanner
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner

      // Configuration as per claude-code-qr-integration.xml spec
      const config = {
        fps: 10,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
      }

      // Start scanning with back camera preference
      await scanner.start(
        { facingMode: "environment" }, // Use back camera on mobile
        config,
        onScanSuccess,
        onScanFailure
      )

      setScanning(true)
      setLoading(false)
    } catch (err) {
      console.error("Camera initialization error:", err)
      setCameraError("Error al acceder a la cámara. Por favor, permite el acceso.")
      setLoading(false)
    }
  }

  const onScanSuccess = async (decodedText: string) => {
    if (scanning && scannerRef.current?.isScanning) {
      setScanning(false)
      await handleQRCodeScanned(decodedText)
    }
  }

  const onScanFailure = (errorMessage: string) => {
    // Ignore scan failures during continuous scanning
    // These are expected when no QR code is in view
  }

  const handleQRCodeScanned = async (qrData: string) => {
    try {
      // Pause scanner while processing
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.pause()
      }

      // Get geolocation if available
      let latitude: number | undefined
      let longitude: number | undefined

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          latitude = position.coords.latitude
          longitude = position.coords.longitude
        } catch {
          // Geolocation not available or denied - continue without it
        }
      }

      // Call Server Action to record attendance
      const result = await recordAttendanceFromQR(qrData, latitude, longitude)

      if (!result.success) {
        throw new Error(result.message)
      }

      // Success!
      setSuccessData({
        studentName: result.data?.studentName || "Student",
        subjectName: result.data?.subjectName || "Subject",
      })
      setSuccess(true)
      router.refresh()
    } catch (err) {
      console.error("QR scan processing error:", err)
      setError(err instanceof Error ? err.message : "Error al registrar asistencia")
      setScanning(false)
    }
  }

  const cleanupScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
        scannerRef.current.clear()
      } catch (err) {
        console.error("Error cleaning up scanner:", err)
      }
      scannerRef.current = null
    }
  }

  const handleClose = async () => {
    await cleanupScanner()
    setSuccess(false)
    setError(null)
    setCameraError(null)
    setScanning(false)
    setLoading(true)
    setSuccessData(null)
    onOpenChange(false)
  }

  const handleRetry = async () => {
    setError(null)
    setCameraError(null)
    await initializeScanner()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Escanear Código QR
          </DialogTitle>
          <DialogDescription>Apunta la cámara al código QR que muestra tu profesor</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {success && successData ? (
            <div className="flex flex-col items-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">¡Asistencia registrada!</h3>
              <p className="text-sm text-gray-600 text-center">
                Bienvenido/a <strong>{successData.studentName}</strong>
              </p>
              <p className="text-sm text-gray-600 text-center mb-6">
                Materia: <strong>{successData.subjectName}</strong>
              </p>
              <Button onClick={handleClose} className="mt-6">
                Cerrar
              </Button>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8">
              <XCircle className="h-16 w-16 text-red-600 mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
              <p className="text-sm text-gray-600 text-center mb-6">{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={handleRetry}>Intentar de nuevo</Button>
              </div>
            </div>
          ) : cameraError ? (
            <div className="flex flex-col items-center py-8">
              <AlertCircle className="h-16 w-16 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold text-orange-900 mb-2">Error de Cámara</h3>
              <p className="text-sm text-gray-600 text-center mb-6">{cameraError}</p>
              <Button onClick={handleClose}>Cerrar</Button>
            </div>
          ) : (
            <>
              {loading && (
                <div className="flex flex-col items-center py-16 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-600">Inicializando cámara...</p>
                </div>
              )}

              {!loading && (
                <>
                  <div
                    id="qr-reader"
                    className="rounded-lg overflow-hidden border-2 border-blue-300 bg-gray-100"
                    style={{ minHeight: "350px" }}
                  />

                  {scanning && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Escaneando...
                    </div>
                  )}

                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <Camera className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>Centra el código QR dentro del marco. El escaneo es automático.</p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
