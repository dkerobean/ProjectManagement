import { createSupabaseServerClient } from '@/lib/supabase-server'
import { auth } from '@/auth'

const getProjectsForCrud = async () => {
    try {
        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.warn('No session found in getProjectsForCrud, returning empty array')
            return []
        }

        const supabase = await createSupabaseServerClient()

        // Fetch projects with complete data structure needed for CRUD
        const { data: projects, error } = await supabase
            .from('projects')
            .select(`
                id,
                name,
                description,
                status,
                priority,
                owner_id,
                start_date,
                end_date,
                budget,
                metadata,
                created_at,
                updated_at,
                owner:users!projects_owner_id_fkey(id, name, email, avatar_url),
                project_members(
                    id,
                    role,
                    user:users!project_members_user_id_fkey(id, name, email, avatar_url)
                ),
                tasks(
                    id,
                    status,
                    priority
                )
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching projects in getProjectsForCrud:', error)
            return []
        }

        if (!projects || projects.length === 0) {
            console.log('No projects found, returning empty array')
            return []
        }

        // Transform data for compatibility with existing components
        const transformedProjects = projects.map(project => ({
            id: project.id,
            name: project.name,
            category: project.metadata?.template || 'other',
            desc: project.description || '',
            attachmentCount: 0,
            totalTask: project.tasks?.length || 0,
            completedTask: project.tasks?.filter(task => task.status === 'done').length || 0,
            progression: project.tasks?.length > 0
                ? Math.round((project.tasks.filter(task => task.status === 'done').length / project.tasks.length) * 100)
                : 0,
            dayleft: project.end_date ?
                Math.max(0, Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : undefined,
            status: project.status,
            member: project.project_members?.map(member => ({
                id: member.user.id,
                name: member.user.name,
                email: member.user.email,
                img: member.user.avatar_url || '/img/avatars/thumb-1.jpg'
            })) || [],
            cover: project.metadata?.color || '#3B82F6',
            priority: project.priority || 'medium',
            createdAt: project.created_at,
            updatedAt: project.updated_at,
            favourite: false, // Will be managed separately
            // Include additional data for CRUD operations
            rawData: {
                description: project.description,
                start_date: project.start_date,
                end_date: project.end_date,
                budget: project.budget,
                metadata: project.metadata,
                owner: project.owner,
                project_members: project.project_members,
                tasks: project.tasks
            }
        }))

        console.log(`Successfully fetched ${transformedProjects.length} projects for CRUD`)
        return transformedProjects
    } catch (error) {
        console.error('Error in getProjectsForCrud:', error)
        return []
    }
}

export default getProjectsForCrud
