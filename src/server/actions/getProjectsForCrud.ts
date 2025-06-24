import { createSupabaseServerClient } from '@/lib/supabase/server'
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
                metadata,
                created_at,
                updated_at
            `)
            .eq('owner_id', session.user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching projects in getProjectsForCrud:', error)
            console.error('Full error details:', JSON.stringify(error, null, 2))
            return []
        }

        if (!projects || projects.length === 0) {
            console.log('No projects found, returning empty array')
            return []
        }

        console.log(`Found ${projects.length} projects for user ${session.user.id}`)

        // Fetch tasks for all projects
        const projectIds = projects.map(p => p.id)
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('id, status, priority, project_id')
            .in('project_id', projectIds)

        if (tasksError) {
            console.error('Error fetching tasks:', tasksError)
        }

        // Fetch project members for all projects
        const { data: projectMembers, error: membersError } = await supabase
            .from('project_members')
            .select(`
                id,
                role,
                project_id,
                user:users!project_members_user_id_fkey(id, name, email, avatar_url)
            `)
            .in('project_id', projectIds)

        if (membersError) {
            console.error('Error fetching project members:', membersError)
        }

        // Group tasks and members by project
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tasksByProject: Record<string, any[]> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const membersByProject: Record<string, any[]> = {}

        // Group tasks
        if (tasks) {
            tasks.forEach(task => {
                if (!tasksByProject[task.project_id]) tasksByProject[task.project_id] = []
                tasksByProject[task.project_id].push(task)
            })
        }

        // Group members
        if (projectMembers) {
            projectMembers.forEach(member => {
                if (!membersByProject[member.project_id]) membersByProject[member.project_id] = []
                membersByProject[member.project_id].push(member)
            })
        }

        // Transform data for compatibility with existing components
        const transformedProjects = projects.map(project => {
            const projectTasks = tasksByProject[project.id] || []
            const projectMembers = membersByProject[project.id] || []

            return {
                id: project.id,
                name: project.name,
                category: project.metadata?.template || 'other',
                desc: project.description || '',
                attachmentCount: 0,
                totalTask: projectTasks.length,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                completedTask: projectTasks.filter((task: any) => task.status === 'done').length,
                progression: projectTasks.length > 0
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? Math.round((projectTasks.filter((task: any) => task.status === 'done').length / projectTasks.length) * 100)
                    : 0,
                dayleft: project.end_date ?
                    Math.max(0, Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : undefined,
                status: project.status,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                member: projectMembers.map((member: any) => ({
                    id: member.user?.id || member.id,
                    name: member.user?.name || 'Unknown',
                    email: member.user?.email || '',
                    img: member.user?.avatar_url || '/img/avatars/thumb-1.jpg'
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
                    metadata: project.metadata,
                    owner_id: project.owner_id,
                    project_members: projectMembers,
                    tasks: projectTasks
                }
            }
        })

        console.log(`Successfully fetched ${transformedProjects.length} projects for CRUD`)
        return transformedProjects
    } catch (error) {
        console.error('Error in getProjectsForCrud:', error)
        return []
    }
}

export default getProjectsForCrud
