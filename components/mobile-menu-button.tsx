"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu, LogOut, User } from "lucide-react"

interface MobileMenuButtonProps {
  userRole: "teacher" | "student"
}

export function MobileMenuButton({ userRole }: MobileMenuButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/")
    }
  }

  const roleTitle = userRole === "teacher" ? "Profesor" : "Estudiante"
  const roleColor = userRole === "teacher" ? "text-blue-600" : "text-green-600"

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[250px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className={cn("h-5 w-5", roleColor)} />
            <span>{roleTitle}</span>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="ghost"
            className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}