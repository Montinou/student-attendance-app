import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { ReportsFilter } from "@/components/reports-filter"
import { AttendanceReportTable } from "@/components/attendance-report-table"
import type { Subject, AttendanceRecord, Profile } from "@/lib/types"

interface SearchParams {
  subject?: string
  from?: string
  to?: string
}

type AttendanceRecordFull = AttendanceRecord & {
  subjects: { name: string; code: string }
  profiles: { full_name: string; email: string }
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

  // Construct API URL
  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  const baseUrl = `${protocol}://${host}`
  const cookie = headersList.get("cookie") || ""

  // Fetch subjects from API
  const subjectsResponse = await fetch(`${baseUrl}/api/subjects?teacherId=${user.id}`, {
    cache: "no-store",
    headers: { Cookie: cookie },
  })

  let subjects: Subject[] = []
  if (subjectsResponse.ok) {
    const data = await subjectsResponse.json()
    subjects = data.subjects || []
  }

  // Build attendance records query parameters
  const queryParams = new URLSearchParams({ teacherId: user.id })
  if (params.subject) queryParams.append("subjectId", params.subject)
  if (params.from) queryParams.append("fromDate", params.from)
  if (params.to) queryParams.append("toDate", params.to)

  // Fetch attendance records from API
  const recordsResponse = await fetch(`${baseUrl}/api/attendance-records?${queryParams.toString()}`, {
    cache: "no-store",
    headers: { Cookie: cookie },
  })

  let attendanceRecords: AttendanceRecordFull[] = []
  if (recordsResponse.ok) {
    const data = await recordsResponse.json()
    attendanceRecords = data.records || []
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes de Asistencia</h1>
        <p className="text-gray-600">Consulta y exporta los registros de asistencia</p>
      </div>

      <ReportsFilter subjects={subjects} />

      <AttendanceReportTable records={attendanceRecords} subjects={subjects} />
    </div>
  )
}
