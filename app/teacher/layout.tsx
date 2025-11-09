import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TeacherNav } from "@/components/teacher-nav"

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?role=teacher")
  }

  // Check if user is a teacher
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "teacher") {
    redirect("/student")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherNav />
      <main className="flex-1">{children}</main>
    </div>
  )
}
