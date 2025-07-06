import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for creating activities
const createActivitySchema = z.object({
    type: z.string(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    entity_type: z.string().optional(),
    entity_id: z.string().optional(),
    metadata: z.record(z.any()).optional()
})

// GET /api/activities - Get activities with optional filtering
export async function GET(request: NextRequest) {
    try {
        console.log('🔍 GET /api/activities - Starting request')

        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.log('❌ No session or user ID found')
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const entity_type = searchParams.get('entity_type')
        const entity_id = searchParams.get('entity_id')
        const user_id = searchParams.get('user_id')
        const activity_type = searchParams.get('activity_type')
        const start_date = searchParams.get('start_date')
        const end_date = searchParams.get('end_date')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = (page - 1) * limit

        const supabase = await createSupabaseServerClient()

        // Build the query
        let query = supabase
            .from('activities')
            .select(`
                *,
                user:users!activities_user_id_fkey(id, name, email, avatar_url)
            `)
            .order('created_at', { ascending: false })

        // Apply filters
        if (entity_type && entity_id) {
            query = query.eq('entity_type', entity_type).eq('entity_id', entity_id)
        } else if (entity_type) {
            query = query.eq('entity_type', entity_type)
        }

        if (user_id) {
            query = query.eq('user_id', user_id)
        }

        if (activity_type) {
            query = query.eq('type', activity_type)
        }

        if (start_date) {
            query = query.gte('created_at', start_date)
        }

        if (end_date) {
            query = query.lte('created_at', end_date)
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1)

        const { data: activities, error } = await query

        if (error) {
            console.error('❌ Database error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch activities' },
                { status: 500 }
            )
        }

        // Get total count for pagination
        let countQuery = supabase
            .from('activities')
            .select('*', { count: 'exact', head: true })

        // Apply same filters for count
        if (entity_type && entity_id) {
            countQuery = countQuery.eq('entity_type', entity_type).eq('entity_id', entity_id)
        } else if (entity_type) {
            countQuery = countQuery.eq('entity_type', entity_type)
        }

        if (user_id) {
            countQuery = countQuery.eq('user_id', user_id)
        }

        if (activity_type) {
            countQuery = countQuery.eq('type', activity_type)
        }

        if (start_date) {
            countQuery = countQuery.gte('created_at', start_date)
        }

        if (end_date) {
            countQuery = countQuery.lte('created_at', end_date)
        }

        const { count, error: countError } = await countQuery

        if (countError) {
            console.error('❌ Count error:', countError)
            return NextResponse.json(
                { error: 'Failed to get activities count' },
                { status: 500 }
            )
        }

        console.log('✅ Successfully fetched activities')

        return NextResponse.json({
            data: activities || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/activities - Create a new activity
export async function POST(request: NextRequest) {
    try {
        console.log('🔍 POST /api/activities - Starting request')

        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.log('❌ No session or user ID found')
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const body = await request.json()
        console.log('📝 Request body:', body)

        // Validate the request body
        const validationResult = createActivitySchema.safeParse(body)
        if (!validationResult.success) {
            console.log('❌ Validation failed:', validationResult.error.errors)
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.errors
                },
                { status: 400 }
            )
        }

        const activityData = validationResult.data
        // Use service role client to bypass RLS for system activities
        const { createSupabaseServiceClient } = await import('@/lib/supabase/server')
        const supabase = createSupabaseServiceClient()

        // Create the activity
        const { data: activity, error } = await supabase
            .from('activities')
            .insert({
                user_id: session.user.id,
                type: activityData.type,
                title: activityData.title,
                description: activityData.description,
                entity_type: activityData.entity_type,
                entity_id: activityData.entity_id,
                metadata: activityData.metadata || {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select(`
                *,
                user:users!activities_user_id_fkey(id, name, email, avatar_url)
            `)
            .single()

        if (error) {
            console.error('❌ Database error:', error)
            return NextResponse.json(
                { error: 'Failed to create activity' },
                { status: 500 }
            )
        }

        console.log('✅ Successfully created activity')

        return NextResponse.json({
            data: activity,
            message: 'Activity created successfully'
        })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}