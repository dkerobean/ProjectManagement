import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Helper function to get default image for clients
const getDefaultClientImage = () => {
    // Use a consistent generic image for all clients
    return '/img/avatars/thumb-1.jpg'
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        console.log('🔍 GET /api/clients/[id] - Starting request for client:', id)

        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.log('❌ No session or user ID found')
            return NextResponse.json(
                { success: false, error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const supabase = await createSupabaseServerClient()

        // Fetch the client from the database with user access control
        // First try to get user-owned client
        let { data: client, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .eq('created_by', session.user.id)
            .single()

        // If not found, try to get legacy client (created_by is null)
        if (error && error.code === 'PGRST116') {
            const { data: legacyClient, error: legacyError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .is('created_by', null)
                .single()
            
            client = legacyClient
            error = legacyError
        }

        if (error) {
            console.error('❌ Supabase error:', error)
            if (error.code === 'PGRST116') {
                console.log('❌ Client not found:', id)
                return NextResponse.json(
                    { success: false, error: 'Client not found' },
                    { status: 404 }
                )
            }
            return NextResponse.json(
                { success: false, error: 'Failed to fetch client' },
                { status: 500 }
            )
        }

        if (!client) {
            console.log('❌ Client not found or no access:', id)
            return NextResponse.json(
                { success: false, error: 'Client not found' },
                { status: 404 }
            )
        }

        // Apply default image if none provided
        const clientWithImage = {
            ...client,
            image_url: client.image_url || getDefaultClientImage()
        }

        console.log('✅ Successfully fetched client:', id)
        return NextResponse.json({
            success: true,
            data: clientWithImage,
            message: 'Client fetched successfully'
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
        console.log('🔍 PUT /api/clients/[id] - Starting request for client:', id)

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
                { success: false, error: 'Name and email are required' },
                { status: 400 }
            )
        }

        const supabase = await createSupabaseServerClient()

        // Update the client in the database with user access control
        const updateData = {
            name,
            email,
            phone,
            company,
            address,
            city,
            state,
            country,
            postal_code,
            image_url: image_url || getDefaultClientImage(),
            status,
            updated_at: new Date().toISOString()
        }

        // First try to update user-owned client
        let { data: updatedClient, error } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', id)
            .eq('created_by', session.user.id)
            .select()
            .single()

        // If not found, try to update legacy client and link to current user
        if (error && error.code === 'PGRST116') {
            const { data: legacyUpdate, error: legacyError } = await supabase
                .from('clients')
                .update({
                    ...updateData,
                    created_by: session.user.id // Link to current user
                })
                .eq('id', id)
                .is('created_by', null)
                .select()
                .single()
            
            updatedClient = legacyUpdate
            error = legacyError
        }

        if (error) {
            console.error('❌ Supabase error:', error)
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { success: false, error: 'Client not found or access denied' },
                    { status: 404 }
                )
            }
            return NextResponse.json(
                { success: false, error: 'Failed to update client' },
                { status: 500 }
            )
        }

        console.log('✅ Successfully updated client:', id)
        return NextResponse.json({
            success: true,
            data: updatedClient,
            message: 'Client updated successfully'
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
        console.log('🔍 DELETE /api/clients/[id] - Starting request for client:', id)

        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.log('❌ No session or user ID found')
            return NextResponse.json(
                { success: false, error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const supabase = await createSupabaseServerClient()

        // Delete the client from the database with user access control
        // First try to delete user-owned client
        let { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id)
            .eq('created_by', session.user.id)

        // If not found, try to delete legacy client
        if (error && error.code === 'PGRST116') {
            const { error: legacyError } = await supabase
                .from('clients')
                .delete()
                .eq('id', id)
                .is('created_by', null)
            
            error = legacyError
        }

        if (error) {
            console.error('❌ Supabase error:', error)
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { success: false, error: 'Client not found or access denied' },
                    { status: 404 }
                )
            }
            return NextResponse.json(
                { success: false, error: 'Failed to delete client' },
                { status: 500 }
            )
        }

        console.log('✅ Successfully deleted client:', id)
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
