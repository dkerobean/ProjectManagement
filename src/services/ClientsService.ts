// Client Service - API functions for client management

export interface Client {
    id: string
    name: string
    email: string
    phone?: string
    company?: string
    address?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
    image_url?: string
    status: 'active' | 'inactive'
    created_by?: string
    created_at: string
    updated_at: string
}

export interface CreateClientPayload {
    name: string
    email: string
    phone?: string
    company?: string
    address?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
    image_url?: string
    status?: 'active' | 'inactive'
}

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

/**
 * Get all clients
 */
export async function apiGetClients<T = Client[]>(params?: Record<string, unknown>): Promise<T> {
    try {
        const queryParams = new URLSearchParams()
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, String(value))
                }
            })
        }

        const url = `/api/clients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to fetch clients')
        }

        const data = await response.json()
        return data as T
    } catch (error) {
        console.error('❌ ClientsService.apiGetClients error:', error)
        throw error
    }
}

/**
 * Get a single client by ID
 */
export async function apiGetClient<T = ApiResponse<Client>>({ id }: { id: string }): Promise<T> {
    try {
        const url = `/api/clients/${id}`

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to fetch client')
        }

        const data = await response.json()
        return data as T
    } catch (error) {
        console.error('❌ ClientsService.apiGetClient error:', error)
        throw error
    }
}

/**
 * Create a new client
 */
export async function apiCreateClient<T = ApiResponse<Client>>(payload: CreateClientPayload): Promise<T> {
    try {

        const response = await fetch('/api/clients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create client')
        }

        const data = await response.json()
        return data as T
    } catch (error) {
        console.error('❌ ClientsService.apiCreateClient error:', error)
        throw error
    }
}

/**
 * Update a client
 */
export async function apiUpdateClient<T = ApiResponse<Client>>({ id, ...payload }: { id: string } & Partial<CreateClientPayload>): Promise<T> {
    try {

        const response = await fetch(`/api/clients/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update client')
        }

        const data = await response.json()
        return data as T
    } catch (error) {
        console.error('❌ ClientsService.apiUpdateClient error:', error)
        throw error
    }
}

/**
 * Delete a client
 */
export async function apiDeleteClient<T = ApiResponse<void>>({ id }: { id: string }): Promise<T> {
    try {

        const response = await fetch(`/api/clients/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete client')
        }

        const data = await response.json()
        return data as T
    } catch (error) {
        console.error('❌ ClientsService.apiDeleteClient error:', error)
        throw error
    }
}