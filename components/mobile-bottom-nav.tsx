"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

interface MobileBottomNavProps {
  navItems: NavItem[]
  activeColor?: string
}

export function MobileBottomNav({ navItems, activeColor = "blue" }: MobileBottomNavProps) {
  const pathname = usePathname()

  const activeColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
  }

  const activeClass = activeColorClasses[activeColor as keyof typeof activeColorClasses] || activeColorClasses.blue

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t md:hidden">
      <div className="grid grid-cols-3 h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                isActive ? activeClass : "text-gray-500"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="max-w-[60px] truncate">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}