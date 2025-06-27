import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Helper function to get default image for clients
const getDefaultClientImage = () => {
    // Use default image from Supabase storage
    return 'https://gafpwitcdoiviixlxnuz.supabase.co/storage/v1/object/public/client-images/default-client-avatar.png'
}

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 GET /api/clients - Starting request')

        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.log('❌ No session or user ID found')
            return NextResponse.json(
                { success: false, error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const pageIndex = searchParams.get('pageIndex') || '1'
        const pageSize = searchParams.get('pageSize') || '10'
        const sortKey = searchParams.get('sortKey') || 'name'
        const order = searchParams.get('order') || 'asc'
        const query = searchParams.get('query')

        const supabase = await createSupabaseServerClient()

        // Get user-owned clients
        const { data: ownedClients } = await supabase
            .from('clients')
            .select('*')
            .eq('created_by', session.user.id)

        // Get legacy clients (null created_by)
        const { data: legacyClients } = await supabase
            .from('clients')
            .select('*')
            .is('created_by', null)

        // Combine results
        let allClients = [...(ownedClients || []), ...(legacyClients || [])]

        // Apply search filter
        if (query && typeof query === 'string') {
            const searchLower = query.toLowerCase()
            allClients = allClients.filter(client => 
                client.name?.toLowerCase().includes(searchLower) ||
                client.email?.toLowerCase().includes(searchLower) ||
                client.company?.toLowerCase().includes(searchLower) ||
                client.phone?.includes(query)
            )
        }

        // Apply sorting
        allClients.sort((a, b) => {
            const aValue = a[sortKey] || ''
            const bValue = b[sortKey] || ''
            
            if (order === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
            }
        })

        // Apply pagination
        const totalCount = allClients.length
        const limit = parseInt(pageSize as string)
        const offset = (parseInt(pageIndex as string) - 1) * limit
        const paginatedClients = allClients.slice(offset, offset + limit)

        // Process clients and apply default images
        const processedClients = paginatedClients.map(client => ({
            ...client,
            image_url: client.image_url || getDefaultClientImage()
        }))

        console.log(`✅ Successfully fetched ${processedClients.length} clients`)

        return NextResponse.json({
            success: true,
            data: {
                list: processedClients,
                total: totalCount
            },
            message: 'Clients fetched successfully'
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
        console.log('🔍 POST /api/clients - Starting request')

        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.log('❌ No session or user ID found')
            return NextResponse.json(
                { success: false, error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const body = await request.json()
        console.log('📝 Request body:', body)

        const {
            name,
            email,
            phone,
            company,
            address,
            country,
            image_url,
            status = 'active'
        } = body

        // Validate required fields
        if (!name || !email) {
            console.log('❌ Validation failed: missing name or email')
            return NextResponse.json(
                { success: false, error: 'Name and email are required' },
                { status: 400 }
            )
        }

        const supabase = await createSupabaseServerClient()
        console.log('✅ Supabase client created')

        // Create the client in the database with user linking
        const { data: newClient, error } = await supabase
            .from('clients')
            .insert({
                name,
                email,
                phone,
                company,
                address,
                country,
                image_url: image_url || getDefaultClientImage(),
                status,
                created_by: session.user.id, // Link to current user
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error('❌ Supabase error:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to create client', details: error.message },
                { status: 500 }
            )
        }

        console.log('✅ Client created successfully:', newClient.id)

        return NextResponse.json({
            success: true,
            data: newClient,
            message: 'Client created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('POST /api/clients - Error creating client:', error)
        return NextResponse.json(
            { error: 'Failed to create client', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
