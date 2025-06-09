import { supabase, createServiceClient } from '../lib/supabase'

/**
 * Project Service - Handles project-related database operations
 */
export class ProjectService {
  /**
   * Create a new project
   */
  static async createProject(projectData, ownerId) {
    const serviceClient = createServiceClient()

    // Start a transaction
    const { data: project, error: projectError } = await serviceClient
      .from('projects')
      .insert([{
        name: projectData.name,
        description: projectData.description,
        status: projectData.status || 'active',
        priority: projectData.priority || 'medium',
        start_date: projectData.start_date,
        end_date: projectData.end_date,
        due_date: projectData.due_date,
        color: projectData.color || '#3B82F6',
        owner_id: ownerId,
        metadata: projectData.metadata || {}
      }])
      .select()
      .single()

    if (projectError) throw projectError

    // Add the owner as a project member
    const { error: memberError } = await serviceClient
      .from('project_members')
      .insert([{
        project_id: project.id,
        user_id: ownerId,
        role: 'owner'
      }])

    if (memberError) throw memberError

    return project
  }

  /**
   * Get project by ID with member info
   */
  static async getProjectById(projectId, userId) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:users!owner_id(id, name, email, avatar_url),
        project_members(
          id, role, joined_at,
          user:users(id, name, email, avatar_url, role)
        )
      `)
      .eq('id', projectId)
      .single()

    if (error) throw error

    // Check if user has access to this project
    const userMembership = data.project_members.find(member => member.user.id === userId)
    if (!userMembership) {
      throw new Error('Access denied to this project')
    }

    return data
  }

  /**
   * Get user's projects
   */
  static async getUserProjects(userId, status = null) {
    let query = supabase
      .from('projects')
      .select(`
        *,
        owner:users!owner_id(id, name, email, avatar_url),
        project_members!inner(role),
        tasks(count)
      `)
      .eq('project_members.user_id', userId)
      .order('updated_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  /**
   * Update project
   */
  static async updateProject(projectId, updates, userId) {
    // First check if user has permission to update
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw new Error('Insufficient permissions to update project')
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Add member to project
   */
  static async addProjectMember(projectId, userId, memberData, requesterId) {
    // Check if requester has permission
    const { data: requesterMembership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', requesterId)
      .single()

    if (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role)) {
      throw new Error('Insufficient permissions to add members')
    }

    const { data, error } = await supabase
      .from('project_members')
      .insert([{
        project_id: projectId,
        user_id: memberData.user_id,
        role: memberData.role || 'member',
        permissions: memberData.permissions || {},
        invited_by: requesterId
      }])
      .select(`
        *,
        user:users(id, name, email, avatar_url)
      `)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Soft delete project
   */
  static async softDeleteProject(projectId, userId, reason = 'User requested deletion') {
    // Check if user has permission to delete
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw new Error('Insufficient permissions to delete project')
    }

    const { data, error } = await supabase
      .from('projects')
      .update({
        status: 'inactive',
        deleted_at: new Date().toISOString(),
        metadata: {
          deleted_by: userId,
          deleted_reason: reason,
          deleted_at: new Date().toISOString()
        }
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Remove member from project
   */
  static async removeProjectMember(projectId, memberUserId, requesterId) {
    // Check if requester has permission
    const { data: requesterMembership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', requesterId)
      .single()

    if (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role)) {
      throw new Error('Insufficient permissions to remove members')
    }

    // Don't allow removing the owner
    const { data: targetMembership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', memberUserId)
      .single()

    if (targetMembership?.role === 'owner') {
      throw new Error('Cannot remove project owner')
    }

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', memberUserId)

    if (error) throw error
    return { success: true }
  }

  /**
   * Search projects by name or description
   */
  static async searchUserProjects(userId, searchTerm, status = null) {
    let query = supabase
      .from('projects')
      .select(`
        *,
        owner:users!owner_id(id, name, email, avatar_url),
        project_members!inner(role),
        tasks(count)
      `)
      .eq('project_members.user_id', userId)
      .order('updated_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Add search conditions
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  /**
   * Get project statistics
   */
  static async getProjectStats(projectId, userId) {
    // First check if user has access to this project
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (!membership) {
      throw new Error('Access denied to this project')
    }

    // Get task statistics
    const { data: taskStats, error: taskError } = await supabase
      .from('tasks')
      .select('status')
      .eq('project_id', projectId)

    if (taskError) throw taskError

    const stats = {
      total_tasks: taskStats.length,
      completed_tasks: taskStats.filter(task => task.status === 'completed').length,
      in_progress_tasks: taskStats.filter(task => task.status === 'in-progress').length,
      pending_tasks: taskStats.filter(task => task.status === 'pending').length
    }

    stats.completion_percentage = stats.total_tasks > 0
      ? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
      : 0

    return stats
  }
}

// Legacy API functions for backward compatibility
export async function apiGetScrumBoards() {
    // TODO: Implement with Supabase
    return { data: [] }
}

export async function apiGetProjectMembers() {
    // TODO: Implement with Supabase
    return { data: [] }
}

export async function apiGetProject({ id, ...params }) {
    // TODO: Implement with Supabase
    // Legacy function for backward compatibility - not currently used
    console.log('Legacy API called with id:', id, 'params:', params)
    return { data: null }
}
