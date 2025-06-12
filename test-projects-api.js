// Test script to verify projects API is working
const testProjectsAPI = async () => {
    console.log('🔍 Testing Projects API...')
    
    try {
        // Test the API endpoint
        const response = await fetch('http://localhost:3001/api/projects', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        console.log('📊 Response status:', response.status)
        
        if (response.ok) {
            const data = await response.json()
            console.log('✅ API Response:', {
                totalProjects: data.data?.length || 0,
                pagination: data.pagination,
                firstProject: data.data?.[0] ? {
                    id: data.data[0].id,
                    name: data.data[0].name,
                    status: data.data[0].status
                } : null
            })
        } else {
            console.error('❌ API Error:', response.status, await response.text())
        }
    } catch (error) {
        console.error('❌ Network Error:', error.message)
    }
}

// Run if this is the main module
if (typeof window === 'undefined') {
    testProjectsAPI()
}

module.exports = testProjectsAPI
