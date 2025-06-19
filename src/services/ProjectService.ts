// Project Service - API functions for project management

export interface CreateProjectPayload {
    name: string
    description: string
    status?: string
    priority?: string
    start_date?: string
    end_date?: string
    metadata?: Record<string, unknown>
}

export interface Project {
    id: string
    name: string
    description: string
    status: string
    priority: string
    start_date: string | null
    end_date: string | null
    owner_id: string
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
}

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

/**
 * Create a new project
 */
export const apiCreateProject = async (payload: CreateProjectPayload): Promise<ApiResponse<Project>> => {
    try {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: payload.name,
                description: payload.description,
                status: payload.status || 'active',
                priority: payload.priority || 'medium',
                start_date: payload.start_date,
                end_date: payload.end_date,
                metadata: payload.metadata || {},
                team_members: [], // Empty array for now
                tasks: [] // Empty array for now
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create project')
        }

        const data = await response.json()
        return {
            success: true,
            data: data.data,
            message: data.message
        }
    } catch (error) {
        console.error('Error creating project:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

/**
 * Get all projects
 */
export const apiGetProjects = async (): Promise<ApiResponse<Project[]>> => {
    try {
        const response = await fetch('/api/projects', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to fetch projects')
        }

        const data = await response.json()
        return {
            success: true,
            data: data.data || data.list || []
        }
    } catch (error) {
        console.error('Error fetching projects:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

/**
 * Get a single project by ID
 */
export const apiGetProject = async (id: string): Promise<ApiResponse<Project>> => {
    try {
        const response = await fetch(`/api/projects/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to fetch project')
        }

        const data = await response.json()
        return {
            success: true,
            data: data.data
        }
    } catch (error) {
        console.error('Error fetching project:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

/**
 * Update a project
 */
export const apiUpdateProject = async (id: string, payload: Partial<CreateProjectPayload>): Promise<ApiResponse<Project>> => {
    try {
        const response = await fetch(`/api/projects/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update project')
        }

        const data = await response.json()
        return {
            success: true,
            data: data.data,
            message: data.message
        }
    } catch (error) {
        console.error('Error updating project:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

/**
 * Delete a project
 */
export const apiDeleteProject = async (id: string): Promise<ApiResponse<void>> => {
    try {
        const response = await fetch(`/api/projects/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete project')
        }

        const data = await response.json()
        return {
            success: true,
            message: data.message
        }
    } catch (error) {
        console.error('Error deleting project:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}
