// Test script to verify tasks are saved to database when creating a project
const BASE_URL = 'http://localhost:3002'

async function testTaskCreationWithProject() {
    console.log('🧪 Testing task creation when creating a project...')
    
    try {
        // Test data for project with tasks
        const projectData = {
            name: `Test Project with Tasks - ${new Date().toISOString()}`,
            description: 'A test project to verify task saving functionality',
            status: 'active',
            priority: 'medium',
            start_date: '2025-06-15',
            end_date: '2025-07-15',
            metadata: {},
            team_members: [],
            tasks: [
                {
                    title: 'Setup project infrastructure',
                    status: 'todo',
                    priority: 'high',
                    due_date: '2025-06-20'
                },
                {
                    title: 'Create database schema',
                    status: 'todo', 
                    priority: 'medium',
                    due_date: '2025-06-25'
                },
                {
                    title: 'Implement user authentication',
                    status: 'todo',
                    priority: 'high',
                    due_date: '2025-06-30'
                }
            ]
        }

        console.log('📋 Creating project with tasks:', projectData.name)
        console.log('📝 Number of tasks to create:', projectData.tasks.length)

        // Create the project
        const projectResponse = await fetch(`${BASE_URL}/api/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(projectData),
        })

        if (!projectResponse.ok) {
            const errorData = await projectResponse.json()
            throw new Error(`Failed to create project: ${JSON.stringify(errorData)}`)
        }

        const { data: createdProject } = await projectResponse.json()
        console.log('✅ Project created:', createdProject.name, 'ID:', createdProject.id)

        // Wait a moment for tasks to be created
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Now check if tasks were created in the database
        console.log('\n🔍 Checking if tasks were saved to database...')
        
        const tasksResponse = await fetch(`${BASE_URL}/api/tasks?project_id=${createdProject.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        })

        if (!tasksResponse.ok) {
            const errorData = await tasksResponse.json()
            throw new Error(`Failed to fetch tasks: ${JSON.stringify(errorData)}`)
        }

        const savedTasks = await tasksResponse.json()
        console.log('📊 Tasks found in database:', savedTasks.length)

        if (savedTasks.length === 0) {
            console.log('❌ No tasks found in database! Task saving may not be working.')
            return false
        }

        console.log('\n📋 Tasks in database:')
        savedTasks.forEach((task, index) => {
            console.log(`  ${index + 1}. ${task.title}`)
            console.log(`     Status: ${task.status}`)
            console.log(`     Priority: ${task.priority}`)
            console.log(`     Due Date: ${task.due_date || 'No due date'}`)
            console.log(`     Project ID: ${task.project_id}`)
            console.log('')
        })

        // Verify that all original tasks were saved
        const expectedTaskCount = projectData.tasks.length
        const actualTaskCount = savedTasks.length

        if (actualTaskCount === expectedTaskCount) {
            console.log('✅ All tasks were successfully saved to database!')
            return true
        } else {
            console.log(`❌ Expected ${expectedTaskCount} tasks, but found ${actualTaskCount} in database`)
            return false
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message)
        return false
    }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
    testTaskCreationWithProject().then(success => {
        if (success) {
            console.log('\n🎉 Test completed successfully!')
        } else {
            console.log('\n💥 Test failed!')
        }
    })
}

module.exports = { testTaskCreationWithProject }
