"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Subject } from "@/lib/types"
import { Filter, X } from "lucide-react"

interface ReportsFilterProps {
  subjects: Subject[]
}

export function ReportsFilter({ subjects }: ReportsFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/teacher/reports?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push("/teacher/reports")
  }

  const hasFilters = searchParams.toString().length > 0

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gray-600" />
          <h3 className="font-semibold">Filtros</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Materia</Label>
            <Select
              value={searchParams.get("subject") || "all"}
              onValueChange={(value) => handleFilterChange("subject", value)}
            >
              <SelectTrigger id="subject">
                <SelectValue placeholder="Todas las materias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las materias</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from">Desde</Label>
            <Input
              id="from"
              type="date"
              value={searchParams.get("from") || ""}
              onChange={(e) => handleFilterChange("from", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to">Hasta</Label>
            <Input
              id="to"
              type="date"
              value={searchParams.get("to") || ""}
              onChange={(e) => handleFilterChange("to", e.target.value)}
            />
          </div>

          <div className="flex items-end">
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters} className="w-full bg-transparent">
                <X className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
