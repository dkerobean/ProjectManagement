import { createSupabaseServerClient } from '@/lib/supabase-server'
import { auth } from '@/auth'

const getScrumboardData = async () => {
    try {
        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            throw new Error('Unauthorized - No valid session')
        }

        const supabase = await createSupabaseServerClient()

        // Fetch projects with basic information only
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select(`
                id,
                name,                description,
                status,
                priority,
                start_date,
                end_date,
                due_date,
                created_at,
                updated_at,
                owner_id
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false })

        if (projectsError) {
            console.error('Error fetching projects:', projectsError)
            throw projectsError
        }        // Transform the data into scrum board format with basic data
        const boards = projects?.map(project => ({
            id: project.id,
            name: project.name,
            description: project.description,
            cover: '#3B82F6', // Default blue color since we removed color field
            member: [], // Will be populated when we have user data
            totalTask: 0, // Will be updated when we have task counts
            completedTask: 0,
            progression: 0,
            dayleft: project.due_date ?
                Math.max(0, Math.ceil((new Date(project.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null,
            attachmentCount: 0,
            taskBoard: {
                columns: [
                    {
                        name: 'To Do',
                        label: 'todo',
                        taskCount: 0
                    },
                    {
                        name: 'In Progress',
                        label: 'in_progress',
                        taskCount: 0
                    },
                    {
                        name: 'Testing',
                        label: 'testing',
                        taskCount: 0
                    },
                    {
                        name: 'Done',
                        label: 'completed',
                        taskCount: 0
                    }
                ]
            }
        })) || []

        return { boards }
    } catch (error) {
        console.error('Error in getScrumboardData:', error)
        // Return empty structure instead of throwing to prevent page crashes
        return { boards: [] }
    }
}

export default getScrumboardData
