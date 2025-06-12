// Test projects loading functionality
const testProjectsLoading = async () => {
    console.log('🧪 Testing Projects Loading Functionality...')

    try {
        // Test 1: Direct API call
        console.log('\n1. Testing direct API call...')
        const response = await fetch('http://localhost:3001/api/projects', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        })

        console.log('📊 API Response status:', response.status)

        if (response.ok) {
            const data = await response.json()
            console.log('✅ API Success:', {
                totalProjects: data.data?.length || 0,
                projectNames: data.data?.slice(0, 3).map(p => p.name) || [],
                pagination: data.pagination
            })
        } else {
            const errorText = await response.text()
            console.error('❌ API Error:', response.status, errorText)
        }

        // Test 2: Check if we can access the specific database projects
        console.log('\n2. Checking specific projects from our Supabase query...')
        const projectIds = [
            '3cf94769-0e76-44d3-882a-04ee2449331f',
            'dfe8c80c-87d8-4716-aebe-0737b13d7945',
            'd7e699e7-6ef3-439e-a4a6-2f949ce4c240'
        ]

        for (const id of projectIds) {
            try {
                const projectResponse = await fetch(`http://localhost:3001/api/projects/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                })

                if (projectResponse.ok) {
                    const projectData = await projectResponse.json()
                    console.log(`✅ Project ${id}:`, projectData.data?.name)
                } else {
                    console.log(`❌ Project ${id}: ${projectResponse.status}`)
                }
            } catch (error) {
                console.log(`❌ Project ${id}: ${error.message}`)
            }
        }

    } catch (error) {
        console.error('❌ Test Error:', error.message)
    }
}

// Run the test
testProjectsLoading()
