import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

        // Use Supabase client to fetch data directly from the database
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gafpwitcdoiviixlxnuz.supabase.co'
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjQxNTksImV4cCI6MjA2NTA0MDE1OX0.RNdmc2PkTYA6oQ-4HRPoRp-z-iinT8v5d6pWx9YRPhk'
        
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Fetch the client from the database
        const { data: client, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Supabase error:', error)
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { success: false, error: 'Client not found' },
                    { status: 404 }
                )
            }
            throw error
        }

        if (!client) {
            return NextResponse.json(
                { success: false, error: 'Client not found' },
                { status: 404 }
            )
        }

        // Apply default image if none provided
        const clientWithImage = {
            ...client,
            image_url: client.image_url || getDefaultClientImage(client.name)
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

        // Use Supabase client to update data in the database
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gafpwitcdoiviixlxnuz.supabase.co'
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjQxNTksImV4cCI6MjA2NTA0MDE1OX0.RNdmc2PkTYA6oQ-4HRPoRp-z-iinT8v5d6pWx9YRPhk'
        
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Update the client in the database
        const { data: updatedClient, error } = await supabase
            .from('clients')
            .update({
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
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            throw error
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

        // Use Supabase client to delete data from the database
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gafpwitcdoiviixlxnuz.supabase.co'
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjQxNTksImV4cCI6MjA2NTA0MDE1OX0.RNdmc2PkTYA6oQ-4HRPoRp-z-iinT8v5d6pWx9YRPhk'
        
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Delete the client from the database
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Supabase error:', error)
            throw error
        }

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
