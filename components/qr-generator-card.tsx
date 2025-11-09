"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import type { Subject } from "@/lib/types"
import { QrCode, Clock } from "lucide-react"

interface QRGeneratorCardProps {
  subjects: Subject[]
}

export function QRGeneratorCard({ subjects }: QRGeneratorCardProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [duration, setDuration] = useState<string>("10")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleGenerate = async () => {
    if (!selectedSubject) {
      setError("Selecciona una materia")
      return
    }

    if (!duration || Number.parseInt(duration) <= 0) {
      setError("Selecciona una duración válida")
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Verify user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error("Debes iniciar sesión para generar códigos QR")
      }

      // Generate unique QR code (UUID + timestamp)
      const qrCode = `${selectedSubject}-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + Number.parseInt(duration))

      // Validate expiration time is in the future
      if (expiresAt <= new Date()) {
        throw new Error("La fecha de expiración debe ser en el futuro")
      }

      const { data, error } = await supabase.from("attendance_sessions").insert({
        subject_id: selectedSubject,
        qr_code: qrCode,
        expires_at: expiresAt.toISOString(),
      }).select()

      if (error) throw error

      if (!data || data.length === 0) {
        throw new Error("No se pudo crear la sesión de asistencia")
      }

      console.log("QR Code generado exitosamente:", qrCode)
      router.refresh()
      setSelectedSubject("")
    } catch (err) {
      console.error("Error al generar QR:", err)
      setError(err instanceof Error ? err.message : "Error al generar código QR")
    } finally {
      setIsLoading(false)
    }
  }

  if (subjects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generar Código QR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">Primero debes crear una materia para generar códigos QR</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Generar Código QR
        </CardTitle>
        <CardDescription>Selecciona la materia y duración del código QR</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Materia</Label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger id="subject">
              <SelectValue placeholder="Selecciona una materia" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duración de validez</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger id="duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 minutos</SelectItem>
              <SelectItem value="10">10 minutos</SelectItem>
              <SelectItem value="15">15 minutos</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="60">1 hora</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button onClick={handleGenerate} disabled={isLoading || !selectedSubject} className="w-full" size="lg">
          <QrCode className="h-5 w-5 mr-2" />
          {isLoading ? "Generando..." : "Generar Código QR"}
        </Button>

        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            El código QR expirará después de {duration} minutos. Los estudiantes deberán escanearlo antes de que expire
            para registrar su asistencia.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
