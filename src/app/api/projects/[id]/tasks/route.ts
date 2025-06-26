import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for task creation
const createTaskSchema = z.object({
    title: z.string().min(1, 'Task title is required').max(255, 'Task title too long'),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    assigned_to: z.string().uuid().optional(),
    start_date: z.string().optional(),
    due_date: z.string().optional(),
    estimated_hours: z.number().min(0).optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional()
})

// GET /api/projects/[id]/tasks - Get all tasks for a specific project
export async function GET(
    _: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = (await params).id
        console.log('🔍 GET /api/projects/[id]/tasks - Starting request for project:', id)

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

        // First, verify that the project exists and user has access to it
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select(`
                id,
                name,
                owner_id,
                project_members(user_id, role)
            `)
            .eq('id', id)
            .single()

        if (projectError || !project) {
            console.log('❌ Project not found:', projectError)
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        // Check if user has access to this project
        const hasAccess = project.owner_id === session.user.id ||
                         project.project_members?.some(member => member.user_id === session.user.id)

        if (!hasAccess) {
            console.log('❌ User does not have access to project:', id)
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }

        // Fetch all tasks for the project with related data
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select(`
                *,
                created_by_user:users!tasks_created_by_fkey(id, name, email, avatar_url),
                assigned_to_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                project:projects(id, name, color)
            `)
            .eq('project_id', id)
            .order('created_at', { ascending: false })

        if (tasksError) {
            console.error('❌ Error fetching tasks:', tasksError)
            return NextResponse.json(
                { error: 'Failed to fetch tasks', details: tasksError.message },
                { status: 500 }
            )
        }

        console.log('✅ Successfully fetched tasks for project:', id, 'Count:', tasks?.length || 0)

        return NextResponse.json({
            success: true,
            data: tasks || [],
            message: `Found ${tasks?.length || 0} tasks for project`
        })

    } catch (error) {
        console.error('❌ Error in GET /api/projects/[id]/tasks:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

// POST /api/projects/[id]/tasks - Create a new task for a specific project
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = (await params).id
        console.log('🔍 POST /api/projects/[id]/tasks - Starting request for project:', id)

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

        // First, verify that the project exists and user has access to it
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select(`
                id,
                name,
                owner_id,
                project_members(user_id, role)
            `)
            .eq('id', id)
            .single()

        if (projectError || !project) {
            console.log('❌ Project not found:', projectError)
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        // Check if user has access to this project
        const hasAccess = project.owner_id === session.user.id ||
                         project.project_members?.some(member => member.user_id === session.user.id)

        if (!hasAccess) {
            console.log('❌ User does not have access to project:', id)
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }

        // Prepare task data
        const taskData = {
            ...validatedData,
            project_id: id,
            created_by: session.user.id,
            status: validatedData.status || 'todo',
            priority: validatedData.priority || 'medium',
            metadata: validatedData.metadata || {}
        }

        // Create the task
        const { data: newTask, error: insertError } = await supabase
            .from('tasks')
            .insert([taskData])
            .select(`
                *,
                created_by_user:users!tasks_created_by_fkey(id, name, email, avatar_url),
                assigned_to_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                project:projects(id, name, color)
            `)
            .single()

        if (insertError) {
            console.error('❌ Error creating task:', insertError)
            return NextResponse.json(
                { error: 'Failed to create task', details: insertError.message },
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
        console.error('❌ Error in POST /api/projects/[id]/tasks:', error)

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
