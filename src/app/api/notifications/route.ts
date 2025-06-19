import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createSupabaseServerClient()

        // For now, we'll create notifications based on recent task/project activity
        // You can create a proper notifications table later if needed
          // Get recent task updates for notifications
        const { data: recentTasks, error: tasksError } = await supabase
            .from('tasks')
            .select(`
                id,
                title,
                status,
                updated_at,
                projects!tasks_project_id_fkey(name)
            `)
            .order('updated_at', { ascending: false })
            .limit(5)

        if (tasksError) {
            console.error('Error fetching tasks for notifications:', tasksError)
        }

        // Get recent project updates
        const { data: recentProjects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name, status, updated_at')
            .eq('owner_id', session.user.id)
            .order('updated_at', { ascending: false })
            .limit(3)

        if (projectsError) {
            console.error('Error fetching projects for notifications:', projectsError)
        }        // Transform to notification format
        const notifications: Array<{
            id: string
            title: string
            desc: string
            time: number
            readed: boolean
            img: string
        }> = []        // Add task notifications
        if (recentTasks) {
            recentTasks.forEach((task) => {
                const projectName = Array.isArray(task.projects) && task.projects.length > 0
                    ? task.projects[0]?.name
                    : 'Unknown Project'

                notifications.push({
                    id: `task-${task.id}`,
                    title: `Task Updated: ${task.title}`,
                    desc: `Status changed to ${task.status} in project ${projectName}`,
                    time: new Date(task.updated_at).getTime(),
                    readed: false,
                    img: '/img/avatars/thumb-1.jpg'
                })
            })
        }

        // Add project notifications
        if (recentProjects) {
            recentProjects.forEach((project) => {
                notifications.push({
                    id: `project-${project.id}`,
                    title: `Project Updated: ${project.name}`,
                    desc: `Project status is now ${project.status}`,
                    time: new Date(project.updated_at).getTime(),
                    readed: false,
                    img: '/img/avatars/thumb-2.jpg'
                })
            })
        }

        // Sort by time (most recent first)
        notifications.sort((a, b) => b.time - a.time)

        return NextResponse.json(notifications.slice(0, 10)) // Return top 10

    } catch (error) {
        console.error('Error in notifications API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
