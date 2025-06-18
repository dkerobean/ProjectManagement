// Test the calendar events API endpoint
// Run this in browser console on the calendar page

async function testCalendarAPI() {
    console.log('🧪 Testing GET /api/calendar/events...')

    try {
        const response = await fetch('/api/calendar/events')
        console.log('📡 Response status:', response.status)

        if (!response.ok) {
            const errorData = await response.json()
            console.error('❌ API error:', errorData)
            return
        }

        const result = await response.json()
        console.log('✅ API response:', result)
        console.log('📊 Events count:', result.data?.length || 0)

        if (result.data && result.data.length > 0) {
            console.log('🎯 Sample event:', result.data[0])
        }

    } catch (error) {
        console.error('💥 Network error:', error)
    }
}

// Also test current store state
function checkStoreState() {
    console.log('🔍 Current calendar store state:')

    // Access the store (this might vary depending on how Zustand is set up)
    const calendarStore = window.__ZUSTAND_STORES__?.calendar || 'Store not accessible'
    console.log('📦 Store data:', calendarStore)
}

console.log('🏃‍♂️ Running calendar API tests...')
testCalendarAPI()
checkStoreState()
