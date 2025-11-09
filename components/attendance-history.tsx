"use client"

import type { AttendanceRecord } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Calendar } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface AttendanceHistoryProps {
  records: (AttendanceRecord & { subjects?: { name: string; code: string } })[]
}

export function AttendanceHistory({ records }: AttendanceHistoryProps) {
  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CheckCircle2 className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay registros de asistencia</h3>
          <p className="text-sm text-gray-600 text-center max-w-sm">
            Tus asistencias aparecerán aquí después de escanear códigos QR.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registros de Asistencia</CardTitle>
        <CardDescription>
          {records.length} asistencia{records.length !== 1 ? "s" : ""} registrada{records.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">{record.subjects?.name}</p>
                  <p className="text-sm text-gray-600 font-mono">{record.subjects?.code}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(record.scanned_at), "d 'de' MMMM, yyyy", {
                    locale: es,
                  })}
                </div>
                <p className="text-xs text-gray-500">{format(new Date(record.scanned_at), "HH:mm")}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
