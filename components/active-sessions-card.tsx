"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { AttendanceSession } from "@/lib/types"
import { Clock, Eye, X } from "lucide-react"
import { ViewQRDialog } from "./view-qr-dialog"
import { useRouter } from "next/navigation"

interface ActiveSessionsCardProps {
  sessions: (AttendanceSession & { subjects?: { name: string; code: string } })[]
}

export function ActiveSessionsCard({ sessions: initialSessions }: ActiveSessionsCardProps) {
  const [sessions, setSessions] = useState(initialSessions)
  const [selectedSession, setSelectedSession] = useState<(AttendanceSession & { subjects?: { name: string; code: string } }) | null>(null)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  // Prevent hydration mismatch by only rendering time on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update sessions when initialSessions changes
  useEffect(() => {
    setSessions(initialSessions)
  }, [initialSessions])

  useEffect(() => {
    // Update countdown every second and filter expired sessions
    const interval = setInterval(() => {
      const now = new Date()
      setSessions((prev) => {
        const filtered = prev.filter((session) => new Date(session.expires_at) > now)
        // Only trigger re-render if something changed
        if (filtered.length !== prev.length) {
          return filtered
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()

    if (diff <= 0) return "Expirado"

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleEndSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/attendance-sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "end" }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al finalizar sesión")
      }

      // Optimistically update UI
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      router.refresh()
    } catch (error) {
      console.error("Failed to end session:", error)
      // Refresh to show accurate state
      router.refresh()
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Sesiones Activas</CardTitle>
          <CardDescription>Códigos QR activos y tiempo restante</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay sesiones activas</div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{session.subjects?.name}</p>
                    <p className="text-sm text-gray-600 font-mono">{session.subjects?.code}</p>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      {isMounted ? getTimeRemaining(session.expires_at) : "Cargando..."}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSession(session)
                        setShowQRDialog(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEndSession(session.id)}>
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSession && <ViewQRDialog session={selectedSession} open={showQRDialog} onOpenChange={setShowQRDialog} />}
    </>
  )
}
