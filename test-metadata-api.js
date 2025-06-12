const fetch = require('node-fetch')

// Test project metadata API endpoints
async function testMetadataAPI() {
    const baseUrl = 'http://localhost:3000'

    console.log('🔍 Testing Project Metadata Management API...\n')

    try {
        // Test 1: Get project templates
        console.log('1. Testing GET /api/projects/templates')
        const templatesResponse = await fetch(`${baseUrl}/api/projects/templates`)
        const templatesData = await templatesResponse.json()
        console.log('✅ Templates response:', templatesData.templates?.length, 'templates found')
        console.log('📋 Available templates:', templatesData.templates?.map(t => t.id).join(', '))

        // Test 2: List projects to get an ID
        console.log('\n2. Testing GET /api/projects to get a project ID')
        const projectsResponse = await fetch(`${baseUrl}/api/projects`)
        const projectsData = await projectsResponse.json()

        if (!projectsData.data || projectsData.data.length === 0) {
            console.log('⚠️ No projects found, creating a test project...')

            // Create a test project
            const createResponse = await fetch(`${baseUrl}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'Test Metadata Project',
                    description: 'A project for testing metadata management',
                    template: 'software',
                    priority: 'medium',
                    status: 'active'
                })
            })

            if (createResponse.ok) {
                const newProject = await createResponse.json()
                console.log('✅ Test project created:', newProject.data?.id)
                projectId = newProject.data?.id
            } else {
                console.log('❌ Failed to create test project:', await createResponse.text())
                return
            }
        } else {
            const projectId = projectsData.data[0].id
            console.log('✅ Using existing project:', projectId)

            // Test 3: Get project metadata
            console.log('\n3. Testing GET /api/projects/[id]/metadata')
            const metadataResponse = await fetch(`${baseUrl}/api/projects/${projectId}/metadata`)

            if (metadataResponse.ok) {
                const metadataData = await metadataResponse.json()
                console.log('✅ Project metadata retrieved')
                console.log('📊 Current metadata:', JSON.stringify(metadataData.metadata, null, 2))
            } else {
                console.log('❌ Failed to get metadata:', await metadataResponse.text())
            }

            // Test 4: Update project metadata
            console.log('\n4. Testing PATCH /api/projects/[id]/metadata')
            const updateResponse = await fetch(`${baseUrl}/api/projects/${projectId}/metadata`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tags: ['test', 'metadata', 'api'],
                    settings: {
                        allowPublicAccess: false,
                        requireApproval: true,
                        autoArchive: false,
                        notificationLevel: 'important'
                    }
                })
            })

            if (updateResponse.ok) {
                const updateData = await updateResponse.json()
                console.log('✅ Metadata updated successfully')
                console.log('📊 Updated metadata keys:', Object.keys(updateData.metadata))
            } else {
                console.log('❌ Failed to update metadata:', await updateResponse.text())
            }

            // Test 5: Get project milestones
            console.log('\n5. Testing GET /api/projects/[id]/metadata/milestones')
            const milestonesResponse = await fetch(`${baseUrl}/api/projects/${projectId}/metadata/milestones`)

            if (milestonesResponse.ok) {
                const milestonesData = await milestonesResponse.json()
                console.log('✅ Milestones retrieved')
                console.log('📊 Milestone stats:', milestonesData.stats)
            } else {
                console.log('❌ Failed to get milestones:', await milestonesResponse.text())
            }

            // Test 6: Update project milestones
            console.log('\n6. Testing PUT /api/projects/[id]/metadata/milestones')
            const updateMilestonesResponse = await fetch(`${baseUrl}/api/projects/${projectId}/metadata/milestones`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    milestones: [
                        {
                            name: 'Project Kickoff',
                            date: '2025-06-15',
                            completed: true,
                            description: 'Initial project setup and planning'
                        },
                        {
                            name: 'MVP Development',
                            date: '2025-07-15',
                            completed: false,
                            description: 'Minimum viable product development'
                        },
                        {
                            name: 'Beta Release',
                            date: '2025-08-15',
                            completed: false,
                            description: 'Beta version release for testing'
                        }
                    ]
                })
            })

            if (updateMilestonesResponse.ok) {
                const milestonesUpdateData = await updateMilestonesResponse.json()
                console.log('✅ Milestones updated successfully')
                console.log('📊 New milestone stats:', milestonesUpdateData.stats)
            } else {
                console.log('❌ Failed to update milestones:', await updateMilestonesResponse.text())
            }

            // Test 7: Get custom fields
            console.log('\n7. Testing GET /api/projects/[id]/metadata/custom-fields')
            const customFieldsResponse = await fetch(`${baseUrl}/api/projects/${projectId}/metadata/custom-fields`)

            if (customFieldsResponse.ok) {
                const customFieldsData = await customFieldsResponse.json()
                console.log('✅ Custom fields retrieved')
                console.log('📊 Available field types:', customFieldsData.availableTypes)
                console.log('📋 Current fields:', customFieldsData.customFields?.length || 0)
            } else {
                console.log('❌ Failed to get custom fields:', await customFieldsResponse.text())
            }

            // Test 8: Update custom fields
            console.log('\n8. Testing PUT /api/projects/[id]/metadata/custom-fields')
            const updateCustomFieldsResponse = await fetch(`${baseUrl}/api/projects/${projectId}/metadata/custom-fields`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customFields: [
                        {
                            name: 'Technology Stack',
                            type: 'multiselect',
                            options: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
                            required: false,
                            description: 'Technologies used in this project',
                            value: ['React', 'TypeScript']
                        },
                        {
                            name: 'Project Priority',
                            type: 'select',
                            options: ['Low', 'Medium', 'High', 'Critical'],
                            required: true,
                            value: 'High'
                        },
                        {
                            name: 'Estimated Hours',
                            type: 'number',
                            required: false,
                            description: 'Total estimated hours for completion',
                            value: 120
                        }
                    ]
                })
            })

            if (updateCustomFieldsResponse.ok) {
                const customFieldsUpdateData = await updateCustomFieldsResponse.json()
                console.log('✅ Custom fields updated successfully')
                console.log('📋 Updated fields:', customFieldsUpdateData.customFields?.length || 0)
            } else {
                console.log('❌ Failed to update custom fields:', await updateCustomFieldsResponse.text())
            }
        }

        console.log('\n🎉 Metadata API testing completed!')

    } catch (error) {
        console.error('❌ Test failed:', error.message)
    }
}

// Run the test
testMetadataAPI()
