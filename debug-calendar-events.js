// Test script to debug calendar event creation
// Run this in the browser console on the calendar page

async function testEventCreation() {
    console.log('🧪 Testing calendar event creation...')

    const testEvent = {
        title: 'Test Event',
        start: '2025-06-21T00:00:00+00:00',
        end: '2025-06-22T00:00:00+00:00',
        eventColor: 'red'
    }

    console.log('📤 Sending test event:', testEvent)

    try {
        const response = await fetch('/api/calendar/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testEvent),
        })

        console.log('📡 Response status:', response.status)
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

        const result = await response.json()
        console.log('📥 Response body:', result)

        if (!response.ok) {
            console.error('❌ Request failed:', result)
        } else {
            console.log('✅ Request successful:', result)
        }

    } catch (error) {
        console.error('💥 Network error:', error)
    }
}

// Also test session status
async function testSession() {
    console.log('🔐 Testing session status...')

    try {
        const response = await fetch('/api/auth/session')
        const session = await response.json()
        console.log('👤 Current session:', session)
    } catch (error) {
        console.error('❌ Session check failed:', error)
    }
}

// Run both tests
console.log('🏃‍♂️ Running calendar event debug tests...')
testSession().then(() => testEventCreation())
