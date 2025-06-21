/**
 * Simple test to verify the task completion API endpoint works without RLS errors
 */

async function testTaskCompletion() {
    try {
        console.log('🧪 Testing task completion API endpoint...')

        // First, let's check if we can identify a test project with tasks
        const testResponse = await fetch('http://localhost:3000/api/projects', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!testResponse.ok) {
            console.error('❌ Failed to fetch projects:', testResponse.status)
            return
        }

        const projects = await testResponse.json()
        console.log('📁 Found projects:', projects.length)

        if (projects.length === 0) {
            console.log('ℹ️ No projects found. Create a project with tasks first to test.')
            return
        }

        // Find a project with tasks
        let testProject = null
        let testTasks = []

        for (const project of projects) {
            const tasksResponse = await fetch(`http://localhost:3000/api/projects/${project.id}/tasks`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (tasksResponse.ok) {
                const tasks = await tasksResponse.json()
                if (tasks.length > 0) {
                    testProject = project
                    testTasks = tasks
                    break
                }
            }
        }

        if (!testProject || testTasks.length === 0) {
            console.log('ℹ️ No projects with tasks found. Create tasks first to test.')
            return
        }

        console.log(`📋 Testing with project: ${testProject.name} (${testTasks.length} tasks)`)

        // Find a task that's not already completed
        const incompleteTask = testTasks.find(task => task.status !== 'done')

        if (!incompleteTask) {
            console.log('ℹ️ All tasks are already completed. Mark some as incomplete first.')
            return
        }

        console.log(`🎯 Testing completion of task: ${incompleteTask.title}`)

        // Try to complete the task
        const updateResponse = await fetch(`http://localhost:3000/api/tasks/${incompleteTask.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'done'
            }),
        })

        const result = await updateResponse.text()

        if (updateResponse.ok) {
            console.log('✅ Task completion successful!')
            console.log('📊 Response:', JSON.parse(result))
        } else {
            console.error('❌ Task completion failed!')
            console.error('📊 Status:', updateResponse.status)
            console.error('📊 Response:', result)
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error)
    }
}

// Run the test
testTaskCompletion()
