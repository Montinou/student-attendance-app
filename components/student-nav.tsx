"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GraduationCap, BookOpen, History, LogOut, Search } from "lucide-react"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MobileMenuButton } from "@/components/mobile-menu-button"

const navItems = [
  {
    title: "Mis Materias",
    href: "/student",
    icon: BookOpen,
  },
  {
    title: "Explorar",
    href: "/student/subjects",
    icon: Search,
  },
  {
    title: "Historial",
    href: "/student/history",
    icon: History,
  },
]

export function StudentNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      // Still redirect to home on error
      router.push("/")
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/student" className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-green-600" />
              <span className="font-semibold text-lg">Panel Estudiante</span>
            </Link>
            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      pathname === item.href
                        ? "bg-green-50 text-green-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title === "Explorar" ? "Explorar Materias" : item.title}
                  </Link>
                )
              })}
            </nav>
          </div>
          {/* Desktop logout button */}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
          {/* Mobile menu button */}
          <MobileMenuButton userRole="student" />
        </div>
      </header>
      {/* Mobile bottom navigation */}
      <MobileBottomNav navItems={navItems} activeColor="green" />
    </>
  )
}
