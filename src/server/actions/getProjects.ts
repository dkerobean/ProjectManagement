import { createSupabaseServerClient } from '@/lib/supabase-server'
import { auth } from '@/auth'

type ProjectUser = {
    id: string
    name: string
    email: string
    avatar_url: string
}

type ProjectMember = {
    id: string
    role: string
    user: ProjectUser
}

const getProjects = async () => {
    try {
        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.warn('No session found in getProjects, returning empty array')
            return []
        }
        
        console.log(`[getProjects] Starting fetch for user: ${session.user.email} (${session.user.id})`)
        const startTime = Date.now()

        const supabase = await createSupabaseServerClient()        // Fetch projects with related member data
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
                owner_id,
                owner:users!projects_owner_id_fkey(id, name, email, avatar_url),
                project_members(
                    id,
                    role,
                    user:users!project_members_user_id_fkey(id, name, email, avatar_url)
                )
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching projects in getProjects:', error)
            return []
        }

        const fetchTime = Date.now() - startTime
        console.log(`[getProjects] Fetched ${projects?.length || 0} projects in ${fetchTime}ms`)
        
        if (!projects || projects.length === 0) {
            console.log('[getProjects] No projects found, returning empty array')
            return []
        }        // Transform the data to match the expected format with real member data and task counts
        // Using 'any' temporarily for complex Supabase return types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformedProjects = await Promise.all(projects.map(async (project: any) => {
            // Combine owner and members into a single array
            const allMembers: Array<{
                id: string
                name: string
                email: string
                img: string
                role: string
            }> = []

            // Add owner (handle both single object and array cases)
            const owner = Array.isArray(project.owner) ? project.owner[0] : project.owner
            if (owner) {
                allMembers.push({
                    id: owner.id,
                    name: owner.name || 'Unknown User',
                    email: owner.email || '',
                    img: owner.avatar_url || '/img/avatars/thumb-1.jpg',
                    role: 'owner'
                })
            }

            // Add project members
            if (project.project_members && Array.isArray(project.project_members)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                project.project_members.forEach((member: any) => {
                    if (member.user) {
                        allMembers.push({
                            id: member.user.id,
                            name: member.user.name || 'Unknown User',
                            email: member.user.email || '',
                            img: member.user.avatar_url || '/img/avatars/thumb-1.jpg',
                            role: member.role || 'member'
                        })
                    }
                })
            }

            // Fetch task counts for this project
            const { data: taskCounts } = await supabase
                .from('tasks')
                .select('status')
                .eq('project_id', project.id)

            let totalTask = 0
            let completedTask = 0

            if (taskCounts) {
                totalTask = taskCounts.length
                completedTask = taskCounts.filter(task => task.status === 'done').length
            }            // Calculate progression percentage
            const progression = totalTask > 0 ? Math.round((completedTask / totalTask) * 100) : 0

            return {
                id: project.id,
                name: project.name,
                category: project.metadata?.template || 'other',
                desc: project.description || '',
                attachmentCount: 0,
                totalTask: totalTask,
                completedTask: completedTask,
                progression: progression,
                dayleft: project.due_date ?
                    Math.max(0, Math.ceil((new Date(project.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : undefined,
                status: project.status,
                member: allMembers, // Now populated with real members
                cover: project.color || '#3B82F6',
                priority: project.priority || 'medium',
                createdAt: project.created_at,
                updatedAt: project.updated_at,
                favourite: project.metadata?.favourite === true || project.metadata?.favourite === 'true' // Read from metadata
            }
        }))

        const totalTime = Date.now() - startTime
        console.log(`[getProjects] Successfully transformed ${transformedProjects.length} projects in ${totalTime}ms`)
        
        // Log project IDs for debugging
        console.log('[getProjects] Project IDs:', transformedProjects.map((p: any) => p.id).join(', '))
        
        return transformedProjects
    } catch (error) {
        console.error('Error in getProjects:', error)
        return []
    }
}

export default getProjects
