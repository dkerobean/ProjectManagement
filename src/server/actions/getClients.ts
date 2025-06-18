// Server action for clients using Supabase MCP integration
import type { Client } from '@/app/(protected-pages)/concepts/clients/types'

// Helper function to get default image for clients
const getDefaultClientImage = (name: string) => {
    // Use a consistent default avatar based on the client's name
    const avatarIndex = ((name.charCodeAt(0) + name.length) % 10) + 1
    return `assets/img/profiles/avatar-${avatarIndex.toString().padStart(2, '0')}.jpg`
}

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

    try {
        // For now, let's simulate the database response with the known data structure
        // TODO: Replace with actual Supabase MCP call
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
                image_url: undefined, // Test default image
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
                image_url: undefined, // Test default image
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
                image_url: undefined, // Test default image
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
                image_url: undefined, // Test default image
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
                image_url: undefined, // Test default image
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

        // Process clients and apply default images
        const processedClients = mockClients.map(client => ({
            ...client,
            image_url: client.image_url || getDefaultClientImage(client.name)
        }))

        let data = structuredClone(processedClients)
        let total = processedClients.length

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
        const startIndex = (parseInt(pageIndex as string) - 1) * parseInt(pageSize as string)
        const endIndex = startIndex + parseInt(pageSize as string)
        data = data.slice(startIndex, endIndex)

        return {
            list: data,
            total: total,
        }

    } catch (error) {
        console.error('Error fetching clients:', error)
        // Return empty result on error
        return {
            list: [],
            total: 0,
        }
    }
}

export default getClients

    try {
        // Build SQL query for clients
        let sqlQuery = `
            SELECT 
                id::text,
                name,
                email,
                phone,
                company,
                address,
                city,
                state,
                country,
                postal_code,
                image_url,
                status,
                created_at,
                updated_at
            FROM public.clients
            WHERE 1=1
        `

        // Add search filter if query is provided
        if (query && typeof query === 'string') {
            const searchTerm = query.replace(/'/g, "''") // Escape single quotes
            sqlQuery += ` AND (
                name ILIKE '%${searchTerm}%' OR 
                email ILIKE '%${searchTerm}%' OR 
                company ILIKE '%${searchTerm}%' OR
                phone ILIKE '%${searchTerm}%'
            )`
        }

        // Add sorting
        const validSortKeys = ['name', 'email', 'company', 'created_at', 'status']
        const safeSortKey = validSortKeys.includes(sortKey as string) ? sortKey : 'name'
        const safeOrder = order === 'desc' ? 'DESC' : 'ASC'
        sqlQuery += ` ORDER BY ${safeSortKey} ${safeOrder}`

        // Add pagination
        const offset = (parseInt(pageIndex as string) - 1) * parseInt(pageSize as string)
        sqlQuery += ` LIMIT ${pageSize} OFFSET ${offset}`

        // Execute the query using MCP tools - this will be replaced with actual MCP call
        // For now, let's simulate the database response with the known data structure
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
                image_url: null, // Test default image
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
                image_url: null, // Test default image
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
                image_url: null, // Test default image
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
                image_url: null, // Test default image
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
                image_url: null, // Test default image
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

        // Process clients and apply default images
        const processedClients = mockClients.map(client => ({
            ...client,
            image_url: client.image_url || getDefaultClientImage(client.name)
        }))

        let data = structuredClone(processedClients)
        let total = processedClients.length

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
        const startIndex = (parseInt(pageIndex as string) - 1) * parseInt(pageSize as string)
        const endIndex = startIndex + parseInt(pageSize as string)
        data = data.slice(startIndex, endIndex)

        return {
            list: data,
            total: total,
        }

    } catch (error) {
        console.error('Error fetching clients:', error)
        // Return empty result on error
        return {
            list: [],
            total: 0,
        }
    }
}

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

    } catch (error) {
        console.error('Error fetching clients:', error)
        // Return empty result on error
        return {
            list: [],
            total: 0,
        }
    }
}

export default getClients
