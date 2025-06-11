import { createSupabaseClient } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

class SupabaseAuthService {
  constructor() {
    this.supabase = createSupabaseClient()
  }

  // Sign up with email and password
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name || '',
            avatar_url: userData.avatar_url || null,
            timezone: userData.timezone || 'UTC',
            role: userData.role || 'member',
          },
        },
      })

      if (error) {
        toast.push(
          <Notification type="danger" title="Registration Failed">
            {error.message}
          </Notification>,
          { placement: 'top-end' }
        )
        return { data: null, error }
      }

      // Create user profile in users table
      if (data.user) {
        const { error: profileError } = await this.supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: userData.name || '',
            avatar_url: userData.avatar_url || null,
            timezone: userData.timezone || 'UTC',
            role: userData.role || 'member',
            preferences: userData.preferences || null,
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
        }
      }

      toast.push(
        <Notification type="success" title="Registration Successful">
          Please check your email to verify your account.
        </Notification>,
        { placement: 'top-end' }
      )

      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      toast.push(
        <Notification type="danger" title="Registration Error">
          An unexpected error occurred. Please try again.
        </Notification>,
        { placement: 'top-end' }
      )
      return { data: null, error }
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.push(
          <Notification type="danger" title="Login Failed">
            {error.message}
          </Notification>,
          { placement: 'top-end' }
        )
        return { data: null, error }
      }

      toast.push(
        <Notification type="success" title="Login Successful">
          Welcome back!
        </Notification>,
        { placement: 'top-end' }
      )

      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.push(
        <Notification type="danger" title="Login Error">
          An unexpected error occurred. Please try again.
        </Notification>,
        { placement: 'top-end' }
      )
      return { data: null, error }
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()

      if (error) {
        toast.push(
          <Notification type="danger" title="Logout Failed">
            {error.message}
          </Notification>,
          { placement: 'top-end' }
        )
        return { error }
      }

      toast.push(
        <Notification type="success" title="Logged Out">
          You have been successfully logged out.
        </Notification>,
        { placement: 'top-end' }
      )

      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      const { data, error } = await this.supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      )

      if (error) {
        toast.push(
          <Notification type="danger" title="Password Reset Failed">
            {error.message}
          </Notification>,
          { placement: 'top-end' }
        )
        return { data: null, error }
      }

      toast.push(
        <Notification type="success" title="Password Reset Email Sent">
          Please check your email for password reset instructions.
        </Notification>,
        { placement: 'top-end' }
      )

      return { data, error: null }
    } catch (error) {
      console.error('Reset password error:', error)
      toast.push(
        <Notification type="danger" title="Password Reset Error">
          An unexpected error occurred. Please try again.
        </Notification>,
        { placement: 'top-end' }
      )
      return { data: null, error }
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        toast.push(
          <Notification type="danger" title="Password Update Failed">
            {error.message}
          </Notification>,
          { placement: 'top-end' }
        )
        return { data: null, error }
      }

      toast.push(
        <Notification type="success" title="Password Updated">
          Your password has been successfully updated.
        </Notification>,
        { placement: 'top-end' }
      )

      return { data, error: null }
    } catch (error) {
      console.error('Update password error:', error)
      return { data: null, error }
    }
  }

  // Get current session
  async getSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()
      return { session, error }
    } catch (error) {
      console.error('Get session error:', error)
      return { session: null, error }
    }
  }

  // Get current user
  async getUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      return { user, error }
    } catch (error) {
      console.error('Get user error:', error)
      return { user: null, error }
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Get user profile error:', error)
        return { profile: null, error }
      }

      return { profile: data, error: null }
    } catch (error) {
      console.error('Get user profile error:', error)
      return { profile: null, error }
    }
  }

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        toast.push(
          <Notification type="danger" title="Profile Update Failed">
            {error.message}
          </Notification>,
          { placement: 'top-end' }
        )
        return { data: null, error }
      }

      toast.push(
        <Notification type="success" title="Profile Updated">
          Your profile has been successfully updated.
        </Notification>,
        { placement: 'top-end' }
      )

      return { data, error: null }
    } catch (error) {
      console.error('Update user profile error:', error)
      return { data: null, error }
    }
  }

  // Check if user has role
  hasRole(user, requiredRole) {
    if (!user || !user.user_metadata) return false

    const userRole = user.user_metadata.role || 'member'
    const roleHierarchy = {
      viewer: 1,
      member: 2,
      project_manager: 3,
      admin: 4,
    }

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
  }

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

export default new SupabaseAuthService()