// Task Service - API functions for task management

export interface CreateTaskPayload {
    title: string
    description?: string
    priority: 'low' | 'medium' | 'high'
    status: 'todo' | 'in_progress' | 'completed' | 'blocked'
    due_date?: string
    project_id: string
    assigned_to?: string
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
    id: string
}

export interface Task {
    id: string
    title: string
    description?: string
    priority: 'low' | 'medium' | 'high'
    status: 'todo' | 'in_progress' | 'completed' | 'blocked'
    due_date?: string
    project_id: string
    assigned_to?: string
    created_by: string
    created_at: string
    updated_at: string
    assignee?: {
        id: string
        name: string
        img: string
    }
}

export interface Project {
    id: string
    name: string
    description: string
    tasks: Task[]
}

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

/**
 * Get all projects with their tasks
 */
export const apiGetProjectsWithTasks = async (): Promise<ApiResponse<Project[]>> => {
    try {
        const response = await fetch('/api/projects-with-tasks', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to fetch projects with tasks')
        }

        const data = await response.json()
        return {
            success: true,
            data: data.data || data.list || []
        }
    } catch (error) {
        console.error('Error fetching projects with tasks:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

/**
 * Get tasks for a specific project
 */
export const apiGetProjectTasks = async (projectId: string): Promise<ApiResponse<Task[]>> => {
    try {
        const response = await fetch(`/api/projects/${projectId}/tasks`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to fetch project tasks')
        }

        const data = await response.json()
        return {
            success: true,
            data: data.data || data.list || []
        }
    } catch (error) {
        console.error('Error fetching project tasks:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

/**
 * Create a new task
 */
export const apiCreateTask = async (payload: CreateTaskPayload): Promise<ApiResponse<Task>> => {
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create task')
        }

        const data = await response.json()
        return {
            success: true,
            data: data.data,
            message: data.message
        }
    } catch (error) {
        console.error('Error creating task:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

/**
 * Update a task
 */
export const apiUpdateTask = async (payload: UpdateTaskPayload): Promise<ApiResponse<Task>> => {
    try {
        const response = await fetch(`/api/tasks/${payload.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update task')
        }

        const data = await response.json()
        return {
            success: true,
            data: data.data,
            message: data.message
        }
    } catch (error) {
        console.error('Error updating task:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

/**
 * Delete a task
 */
export const apiDeleteTask = async (taskId: string): Promise<ApiResponse<void>> => {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete task')
        }

        const data = await response.json()
        return {
            success: true,
            message: data.message
        }
    } catch (error) {
        console.error('Error deleting task:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

/**
 * Move a task to another project
 */
export const apiMoveTask = async (taskId: string, newProjectId: string): Promise<ApiResponse<Task>> => {
    try {
        const response = await fetch(`/api/tasks/${taskId}/move`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ project_id: newProjectId }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to move task')
        }

        const data = await response.json()
        return {
            success: true,
            data: data.data,
            message: data.message
        }
    } catch (error) {
        console.error('Error moving task:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

/**
 * Update task status (for drag and drop)
 */
export const apiUpdateTaskStatus = async (taskId: string, status: Task['status']): Promise<ApiResponse<Task>> => {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update task status')
        }

        const data = await response.json()
        return {
            success: true,
            data: data.data,
            message: data.message
        }
    } catch (error) {
        console.error('Error updating task status:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}
