"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser"
import { Camera, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { QrCode } from "lucide-react"

interface QRScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRScannerDialog({ open, onOpenChange }: QRScannerDialogProps) {
  const [scanning, setScanning] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerControlsRef = useRef<IScannerControls | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (open && !success) {
      startScanning()
    }

    return () => {
      stopScanning()
    }
  }, [open, success])

  const startScanning = async () => {
    if (!videoRef.current) {
      setCameraError("No se pudo inicializar el video")
      return
    }

    setScanning(true)
    setError(null)
    setCameraError(null)

    try {
      const codeReader = new BrowserMultiFormatReader()

      // Request camera permission first by getting user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      })

      // Stop the temporary stream as zxing will create its own
      stream.getTracks().forEach(track => track.stop())

      // Now enumerate devices (labels will be available after permission granted)
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')

      if (videoDevices.length === 0) {
        setCameraError("No se encontró ninguna cámara")
        setScanning(false)
        return
      }

      // Use back camera if available (for mobile)
      const selectedDevice =
        videoDevices.find((device) => device.label.toLowerCase().includes("back")) || videoDevices[0]

      // Start decoding from video device
      const controls = await codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        async (result, error) => {
          if (result) {
            const qrCode = result.getText()
            await handleQRCodeScanned(qrCode)
            stopScanning()
          }
          // Ignore errors during scanning (they happen continuously)
        }
      )

      scannerControlsRef.current = controls
    } catch (err) {
      console.error("Camera error:", err)
      if (err instanceof Error && err.name === "NotAllowedError") {
        setCameraError("Permiso de cámara denegado. Por favor, permite el acceso a la cámara.")
      } else if (err instanceof Error && err.name === "NotFoundError") {
        setCameraError("No se encontró ninguna cámara en tu dispositivo.")
      } else {
        setCameraError("Error al acceder a la cámara. Por favor, permite el acceso.")
      }
      setScanning(false)
    }
  }

  const stopScanning = () => {
    if (scannerControlsRef.current) {
      scannerControlsRef.current.stop()
      scannerControlsRef.current = null
    }
    setScanning(false)
  }

  const handleQRCodeScanned = async (qrCode: string) => {
    try {
      const response = await fetch("/api/attendance-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error status codes
        if (response.status === 404) {
          throw new Error("Código QR inválido")
        } else if (response.status === 410) {
          throw new Error("Este código QR ha expirado")
        } else if (response.status === 403) {
          throw new Error("No estás inscrito en esta materia")
        } else if (response.status === 409) {
          throw new Error("Ya registraste tu asistencia para esta sesión")
        }
        throw new Error(data.error || "Error al registrar asistencia")
      }

      console.log("✅ Asistencia registrada exitosamente:", data.record)

      setSuccess(true)
      router.refresh()
    } catch (err) {
      console.error("❌ QR scan error:", err)
      setError(err instanceof Error ? err.message : "Error al registrar asistencia")
    }
  }

  const handleClose = () => {
    // Stop scanning first
    stopScanning()

    // Reset all states
    setSuccess(false)
    setError(null)
    setCameraError(null)

    // Close the dialog
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleClose()
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Escanear Código QR
          </DialogTitle>
          <DialogDescription>Apunta la cámara al código QR que muestra tu profesor</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {success ? (
            <div className="flex flex-col items-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">¡Asistencia registrada!</h3>
              <p className="text-sm text-gray-600 text-center">Tu asistencia ha sido registrada exitosamente</p>
              <Button onClick={handleClose} className="mt-6" type="button">
                Cerrar
              </Button>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8">
              <XCircle className="h-16 w-16 text-red-600 mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
              <p className="text-sm text-gray-600 text-center mb-6">{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} type="button">
                  Cancelar
                </Button>
                <Button onClick={() => {
                  setError(null)
                  startScanning()
                }} type="button">
                  Intentar de nuevo
                </Button>
              </div>
            </div>
          ) : cameraError ? (
            <div className="flex flex-col items-center py-8">
              <AlertCircle className="h-16 w-16 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold text-orange-900 mb-2">Error de Cámara</h3>
              <p className="text-sm text-gray-600 text-center mb-6">{cameraError}</p>
              <Button onClick={handleClose} type="button">Cerrar</Button>
            </div>
          ) : (
            <>
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <Camera className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Centra el código QR dentro del marco. El escaneo es automático.</p>
              </div>
              <Button variant="outline" onClick={handleClose} className="w-full" type="button">
                Cancelar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
