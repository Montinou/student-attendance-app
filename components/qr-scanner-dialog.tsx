"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { Camera, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { QrCode } from "lucide-react" // Import QrCode component

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
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (open && !success) {
      startScanning()
    }

    return () => {
      stopScanning()
    }
  }, [open])

  const startScanning = async () => {
    setScanning(true)
    setError(null)
    setCameraError(null)

    try {
      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader

      const videoInputDevices = await codeReader.listVideoInputDevices()

      if (videoInputDevices.length === 0) {
        setCameraError("No se encontró ninguna cámara")
        setScanning(false)
        return
      }

      // Use back camera if available (for mobile)
      const selectedDevice =
        videoInputDevices.find((device) => device.label.toLowerCase().includes("back")) || videoInputDevices[0]

      await codeReader.decodeFromVideoDevice(selectedDevice.deviceId, videoRef.current!, async (result, error) => {
        if (result) {
          const qrCode = result.getText()
          await handleQRCodeScanned(qrCode)
          stopScanning()
        }
      })
    } catch (err) {
      console.error("[v0] Camera error:", err)
      setCameraError("Error al acceder a la cámara. Por favor, permite el acceso.")
      setScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }
    setScanning(false)
  }

  const handleQRCodeScanned = async (qrCode: string) => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      // Find the session
      const { data: session, error: sessionError } = await supabase
        .from("attendance_sessions")
        .select("*, subjects(*)")
        .eq("qr_code", qrCode)
        .single()

      if (sessionError || !session) {
        throw new Error("Código QR inválido")
      }

      // Check if session is still valid
      const now = new Date()
      const expiresAt = new Date(session.expires_at)
      if (expiresAt <= now) {
        throw new Error("Este código QR ha expirado")
      }

      // Check if student is enrolled
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("*")
        .eq("student_id", user.id)
        .eq("subject_id", session.subject_id)
        .single()

      if (!enrollment) {
        throw new Error("No estás inscrito en esta materia")
      }

      // Check if already marked attendance
      const { data: existing } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("session_id", session.id)
        .eq("student_id", user.id)
        .single()

      if (existing) {
        throw new Error("Ya registraste tu asistencia para esta sesión")
      }

      // Record attendance
      const { error: insertError } = await supabase.from("attendance_records").insert({
        session_id: session.id,
        student_id: user.id,
        subject_id: session.subject_id,
      })

      if (insertError) throw insertError

      setSuccess(true)
      router.refresh()
    } catch (err) {
      console.error("[v0] QR scan error:", err)
      setError(err instanceof Error ? err.message : "Error al registrar asistencia")
    }
  }

  const handleClose = () => {
    stopScanning()
    setSuccess(false)
    setError(null)
    setCameraError(null)
    onOpenChange(false)
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
          {success ? (
            <div className="flex flex-col items-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">¡Asistencia registrada!</h3>
              <p className="text-sm text-gray-600 text-center">Tu asistencia ha sido registrada exitosamente</p>
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
                <Button onClick={startScanning}>Intentar de nuevo</Button>
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
