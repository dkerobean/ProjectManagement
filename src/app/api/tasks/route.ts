import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for task creation
const createTaskSchema = z.object({
    title: z.string().min(1, 'Task title is required').max(255, 'Task title too long'),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']).default('todo'),
    priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
    project_id: z.string().uuid('Valid project ID is required'),
    assigned_to: z.string().uuid().nullable().optional(),
    start_date: z.string().optional(),
    due_date: z.string().optional(),
    estimated_hours: z.number().min(0).optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
    position: z.number().optional()
})

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
        const { data: ownedProjects } = await supabase
            .from('projects')
            .select('id, name, owner_id')
            .eq('owner_id', session.user.id)

        const { data: memberProjects } = await supabase
            .from('project_members')
            .select(`
                project_id,
                projects!inner(id, name, owner_id)
            `)
            .eq('user_id', session.user.id)

        // Combine both lists
        const accessibleProjects = [
            ...(ownedProjects || []),
            ...(memberProjects?.map(mp => mp.projects).filter(Boolean) || [])
        ]

        const projectsError = null

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

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
    try {
        console.log('🔍 POST /api/tasks - Starting task creation request')

        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.log('❌ No session or user ID found')
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        // Parse and validate request body
        const body = await request.json()
        const validatedData = createTaskSchema.parse(body)

        const supabase = await createSupabaseServerClient()

        // Check if the project exists and user has access to it
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id, name, owner_id')
            .eq('id', validatedData.project_id)
            .single()

        if (!projectError && project) {
            // Check if user is owner
            if (project.owner_id !== session.user.id) {
                // Check if user is a member
                const { data: membership } = await supabase
                    .from('project_members')
                    .select('user_id')
                    .eq('project_id', validatedData.project_id)
                    .eq('user_id', session.user.id)
                    .single()
                
                if (!membership) {
                    return NextResponse.json(
                        { error: 'Project not found or access denied' },
                        { status: 404 }
                    )
                }
            }
        }

        if (projectError) {
            console.error('❌ Error fetching project or no access:', projectError)
            return NextResponse.json(
                { error: 'Project not found or access denied' },
                { status: 404 }
            )
        }

        // Prepare task data
        const taskData: Record<string, unknown> = {
            title: validatedData.title,
            description: validatedData.description,
            status: validatedData.status,
            priority: validatedData.priority,
            project_id: validatedData.project_id,
            created_by: session.user.id,
            assigned_to: validatedData.assigned_to,
            estimated_hours: validatedData.estimated_hours,
            tags: validatedData.tags,
            metadata: validatedData.metadata || {},
            position: validatedData.position || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        // Handle date fields
        if (validatedData.start_date) {
            taskData.start_date = new Date(validatedData.start_date).toISOString().split('T')[0]
        }
        if (validatedData.due_date) {
            taskData.due_date = new Date(validatedData.due_date).toISOString().split('T')[0]
        }

        // Create the task
        const { data: newTask, error: createError } = await supabase
            .from('tasks')
            .insert([taskData])
            .select(`
                *,
                created_by_user:users!tasks_created_by_fkey(id, name, email, avatar_url),
                assigned_to_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                project:projects(id, name, color)
            `)
            .single()

        if (createError) {
            console.error('❌ Error creating task:', createError)
            return NextResponse.json(
                { error: 'Failed to create task' },
                { status: 500 }
            )
        }

        console.log('✅ Successfully created task:', newTask.id)

        return NextResponse.json({
            success: true,
            data: newTask,
            message: 'Task created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('❌ Error in POST /api/tasks:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
