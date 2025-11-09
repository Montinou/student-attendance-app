"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Subject } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, UserPlus, CheckCircle2, Loader2 } from "lucide-react"

interface AvailableSubjectsListProps {
  subjects: (Subject & { profiles?: { full_name: string } })[]
  enrolledSubjectIds: string[]
}

export function AvailableSubjectsList({ subjects, enrolledSubjectIds }: AvailableSubjectsListProps) {
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleEnroll = async (subjectId: string) => {
    setEnrolling(subjectId)
    setError(null)

    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subjectId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al inscribirse. Por favor intenta de nuevo.")
      }

      console.log("✅ Inscripción exitosa:", data.enrollment)

      // Refresh the page to show updated enrollments
      router.refresh()
    } catch (err) {
      console.error("❌ Enrollment error:", err)
      setError(err instanceof Error ? err.message : "Error al inscribirse")
    } finally {
      setEnrolling(null)
    }
  }

  if (subjects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay materias disponibles</h3>
          <p className="text-sm text-gray-600 text-center max-w-sm">
            Aún no hay materias creadas por los profesores.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => {
          const isEnrolled = enrolledSubjectIds.includes(subject.id)
          const isEnrolling = enrolling === subject.id

          return (
            <Card key={subject.id} className={`hover:shadow-md transition-shadow ${isEnrolled ? 'border-green-200 bg-green-50/50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">{subject.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">{subject.code}</CardDescription>
                  </div>
                  {isEnrolled ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {subject.schedule && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Horario:</span> {subject.schedule}
                  </p>
                )}
                {subject.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{subject.description}</p>
                )}
                {subject.profiles?.full_name && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Profesor:</span> {subject.profiles.full_name}
                  </p>
                )}

                {isEnrolled ? (
                  <div className="pt-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-100 py-2 rounded-lg">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">Ya estás inscrito</span>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleEnroll(subject.id)}
                    disabled={isEnrolling}
                    className="w-full"
                    type="button"
                  >
                    {isEnrolling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Inscribiendo...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Inscribirse
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
