"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { AttendanceSession } from "@/lib/types"
import QRCode from "qrcode"
import { createClient } from "@/lib/supabase/client"
import { Users, Clock, AlertCircle } from "lucide-react"

interface ViewQRDialogProps {
  session: AttendanceSession & { subjects?: { name: string; code: string } }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewQRDialog({ session, open, onOpenChange }: ViewQRDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState("")
  const [qrError, setQrError] = useState<string | null>(null)

  // Extract stable values to avoid unnecessary re-renders
  const sessionId = session.id
  const qrCode = session.qr_code
  const expiresAt = session.expires_at

  // Generate QR code when dialog opens
  useEffect(() => {
    if (!open || !canvasRef.current) return

    // Clear any previous error
    setQrError(null)

    QRCode.toCanvas(
      canvasRef.current,
      qrCode,
      {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      },
      (error) => {
        if (error) {
          console.error("QR Generation Error:", error)
          setQrError("Error al generar código QR")
        }
      },
    )
  }, [qrCode, open])

  // Memoized function to load attendance
  const loadAttendance = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from("attendance_records").select("*").eq("session_id", sessionId)
    setAttendanceCount(data?.length || 0)
  }, [sessionId])

  // Handle countdown and attendance updates
  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setTimeRemaining("")
      setAttendanceCount(0)
      return
    }

    // Initial load
    loadAttendance()

    // Update countdown and attendance
    const interval = setInterval(() => {
      const now = new Date()
      const expires = new Date(expiresAt)
      const diff = expires.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining("Expirado")
        clearInterval(interval)
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`)

      // Refresh attendance count
      loadAttendance()
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [open, expiresAt, loadAttendance])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{session.subjects?.name}</DialogTitle>
          <DialogDescription className="text-center">Muestra este código QR a tus estudiantes</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {qrError ? (
            <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border-2 border-red-200">
              <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
              <p className="text-red-700 font-medium">{qrError}</p>
              <p className="text-sm text-red-600 mt-1">Por favor, cierra e intenta nuevamente</p>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              <canvas ref={canvasRef} />
            </div>
          )}

          <div className="w-full grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-600">Tiempo</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{timeRemaining}</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-600">Asistencias</p>
              </div>
              <p className="text-2xl font-bold text-green-900">{attendanceCount}</p>
            </div>
          </div>

          <p className="text-xs text-center text-gray-500">
            Los estudiantes deben escanear este código con la app antes de que expire
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
