import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

const taskSchema = z.object({
    id: z.string().uuid().optional(),
    title: z.string().min(1, 'Task title is required'),
    description: z.string().optional().nullable(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']).default('todo'),
})

const updateProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(255, 'Project name too long').optional(),
    description: z.string().optional().nullable(),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    metadata: z.record(z.any()).optional().default({}),
    team_members: z.array(z.string().uuid()).optional(),
    tasks: z.array(taskSchema).optional(),
})

// GET /api/projects/{projectId} - Get a single project
export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        console.log(`🔍 GET /api/projects/${params.projectId} - Starting request`)
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createSupabaseServerClient()
        const { data: project, error } = await supabase
            .from('projects')
            .select(`
                *,
                owner:users!projects_owner_id_fkey(id, name, email, avatar_url),
                project_members(
                    id,
                    role,
                    user:users!project_members_user_id_fkey(id, name, email, avatar_url)
                ),
                tasks(*)
            `)
            .eq('id', params.projectId)
            .single()

        if (error) {
            console.error('❌ Database error:', error)
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }
        
        // Calculate project metrics
        const tasks = project.tasks || []
        const completedTasksCount = tasks.filter((task: { status: string }) => task.status === 'done').length
        const projectWithMetrics = {
            ...project,
            taskCount: tasks.length,
            completedTasks: completedTasksCount,
            memberCount: project.project_members?.length || 0,
            progress: tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0
        }


        console.log(`✅ Successfully fetched project ${params.projectId}`)
        return NextResponse.json({ data: projectWithMetrics })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}


// PUT /api/projects/{projectId} - Update a project
export async function PUT(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        console.log(`🔄 PUT /api/projects/${params.projectId} - Starting request`)
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        console.log('📝 Request body:', body)

        const validationResult = updateProjectSchema.safeParse(body)
        if (!validationResult.success) {
            console.log('❌ Validation failed:', validationResult.error.errors)
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.errors },
                { status: 400 }
            )
        }

        const { tasks: tasksData, team_members: teamMembersData, ...projectData } = validationResult.data
        
        const supabase = await createSupabaseServerClient()

        // Update project details
        const { data: updatedProject, error: projectUpdateError } = await supabase
            .from('projects')
            .update({
                ...projectData,
                start_date: projectData.start_date ? new Date(projectData.start_date).toISOString().split('T')[0] : null,
                end_date: projectData.end_date ? new Date(projectData.end_date).toISOString().split('T')[0] : null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', params.projectId)
            .select(`
                *,
                owner:users!projects_owner_id_fkey(id, name, email, avatar_url)
            `)
            .single()

        if (projectUpdateError) {
            console.error('❌ Project update error:', projectUpdateError)
            return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
        }
        console.log(`✅ Project ${params.projectId} details updated`)

        // Handle tasks: update existing, create new, delete removed
        if (tasksData) {
            console.log('🔄 Processing tasks...')
            const existingTasksResult = await supabase.from('tasks').select('id').eq('project_id', params.projectId)
            if (existingTasksResult.error) {
                console.error('❌ Error fetching existing tasks:', existingTasksResult.error)
                // Non-critical, proceed with caution or return error
            }
            const existingTaskIds = existingTasksResult.data?.map(t => t.id) || []
            
            const tasksToCreate = []
            const tasksToUpdate = []

            for (const task of tasksData) {
                if (task.id && existingTaskIds.includes(task.id)) {
                    tasksToUpdate.push({ ...task, project_id: params.projectId, updated_at: new Date().toISOString() })
                } else {
                    // Remove id if it's a new task to let DB generate it
                    const { id, ...restOfTask } = task;
                    tasksToCreate.push({ ...restOfTask, project_id: params.projectId, created_by: session.user.id })
                }
            }
            
            const taskIdsInRequest = tasksData.map(t => t.id).filter(id => id)
            const tasksToDelete = existingTaskIds.filter(id => !taskIdsInRequest.includes(id))

            if (tasksToCreate.length > 0) {
                console.log('➕ Creating new tasks:', tasksToCreate.length)
                const { error: createTasksError } = await supabase.from('tasks').insert(tasksToCreate)
                if (createTasksError) console.error('❌ Error creating tasks:', createTasksError)
            }
            if (tasksToUpdate.length > 0) {
                console.log('✍️ Updating tasks:', tasksToUpdate.length)
                for (const task of tasksToUpdate) {
                    const { error: updateTaskError } = await supabase.from('tasks').update(task).eq('id', task.id!)
                    if (updateTaskError) console.error(`❌ Error updating task ${task.id}:`, updateTaskError)
                }
            }
            if (tasksToDelete.length > 0) {
                console.log('➖ Deleting tasks:', tasksToDelete.length)
                const { error: deleteTasksError } = await supabase.from('tasks').delete().in('id', tasksToDelete)
                if (deleteTasksError) console.error('❌ Error deleting tasks:', deleteTasksError)
            }
            console.log('✅ Tasks processed')
        }
        
        // Handle team members (simplified: replace all members)
        if (teamMembersData) {
            console.log('🔄 Processing team members...')
            // Remove existing members (except owner if not in new list)
            const { error: deleteMembersError } = await supabase
                .from('project_members')
                .delete()
                .eq('project_id', params.projectId)
                .neq('role', 'owner'); // Keep owner by default
            
            if (deleteMembersError) console.error('❌ Error deleting old team members:', deleteMembersError)

            const ownerMember = await supabase.from('project_members').select('user_id').eq('project_id', params.projectId).eq('role', 'owner').single();

            const memberInserts = teamMembersData
                .filter(userId => userId !== ownerMember.data?.user_id) // Don't re-add owner if they are still owner
                .map(userId => ({
                    project_id: params.projectId,
                    user_id: userId,
                    role: 'member', // Default role, can be expanded
                }));
            
            // Ensure owner is still a member if not in teamMembersData explicitly
            if (ownerMember.data && !teamMembersData.includes(ownerMember.data.user_id)) {
                 //This case should ideally be handled by ensuring owner_id is always part of team_members or by specific logic
            }


            if (memberInserts.length > 0) {
                const { error: insertMembersError } = await supabase.from('project_members').insert(memberInserts);
                if (insertMembersError) console.error('❌ Error inserting new team members:', insertMembersError);
            }
             console.log('✅ Team members processed')
        }


        // Fetch the complete project data again
        const { data: finalProject, error: fetchFinalError } = await supabase
            .from('projects')
            .select(`
                *,
                owner:users!projects_owner_id_fkey(id, name, email, avatar_url),
                project_members(
                    id,
                    role,
                    user:users!project_members_user_id_fkey(id, name, email, avatar_url)
                ),
                tasks(*)
            `)
            .eq('id', params.projectId)
            .single()

        if (fetchFinalError) {
            console.error('❌ Failed to fetch final project data:', fetchFinalError)
            return NextResponse.json({ data: updatedProject, message: 'Project updated, but failed to fetch full details' })
        }
        
        const finalTasks = finalProject.tasks || []
        const finalCompletedTasksCount = finalTasks.filter((task: { status: string }) => task.status === 'done').length
        const projectWithMetrics = {
            ...finalProject,
            taskCount: finalTasks.length,
            completedTasks: finalCompletedTasksCount,
            memberCount: finalProject.project_members?.length || 0,
            progress: finalTasks.length > 0 ? Math.round((finalCompletedTasksCount / finalTasks.length) * 100) : 0
        }


        console.log(`✅ Successfully updated project ${params.projectId}`)
        return NextResponse.json({ data: projectWithMetrics, message: 'Project updated successfully' })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/projects/{projectId} - Delete a project
export async function DELETE(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        console.log(`🗑️ DELETE /api/projects/${params.projectId} - Starting request`)
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createSupabaseServerClient()

        // Check if the user is the owner of the project
        const { data: projectOwner, error: ownerError } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', params.projectId)
            .single()

        if (ownerError || !projectOwner) {
            console.error('❌ Error fetching project owner or project not found:', ownerError)
            return NextResponse.json({ error: 'Project not found or error fetching owner' }, { status: 404 })
        }

        if (projectOwner.owner_id !== session.user.id) {
            // Optionally, allow admins to delete projects too
            // const { data: userRole } = await supabase.from('users').select('role').eq('id', session.user.id).single();
            // if (userRole?.role !== 'admin') {
            console.log('🚫 User is not the owner, deletion forbidden')
            return NextResponse.json({ error: 'Forbidden: You are not the owner of this project.' }, { status: 403 })
            // }
        }
        
        // It's good practice to delete related records first if cascade is not set up or to be sure
        // Delete project members
        await supabase.from('project_members').delete().eq('project_id', params.projectId)
        // Delete tasks
        await supabase.from('tasks').delete().eq('project_id', params.projectId)
        // Potentially delete comments, attachments etc. if they exist and are related

        const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .eq('id', params.projectId)

        if (deleteError) {
            console.error('❌ Database error during deletion:', deleteError)
            return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
        }

        console.log(`✅ Successfully deleted project ${params.projectId}`)
        return NextResponse.json({ message: 'Project deleted successfully' }, { status: 200 })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
