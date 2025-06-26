import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for task updates
const updateTaskSchema = z.object({
    title: z.string().min(1, 'Task title is required').max(255, 'Task title too long').optional(),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    start_date: z.string().optional(),
    due_date: z.string().optional(),
    estimated_hours: z.number().min(0).optional(),
    actual_hours: z.number().min(0).optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
    position: z.number().optional()
})

// GET /api/tasks/[id] - Get a specific task by ID
export async function GET(
    _: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = (await params).id
        console.log('🔍 GET /api/tasks/[id] - Starting request for task:', id)

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

        // Fetch the task with related data
        const { data: task, error } = await supabase
            .from('tasks')
            .select(`
                *,
                created_by_user:users!tasks_created_by_fkey(id, name, email, avatar_url),
                assigned_to_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                project:projects!inner(id, name, color, owner_id)
            `)
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                console.log('❌ Task not found:', id)
                return NextResponse.json(
                    { error: 'Task not found' },
                    { status: 404 }
                )
            }
            console.error('❌ Database error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch task' },
                { status: 500 }
            )
        }

        // Check if user has access to this task's project
        const { data: projectMembers } = await supabase
            .from('project_members')
            .select('user_id, role')
            .eq('project_id', task.project.id)
            .eq('user_id', session.user.id)

        const hasAccess = task.project.owner_id === session.user.id || projectMembers && projectMembers.length > 0

        if (!hasAccess) {
            console.log('❌ User does not have access to task:', id)
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }

        console.log('✅ Successfully fetched task:', id)

        return NextResponse.json({
            success: true,
            data: task,
            message: 'Task fetched successfully'
        })

    } catch (error) {
        console.error('❌ Error in GET /api/tasks/[id]:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

// PATCH /api/tasks/[id] - Update a specific task
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = (await params).id
        console.log('🔍 PATCH /api/tasks/[id] - Starting request for task:', id)

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
        const validatedData = updateTaskSchema.parse(body)

        const supabase = await createSupabaseServerClient()

        // First, verify the task exists and user has access
        const { data: existingTask, error: fetchError } = await supabase
            .from('tasks')
            .select('id, project_id')
            .eq('id', id)
            .single()

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Task not found' },
                    { status: 404 }
                )
            }
            console.error('❌ Database error:', fetchError)
            return NextResponse.json(
                { error: 'Failed to fetch task' },
                { status: 500 }
            )
        }

        // Get project and check access
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id, owner_id')
            .eq('id', existingTask.project_id)
            .single()

        if (projectError || !project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        // Check if user has access to this task's project
        const { data: projectMembers } = await supabase
            .from('project_members')
            .select('user_id, role')
            .eq('project_id', project.id)
            .eq('user_id', session.user.id)

        const hasAccess = project.owner_id === session.user.id || projectMembers && projectMembers.length > 0

        if (!hasAccess) {
            console.log('❌ User does not have access to task:', id)
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }

        // Prepare update data
        const updates: Record<string, unknown> = {
            ...validatedData,
            updated_at: new Date().toISOString()
        }

        // Handle date fields
        if (validatedData.start_date) {
            updates.start_date = new Date(validatedData.start_date).toISOString().split('T')[0]
        }
        if (validatedData.due_date) {
            updates.due_date = new Date(validatedData.due_date).toISOString().split('T')[0]
        }

        // Handle completed_at when status changes to done
        if (validatedData.status === 'done') {
            updates.completed_at = new Date().toISOString()
        } else if (validatedData.status && validatedData.status !== 'done') {
            updates.completed_at = null
        }

        // Update the task
        const { data: updatedTask, error: updateError } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                created_by_user:users!tasks_created_by_fkey(id, name, email, avatar_url),
                assigned_to_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                project:projects(id, name, color)
            `)
            .single()

        if (updateError) {
            console.error('❌ Database error:', updateError)
            return NextResponse.json(
                { error: 'Failed to update task' },
                { status: 500 }
            )
        }

        console.log('✅ Successfully updated task:', id)

        return NextResponse.json({
            success: true,
            data: updatedTask,
            message: 'Task updated successfully'
        })

    } catch (error) {
        console.error('❌ Error in PATCH /api/tasks/[id]:', error)

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

// DELETE /api/tasks/[id] - Delete a specific task
export async function DELETE(
    _: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = (await params).id
        console.log('🔍 DELETE /api/tasks/[id] - Starting request for task:', id)

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

        // First, verify the task exists and user has access
        const { data: existingTask, error: fetchError } = await supabase
            .from('tasks')
            .select('id, project_id, created_by')
            .eq('id', id)
            .single()

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Task not found' },
                    { status: 404 }
                )
            }
            console.error('❌ Database error:', fetchError)
            return NextResponse.json(
                { error: 'Failed to fetch task' },
                { status: 500 }
            )
        }

        // Get project and check permissions
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id, owner_id')
            .eq('id', existingTask.project_id)
            .single()

        if (projectError || !project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        // Check if user has permission to delete (project owner/admin or task creator)
        const { data: projectMembers } = await supabase
            .from('project_members')
            .select('user_id, role')
            .eq('project_id', project.id)
            .eq('user_id', session.user.id)

        const isProjectOwner = project.owner_id === session.user.id
        const isTaskCreator = existingTask.created_by === session.user.id
        const isProjectAdmin = projectMembers?.some(member => ['owner', 'admin'].includes(member.role)) || false

        const hasDeletePermission = isProjectOwner || isTaskCreator || isProjectAdmin

        if (!hasDeletePermission) {
            console.log('❌ User does not have permission to delete task:', id)
            return NextResponse.json(
                { error: 'Access denied - insufficient permissions' },
                { status: 403 }
            )
        }

        // Delete the task (this will cascade delete related records due to foreign key constraints)
        const { error: deleteError } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)

        if (deleteError) {
            console.error('❌ Error deleting task:', deleteError)
            return NextResponse.json(
                { error: 'Failed to delete task' },
                { status: 500 }
            )
        }

        console.log('✅ Successfully deleted task:', id)

        return NextResponse.json({
            success: true,
            message: 'Task deleted successfully'
        })

    } catch (error) {
        console.error('❌ Error in DELETE /api/tasks/[id]:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
