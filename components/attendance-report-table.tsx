"use client"

import type { AttendanceRecord, Subject } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface AttendanceReportTableProps {
  records: (AttendanceRecord & {
    profiles?: { full_name: string; email: string }
    subjects?: { name: string; code: string }
  })[]
  subjects: Subject[]
}

export function AttendanceReportTable({ records, subjects }: AttendanceReportTableProps) {
  const exportToCSV = () => {
    if (records.length === 0) return

    // Create CSV header
    const header = ["Fecha", "Hora", "Estudiante", "Correo", "Materia", "Código"].join(",")

    // Create CSV rows
    const rows = records.map((record) =>
      [
        format(new Date(record.scanned_at), "dd/MM/yyyy"),
        format(new Date(record.scanned_at), "HH:mm"),
        record.profiles?.full_name || "",
        record.profiles?.email || "",
        record.subjects?.name || "",
        record.subjects?.code || "",
      ].join(","),
    )

    const csv = [header, ...rows].join("\n")

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `reporte-asistencia-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Registros de Asistencia</CardTitle>
            <CardDescription>
              {records.length} registro{records.length !== 1 ? "s" : ""} encontrado{records.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          {records.length > 0 && (
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileSpreadsheet className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay registros</h3>
            <p className="text-sm text-gray-600 text-center max-w-sm">
              No se encontraron registros de asistencia con los filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-sm">Fecha</th>
                  <th className="text-left p-3 font-semibold text-sm">Hora</th>
                  <th className="text-left p-3 font-semibold text-sm">Estudiante</th>
                  <th className="text-left p-3 font-semibold text-sm">Correo</th>
                  <th className="text-left p-3 font-semibold text-sm">Materia</th>
                  <th className="text-left p-3 font-semibold text-sm">Código</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">
                      {format(new Date(record.scanned_at), "d 'de' MMMM", {
                        locale: es,
                      })}
                    </td>
                    <td className="p-3 text-sm">{format(new Date(record.scanned_at), "HH:mm")}</td>
                    <td className="p-3 text-sm font-medium">{record.profiles?.full_name}</td>
                    <td className="p-3 text-sm text-gray-600">{record.profiles?.email}</td>
                    <td className="p-3 text-sm">{record.subjects?.name}</td>
                    <td className="p-3 text-sm font-mono text-gray-600">{record.subjects?.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
