import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EnrolledSubjectsList } from "@/components/enrolled-subjects-list"
import { QRScannerButton } from "@/components/qr-scanner-button"

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

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, subjects(*)")
    .eq("student_id", user.id)
    .order("enrolled_at", { ascending: false })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Materias</h1>
        <p className="text-gray-600">Bienvenido, {profile?.full_name || "Estudiante"}</p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {enrollments?.length || 0} materia{enrollments?.length !== 1 ? "s" : ""} inscrita
          {enrollments?.length !== 1 ? "s" : ""}
        </p>
        <QRScannerButton />
      </div>

      <EnrolledSubjectsList enrollments={enrollments || []} />
    </div>
  )
}
