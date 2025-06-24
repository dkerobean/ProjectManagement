import { createSupabaseServerClient } from '@/lib/supabase/server'
import { auth } from '@/auth'

const getProjectDashboard = async () => {
    try {
        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.warn('No session found in getProjectDashboard, returning mock data')
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
        const { data: projectStats, error: projectError } = await supabase
            .from('projects')
            .select('id, status')
            .eq('owner_id', session.user.id)

        if (projectError) {
            console.error('Error fetching project stats:', projectError)
        }

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
            .select(`
                id,
                status,
                created_at,
                completed_at,
                project:projects!tasks_project_id_fkey(owner_id)
            `)
            .eq('projects.owner_id', session.user.id)
            .gte('created_at', oneWeekAgo.toISOString())

        if (taskError) {
            console.error('Error fetching task stats:', taskError)
        }

        // Generate weekly task overview
        const weeklyData = generateWeeklyTaskData(taskStats || [])

        // 3. Fetch current tasks (high priority and overdue)
        const { data: currentTasks, error: currentTasksError } = await supabase
            .from('tasks')
            .select(`
                id,
                title,
                due_date,
                status,
                priority,
                assignee:users!tasks_assignee_id_fkey(id, name, avatar_url),
                project:projects!tasks_project_id_fkey(owner_id)
            `)
            .eq('projects.owner_id', session.user.id)
            .in('status', ['todo', 'in_progress'])
            .order('priority', { ascending: false })
            .order('due_date', { ascending: true })
            .limit(10)

        if (currentTasksError) {
            console.error('Error fetching current tasks:', currentTasksError)
        }

        // Transform current tasks to match expected format
        const transformedCurrentTasks = (currentTasks || []).map(task => ({
            id: task.id,
            name: task.title,
            dueDate: task.due_date ? new Date(task.due_date).getTime() : Date.now(),
            checked: task.status === 'done',
            progress: getProgressByStatus(task.status),
            priority: task.priority || 'medium',
            assignee: {
                name: task.assignee?.name || 'Unassigned',
                img: task.assignee?.avatar_url || '/img/avatars/thumb-1.jpg'
            }
        }))

        // 4. Fetch project schedule (active projects with tasks)
        const { data: scheduleData, error: scheduleError } = await supabase
            .from('projects')
            .select(`
                id,
                name,
                start_date,
                end_date,
                status,
                tasks(id, title, start_date, due_date, status)
            `)
            .eq('owner_id', session.user.id)
            .eq('status', 'active')
            .limit(5)

        if (scheduleError) {
            console.error('Error fetching schedule data:', scheduleError)
        }

        // Transform schedule data to match expected format
        const transformedSchedule = generateScheduleData(scheduleData || [])

        // 5. Fetch recent activity (recent task updates, comments, etc.)
        const { data: recentActivity, error: activityError } = await supabase
            .from('tasks')
            .select(`
                id,
                title,
                status,
                updated_at,
                assignee:users!tasks_assignee_id_fkey(id, name, avatar_url)
            `)
            .eq('projects.owner_id', session.user.id)
            .order('updated_at', { ascending: false })
            .limit(6)

        if (activityError) {
            console.error('Error fetching recent activity:', activityError)
        }        // Transform recent activity to match expected format
        const transformedActivity = (recentActivity || []).map((task) => {
            const timeDiff = Date.now() - new Date(task.updated_at).getTime()
            const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))
            const timeString = hoursAgo < 1 ? 'Just now' :
                              hoursAgo < 24 ? `${hoursAgo}h ago` :
                              `${Math.floor(hoursAgo / 24)}d ago`

            return {
                type: 'UPDATE-TICKET',
                dateTime: timeString,
                ticket: `TSK-${task.id.substring(0, 6)}`,
                status: getStatusCode(task.status),
                userName: task.assignee?.name || 'System',
                userImg: task.assignee?.avatar_url || '',
            }
        })

        const totalTime = Date.now() - startTime
        console.log(`[getProjectDashboard] Successfully fetched dashboard data in ${totalTime}ms`)

        return {
            projectOverview,
            taskOverview: {
                weekly: weeklyData,
                daily: generateDailyTaskData(), // Simplified daily data
            },
            currentTasks: transformedCurrentTasks,
            schedule: transformedSchedule,
            recentActivity: transformedActivity,
        }

    } catch (error) {
        console.error('Error in getProjectDashboard:', error)
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
function generateWeeklyTaskData(tasks: any[]) {
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

function generateScheduleData(projects: any[]) {
    const currentDate = new Date()
    const schedule: any[] = []

    projects.forEach((project, index) => {
        // Add project as main item
        schedule.push({
            start: project.start_date ? new Date(project.start_date) : currentDate,
            end: project.end_date ? new Date(project.end_date) : new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            name: project.name,
            id: project.id,
            progress: calculateProjectProgress(project.tasks),
            type: 'project',
            hideChildren: false,
            displayOrder: index * 10,
            barVariant: getProjectVariant(index),
        })

        // Add top 3 tasks from project
        if (project.tasks && project.tasks.length > 0) {
            project.tasks.slice(0, 3).forEach((task: any, taskIndex: number) => {
                schedule.push({
                    start: task.start_date ? new Date(task.start_date) : currentDate,
                    end: task.due_date ? new Date(task.due_date) : new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                    name: task.title,
                    id: task.id,
                    progress: task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0,
                    type: 'task',
                    project: project.id,
                    displayOrder: index * 10 + taskIndex + 1,
                    barVariant: getTaskVariant(index),
                })
            })
        }
    })

    return schedule
}

function calculateProjectProgress(tasks: any[]) {
    if (!tasks || tasks.length === 0) return 0
    const completedTasks = tasks.filter(task => task.status === 'done').length
    return Math.round((completedTasks / tasks.length) * 100)
}

function getProjectVariant(index: number) {
    const variants = ['overallDesign', 'overallDevelopment', 'overallTesting']
    return variants[index % variants.length]
}

function getTaskVariant(index: number) {
    const variants = ['design', 'development', 'testing']
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
        case 'done': return 3
        case 'in_progress': return 1
        case 'review': return 2
        case 'todo': return 0
        default: return 0
    }
}

export default getProjectDashboard
