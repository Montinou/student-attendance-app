import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReportsFilter } from "@/components/reports-filter"
import { AttendanceReportTable } from "@/components/attendance-report-table"

interface SearchParams {
  subject?: string
  from?: string
  to?: string
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?role=teacher")
  }

  const { data: subjects } = await supabase.from("subjects").select("*").eq("teacher_id", user.id).order("name")

  // Build query for attendance records
  let query = supabase
    .from("attendance_records")
    .select("*, profiles(full_name, email), subjects(name, code)")
    .eq("subjects.teacher_id", user.id)

  if (params.subject) {
    query = query.eq("subject_id", params.subject)
  }

  if (params.from) {
    query = query.gte("scanned_at", params.from)
  }

  if (params.to) {
    const toDate = new Date(params.to)
    toDate.setHours(23, 59, 59, 999)
    query = query.lte("scanned_at", toDate.toISOString())
  }

  const { data: attendanceRecords } = await query.order("scanned_at", {
    ascending: false,
  })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes de Asistencia</h1>
        <p className="text-gray-600">Consulta y exporta los registros de asistencia</p>
      </div>

      <ReportsFilter subjects={subjects || []} />

      <AttendanceReportTable records={attendanceRecords || []} subjects={subjects || []} />
    </div>
  )
}
