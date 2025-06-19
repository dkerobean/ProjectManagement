import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ count: 0 })
        }

        const supabase = await createSupabaseServerClient()

        // Count recent activity (tasks and projects updated in last 7 days)
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        // Get recent task updates
        const { data: recentTasks, error: tasksError } = await supabase
            .from('tasks')
            .select('id, updated_at')
            .gte('updated_at', oneWeekAgo.toISOString())
            .order('updated_at', { ascending: false })

        // Get recent project updates
        const { data: recentProjects, error: projectsError } = await supabase
            .from('projects')
            .select('id, updated_at')
            .eq('owner_id', session.user.id)
            .gte('updated_at', oneWeekAgo.toISOString())
            .order('updated_at', { ascending: false })

        if (tasksError || projectsError) {
            console.error('Error fetching notification count:', { tasksError, projectsError })
        }

        const taskCount = recentTasks?.length || 0
        const projectCount = recentProjects?.length || 0
        const totalCount = Math.min(taskCount + projectCount, 99) // Cap at 99

        return NextResponse.json({ count: totalCount })

    } catch (error) {
        console.error('Error in notifications count API:', error)
        return NextResponse.json({ count: 0 })
    }
}
