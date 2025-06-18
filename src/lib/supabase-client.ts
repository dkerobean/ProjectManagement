// Server-side utility to use Supabase MCP functions
// This enables us to run SQL queries against the Supabase database using the MCP tools

import type { Client, ClientFormSchema } from '@/app/(protected-pages)/concepts/clients/types'

interface MCPSupabaseClient {
    executeSQL: (query: string) => Promise<Record<string, unknown>[]>
    getClients: (params: {
        pageIndex?: number
        pageSize?: number
        sortKey?: string
        order?: string
        query?: string
    }) => Promise<{ list: Client[]; total: number }>
    getClient: (id: string) => Promise<Client>
    createClient: (data: ClientFormSchema) => Promise<Client>
    updateClient: (id: string, data: Partial<ClientFormSchema>) => Promise<Client>
    deleteClient: (id: string) => Promise<boolean>
}

// Note: This is a placeholder for the MCP integration
// In production, this would call the actual MCP functions
// For now, we'll use mock data that matches the real Supabase structure

export const supabaseClient: MCPSupabaseClient = {
    async executeSQL(query: string) {
        // This would call the actual MCP function
        // For now, return mock data
        console.log('Would execute SQL:', query)
        return []
    },

    async getClients(params) {
        // Mock data matching the real Supabase clients table
        const mockClients = [
            {
                id: "8fc7c55c-d486-48b1-b96a-139e81e41d85",
                name: "John Smith",
                email: "john.smith@techcorp.com",
                phone: "+1-555-0101",
                company: "TechCorp Solutions",
                address: "123 Main Street, Suite 100",
                city: "New York",
                state: "NY",
                country: "United States",
                postal_code: "10001",
                image_url: "assets/img/profiles/avatar-01.jpg",
                status: "active" as const,
                created_at: "2025-06-17T17:20:45.303056Z",
                updated_at: "2025-06-17T17:20:45.303056Z"
            },
            {
                id: "f5f50fe3-6c4a-43b6-bbce-3083901334aa",
                name: "Sarah Johnson",
                email: "sarah.johnson@innovate.com",
                phone: "+1-555-0102",
                company: "Innovate Industries",
                address: "456 Oak Avenue",
                city: "Los Angeles",
                state: "CA",
                country: "United States",
                postal_code: "90210",
                image_url: "assets/img/profiles/avatar-02.jpg",
                status: "active",
                created_at: "2025-06-17T17:20:45.303056Z",
                updated_at: "2025-06-17T17:20:45.303056Z"
            },
            {
                id: "6fc0d000-d931-4555-86d9-65db27f698af",
                name: "Michael Brown",
                email: "michael.brown@globaltech.com",
                phone: "+1-555-0103",
                company: "Global Tech Ltd",
                address: "789 Pine Road",
                city: "Chicago",
                state: "IL",
                country: "United States",
                postal_code: "60601",
                image_url: "assets/img/profiles/avatar-03.jpg",
                status: "active",
                created_at: "2025-06-17T17:20:45.303056Z",
                updated_at: "2025-06-17T17:20:45.303056Z"
            },
            {
                id: "9423d67d-3ea5-4a5f-b65a-da4f3c0d6217",
                name: "Emily Davis",
                email: "emily.davis@creativestudio.com",
                phone: "+1-555-0104",
                company: "Creative Studio Inc",
                address: "321 Elm Street",
                city: "Miami",
                state: "FL",
                country: "United States",
                postal_code: "33101",
                image_url: "assets/img/profiles/avatar-04.jpg",
                status: "active",
                created_at: "2025-06-17T17:20:45.303056Z",
                updated_at: "2025-06-17T17:20:45.303056Z"
            },
            {
                id: "8551ac0e-4693-4ccf-a594-5a9bb1566acb",
                name: "David Wilson",
                email: "david.wilson@futuretech.com",
                phone: "+1-555-0105",
                company: "Future Tech Corp",
                address: "654 Maple Avenue",
                city: "Seattle",
                state: "WA",
                country: "United States",
                postal_code: "98101",
                image_url: "assets/img/profiles/avatar-05.jpg",
                status: "active",
                created_at: "2025-06-17T17:20:45.303056Z",
                updated_at: "2025-06-17T17:20:45.303056Z"
            },
            {
                id: "168b5f3a-3402-49b1-b64f-b5b1880cd470",
                name: "Lisa Garcia",
                email: "lisa.garcia@dynamicsolutions.com",
                phone: "+1-555-0106",
                company: "Dynamic Solutions",
                address: "987 Cedar Lane",
                city: "Austin",
                state: "TX",
                country: "United States",
                postal_code: "78701",
                image_url: "assets/img/profiles/avatar-06.jpg",
                status: "active",
                created_at: "2025-06-17T17:20:45.303056Z",
                updated_at: "2025-06-17T17:20:45.303056Z"
            },
            {
                id: "84cba59e-2662-429d-b824-4e78690a00f6",
                name: "Robert Miller",
                email: "robert.miller@nexusgroup.com",
                phone: "+1-555-0107",
                company: "Nexus Group",
                address: "159 Birch Street",
                city: "Boston",
                state: "MA",
                country: "United States",
                postal_code: "02101",
                image_url: "assets/img/profiles/avatar-07.jpg",
                status: "active",
                created_at: "2025-06-17T17:20:45.303056Z",
                updated_at: "2025-06-17T17:20:45.303056Z"
            },
            {
                id: "a8e2463c-fd59-4b63-915b-f08081b5aec3",
                name: "Jennifer Lee",
                email: "jennifer.lee@zenithcorp.com",
                phone: "+1-555-0108",
                company: "Zenith Corporation",
                address: "753 Willow Drive",
                city: "Denver",
                state: "CO",
                country: "United States",
                postal_code: "80201",
                image_url: "assets/img/profiles/avatar-08.jpg",
                status: "inactive",
                created_at: "2025-06-17T17:20:45.303056Z",
                updated_at: "2025-06-17T17:20:45.303056Z"
            },
            {
                id: "0a74bf60-3a8f-4898-9513-c90f1229afef",
                name: "James Taylor",
                email: "james.taylor@alphaenterprises.com",
                phone: "+1-555-0109",
                company: "Alpha Enterprises",
                address: "852 Spruce Road",
                city: "Phoenix",
                state: "AZ",
                country: "United States",
                postal_code: "85001",
                image_url: "assets/img/profiles/avatar-09.jpg",
                status: "active",
                created_at: "2025-06-17T17:20:45.303056Z",
                updated_at: "2025-06-17T17:20:45.303056Z"
            },
            {
                id: "4868a6b7-4806-431f-a4a6-038b636eb03a",
                name: "Amanda White",
                email: "amanda.white@betasystems.com",
                phone: "+1-555-0110",
                company: "Beta Systems",
                address: "741 Aspen Circle",
                city: "Portland",
                state: "OR",
                country: "United States",
                postal_code: "97201",
                image_url: "assets/img/profiles/avatar-10.jpg",
                status: "active",
                created_at: "2025-06-17T17:20:45.303056Z",
                updated_at: "2025-06-17T17:20:45.303056Z"
            }
        ]

        const {
            pageIndex = 1,
            pageSize = 10,
            sortKey = 'name',
            order = 'asc',
            query = ''
        } = params

        // Apply search filter
        let filteredClients = mockClients
        if (query) {
            filteredClients = mockClients.filter(client =>
                client.name.toLowerCase().includes(query.toLowerCase()) ||
                client.email.toLowerCase().includes(query.toLowerCase()) ||
                client.company?.toLowerCase().includes(query.toLowerCase()) ||
                client.phone?.includes(query)
            )
        }

        // Apply sorting
        const validSortKeys = ['name', 'email', 'company', 'created_at', 'status']
        if (sortKey && validSortKeys.includes(sortKey)) {
            filteredClients.sort((a, b) => {
                const aVal = (a as Record<string, unknown>)[sortKey]
                const bVal = (b as Record<string, unknown>)[sortKey]

                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    if (order === 'desc') {
                        return bVal.localeCompare(aVal)
                    } else {
                        return aVal.localeCompare(bVal)
                    }
                }
                return 0
            })
        }

        // Apply pagination
        const startIndex = (pageIndex - 1) * pageSize
        const paginatedClients = filteredClients.slice(startIndex, startIndex + pageSize)

        return {
            list: paginatedClients,
            total: filteredClients.length
        }
    },

    async getClient(id: string) {
        // Mock client lookup
        const mockClient = {
            id,
            name: "John Smith",
            email: "john.smith@techcorp.com",
            phone: "+1-555-0101",
            company: "TechCorp Solutions",
            address: "123 Main Street, Suite 100",
            city: "New York",
            state: "NY",
            country: "United States",
            postal_code: "10001",
            image_url: "assets/img/profiles/avatar-01.jpg",
            status: "active",
            created_at: "2025-06-17T17:20:45.303056Z",
            updated_at: "2025-06-17T17:20:45.303056Z"
        }
        return mockClient
    },

    async createClient(data: ClientFormSchema) {
        // Mock client creation
        const newClient: Client = {
            id: crypto.randomUUID(),
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            address: data.address,
            city: data.city,
            state: data.state,
            country: data.country,
            postal_code: data.postal_code,
            image_url: data.image_url || "assets/img/profiles/avatar-01.jpg",
            status: data.status || "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
        return newClient
    },

    async updateClient(id: string, data: Partial<ClientFormSchema>) {
        // Mock client update
        const updatedClient: Client = {
            id,
            name: data.name || "Unknown",
            email: data.email || "unknown@example.com",
            phone: data.phone,
            company: data.company,
            address: data.address,
            city: data.city,
            state: data.state,
            country: data.country,
            postal_code: data.postal_code,
            image_url: data.image_url || "assets/img/profiles/avatar-01.jpg",
            status: data.status || "active",
            created_at: "2025-06-17T17:20:45.303056Z", // Would come from DB
            updated_at: new Date().toISOString()
        }
        return updatedClient
    },

    async deleteClient(id: string) {
        // Mock client deletion
        console.log('Would delete client:', id)
        return true
    }
}
