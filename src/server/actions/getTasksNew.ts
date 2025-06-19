import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gafpwitcdoiviixlxnuz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjQxNTksImV4cCI6MjA2NTA0MDE1OX0.RNdmc2PkTYA6oQ-4HRPoRp-z-iinT8v5d6pWx9YRPhk'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Mock user ID - in reality you'd get this from your auth system
const getCurrentUserId = () => {
    return 'a8fa04b3-d73c-4048-980a-e94db5ebf70c'
}

async function getTasks() {
    try {
        const userId = getCurrentUserId()

        // Fetch projects for the user
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name, description, status, priority, start_date, end_date, created_at, updated_at')
            .eq('owner_id', userId)
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
