"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
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
    const supabase = createClient()
    const { data } = await supabase.from("enrollments").select("*, profiles(*)").eq("subject_id", subject.id)

    if (data) {
      setEnrollments(data)
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Find student by email
      const { data: student, error: studentError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", studentEmail.trim().toLowerCase())
        .eq("role", "student")
        .maybeSingle()

      if (studentError) {
        console.error("Student lookup error:", studentError)
        throw new Error("Error al buscar estudiante")
      }

      if (!student) {
        throw new Error("No se encontró un estudiante con ese correo")
      }

      // Check if already enrolled
      const { data: existing, error: existingError } = await supabase
        .from("enrollments")
        .select("*")
        .eq("student_id", student.id)
        .eq("subject_id", subject.id)
        .maybeSingle()

      if (existingError) {
        console.error("Enrollment check error:", existingError)
        throw new Error("Error al verificar inscripción")
      }

      if (existing) {
        throw new Error("El estudiante ya está inscrito en esta materia")
      }

      // Create enrollment
      const { data: newEnrollment, error: insertError } = await supabase
        .from("enrollments")
        .insert({
          student_id: student.id,
          subject_id: subject.id,
        })
        .select()

      if (insertError) {
        console.error("Enrollment insert error:", insertError)
        throw insertError
      }

      console.log("✅ Estudiante inscrito exitosamente:", {
        student: student.full_name,
        email: student.email,
        subject: subject.name
      })

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
    const supabase = createClient()

    try {
      const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId)

      if (error) throw error

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
