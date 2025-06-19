import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gafpwitcdoiviixlxnuz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjQxNTksImV4cCI6MjA2NTA0MDE1OX0.RNdmc2PkTYA6oQ-4HRPoRp-z-iinT8v5d6pWx9YRPhk'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For now, we'll simulate user authentication
// In a real app, you'd get this from your auth system
const getCurrentUserId = () => {
    // This is a mock user ID - in reality you'd get this from your auth system
    return 'a8fa04b3-d73c-4048-980a-e94db5ebf70c'
}

export async function GET(request: NextRequest) {
    try {
        const userId = getCurrentUserId()
        
        const { searchParams } = new URL(request.url)
        const entityType = searchParams.get('entity_type')
        const entityId = searchParams.get('entity_id')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = (page - 1) * limit

        let query = supabase
            .from('files')
            .select('*')
            .eq('user_id', userId)
            .order('uploaded_at', { ascending: false })

        // Filter by entity if provided
        if (entityType && entityId) {
            query = query.eq('entity_type', entityType).eq('entity_id', entityId)
        } else if (entityType) {
            query = query.eq('entity_type', entityType)
        } else if (!entityType && !entityId) {
            // Get all files not associated with any entity
            query = query.is('entity_type', null).is('entity_id', null)
        }

        const { data: files, error: filesError } = await query
            .range(offset, offset + limit - 1)

        if (filesError) {
            console.error('Database error:', filesError)
            return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
        }

        // Get total count for pagination
        let countQuery = supabase
            .from('files')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)

        if (entityType && entityId) {
            countQuery = countQuery.eq('entity_type', entityType).eq('entity_id', entityId)
        } else if (entityType) {
            countQuery = countQuery.eq('entity_type', entityType)
        } else if (!entityType && !entityId) {
            countQuery = countQuery.is('entity_type', null).is('entity_id', null)
        }

        const { count, error: countError } = await countQuery

        if (countError) {
            console.error('Count error:', countError)
            return NextResponse.json({ error: 'Failed to get file count' }, { status: 500 })
        }

        // Transform files to match the expected format
        const transformedFiles = (files || []).map((file: any) => ({
            id: file.id,
            name: file.original_name,
            fileType: file.type,
            srcUrl: file.url,
            size: file.size,
            uploadDate: new Date(file.uploaded_at).getTime(),
            recent: new Date(file.uploaded_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000), // Recent if uploaded within 7 days
            author: {
                name: 'Current User',
                email: 'user@example.com',
                img: ''
            },
            activities: [],
            permissions: []
        }))

        return NextResponse.json({
            list: transformedFiles,
            directory: [], // We'll implement directories later if needed
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        })
        
    } catch (error) {
        console.error('List files error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
