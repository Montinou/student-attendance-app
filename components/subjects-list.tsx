"use client"

import type { Subject } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Pencil, Trash2 } from "lucide-react"
import { EditSubjectDialog } from "./edit-subject-dialog"
import { DeleteSubjectDialog } from "./delete-subject-dialog"
import { ManageEnrollmentsDialog } from "./manage-enrollments-dialog"
import { useState } from "react"

interface SubjectsListProps {
  subjects: Subject[]
}

export function SubjectsList({ subjects }: SubjectsListProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEnrollmentsDialog, setShowEnrollmentsDialog] = useState(false)

  if (subjects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay materias registradas</h3>
          <p className="text-sm text-gray-600 text-center max-w-sm">
            Comienza creando tu primera materia para gestionar la asistencia de tus estudiantes.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <Card key={subject.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-1">{subject.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">{subject.code}</CardDescription>
                </div>
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {subject.schedule && <p className="text-sm text-gray-600">{subject.schedule}</p>}
              {subject.description && <p className="text-sm text-gray-500 line-clamp-2">{subject.description}</p>}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setSelectedSubject(subject)
                    setShowEnrollmentsDialog(true)
                  }}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Estudiantes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSubject(subject)
                    setShowEditDialog(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSubject(subject)
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSubject && (
        <>
          <EditSubjectDialog subject={selectedSubject} open={showEditDialog} onOpenChange={setShowEditDialog} />
          <DeleteSubjectDialog subject={selectedSubject} open={showDeleteDialog} onOpenChange={setShowDeleteDialog} />
          <ManageEnrollmentsDialog
            subject={selectedSubject}
            open={showEnrollmentsDialog}
            onOpenChange={setShowEnrollmentsDialog}
          />
        </>
      )}
    </>
  )
}
