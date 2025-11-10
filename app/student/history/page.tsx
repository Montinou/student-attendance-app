import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { AttendanceHistory } from "@/components/attendance-history"
import type { AttendanceRecord, Subject } from "@/lib/types"

type AttendanceRecordWithSubject = AttendanceRecord & {
  subjects: { name: string; code: string }
}

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?role=student")
  }

  // Fetch attendance records from API route
  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  const baseUrl = `${protocol}://${host}`

  const response = await fetch(`${baseUrl}/api/attendance-records?studentId=${user.id}`, {
    cache: "no-store",
    headers: {
      Cookie: headersList.get("cookie") || "",
    },
  })

  let attendanceRecords: AttendanceRecordWithSubject[] = []
  if (response.ok) {
    const data = await response.json()
    attendanceRecords = data.records || []
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Historial de Asistencia</h1>
        <p className="text-gray-600">Consulta tu registro de asistencias</p>
      </div>

      <AttendanceHistory records={attendanceRecords} />
    </div>
  )
}
