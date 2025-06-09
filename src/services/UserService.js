import { supabase, createServiceClient } from '../lib/supabase'

/**
 * User Service - Handles user-related database operations
 */
export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: userData.email,
        name: userData.name,
        role: userData.role || 'member',
        timezone: userData.timezone || 'UTC',
        avatar_url: userData.avatar_url,
        preferences: userData.preferences || {}
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update user
   */
  static async updateUser(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update user's last login
   */
  static async updateLastLogin(userId) {
    const { error } = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw error
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('name')

    if (error) throw error
    return data
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(query, limit = 10) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, role')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit)
      .order('name')

    if (error) throw error
    return data
  }
}
