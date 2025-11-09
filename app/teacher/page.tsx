import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SubjectsList } from "@/components/subjects-list"
import { CreateSubjectDialog } from "@/components/create-subject-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function TeacherDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?role=teacher")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Materias</h1>
        <p className="text-gray-600">Bienvenido, {profile?.full_name || "Profesor"}</p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {subjects?.length || 0} materia{subjects?.length !== 1 ? "s" : ""} registrada
          {subjects?.length !== 1 ? "s" : ""}
        </p>
        <CreateSubjectDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Materia
          </Button>
        </CreateSubjectDialog>
      </div>

      <SubjectsList subjects={subjects || []} />
    </div>
  )
}
