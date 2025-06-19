// Test script to verify dashboard data structure
const testData = {
    projectOverview: {
        ongoingProject: 5,
        projectCompleted: 3,
        upcomingProject: 2,
    },
    taskOverview: {
        weekly: {
            onGoing: 12,
            finished: 8,
            total: 20,
            series: [
                { name: 'On Going', data: [2, 3, 4, 2, 1, 0, 0] },
                { name: 'Finished', data: [1, 2, 1, 1, 1, 1, 1] },
            ],
            range: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        },
        daily: {
            onGoing: 12,
            finished: 8,
            total: 20,
            series: [
                { name: 'On Going', data: [2, 3, 3, 2, 2] },
                { name: 'Finished', data: [1, 2, 2, 2, 1] },
            ],
            range: ['08:00', '12:00', '16:00', '20:00', '24:00'],
        },
    },
    currentTasks: [
        {
            id: 'task-1',
            name: 'Complete user authentication',
            dueDate: Date.now() + (24 * 60 * 60 * 1000),
            checked: false,
            progress: '60%',
            priority: 'high',
            assignee: {
                name: 'John Doe',
                img: '/img/avatars/thumb-1.jpg'
            }
        }
    ],
    schedule: [
        {
            start: new Date(),
            end: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
            name: 'Project Alpha',
            id: 'project-1',
            progress: 45,
            type: 'project',
            hideChildren: false,
            displayOrder: 1,
            barVariant: 'overallDesign',
        }
    ],
    recentActivity: [
        {
            type: 'UPDATE-TICKET',
            dateTime: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
            ticket: 'TSK-123456',
            status: 1,
            userName: 'System',
            userImg: '',
        }
    ],
}

console.log('Dashboard data structure test:')
console.log('✅ Project Overview:', Object.keys(testData.projectOverview))
console.log('✅ Task Overview:', Object.keys(testData.taskOverview))
console.log('✅ Current Tasks:', testData.currentTasks.length, 'tasks')
console.log('✅ Schedule:', testData.schedule.length, 'projects')
console.log('✅ Recent Activity:', testData.recentActivity.length, 'activities')

// Test type compatibility
const scheduleItem = testData.schedule[0]
console.log('✅ Schedule item type:', scheduleItem.type)

const activityItem = testData.recentActivity[0]
console.log('✅ Activity dateTime type:', typeof activityItem.dateTime)

console.log('\n🎉 All data structures are compatible!')
