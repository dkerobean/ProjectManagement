import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper function to get default image for clients
const getDefaultClientImage = () => {
    // Use a consistent generic image for all clients
    return '/img/avatars/thumb-1.jpg'
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const pageIndex = searchParams.get('pageIndex') || '1'
        const pageSize = searchParams.get('pageSize') || '10'
        const sortKey = searchParams.get('sortKey') || 'name'
        const order = searchParams.get('order') || 'asc'
        const query = searchParams.get('query')

        // Use Supabase client to fetch data directly from the database
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gafpwitcdoiviixlxnuz.supabase.co'
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjQxNTksImV4cCI6MjA2NTA0MDE1OX0.RNdmc2PkTYA6oQ-4HRPoRp-z-iinT8v5d6pWx9YRPhk'

        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Build Supabase query
        let supabaseQuery = supabase.from('clients').select('*', { count: 'exact' })

        // Apply search filter
        if (query && typeof query === 'string') {
            supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%,phone.like.%${query}%`)
        }

        // Apply sorting
        if (sortKey && typeof sortKey === 'string') {
            supabaseQuery = supabaseQuery.order(sortKey, { ascending: order !== 'desc' })
        } else {
            supabaseQuery = supabaseQuery.order('created_at', { ascending: false })
        }

        // Apply pagination
        const limit = parseInt(pageSize as string)
        const offset = (parseInt(pageIndex as string) - 1) * limit
        supabaseQuery = supabaseQuery.range(offset, offset + limit - 1)

        const { data: clients, count, error } = await supabaseQuery

        if (error) {
            console.error('Supabase error:', error)
            throw error
        }

        // Process clients and apply default images
        const processedClients = (clients || []).map(client => ({
            ...client,
            image_url: client.image_url || getDefaultClientImage()
        }))

        return NextResponse.json({
            success: true,
            data: {
                list: processedClients,
                total: count || 0
            }
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
        console.log('POST /api/clients - Request received')
        const body = await request.json()
        console.log('POST /api/clients - Request body:', body)

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
            console.log('POST /api/clients - Validation failed: missing name or email')
            return NextResponse.json(
                { error: 'Name and email are required' },
                { status: 400 }
            )
        }

        // Use Supabase client to create data in the database
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gafpwitcdoiviixlxnuz.supabase.co'
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjQxNTksImV4cCI6MjA2NTA0MDE1OX0.RNdmc2PkTYA6oQ-4HRPoRp-z-iinT8v5d6pWx9YRPhk'

        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        console.log('POST /api/clients - Supabase client created')

        // Create the client in the database
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
                status
            })
            .select()
            .single()

        if (error) {
            console.error('POST /api/clients - Supabase error:', error)
            return NextResponse.json(
                { error: 'Failed to create client', details: error.message },
                { status: 500 }
            )
        }

        console.log('POST /api/clients - Client created successfully:', newClient)

        return NextResponse.json({
            success: true,
            data: newClient
        })

    } catch (error) {
        console.error('POST /api/clients - Error creating client:', error)
        return NextResponse.json(
            { error: 'Failed to create client', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
