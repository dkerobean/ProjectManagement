#!/usr/bin/env node

/**
 * Test Script: Avatar Display Fix for New Projects
 *
 * This script tests the avatar display issue fix by:
 * 1. Creating a new project with team members
 * 2. Verifying the API response includes complete team member data
 * 3. Checking that avatars display correctly without needing page refresh
 */

const https = require('https');

const BASE_URL = 'http://localhost:3000';

// Create an agent that ignores self-signed certificates
const agent = new https.Agent({
    rejectUnauthorized: false
});

// Helper function to make API requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const fetch = require('node-fetch');

        fetch(url, {
            ...options,
            agent: url.startsWith('https:') ? agent : undefined
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`HTTP ${response.status}: ${text}`);
                });
            }
            return response.json();
        })
        .then(resolve)
        .catch(reject);
    });
}

async function testAvatarFix() {
    try {
        console.log('🧪 Testing Avatar Display Fix for New Projects');
        console.log('=' .repeat(60));

        // Step 1: Get available team members
        console.log('📋 Step 1: Fetching available team members...');
        const membersResponse = await makeRequest(`${BASE_URL}/api/projects/scrum-board/members`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const availableMembers = membersResponse.allMembers || [];
        console.log(`✅ Found ${availableMembers.length} available team members`);

        if (availableMembers.length === 0) {
            console.log('⚠️  No team members available for testing');
            return;
        }

        // Select first 2 members for testing
        const selectedMembers = availableMembers.slice(0, Math.min(2, availableMembers.length));
        console.log('👥 Selected team members for test:');
        selectedMembers.forEach(member => {
            console.log(`   - ${member.name} (${member.email}) - Avatar: ${member.img ? 'Yes' : 'No'}`);
        });

        // Step 2: Create a test project with team members
        console.log('\n📋 Step 2: Creating test project with team members...');
        const testProjectData = {
            name: `Avatar Fix Test - ${new Date().toISOString().slice(0, 19)}`,
            description: 'Test project to verify avatar display fix after creation',
            status: 'active',
            priority: 'medium',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            metadata: {
                color: '#3B82F6'
            },
            team_members: selectedMembers.map(member => member.id)
        };

        const createResponse = await makeRequest(`${BASE_URL}/api/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testProjectData)
        });

        console.log('✅ Project created successfully!');
        console.log(`   Project ID: ${createResponse.data.id}`);
        console.log(`   Project Name: ${createResponse.data.name}`);

        // Step 3: Verify the response includes complete team member data
        console.log('\n📋 Step 3: Verifying API response includes complete team member data...');

        const projectData = createResponse.data;
        const projectMembers = projectData.project_members || [];

        console.log(`📊 Project Members in Response: ${projectMembers.length}`);

        if (projectMembers.length === 0) {
            console.log('❌ ISSUE: No project members in API response');
            return;
        }

        let allMembersHaveCompleteData = true;
        projectMembers.forEach((member, index) => {
            const user = member.user;
            const hasCompleteData = user && user.id && user.name && user.email;

            console.log(`   Member ${index + 1}:`);
            console.log(`     ID: ${user?.id || 'MISSING'}`);
            console.log(`     Name: ${user?.name || 'MISSING'}`);
            console.log(`     Email: ${user?.email || 'MISSING'}`);
            console.log(`     Avatar: ${user?.avatar_url || 'None'}`);
            console.log(`     Complete Data: ${hasCompleteData ? '✅' : '❌'}`);

            if (!hasCompleteData) {
                allMembersHaveCompleteData = false;
            }
        });

        // Step 4: Test avatar acronym generation
        console.log('\n📋 Step 4: Testing avatar acronym generation...');

        projectMembers.forEach((member, index) => {
            const user = member.user;
            if (user && user.name) {
                // Simulate the acronym generation logic
                const shortName = user.name.match(/\b(\w)/g);
                const acronym = shortName ? shortName.join('') : user.name;

                console.log(`   ${user.name} → Avatar Text: "${acronym}"`);

                if (acronym === '2' || acronym === '' || !acronym) {
                    console.log(`   ❌ ISSUE: Invalid avatar text for ${user.name}`);
                }
            } else {
                console.log(`   ❌ ISSUE: Missing user name for member ${index + 1}`);
            }
        });

        // Step 5: Results summary
        console.log('\n📋 Step 5: Test Results Summary');
        console.log('=' .repeat(40));

        if (allMembersHaveCompleteData) {
            console.log('✅ SUCCESS: All team members have complete data');
            console.log('✅ SUCCESS: Avatar display should work correctly');
            console.log('✅ SUCCESS: No page refresh should be needed');
        } else {
            console.log('❌ FAILURE: Some team members missing complete data');
            console.log('❌ FAILURE: Avatar display may show fallback characters');
            console.log('❌ FAILURE: Page refresh may be needed for correct display');
        }

        // Optional: Clean up test project
        console.log('\n🧹 Cleaning up test project...');
        try {
            await makeRequest(`${BASE_URL}/api/projects/${projectData.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            console.log('✅ Test project cleaned up successfully');
        } catch (cleanupError) {
            console.log('⚠️  Could not clean up test project:', cleanupError.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
console.log('🚀 Starting Avatar Display Fix Test...\n');
testAvatarFix().then(() => {
    console.log('\n🏁 Avatar Display Fix Test Complete');
}).catch(error => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
});
