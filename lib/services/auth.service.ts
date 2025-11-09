import { createClient } from "@/lib/supabase/server"
import type { Profile, UserRole } from "@/lib/types"
import type { User } from "@supabase/supabase-js"

export class AuthService {
  /**
   * Authenticate user with email and password
   * @param email User email
   * @param password User password
   * @returns User object and role
   */
  static async login(
    email: string,
    password: string
  ): Promise<{ user: User; role: UserRole }> {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      throw new Error(error?.message || "Authentication failed")
    }

    // Get user profile to determine role
    const profile = await this.getUserProfile(data.user.id)

    return {
      user: data.user,
      role: profile.role,
    }
  }

  /**
   * Register a new user
   * @param email User email
   * @param password User password
   * @param fullName User's full name
   * @param role User role (teacher or student)
   */
  static async register(
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    // Profile is created automatically by database trigger
  }

  /**
   * Get currently authenticated user
   * @returns User object or null if not authenticated
   */
  static async getCurrentUser(): Promise<User | null> {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  }

  /**
   * Get user profile by user ID
   * @param userId User ID
   * @returns User profile
   */
  static async getUserProfile(userId: string): Promise<Profile> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (error || !data) {
      throw new Error("Profile not found")
    }

    return data
  }

  /**
   * Verify that user has expected role
   * @param userId User ID
   * @param expectedRole Expected role
   * @returns True if user has expected role
   */
  static async verifyUserRole(
    userId: string,
    expectedRole: UserRole
  ): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId)
      return profile.role === expectedRole
    } catch {
      return false
    }
  }

  /**
   * Log out current user
   */
  static async logout(): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }
  }

  /**
   * Get profile with role check
   * Throws if profile doesn't exist or role doesn't match
   * @param userId User ID
   * @param expectedRole Expected role (optional)
   * @returns User profile
   */
  static async getProfileWithRoleCheck(
    userId: string,
    expectedRole?: UserRole
  ): Promise<Profile> {
    const profile = await this.getUserProfile(userId)

    if (expectedRole && profile.role !== expectedRole) {
      throw new Error(
        `Unauthorized: expected ${expectedRole} but got ${profile.role}`
      )
    }

    return profile
  }
}
