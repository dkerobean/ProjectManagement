import { createSupabaseServerClient } from '@/lib/supabase-server'
import { auth } from '@/auth'

async function getTasks() {
    try {
        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.warn('No session found in getTasks, returning empty object')
            return {}
        }

        const supabase = await createSupabaseServerClient()

        // Fetch projects for the user
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name, description, status, priority, start_date, end_date, created_at, updated_at')
            .eq('owner_id', session.user.id)
            .order('created_at', { ascending: false })

        if (projectsError) {
            console.error('Error fetching projects:', projectsError)
            return {}
        }

        if (!projects || projects.length === 0) {
            return {}
        }

        // Fetch tasks for all projects
        const projectIds = projects.map(p => p.id)
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select(`
                id,
                title,
                status,
                priority,
                due_date,
                project_id,
                assigned_to,
                created_by,
                created_at,
                updated_at
            `)
            .in('project_id', projectIds)
            .order('created_at', { ascending: false })

        if (tasksError) {
            console.error('Error fetching tasks:', tasksError)
            // Don't fail completely, just return projects without tasks
        }

        // Transform the data to match the expected Groups format
        const groups: Record<string, Array<{
            id: string
            name: string
            progress: string
            assignee?: {
                id: string
                name: string
                img: string
            }
            priority: string
            dueDate: number | null
            checked: boolean
            project_id: string
        }>> = {}

        projects.forEach(project => {
            const projectTasks = tasks ? tasks.filter(task => task.project_id === project.id) : []
            groups[project.name] = projectTasks.map(task => ({
                id: task.id,
                name: task.title,
                progress: getStatusDisplayName(task.status), // Show status name instead of numbers
                assignee: undefined, // We'll need to fetch user data separately if needed
                priority: getPriorityDisplayName(task.priority),
                dueDate: task.due_date ? new Date(task.due_date).getTime() : null,
                checked: task.status === 'completed' || task.status === 'done',
                project_id: task.project_id
            }))
        })

        return groups
    } catch (error) {
        console.error('Error fetching tasks:', error)
        // Return empty groups on error to prevent page crashes
        return {}
    }
}

// Helper function to convert status to display name
function getStatusDisplayName(status: string): string {
    switch (status) {
        case 'todo':
            return 'To Do'
        case 'in_progress':
            return 'In Progress'
        case 'review':
            return 'Review'
        case 'completed':
        case 'done':
            return 'Completed'
        case 'blocked':
            return 'Blocked'
        default:
            return 'To Do'
    }
}

// Helper function to convert priority to display name
function getPriorityDisplayName(priority: string): string {
    switch (priority) {
        case 'critical':
            return 'Critical'
        case 'high':
            return 'High'
        case 'medium':
            return 'Medium'
        case 'low':
            return 'Low'
        default:
            return 'Medium'
    }
}

export default getTasks
