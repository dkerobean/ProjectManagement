import { supabase, createServiceClient } from '../lib/supabase'

/**
 * Task Service - Handles task-related database operations with hierarchy support
 */
export class TaskService {
  /**
   * Create a new task
   */
  static async createTask(taskData, userId) {
    // Validate parent task exists and belongs to same project
    let parentTask = null
    if (taskData.parent_task_id) {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, project_id')
        .eq('id', taskData.parent_task_id)
        .single()

      if (error || !data) {
        throw new Error('Parent task not found')
      }

      if (data.project_id !== taskData.project_id) {
        throw new Error('Parent task must be in the same project')
      }

      parentTask = data
    }

    // Check if user has permission to create tasks in this project
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', taskData.project_id)
      .eq('user_id', userId)
      .single()

    if (!membership) {
      throw new Error('Access denied to this project')
    }

    // Get the next position for ordering
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', taskData.project_id)
      .eq('parent_task_id', taskData.parent_task_id || null)

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([{
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        project_id: taskData.project_id,
        parent_task_id: taskData.parent_task_id || null,
        assignee_id: taskData.assignee_id || null,
        created_by: userId,
        start_date: taskData.start_date,
        due_date: taskData.due_date,
        position: (count || 0) + 1,
        estimated_hours: taskData.estimated_hours,
        tags: taskData.tags || [],
        metadata: taskData.metadata || {}
      }])
      .select(`
        *,
        assignee:users!assignee_id(id, name, email, avatar_url),
        created_by_user:users!created_by(id, name, email, avatar_url),
        parent_task:tasks!parent_task_id(id, title),
        project:projects(id, name, color)
      `)
      .single()

    if (error) throw error
    return task
  }

  /**
   * Get task by ID with all relationships
   */
  static async getTaskById(taskId, userId) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!assignee_id(id, name, email, avatar_url),
        created_by_user:users!created_by(id, name, email, avatar_url),
        parent_task:tasks!parent_task_id(id, title),
        project:projects(id, name, color),
        subtasks:tasks!parent_task_id(
          id, title, status, priority, assignee_id, due_date, position,
          assignee:users!assignee_id(id, name, avatar_url)
        ),
        dependencies:task_dependencies!task_id(
          id, dependency_type,
          depends_on_task:tasks!depends_on_task_id(id, title, status)
        ),
        dependents:task_dependencies!depends_on_task_id(
          id, dependency_type,
          task:tasks!task_id(id, title, status)
        ),
        comments(
          id, content, created_at, is_edited,
          author:users!author_id(id, name, avatar_url)
        ),
        file_attachments(
          id, filename, original_filename, file_size, mime_type, created_at,
          uploaded_by_user:users!uploaded_by(id, name, avatar_url)
        )
      `)
      .eq('id', taskId)
      .single()

    if (error) throw error

    // Check if user has access to this task's project
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', data.project_id)
      .eq('user_id', userId)
      .single()

    if (!membership) {
      throw new Error('Access denied to this task')
    }

    return data
  }

  /**
   * Get tasks for a project with hierarchy
   */
  static async getProjectTasks(projectId, userId, filters = {}) {
    // Check access
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (!membership) {
      throw new Error('Access denied to this project')
    }

    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!assignee_id(id, name, email, avatar_url),
        created_by_user:users!created_by(id, name, email, avatar_url),
        parent_task:tasks!parent_task_id(id, title),
        subtasks:tasks!parent_task_id(count),
        comments(count)
      `)
      .eq('project_id', projectId)
      .order('position', { ascending: true })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters.assignee_id) {
      query = query.eq('assignee_id', filters.assignee_id)
    }
    if (filters.parent_task_id !== undefined) {
      query = query.eq('parent_task_id', filters.parent_task_id)
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  /**
   * Update task
   */
  static async updateTask(taskId, updates, userId) {
    // Get current task to check permissions
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('project_id, assignee_id, created_by')
      .eq('id', taskId)
      .single()

    if (!currentTask) {
      throw new Error('Task not found')
    }

    // Check permissions
    const canEdit = await this.canEditTask(currentTask.project_id, userId, currentTask)
    if (!canEdit) {
      throw new Error('Insufficient permissions to edit this task')
    }

    // Validate parent task change if provided
    if (updates.parent_task_id !== undefined) {
      if (updates.parent_task_id) {
        // Check for circular dependency
        const hasCircular = await this.checkCircularDependency(taskId, updates.parent_task_id)
        if (hasCircular) {
          throw new Error('This would create a circular dependency')
        }
      }
    }

    // Handle status change to completed
    if (updates.status === 'done' && currentTask.status !== 'done') {
      updates.completed_at = new Date().toISOString()
    } else if (updates.status !== 'done') {
      updates.completed_at = null
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select(`
        *,
        assignee:users!assignee_id(id, name, email, avatar_url),
        created_by_user:users!created_by(id, name, email, avatar_url),
        parent_task:tasks!parent_task_id(id, title),
        project:projects(id, name, color)
      `)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete task and handle subtasks
   */
  static async deleteTask(taskId, userId, handleSubtasks = 'promote') {
    // Get task with subtasks
    const { data: task } = await supabase
      .from('tasks')
      .select(`
        *,
        subtasks:tasks!parent_task_id(id, title)
      `)
      .eq('id', taskId)
      .single()

    if (!task) {
      throw new Error('Task not found')
    }

    // Check permissions
    const canEdit = await this.canEditTask(task.project_id, userId, task)
    if (!canEdit) {
      throw new Error('Insufficient permissions to delete this task')
    }

    // Handle subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      if (handleSubtasks === 'promote') {
        // Move subtasks to parent's level
        await supabase
          .from('tasks')
          .update({ parent_task_id: task.parent_task_id })
          .eq('parent_task_id', taskId)
      } else if (handleSubtasks === 'delete') {
        // Delete all subtasks recursively
        for (const subtask of task.subtasks) {
          await this.deleteTask(subtask.id, userId, 'delete')
        }
      } else {
        throw new Error('Cannot delete task with subtasks. Specify handleSubtasks as "promote" or "delete"')
      }
    }

    // Delete the task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error
  }

  /**
   * Add task dependency
   */
  static async addTaskDependency(taskId, dependsOnTaskId, dependencyType = 'blocks', userId) {
    // Validate both tasks exist and belong to same project
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, project_id')
      .in('id', [taskId, dependsOnTaskId])

    if (!tasks || tasks.length !== 2) {
      throw new Error('One or both tasks not found')
    }

    if (tasks[0].project_id !== tasks[1].project_id) {
      throw new Error('Tasks must be in the same project')
    }

    // Check for circular dependency
    const hasCircular = await this.checkCircularDependency(taskId, dependsOnTaskId)
    if (hasCircular) {
      throw new Error('This would create a circular dependency')
    }

    // Check permissions
    const canEdit = await this.canEditTask(tasks[0].project_id, userId)
    if (!canEdit) {
      throw new Error('Insufficient permissions')
    }

    const { data, error } = await supabase
      .from('task_dependencies')
      .insert([{
        task_id: taskId,
        depends_on_task_id: dependsOnTaskId,
        dependency_type: dependencyType
      }])
      .select(`
        *,
        task:tasks!task_id(id, title),
        depends_on_task:tasks!depends_on_task_id(id, title)
      `)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Helper: Check if user can edit task
   */
  static async canEditTask(projectId, userId, task = null) {
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (!membership) return false

    // Owners and admins can edit any task
    if (['owner', 'admin'].includes(membership.role)) return true

    // Task assignee and creator can edit
    if (task && (task.assignee_id === userId || task.created_by === userId)) return true

    // Regular members can edit tasks they created or are assigned to
    return membership.role === 'member'
  }

  /**
   * Helper: Check for circular dependency
   */
  static async checkCircularDependency(taskId, dependsOnTaskId) {
    // Use the database function we created
    const { data, error } = await supabase
      .rpc('check_circular_dependency', {
        task_uuid: taskId,
        depends_on_uuid: dependsOnTaskId
      })

    if (error) throw error
    return data
  }

  /**
   * Get task hierarchy tree
   */
  static async getTaskHierarchy(projectId, userId, rootTaskId = null) {
    const tasks = await this.getProjectTasks(projectId, userId, {
      parent_task_id: rootTaskId
    })

    // Build hierarchy recursively
    const buildHierarchy = async (parentId) => {
      const children = tasks.filter(task => task.parent_task_id === parentId)

      for (const child of children) {
        child.children = await buildHierarchy(child.id)
      }

      return children
    }

    return buildHierarchy(rootTaskId)
  }

  /**
   * Move task position
   */
  static async moveTask(taskId, newPosition, userId) {
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id, parent_task_id, position')
      .eq('id', taskId)
      .single()

    if (!task) throw new Error('Task not found')

    const canEdit = await this.canEditTask(task.project_id, userId)
    if (!canEdit) throw new Error('Insufficient permissions')

    // Update positions
    const { error } = await supabase
      .from('tasks')
      .update({ position: newPosition })
      .eq('id', taskId)

    if (error) throw error

    // Reorder other tasks
    await this.reorderTasks(task.project_id, task.parent_task_id)
  }

  /**
   * Helper: Reorder tasks to maintain sequential positions
   */
  static async reorderTasks(projectId, parentTaskId) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', projectId)
      .eq('parent_task_id', parentTaskId || null)
      .order('position')

    if (tasks) {
      for (let i = 0; i < tasks.length; i++) {
        await supabase
          .from('tasks')
          .update({ position: i + 1 })
          .eq('id', tasks[i].id)
      }
    }
  }
}
