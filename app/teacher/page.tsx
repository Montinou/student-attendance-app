import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { SubjectsList } from "@/components/subjects-list"
import { CreateSubjectDialog } from "@/components/create-subject-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { Subject } from "@/lib/types"

export default async function TeacherDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?role=teacher")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  // Verify user has teacher role - redirect to their correct dashboard if not
  if (!profile) {
    // Profile doesn't exist - force logout
    redirect("/auth/login?role=teacher&error=no-profile")
  }

  if (profile.role !== "teacher") {
    // User is not a teacher, send them to student dashboard
    redirect("/student")
  }

  // Fetch subjects from API route
  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  const baseUrl = `${protocol}://${host}`

  const response = await fetch(`${baseUrl}/api/subjects?teacherId=${user.id}`, {
    cache: "no-store",
    headers: {
      Cookie: headersList.get("cookie") || "",
    },
  })

  let subjects: Subject[] = []
  if (response.ok) {
    const data = await response.json()
    subjects = data.subjects || []
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Materias</h1>
        <p className="text-gray-600">Bienvenido, {profile?.full_name || "Profesor"}</p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {subjects.length} materia{subjects.length !== 1 ? "s" : ""} registrada
          {subjects.length !== 1 ? "s" : ""}
        </p>
        <CreateSubjectDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Materia
          </Button>
        </CreateSubjectDialog>
      </div>

      <SubjectsList subjects={subjects} />
    </div>
  )
}
