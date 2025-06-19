// Test script to verify database connections are working
console.log('🧪 Testing database connections...')

// Test 1: Projects CRUD
async function testProjectsCrud() {
    try {
        console.log('📋 Testing projects CRUD...')
        const response = await fetch('http://localhost:3000/api/test/projects', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        if (response.ok) {
            const data = await response.json()
            console.log('✅ Projects CRUD working:', data.length, 'projects')
        } else {
            console.error('❌ Projects CRUD failed:', response.status)
        }
    } catch (error) {
        console.error('❌ Projects CRUD error:', error.message)
    }
}

// Test 2: Calendar Events
async function testCalendarEvents() {
    try {
        console.log('📅 Testing calendar events...')
        const response = await fetch('http://localhost:3000/api/calendar/events', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        if (response.ok) {
            const data = await response.json()
            console.log('✅ Calendar events working:', data.data?.length || 0, 'events')
        } else {
            console.error('❌ Calendar events failed:', response.status)
        }
    } catch (error) {
        console.error('❌ Calendar events error:', error.message)
    }
}

// Test 3: Notifications
async function testNotifications() {
    try {
        console.log('🔔 Testing notifications...')
        const response = await fetch('http://localhost:3000/api/notifications', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        if (response.ok) {
            const data = await response.json()
            console.log('✅ Notifications working:', data.length, 'notifications')
        } else {
            console.error('❌ Notifications failed:', response.status)
        }
    } catch (error) {
        console.error('❌ Notifications error:', error.message)
    }
}

// Run all tests
async function runTests() {
    await testProjectsCrud()
    await testCalendarEvents()
    await testNotifications()
    console.log('\n🎉 Database connection tests completed!')
}

// Run if this script is executed directly
if (typeof window === 'undefined') {
    runTests()
} else {
    console.log('Run this script in Node.js environment')
}
