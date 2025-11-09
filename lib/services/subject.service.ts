import { createClient } from "@/lib/supabase/server"
import type { Subject } from "@/lib/types"

export type CreateSubjectDTO = {
  name: string
  code: string
  schedule?: string | null
  description?: string | null
  teacher_id: string
}

export type UpdateSubjectDTO = Partial<
  Omit<CreateSubjectDTO, "teacher_id">
>

export class SubjectService {
  /**
   * Get all subjects for a specific teacher
   * @param teacherId Teacher's user ID
   * @returns Array of subjects
   */
  static async getSubjectsByTeacher(teacherId: string): Promise<Subject[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch subjects: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get all subjects (for students to browse and enroll)
   * @returns Array of all subjects with teacher information
   */
  static async getAllSubjects(): Promise<
    (Subject & { profiles?: { full_name: string } })[]
  > {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("subjects")
      .select("*, profiles:teacher_id(full_name)")
      .order("name", { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch subjects: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get a single subject by ID
   * @param subjectId Subject ID
   * @returns Subject or null if not found
   */
  static async getSubjectById(subjectId: string): Promise<Subject | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch subject: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new subject
   * @param data Subject creation data
   * @returns Created subject
   */
  static async createSubject(data: CreateSubjectDTO): Promise<Subject> {
    const supabase = await createClient()

    const { data: subject, error } = await supabase
      .from("subjects")
      .insert({
        name: data.name,
        code: data.code,
        schedule: data.schedule || null,
        description: data.description || null,
        teacher_id: data.teacher_id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create subject: ${error.message}`)
    }

    return subject
  }

  /**
   * Update an existing subject
   * @param subjectId Subject ID
   * @param data Update data
   * @returns Updated subject
   */
  static async updateSubject(
    subjectId: string,
    data: UpdateSubjectDTO
  ): Promise<Subject> {
    const supabase = await createClient()

    const { data: subject, error } = await supabase
      .from("subjects")
      .update({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.schedule !== undefined && { schedule: data.schedule }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
      })
      .eq("id", subjectId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update subject: ${error.message}`)
    }

    return subject
  }

  /**
   * Delete a subject
   * Cascades to enrollments, attendance_sessions, and attendance_records
   * @param subjectId Subject ID
   */
  static async deleteSubject(subjectId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", subjectId)

    if (error) {
      throw new Error(`Failed to delete subject: ${error.message}`)
    }
  }

  /**
   * Verify that a teacher owns a specific subject
   * @param teacherId Teacher's user ID
   * @param subjectId Subject ID
   * @returns True if teacher owns the subject
   */
  static async verifyTeacherOwnsSubject(
    teacherId: string,
    subjectId: string
  ): Promise<boolean> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("subjects")
      .select("id")
      .eq("id", subjectId)
      .eq("teacher_id", teacherId)
      .maybeSingle()

    if (error) {
      return false
    }

    return data !== null
  }

  /**
   * Get subjects count for a teacher
   * @param teacherId Teacher's user ID
   * @returns Number of subjects
   */
  static async getSubjectsCount(teacherId: string): Promise<number> {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from("subjects")
      .select("*", { count: "exact", head: true })
      .eq("teacher_id", teacherId)

    if (error) {
      throw new Error(`Failed to count subjects: ${error.message}`)
    }

    return count || 0
  }
}
