import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StudentNav } from "@/components/student-nav"

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?role=student")
  }

  // Check if user is a student
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "student") {
    redirect("/teacher")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <StudentNav />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
    </div>
  )
}
