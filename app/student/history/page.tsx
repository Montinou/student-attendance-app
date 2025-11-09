import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AttendanceHistory } from "@/components/attendance-history"

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?role=student")
  }

  const { data: attendanceRecords } = await supabase
    .from("attendance_records")
    .select("*, subjects(name, code)")
    .eq("student_id", user.id)
    .order("scanned_at", { ascending: false })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Historial de Asistencia</h1>
        <p className="text-gray-600">Consulta tu registro de asistencias</p>
      </div>

      <AttendanceHistory records={attendanceRecords || []} />
    </div>
  )
}
