import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { QRGeneratorCard } from "@/components/qr-generator-card"
import { ActiveSessionsCard } from "@/components/active-sessions-card"

export default async function QRPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?role=teacher")
  }

  const { data: subjects } = await supabase.from("subjects").select("*").eq("teacher_id", user.id).order("name")

  const { data: activeSessions } = await supabase
    .from("attendance_sessions")
    .select("*, subjects(*)")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Generar Código QR</h1>
        <p className="text-gray-600">Crea un código QR para que tus estudiantes registren su asistencia</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <QRGeneratorCard subjects={subjects || []} />
        <ActiveSessionsCard sessions={activeSessions || []} />
      </div>
    </div>
  )
}
