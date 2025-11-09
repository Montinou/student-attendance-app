"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import type { Subject } from "@/lib/types"

interface EditSubjectDialogProps {
  subject: Subject
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditSubjectDialog({ subject, open, onOpenChange }: EditSubjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("subjects")
        .update({
          name: formData.get("name") as string,
          code: formData.get("code") as string,
          schedule: formData.get("schedule") as string,
          description: formData.get("description") as string,
        })
        .eq("id", subject.id)

      if (error) throw error

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Materia</DialogTitle>
            <DialogDescription>Actualiza la información de la materia</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre de la materia</Label>
              <Input id="edit-name" name="name" defaultValue={subject.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-code">Código</Label>
              <Input id="edit-code" name="code" defaultValue={subject.code} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-schedule">Horario</Label>
              <Input id="edit-schedule" name="schedule" defaultValue={subject.schedule || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea id="edit-description" name="description" defaultValue={subject.description || ""} rows={3} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
