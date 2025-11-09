"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Subject, Enrollment } from "@/lib/types"
import { UserPlus, X, Users } from "lucide-react"

interface ManageEnrollmentsDialogProps {
  subject: Subject
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManageEnrollmentsDialog({ subject, open, onOpenChange }: ManageEnrollmentsDialogProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [studentEmail, setStudentEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      loadEnrollments()
    }
  }, [open, subject.id])

  const loadEnrollments = async () => {
    try {
      const response = await fetch(`/api/enrollments?subjectId=${subject.id}`)
      const data = await response.json()

      if (response.ok && data.enrollments) {
        setEnrollments(data.enrollments)
      }
    } catch (err) {
      console.error("Error loading enrollments:", err)
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: studentEmail.trim().toLowerCase(),
          subjectId: subject.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al agregar estudiante")
      }

      console.log("✅ Estudiante inscrito exitosamente:", data.enrollment)

      setStudentEmail("")
      loadEnrollments()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar estudiante")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveStudent = async (enrollmentId: string) => {
    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al eliminar estudiante")
      }

      loadEnrollments()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar estudiante")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estudiantes - {subject.name}
          </DialogTitle>
          <DialogDescription>Gestiona los estudiantes inscritos en esta materia</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleAddStudent} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="student-email" className="sr-only">
                Correo del estudiante
              </Label>
              <Input
                id="student-email"
                type="email"
                placeholder="correo@estudiante.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </form>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
            {enrollments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No hay estudiantes inscritos en esta materia</div>
            ) : (
              enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{enrollment.profiles?.full_name}</p>
                    <p className="text-sm text-gray-600">{enrollment.profiles?.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveStudent(enrollment.id)}>
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
