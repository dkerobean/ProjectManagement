import { NextResponse, NextRequest } from 'next/server'

// Helper function to get default image for clients
const getDefaultClientImage = (name: string) => {
    // Use a consistent default avatar based on the client's name
    const avatarIndex = ((name.charCodeAt(0) + name.length) % 10) + 1
    return `assets/img/profiles/avatar-${avatarIndex.toString().padStart(2, '0')}.jpg`
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // TODO: Replace with actual Supabase MCP call
        // For now, return mock data based on ID
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
            image_url: "", // Test default image
            status: "active",
            created_at: "2025-06-17T17:20:45.303056Z",
            updated_at: "2025-06-17T17:20:45.303056Z"
        }

        // Apply default image if none provided
        const clientWithImage = {
            ...mockClient,
            image_url: mockClient.image_url || getDefaultClientImage(mockClient.name)
        }

        return NextResponse.json({
            success: true,
            data: clientWithImage
        })

    } catch (error) {
        console.error('Error fetching client:', error)
        return NextResponse.json(
            { error: 'Failed to fetch client' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
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
            status
        } = body

        // Validate required fields
        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and email are required' },
                { status: 400 }
            )
        }

        // TODO: Replace with actual Supabase MCP call
        const updatedClient = {
            id,
            name,
            email,
            phone,
            company,
            address,
            city,
            state,
            country,
            postal_code,
            image_url: image_url || getDefaultClientImage(name),
            status,
            updated_at: new Date().toISOString()
        }

        return NextResponse.json({
            success: true,
            data: updatedClient
        })

    } catch (error) {
        console.error('Error updating client:', error)
        return NextResponse.json(
            { error: 'Failed to update client' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // TODO: Replace with actual Supabase MCP call
        // For now, just return success

        return NextResponse.json({
            success: true,
            message: 'Client deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting client:', error)
        return NextResponse.json(
            { error: 'Failed to delete client' },
            { status: 500 }
        )
    }
}
