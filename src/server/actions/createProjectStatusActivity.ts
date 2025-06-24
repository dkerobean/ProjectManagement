import { createSupabaseServerClient } from '@/lib/supabase/server'
import { auth } from '@/auth'

/**
 * Server action to create project completion/reactivation activities
 * This is called from the API when project status changes to handle activity logging
 */
export default async function createProjectStatusActivity(
    projectId: string,
    activityType: 'PROJECT-COMPLETED' | 'PROJECT-REACTIVATED',
    metadata: Record<string, unknown> = {}
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            if (process.env.NODE_ENV === 'development') {
                console.error('No session found in createProjectStatusActivity')
            }
            return null
        }

        const supabase = await createSupabaseServerClient()

        // Get project details
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('name, owner_id')
            .eq('id', projectId)
            .single()

        if (projectError || !project) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching project for activity:', projectError)
            }
            return null
        }

        // Create activity title and description
        const isCompletion = activityType === 'PROJECT-COMPLETED'
        const title = isCompletion ? 'Project Completed' : 'Project Reactivated'
        const description = isCompletion
            ? `Project "${project.name}" automatically marked as completed - all tasks finished`
            : `Project "${project.name}" automatically reactivated - not all tasks are completed`

        // Create the activity record
        const { data: activity, error: activityError } = await supabase
            .from('activities')
            .insert({
                user_id: session.user.id, // Use current user session
                type: activityType,
                title,
                description,
                entity_type: 'project',
                entity_id: projectId,
                metadata: {
                    ...metadata,
                    project_name: project.name,
                    trigger_user: session.user.id,
                    trigger_date: new Date().toISOString()
                }
            })
            .select()
            .single()

        if (activityError) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error creating project status activity:', activityError)
            }
            return null
        }

        return activity

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Error in createProjectStatusActivity:', error)
        }
        return null
    }
}
