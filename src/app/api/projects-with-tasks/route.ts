import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gafpwitcdoiviixlxnuz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjQxNTksImV4cCI6MjA2NTA0MDE1OX0.RNdmc2PkTYA6oQ-4HRPoRp-z-iinT8v5d6pWx9YRPhk'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For now, we'll simulate user authentication
// In a real app, you'd get this from your auth system
const getCurrentUserId = () => {
    // This is a mock user ID - in reality you'd get this from your auth system
    return 'a8fa04b3-d73c-4048-980a-e94db5ebf70c'
}

export async function GET() {
    try {
        const userId = getCurrentUserId()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch projects for the user
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name, description, status, priority, start_date, end_date, created_at, updated_at')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false })

        if (projectsError) {
            console.error('Error fetching projects:', projectsError)
            throw projectsError
        }

        if (!projects || projects.length === 0) {
            return NextResponse.json({
                success: true,
                data: []
            })
        }

        // Fetch tasks for all projects
        const projectIds = projects.map(p => p.id)
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select(`
                id,
                title,
                description,
                priority,
                status,
                due_date,
                project_id,
                assigned_to,
                created_by,
                created_at,
                updated_at,
                assignee:assigned_to(id, name, email)
            `)
            .in('project_id', projectIds)
            .order('created_at', { ascending: false })

        if (tasksError) {
            console.error('Error fetching tasks:', tasksError)
            // Don't fail if tasks can't be fetched, just return projects without tasks
        }

        // Group tasks by project
        const projectsWithTasks = projects.map(project => ({
            ...project,
            tasks: tasks ? tasks.filter(task => task.project_id === project.id).map(task => ({
                ...task,
                assignee: task.assignee ? {
                    id: task.assignee.id,
                    name: task.assignee.name || task.assignee.email,
                    img: '/img/avatars/thumb-1.jpg' // Default avatar
                } : undefined
            })) : []
        }))

        return NextResponse.json({
            success: true,
            data: projectsWithTasks
        })

    } catch (error) {
        console.error('Error in projects-with-tasks API:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch projects with tasks',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
