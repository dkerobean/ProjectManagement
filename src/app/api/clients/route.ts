import { NextResponse, NextRequest } from 'next/server'

// Helper function to get default image for clients
const getDefaultClientImage = (name: string) => {
    // Use a consistent default avatar based on the client's name
    const avatarIndex = ((name.charCodeAt(0) + name.length) % 10) + 1
    return `assets/img/profiles/avatar-${avatarIndex.toString().padStart(2, '0')}.jpg`
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const pageIndex = parseInt(searchParams.get('pageIndex') || '1')
        const pageSize = parseInt(searchParams.get('pageSize') || '10')
        const sortKey = searchParams.get('sortKey') || 'name'
        const order = searchParams.get('order') || 'asc'
        const query = searchParams.get('query') || ''

        // Enhanced mock data with some clients having no image_url to test defaults
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
                image_url: "", // Test default image
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
                image_url: "", // Test default image
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
                image_url: "", // Test default image
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
                image_url: "", // Test default image
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
                image_url: "", // Test default image
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

        // Process clients and apply default images for those without image_url
        const processedClients = mockClients.map(client => ({
            ...client,
            image_url: client.image_url || getDefaultClientImage(client.name)
        }))

        // Apply search filter
        let filteredClients = processedClients
        if (query) {
            filteredClients = processedClients.filter(client => 
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

        return NextResponse.json({
            list: paginatedClients,
            total: filteredClients.length
        })

    } catch (error) {
        console.error('Error fetching clients:', error)
        return NextResponse.json(
            { error: 'Failed to fetch clients' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        
        // TODO: Replace with actual Supabase MCP call to create client
        const newClient = {
            id: crypto.randomUUID(),
            ...body,
            image_url: body.image_url || getDefaultClientImage(body.name),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        return NextResponse.json({
            success: true,
            data: newClient
        })

    } catch (error) {
        console.error('Error creating client:', error)
        return NextResponse.json(
            { error: 'Failed to create client' },
            { status: 500 }
        )
    }
}
