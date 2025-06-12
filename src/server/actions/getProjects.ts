import { createSupabaseServerClient } from '@/lib/supabase-server'
import { auth } from '@/auth'

const getProjects = async () => {
    try {
        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.warn('No session found in getProjects, returning empty array')
            return []
        }

        const supabase = await createSupabaseServerClient()

        // Fetch projects with minimal related data to avoid complex joins
        const { data: projects, error } = await supabase
            .from('projects')
            .select(`
                id,
                name,
                description,
                status,
                priority,
                start_date,
                end_date,
                due_date,
                color,
                metadata,
                created_at,
                updated_at,
                owner_id
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching projects in getProjects:', error)
            return []
        }

        if (!projects || projects.length === 0) {
            console.log('No projects found, returning empty array')
            return []
        }

        // Transform the data to match the expected format with basic data only
        const transformedProjects = projects.map(project => ({
            id: project.id,
            name: project.name,
            category: project.metadata?.template || 'other',
            desc: project.description || '',
            attachmentCount: 0,
            totalTask: 0, // Will be updated when we fetch tasks
            completedTask: 0,
            progression: 0,            dayleft: project.due_date ?
                Math.max(0, Math.ceil((new Date(project.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : undefined,
            status: project.status,
            member: [], // Will be populated separately if needed
            cover: project.color || '#3B82F6',
            priority: project.priority || 'medium',
            createdAt: project.created_at,
            updatedAt: project.updated_at
        }))

        console.log(`Successfully fetched ${transformedProjects.length} projects`)
        return transformedProjects
    } catch (error) {
        console.error('Error in getProjects:', error)
        return []
    }
}

export default getProjects
