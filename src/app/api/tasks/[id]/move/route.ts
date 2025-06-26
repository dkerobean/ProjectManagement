import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for moving a task
const moveTaskSchema = z.object({
    project_id: z.string().uuid('Invalid project ID format')
})

// PATCH /api/tasks/[id]/move - Move a task to a different project
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = (await params).id
        console.log('🔍 PATCH /api/tasks/[id]/move - Starting request for task:', id)

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
        const { project_id: newProjectId } = moveTaskSchema.parse(body)

        const supabase = await createSupabaseServerClient()

        // First, verify the task exists
        const { data: existingTask, error: taskError } = await supabase
            .from('tasks')
            .select('id, project_id, title')
            .eq('id', id)
            .single()

        if (taskError) {
            if (taskError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Task not found' },
                    { status: 404 }
                )
            }
            console.error('❌ Database error:', taskError)
            return NextResponse.json(
                { error: 'Failed to fetch task' },
                { status: 500 }
            )
        }

        // Verify the source project exists and user has access
        const { data: sourceProject, error: sourceProjectError } = await supabase
            .from('projects')
            .select('id, owner_id, name')
            .eq('id', existingTask.project_id)
            .single()

        if (sourceProjectError || !sourceProject) {
            return NextResponse.json(
                { error: 'Source project not found' },
                { status: 404 }
            )
        }

        // Verify the target project exists and user has access
        const { data: targetProject, error: targetProjectError } = await supabase
            .from('projects')
            .select('id, owner_id, name')
            .eq('id', newProjectId)
            .single()

        if (targetProjectError || !targetProject) {
            return NextResponse.json(
                { error: 'Target project not found' },
                { status: 404 }
            )
        }

        // Check if user has access to source project
        const { data: sourceMembers } = await supabase
            .from('project_members')
            .select('user_id, role')
            .eq('project_id', sourceProject.id)
            .eq('user_id', session.user.id)

        const hasSourceAccess = sourceProject.owner_id === session.user.id ||
                               (sourceMembers && sourceMembers.length > 0)

        if (!hasSourceAccess) {
            console.log('❌ User does not have access to source project:', sourceProject.id)
            return NextResponse.json(
                { error: 'Access denied to source project' },
                { status: 403 }
            )
        }

        // Check if user has access to target project
        const { data: targetMembers } = await supabase
            .from('project_members')
            .select('user_id, role')
            .eq('project_id', targetProject.id)
            .eq('user_id', session.user.id)

        const hasTargetAccess = targetProject.owner_id === session.user.id ||
                               (targetMembers && targetMembers.length > 0)

        if (!hasTargetAccess) {
            console.log('❌ User does not have access to target project:', targetProject.id)
            return NextResponse.json(
                { error: 'Access denied to target project' },
                { status: 403 }
            )
        }

        // Move the task to the new project
        const { data: movedTask, error: moveError } = await supabase
            .from('tasks')
            .update({
                project_id: newProjectId,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select(`
                *,
                created_by_user:users!tasks_created_by_fkey(id, name, email, avatar_url),
                assigned_to_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                project:projects(id, name, color)
            `)
            .single()

        if (moveError) {
            console.error('❌ Error moving task:', moveError)
            return NextResponse.json(
                { error: 'Failed to move task' },
                { status: 500 }
            )
        }

        console.log(`✅ Successfully moved task "${existingTask.title}" from "${sourceProject.name}" to "${targetProject.name}"`)

        return NextResponse.json({
            success: true,
            data: movedTask,
            message: `Task moved from "${sourceProject.name}" to "${targetProject.name}" successfully`
        })

    } catch (error) {
        console.error('❌ Error in PATCH /api/tasks/[id]/move:', error)

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
