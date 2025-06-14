// Test script to verify project deletion functionality
const BASE_URL = 'http://localhost:3002'

async function testProjectDeletion() {
    console.log('🧪 Testing Project Deletion Functionality...')

    try {
        // First, create a test project via API
        console.log('📝 Creating test project for deletion...')

        const createResponse = await fetch(`${BASE_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                name: 'Delete Test Project',
                description: 'This project will be deleted for testing',
                priority: 'medium'
            }),
        })

        if (!createResponse.ok) {
            throw new Error(`Failed to create test project: ${createResponse.statusText}`)
        }

        const newProject = await createResponse.json()
        const projectId = newProject.data.id
        console.log('✅ Test project created:', projectId)

        // Verify project exists
        const getResponse = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        })

        if (getResponse.ok) {
            console.log('✅ Project exists before deletion')
        }

        // Now delete the project
        console.log('🗑️ Deleting project...')
        const deleteResponse = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
            method: 'DELETE',
            credentials: 'include',
        })

        if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json()
            throw new Error(`Failed to delete project: ${JSON.stringify(errorData)}`)
        }

        console.log('✅ Project deletion API call successful')

        // Verify project no longer exists
        const verifyResponse = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        })

        if (verifyResponse.status === 404) {
            console.log('✅ Project successfully deleted from database')
        } else {
            console.log('❌ Project still exists after deletion!')
        }

        console.log('\n✅ Delete functionality test completed!')
        console.log('📋 Expected behavior:')
        console.log('1. Project should be completely removed from database')
        console.log('2. All related tasks and members should be deleted')
        console.log('3. Project should not reappear after page refresh')

    } catch (error) {
        console.error('❌ Test failed:', error.message)
    }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
    testProjectDeletion()
}

module.exports = { testProjectDeletion }
