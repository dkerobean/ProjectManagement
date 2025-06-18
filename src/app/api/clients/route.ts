import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const pageIndex = parseInt(searchParams.get('pageIndex') || '1')
        const pageSize = parseInt(searchParams.get('pageSize') || '10')
        const sortKey = searchParams.get('sortKey') || 'name'
        const order = searchParams.get('order') || 'asc'
        const query = searchParams.get('query') || ''

        // For now, return mock data based on existing clients table data
        // TODO: Use actual Supabase MCP once it's properly configured
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
        const {
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
            status = 'active'
        } = body

        // Validate required fields
        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and email are required' },
                { status: 400 }
            )
        }

        // TODO: Replace with actual Supabase MCP call
        const newClient = {
            id: crypto.randomUUID(),
            name,
            email,
            phone,
            company,
            address,
            city,
            state,
            country,
            postal_code,
            image_url: image_url || 'assets/img/profiles/avatar-01.jpg',
            status,
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
