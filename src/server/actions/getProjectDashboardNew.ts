import { createSupabaseServerClient } from '@/lib/supabase/server'
import { auth } from '@/auth'

const getProjectDashboard = async () => {
    try {
        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.warn('No session found in getProjectDashboard, returning empty data')
            // Return empty dashboard structure if no session
            return {
                projectOverview: {
                    ongoingProject: 0,
                    projectCompleted: 0,
                    upcomingProject: 0,
                },
                taskOverview: {
                    weekly: {
                        onGoing: 0,
                        finished: 0,
                        total: 0,
                        series: [
                            { name: 'On Going', data: [0, 0, 0, 0, 0, 0, 0] },
                            { name: 'Finished', data: [0, 0, 0, 0, 0, 0, 0] },
                        ],
                        range: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    },
                    daily: {
                        onGoing: 0,
                        finished: 0,
                        total: 0,
                        series: [
                            { name: 'On Going', data: [0, 0, 0, 0, 0] },
                            { name: 'Finished', data: [0, 0, 0, 0, 0] },
                        ],
                        range: ['08:00', '12:00', '16:00', '20:00', '24:00'],
                    },
                },
                currentTasks: [],
                schedule: [],
                recentActivity: [],
            }
        }

        console.log(`[getProjectDashboard] Starting fetch for user: ${session.user.email} (${session.user.id})`)
        const startTime = Date.now()

        const supabase = await createSupabaseServerClient()

        // 1. Fetch project overview statistics
        console.log('[getProjectDashboard] Fetching project stats...')
        const { data: projectStats, error: projectError } = await supabase
            .from('projects')
            .select('id, status')
            .eq('owner_id', session.user.id)

        if (projectError) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching project stats:', projectError)
            }
        }

        console.log(`[getProjectDashboard] Found ${projectStats?.length || 0} projects`)

        // Calculate project overview
        const projectOverview = {
            ongoingProject: projectStats?.filter(p => p.status === 'active').length || 0,
            projectCompleted: projectStats?.filter(p => p.status === 'completed').length || 0,
            upcomingProject: projectStats?.filter(p => p.status === 'on_hold').length || 0,
        }

        // 2. Fetch task statistics for the last 7 days
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        const { data: taskStats, error: taskError } = await supabase
            .from('tasks')
            .select('id, status, created_at, project_id')
            .gte('created_at', oneWeekAgo.toISOString())

        if (taskError) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching task stats:', taskError)
            }
        }

        // Filter tasks by user's projects
        const userProjectIds = projectStats?.map(p => p.id) || []
        const userTasks = (taskStats || []).filter(task => userProjectIds.includes(task.project_id))

        // Generate weekly task overview
        const weeklyData = generateWeeklyTaskData(userTasks)

        // 3. Fetch current tasks (simplified)
        console.log('[getProjectDashboard] Fetching current tasks...')
        const { data: currentTasks, error: currentTasksError } = await supabase
            .from('tasks')
            .select('id, title, due_date, status, priority')
            .in('project_id', userProjectIds.length > 0 ? userProjectIds : [''])
            .in('status', ['todo', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(10)

        if (currentTasksError) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching current tasks:', currentTasksError)
            }
        }

        console.log(`[getProjectDashboard] Found ${currentTasks?.length || 0} current tasks`)

        // Transform current tasks to match expected format
        const transformedCurrentTasks = (currentTasks || []).map(task => ({
            id: task.id,
            name: task.title,
            dueDate: task.due_date ? new Date(task.due_date).getTime() : Date.now() + (7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
            checked: task.status === 'done',
            progress: getProgressByStatus(task.status),
            priority: task.priority || 'medium',
            assignee: {
                name: 'Unassigned',
                img: '/img/avatars/thumb-1.jpg'
            }
        }))

        // 4. Fetch project schedule (active projects)
        const { data: scheduleData, error: scheduleError } = await supabase
            .from('projects')
            .select('id, name, start_date, end_date, status')
            .eq('owner_id', session.user.id)
            .eq('status', 'active')
            .limit(5)

        if (scheduleError) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching schedule data:', scheduleError)
            }
        }

        // Transform schedule data to match expected format
        const transformedSchedule = generateScheduleData(scheduleData || [])

        // 5. Fetch recent activity
        const { data: recentActivity, error: activityError } = await supabase
            .from('tasks')
            .select('id, title, status, updated_at')
            .in('project_id', userProjectIds.length > 0 ? userProjectIds : [''])
            .order('updated_at', { ascending: false })
            .limit(6)

        if (activityError) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching recent activity:', activityError)
            }
        }

        // Transform recent activity to match expected format
        const transformedActivity = (recentActivity || []).map((task) => {
            const updateTime = new Date(task.updated_at).getTime()

            return {
                type: 'UPDATE-TICKET',
                dateTime: updateTime, // Use timestamp instead of string
                ticket: `TSK-${task.id.substring(0, 6)}`,
                status: getStatusCode(task.status),
                userName: 'System',
                userImg: '',
            }
        })

        const totalTime = Date.now() - startTime
        console.log(`[getProjectDashboard] Successfully fetched dashboard data in ${totalTime}ms`)

        return {
            projectOverview,
            taskOverview: {
                weekly: weeklyData,
                daily: generateDailyTaskData(),
            },
            currentTasks: transformedCurrentTasks,
            schedule: transformedSchedule,
            recentActivity: transformedActivity,
        }

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Error in getProjectDashboard:', error)
        }
        // Return empty structure on error
        return {
            projectOverview: {
                ongoingProject: 0,
                projectCompleted: 0,
                upcomingProject: 0,
            },
            taskOverview: {
                weekly: {
                    onGoing: 0,
                    finished: 0,
                    total: 0,
                    series: [
                        { name: 'On Going', data: [0, 0, 0, 0, 0, 0, 0] },
                        { name: 'Finished', data: [0, 0, 0, 0, 0, 0, 0] },
                    ],
                    range: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                },
                daily: {
                    onGoing: 0,
                    finished: 0,
                    total: 0,
                    series: [
                        { name: 'On Going', data: [0, 0, 0, 0, 0] },
                        { name: 'Finished', data: [0, 0, 0, 0, 0] },
                    ],
                    range: ['08:00', '12:00', '16:00', '20:00', '24:00'],
                },
            },
            currentTasks: [],
            schedule: [],
            recentActivity: [],
        }
    }
}

// Helper functions
function generateWeeklyTaskData(tasks: Array<{id: string, status: string, created_at: string, project_id: string}>) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const onGoingData = [0, 0, 0, 0, 0, 0, 0]
    const finishedData = [0, 0, 0, 0, 0, 0, 0]

    // Group tasks by day of week
    tasks.forEach(task => {
        const dayIndex = new Date(task.created_at).getDay()
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1 // Adjust Sunday to be last

        if (task.status === 'done') {
            finishedData[adjustedIndex]++
        } else if (task.status === 'in_progress' || task.status === 'todo') {
            onGoingData[adjustedIndex]++
        }
    })

    const onGoing = onGoingData.reduce((a, b) => a + b, 0)
    const finished = finishedData.reduce((a, b) => a + b, 0)

    return {
        onGoing,
        finished,
        total: onGoing + finished,
        series: [
            { name: 'On Going', data: onGoingData },
            { name: 'Finished', data: finishedData },
        ],
        range: days,
    }
}

function generateDailyTaskData() {
    // Simplified daily data for now
    return {
        onGoing: 12,
        finished: 8,
        total: 20,
        series: [
            { name: 'On Going', data: [2, 3, 3, 2, 2] },
            { name: 'Finished', data: [1, 2, 2, 2, 1] },
        ],
        range: ['08:00', '12:00', '16:00', '20:00', '24:00'],
    }
}

function generateScheduleData(projects: Array<{id: string, name: string, start_date?: string, end_date?: string}>) {
    const currentDate = new Date()
    const schedule: Array<{
        start: Date
        end: Date
        name: string
        id: string
        progress: number
        type: 'project' | 'task' // Fix type to use specific values
        hideChildren?: boolean
        displayOrder: number
        barVariant: string
    }> = []

    projects.forEach((project, index) => {
        // Add project as main item
        const startDate = project.start_date ? new Date(project.start_date) : currentDate
        const endDate = project.end_date ? new Date(project.end_date) : new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)

        // Calculate progress based on dates
        const totalDuration = endDate.getTime() - startDate.getTime()
        const elapsed = currentDate.getTime() - startDate.getTime()
        const calculatedProgress = totalDuration > 0 ? Math.max(0, Math.min(100, Math.round((elapsed / totalDuration) * 100))) : 0

        schedule.push({
            start: startDate,
            end: endDate,
            name: project.name,
            id: project.id,
            progress: calculatedProgress,
            type: 'project',
            hideChildren: false,
            displayOrder: index * 10,
            barVariant: getProjectVariant(index),
        })
    })

    return schedule
}

function getProjectVariant(index: number) {
    const variants = ['overallDesign', 'overallDevelopment', 'overallTesting']
    return variants[index % variants.length]
}

function getProgressByStatus(status: string) {
    switch (status) {
        case 'done': return '100%'
        case 'in_progress': return '60%'
        case 'review': return '80%'
        case 'todo': return '0%'
        default: return '0%'
    }
}

function getStatusCode(status: string) {
    switch (status) {
        case 'done': return 0  // Completed
        case 'in_progress': return 1  // In progress
        case 'review': return 2  // Ready to test
        case 'todo': return 1  // In progress (since it's being worked on)
        default: return 0  // Default to completed
    }
}

export default getProjectDashboard
