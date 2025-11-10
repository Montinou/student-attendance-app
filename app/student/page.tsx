import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { EnrolledSubjectsList } from "@/components/enrolled-subjects-list"
import { QRScannerButton } from "@/components/qr-scanner-button"
import type { Enrollment, Subject } from "@/lib/types"

type EnrollmentWithSubject = Enrollment & { subjects: Subject }

export default async function StudentDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?role=student")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  // Verify user has student role - redirect to their correct dashboard if not
  if (!profile) {
    // Profile doesn't exist - force logout
    redirect("/auth/login?role=student&error=no-profile")
  }

  if (profile.role !== "student") {
    // User is not a student, send them to teacher dashboard
    redirect("/teacher")
  }

  // Fetch enrollments from API route
  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  const baseUrl = `${protocol}://${host}`

  const response = await fetch(`${baseUrl}/api/enrollments?studentId=${user.id}`, {
    cache: "no-store",
    headers: {
      Cookie: headersList.get("cookie") || "",
    },
  })

  let enrollments: EnrollmentWithSubject[] = []
  if (response.ok) {
    const data = await response.json()
    enrollments = data.enrollments || []
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Materias</h1>
        <p className="text-gray-600">Bienvenido, {profile?.full_name || "Estudiante"}</p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {enrollments.length} materia{enrollments.length !== 1 ? "s" : ""} inscrita
          {enrollments.length !== 1 ? "s" : ""}
        </p>
        <QRScannerButton />
      </div>

      <EnrolledSubjectsList enrollments={enrollments} />
    </div>
  )
}
