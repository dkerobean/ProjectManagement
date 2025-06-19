import { apiGetProjectsWithTasks } from '@/services/TaskService'

async function getTasks() {
    try {
        const response = await apiGetProjectsWithTasks()

        if (response.success && response.data) {            // Transform the data to match the expected Groups format
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

            response.data.forEach(project => {
                groups[project.name] = project.tasks.map(task => ({
                    id: task.id,
                    name: task.title,
                    progress: getProgressFromStatus(task.status),
                    assignee: task.assignee,
                    priority: task.priority,
                    dueDate: task.due_date ? new Date(task.due_date).getTime() : null,
                    checked: task.status === 'completed',
                    project_id: task.project_id
                }))
            })

            return groups
        }

        // Return empty groups if no data
        return {}
    } catch (error) {
        console.error('Error fetching tasks:', error)
        // Return empty groups on error to prevent page crashes
        return {}
    }
}

// Helper function to convert status to progress percentage
function getProgressFromStatus(status: string): string {
    switch (status) {
        case 'todo':
            return '0'
        case 'in_progress':
            return '50'
        case 'review':
            return '80'
        case 'completed':
        case 'done':
            return '100'
        case 'blocked':
            return '25'
        default:
            return '0'
    }
}

export default getTasks
