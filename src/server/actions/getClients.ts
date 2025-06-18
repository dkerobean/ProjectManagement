// Mock server action for clients until we integrate Supabase MCP
import type { Client } from '@/app/(protected-pages)/concepts/clients/types'

// Mock client data
const mockClients: Client[] = [
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
        status: "active",
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
    }
]

const getClients = async (_queryParams: {
    [key: string]: string | string[] | undefined
}) => {
    const queryParams = _queryParams

    const {
        pageIndex = '1',
        pageSize = '10',
        sortKey = '',
        order,
        query,
    } = queryParams

    let data = structuredClone(mockClients)
    let total = mockClients.length

    // Apply search filter
    if (query) {
        data = data.filter(client =>
            client.name.toLowerCase().includes((query as string).toLowerCase()) ||
            client.email.toLowerCase().includes((query as string).toLowerCase()) ||
            client.company?.toLowerCase().includes((query as string).toLowerCase()) ||
            client.phone?.includes(query as string)
        )
        total = data.length
    }

    // Apply sorting
    if (sortKey && typeof sortKey === 'string') {
        data.sort((a, b) => {
            const aVal = (a as Record<string, unknown>)[sortKey]
            const bVal = (b as Record<string, unknown>)[sortKey]

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                const aStr = aVal.toUpperCase()
                const bStr = bVal.toUpperCase()

                if (order === 'desc') {
                    return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
                } else {
                    return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
                }
            }

            return 0
        })
    }

    // Apply pagination
    const startIndex = (parseInt(pageIndex as string) - 1) * parseInt(pageSize as string)
    const endIndex = startIndex + parseInt(pageSize as string)
    data = data.slice(startIndex, endIndex)

    return {
        list: data,
        total: total,
    }
}

export default getClients
