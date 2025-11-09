import { createClient } from "@/lib/supabase/server"
import type { Enrollment, Profile, Subject } from "@/lib/types"

export type EnrollmentWithSubject = Enrollment & { subjects: Subject }
export type EnrollmentWithProfile = Enrollment & { profiles: Profile }

export class EnrollmentService {
  /**
   * Get all enrollments for a student (with subject details)
   * @param studentId Student's user ID
   * @returns Array of enrollments with subject information
   */
  static async getEnrollmentsByStudent(
    studentId: string
  ): Promise<EnrollmentWithSubject[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("enrollments")
      .select("*, subjects(*)")
      .eq("student_id", studentId)
      .order("enrolled_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch enrollments: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get all enrollments for a subject (with student details)
   * @param subjectId Subject ID
   * @returns Array of enrollments with student profile information
   */
  static async getEnrollmentsBySubject(
    subjectId: string
  ): Promise<EnrollmentWithProfile[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("enrollments")
      .select("*, profiles(*)")
      .eq("subject_id", subjectId)
      .order("enrolled_at", { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch enrollments: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get array of subject IDs that a student is enrolled in
   * @param studentId Student's user ID
   * @returns Array of subject IDs
   */
  static async getEnrolledSubjectIds(studentId: string): Promise<string[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("enrollments")
      .select("subject_id")
      .eq("student_id", studentId)

    if (error) {
      throw new Error(
        `Failed to fetch enrolled subject IDs: ${error.message}`
      )
    }

    return data?.map((e) => e.subject_id) || []
  }

  /**
   * Check if a specific enrollment exists
   * @param studentId Student's user ID
   * @param subjectId Subject ID
   * @returns Enrollment or null if not found
   */
  static async checkEnrollment(
    studentId: string,
    subjectId: string
  ): Promise<Enrollment | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("enrollments")
      .select("*")
      .eq("student_id", studentId)
      .eq("subject_id", subjectId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to check enrollment: ${error.message}`)
    }

    return data
  }

  /**
   * Enroll a student in a subject
   * @param studentId Student's user ID
   * @param subjectId Subject ID
   * @returns Created enrollment
   */
  static async enrollStudent(
    studentId: string,
    subjectId: string
  ): Promise<Enrollment> {
    const supabase = await createClient()

    // Check if already enrolled
    const existing = await this.checkEnrollment(studentId, subjectId)
    if (existing) {
      throw new Error("Student is already enrolled in this subject")
    }

    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        student_id: studentId,
        subject_id: subjectId,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to enroll student: ${error.message}`)
    }

    return data
  }

  /**
   * Enroll a student by email (for teachers adding students)
   * @param email Student's email
   * @param subjectId Subject ID
   * @returns Created enrollment
   */
  static async enrollStudentByEmail(
    email: string,
    subjectId: string
  ): Promise<Enrollment> {
    const supabase = await createClient()

    // Find student by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .eq("role", "student")
      .maybeSingle()

    if (profileError || !profile) {
      throw new Error("Student not found with this email")
    }

    // Enroll the student
    return await this.enrollStudent(profile.id, subjectId)
  }

  /**
   * Unenroll a student (remove enrollment)
   * @param enrollmentId Enrollment ID
   */
  static async unenrollStudent(enrollmentId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("id", enrollmentId)

    if (error) {
      throw new Error(`Failed to unenroll student: ${error.message}`)
    }
  }

  /**
   * Check if student is enrolled in a subject (boolean only)
   * @param studentId Student's user ID
   * @param subjectId Subject ID
   * @returns True if enrolled
   */
  static async isStudentEnrolled(
    studentId: string,
    subjectId: string
  ): Promise<boolean> {
    const enrollment = await this.checkEnrollment(studentId, subjectId)
    return enrollment !== null
  }

  /**
   * Get enrollment count for a subject
   * @param subjectId Subject ID
   * @returns Number of enrolled students
   */
  static async getEnrollmentCount(subjectId: string): Promise<number> {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("subject_id", subjectId)

    if (error) {
      throw new Error(`Failed to count enrollments: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Get all enrollments for a student with subject count
   * @param studentId Student's user ID
   * @returns Count of enrollments
   */
  static async getStudentEnrollmentCount(studentId: string): Promise<number> {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId)

    if (error) {
      throw new Error(`Failed to count student enrollments: ${error.message}`)
    }

    return count || 0
  }
}
