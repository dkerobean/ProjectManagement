// Test script to verify task progress calculation
const BASE_URL = 'http://localhost:3002'

async function testTaskProgress() {
    console.log('🧪 Testing Task Progress Calculation...')

    try {
        // Test the projects API to see if task counts are included
        const projectsResponse = await fetch(`${BASE_URL}/api/projects`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        })

        if (!projectsResponse.ok) {
            throw new Error(`Failed to fetch projects: ${projectsResponse.statusText}`)
        }

        const projects = await projectsResponse.json()
        console.log('📋 Projects with task progress:')

        projects.forEach(project => {
            const progressColor = project.progression > 70 ? '🟢' :
                                 project.progression < 40 ? '🔴' : '🟡'

            console.log(`${progressColor} ${project.name}:`)
            console.log(`   Tasks: ${project.completedTask}/${project.totalTask} (${project.progression}%)`)
            console.log(`   Progress Color: ${project.progression > 70 ? 'Green' :
                                              project.progression < 40 ? 'Red' : 'Orange'}`)
            console.log('')
        })

        console.log('✅ Task progress test completed!')

    } catch (error) {
        console.error('❌ Test failed:', error.message)
    }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
    testTaskProgress()
}

module.exports = { testTaskProgress }
