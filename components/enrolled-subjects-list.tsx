"use client"

import Link from "next/link"
import type { Enrollment, Subject } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Search } from "lucide-react"

interface EnrolledSubjectsListProps {
  enrollments: (Enrollment & { subjects?: Subject })[]
}

export function EnrolledSubjectsList({ enrollments }: EnrolledSubjectsListProps) {
  if (enrollments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No estás inscrito en ninguna materia</h3>
          <p className="text-sm text-gray-600 text-center max-w-sm mb-6">
            Explora las materias disponibles e inscríbete en las que te interesen.
          </p>
          <Button asChild>
            <Link href="/student/subjects">
              <Search className="h-4 w-4 mr-2" />
              Explorar Materias
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {enrollments.map((enrollment) => (
        <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-1">{enrollment.subjects?.name}</CardTitle>
                <CardDescription className="font-mono text-xs">{enrollment.subjects?.code}</CardDescription>
              </div>
              <BookOpen className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {enrollment.subjects?.schedule && <p className="text-sm text-gray-600">{enrollment.subjects.schedule}</p>}
            {enrollment.subjects?.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{enrollment.subjects.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
