export type Client = {
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
    created_at: string
    updated_at: string
    created_by?: string
}

export type GetClientsListResponse = {
    list: Client[]
    total: number
}

export type Filter = {
    status: Array<string>
    company: string
}

export type ClientFormSchema = {
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
