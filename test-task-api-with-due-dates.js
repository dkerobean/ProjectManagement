// Test script for task API with due dates
const BASE_URL = 'http://localhost:3002'

async function testTaskAPI() {
    console.log('🧪 Testing Task API with due dates...')
    
    try {
        // First, get a project to add tasks to
        const projectsResponse = await fetch(`${BASE_URL}/api/projects`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        })
        
        if (!projectsResponse.ok) {
            throw new Error(`Failed to fetch projects: ${projectsResponse.statusText}`)
        }
        
        const projects = await projectsResponse.json()
        console.log('📋 Available projects:', projects.length)
        
        if (projects.length === 0) {
            console.log('❌ No projects found. Please create a project first.')
            return
        }
        
        const project = projects[0]
        console.log('📌 Using project:', project.name, project.id)
        
        // Test 1: Create a task with due date
        console.log('\n🧪 Test 1: Creating task with due date...')
        const createResponse = await fetch(`${BASE_URL}/api/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                title: 'Test Task with Due Date',
                project_id: project.id,
                due_date: '2025-06-20',
                priority: 'high',
                status: 'todo'
            }),
        })
        
        if (!createResponse.ok) {
            const errorData = await createResponse.json()
            throw new Error(`Failed to create task: ${JSON.stringify(errorData)}`)
        }
        
        const newTask = await createResponse.json()
        console.log('✅ Task created:', newTask.title, 'Due:', newTask.due_date)
        
        // Test 2: Update task status
        console.log('\n🧪 Test 2: Updating task status...')
        const updateResponse = await fetch(`${BASE_URL}/api/tasks/${newTask.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                status: 'done'
            }),
        })
        
        if (!updateResponse.ok) {
            const errorData = await updateResponse.json()
            throw new Error(`Failed to update task: ${JSON.stringify(errorData)}`)
        }
        
        const updatedTask = await updateResponse.json()
        console.log('✅ Task updated:', updatedTask.status, 'Completed at:', updatedTask.completed_at)
        
        // Test 3: Get tasks for project
        console.log('\n🧪 Test 3: Fetching tasks for project...')
        const tasksResponse = await fetch(`${BASE_URL}/api/tasks?project_id=${project.id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        })
        
        if (!tasksResponse.ok) {
            const errorData = await tasksResponse.json()
            throw new Error(`Failed to fetch tasks: ${JSON.stringify(errorData)}`)
        }
        
        const tasks = await tasksResponse.json()
        console.log('✅ Tasks fetched:', tasks.length)
        tasks.forEach(task => {
            console.log(`  - ${task.title} (${task.status}) Due: ${task.due_date || 'No due date'}`)
        })
        
        console.log('\n✅ All tests passed!')
        
    } catch (error) {
        console.error('❌ Test failed:', error.message)
    }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
    testTaskAPI()
}

module.exports = { testTaskAPI }
