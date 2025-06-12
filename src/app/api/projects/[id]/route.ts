import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schema for project updates
const updateProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(255, 'Project name too long').optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'archived', 'completed', 'on_hold']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    due_date: z.string().optional(),
    color: z.string().optional(),
    metadata: z.record(z.any()).optional()
})

// GET /api/projects/[id] - Get a specific project by ID
export async function GET(
    _: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = (await params).id
        console.log('🔍 GET /api/projects/[id] - Starting request for project:', id)

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

        // Fetch the project with related data
        const { data: project, error } = await supabase
            .from('projects')
            .select(`
                *,
                owner:users!projects_owner_id_fkey(id, name, email, avatar_url),
                project_members(
                    id,
                    role,
                    permissions,
                    joined_at,
                    user:users!project_members_user_id_fkey(id, name, email, avatar_url)
                ),
                tasks(
                    id,
                    title,
                    description,
                    status,
                    priority,
                    assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url),
                    created_by:users!tasks_created_by_fkey(id, name, email, avatar_url),
                    start_date,
                    due_date,
                    completed_at,
                    estimated_hours,
                    actual_hours,
                    tags,
                    created_at,
                    updated_at
                )
            `)
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                console.log('❌ Project not found:', id)
                return NextResponse.json(
                    { error: 'Project not found' },
                    { status: 404 }
                )
            }
            console.error('❌ Database error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch project' },
                { status: 500 }
            )
        }

        // Check if user has access to this project
        const hasAccess = project.owner_id === session.user.id ||
                         project.project_members?.some(member => member.user.id === session.user.id)

        if (!hasAccess) {
            console.log('❌ User does not have access to project:', id)
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }

        // Calculate project metrics
        const tasksByStatus = project.tasks?.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1
            return acc
        }, {}) || {}

        const projectWithMetrics = {
            ...project,
            taskCount: project.tasks?.length || 0,
            completedTasks: tasksByStatus.done || 0,
            memberCount: project.project_members?.length || 0,
            progress: project.tasks?.length > 0
                ? Math.round(((tasksByStatus.done || 0) / project.tasks.length) * 100)
                : 0,
            tasksByStatus
        }

        console.log('✅ Successfully fetched project:', id)

        return NextResponse.json({
            data: projectWithMetrics
        })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT /api/projects/[id] - Update a specific project
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = (await params).id
        console.log('🔍 PUT /api/projects/[id] - Starting request for project:', id)

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
        const validationResult = updateProjectSchema.safeParse(body)
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

        const updateData = validationResult.data
        const supabase = await createSupabaseServerClient()

        // Check if project exists and user has permission to update
        const { data: existingProject, error: fetchError } = await supabase
            .from('projects')
            .select('id, owner_id, project_members(user_id, role)')
            .eq('id', id)
            .single()

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Project not found' },
                    { status: 404 }
                )
            }
            console.error('❌ Database error:', fetchError)
            return NextResponse.json(
                { error: 'Failed to fetch project' },
                { status: 500 }
            )
        }

        // Check permissions (owner or admin member)
        const hasPermission = existingProject.owner_id === session.user.id ||
                             existingProject.project_members?.some(member =>
                                 member.user_id === session.user.id &&
                                 ['owner', 'admin'].includes(member.role)
                             )

        if (!hasPermission) {
            console.log('❌ User does not have permission to update project:', id)
            return NextResponse.json(
                { error: 'Access denied - insufficient permissions' },
                { status: 403 }
            )
        }

        // Prepare update data
        const updates = {
            ...updateData,
            updated_at: new Date().toISOString()
        }

        // Handle date fields
        if (updateData.start_date) {
            updates.start_date = new Date(updateData.start_date).toISOString().split('T')[0]
        }
        if (updateData.end_date) {
            updates.end_date = new Date(updateData.end_date).toISOString().split('T')[0]
        }
        if (updateData.due_date) {
            updates.due_date = new Date(updateData.due_date).toISOString().split('T')[0]
        }

        // Update the project
        const { data: updatedProject, error: updateError } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                owner:users!projects_owner_id_fkey(id, name, email, avatar_url)
            `)
            .single()

        if (updateError) {
            console.error('❌ Database error:', updateError)
            return NextResponse.json(
                { error: 'Failed to update project' },
                { status: 500 }
            )
        }

        console.log('✅ Successfully updated project:', id)

        return NextResponse.json({
            data: updatedProject,
            message: 'Project updated successfully'
        })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/projects/[id] - Delete a specific project (soft delete)
export async function DELETE(
    _: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = (await params).id
        console.log('🔍 DELETE /api/projects/[id] - Starting request for project:', id)

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

        // Check if project exists and user has permission to delete
        const { data: existingProject, error: fetchError } = await supabase
            .from('projects')
            .select('id, owner_id, status')
            .eq('id', id)
            .single()

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Project not found' },
                    { status: 404 }
                )
            }
            console.error('❌ Database error:', fetchError)
            return NextResponse.json(
                { error: 'Failed to fetch project' },
                { status: 500 }
            )
        }

        // Check permissions (only owner can delete)
        if (existingProject.owner_id !== session.user.id) {
            console.log('❌ User does not have permission to delete project:', id)
            return NextResponse.json(
                { error: 'Access denied - only project owner can delete' },
                { status: 403 }
            )
        }

        // Soft delete by setting status to archived
        const { error: deleteError } = await supabase
            .from('projects')
            .update({
                status: 'archived',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (deleteError) {
            console.error('❌ Database error:', deleteError)
            return NextResponse.json(
                { error: 'Failed to delete project' },
                { status: 500 }
            )
        }

        console.log('✅ Successfully deleted (archived) project:', id)

        return NextResponse.json({
            message: 'Project deleted successfully'
        })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
