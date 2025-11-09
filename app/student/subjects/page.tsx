import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AvailableSubjectsList } from "@/components/available-subjects-list"

export default async function SubjectsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?role=student")
  }

  // Get all available subjects with teacher info
  const { data: subjects } = await supabase
    .from("subjects")
    .select("*, profiles(full_name)")
    .order("name")

  // Get student's current enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("subject_id")
    .eq("student_id", user.id)

  const enrolledSubjectIds = enrollments?.map((e) => e.subject_id) || []

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Explorar Materias</h1>
        <p className="text-gray-600">Explora las materias disponibles e inscríbete en las que te interesen</p>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600">
          {subjects?.length || 0} materia{subjects?.length !== 1 ? "s" : ""} disponible
          {subjects?.length !== 1 ? "s" : ""}
        </p>
      </div>

      <AvailableSubjectsList subjects={subjects || []} enrolledSubjectIds={enrolledSubjectIds} />
    </div>
  )
}
