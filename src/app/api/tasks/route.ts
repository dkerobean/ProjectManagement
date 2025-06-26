import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// GET /api/tasks - Get all tasks accessible to the current user
export async function GET(request: NextRequest) {
    try {
        console.log('🔍 GET /api/tasks - Starting request for all user tasks')

        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.log('❌ No session or user ID found')
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const supabase = await createSupabaseServerClient()

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url)
        const projectId = searchParams.get('project_id')
        const status = searchParams.get('status')
        const priority = searchParams.get('priority')
        const assignedTo = searchParams.get('assigned_to')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        // First, get all projects the user has access to
        const { data: accessibleProjects, error: projectsError } = await supabase
            .from('projects')
            .select(`
                id,
                name,
                owner_id,
                project_members!inner(user_id, role)
            `)
            .or(`owner_id.eq.${session.user.id},project_members.user_id.eq.${session.user.id}`)

        if (projectsError) {
            console.error('❌ Error fetching accessible projects:', projectsError)
            return NextResponse.json(
                { error: 'Failed to fetch accessible projects' },
                { status: 500 }
            )
        }

        // Extract project IDs that the user has access to
        const accessibleProjectIds = [
            ...new Set([
                ...accessibleProjects.filter(p => p.owner_id === session.user.id).map(p => p.id),
                ...accessibleProjects.flatMap(p =>
                    p.project_members?.map(pm => pm.user_id === session.user.id ? p.id : null).filter(Boolean) || []
                )
            ])
        ]

        if (accessibleProjectIds.length === 0) {
            console.log('ℹ️ User has no accessible projects')
            return NextResponse.json({
                success: true,
                data: [],
                total: 0,
                message: 'No tasks found - user has no accessible projects'
            })
        }

        // Build the tasks query
        let tasksQuery = supabase
            .from('tasks')
            .select(`
                *,
                created_by_user:users!tasks_created_by_fkey(id, name, email, avatar_url),
                assigned_to_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                project:projects(id, name, color)
            `)
            .in('project_id', accessibleProjectIds)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        // Apply filters
        if (projectId) {
            tasksQuery = tasksQuery.eq('project_id', projectId)
        }
        if (status) {
            tasksQuery = tasksQuery.eq('status', status)
        }
        if (priority) {
            tasksQuery = tasksQuery.eq('priority', priority)
        }
        if (assignedTo) {
            tasksQuery = tasksQuery.eq('assigned_to', assignedTo)
        }

        const { data: tasks, error: tasksError } = await tasksQuery

        if (tasksError) {
            console.error('❌ Error fetching tasks:', tasksError)
            return NextResponse.json(
                { error: 'Failed to fetch tasks' },
                { status: 500 }
            )
        }

        // Get total count for pagination
        let countQuery = supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .in('project_id', accessibleProjectIds)

        if (projectId) countQuery = countQuery.eq('project_id', projectId)
        if (status) countQuery = countQuery.eq('status', status)
        if (priority) countQuery = countQuery.eq('priority', priority)
        if (assignedTo) countQuery = countQuery.eq('assigned_to', assignedTo)

        const { count, error: countError } = await countQuery

        if (countError) {
            console.error('❌ Error getting tasks count:', countError)
        }

        console.log(`✅ Successfully fetched ${tasks?.length || 0} tasks`)

        return NextResponse.json({
            success: true,
            data: tasks || [],
            total: count || 0,
            limit,
            offset,
            message: 'Tasks fetched successfully'
        })

    } catch (error) {
        console.error('❌ Error in GET /api/tasks:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
