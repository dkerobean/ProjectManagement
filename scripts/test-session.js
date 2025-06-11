// Test script to check session data
async function testSession() {
  console.log('🧪 Testing session after login...')

  try {
    const response = await fetch('http://localhost:3000/api/auth/session')
    const session = await response.json()

    console.log('📋 Session data:')
    console.log(JSON.stringify(session, null, 2))

    if (session?.user) {
      console.log('\n✅ User session found:')
      console.log('- ID:', session.user.id)
      console.log('- Name:', session.user.name)
      console.log('- Email:', session.user.email)
      console.log('- Role:', session.user.role)
      console.log('- Authority:', session.user.authority)
      console.log('- Timezone:', session.user.timezone)

      if (session.user.role === 'admin') {
        console.log('\n🔑 Admin role confirmed - should have access to dashboard!')
      } else {
        console.log('\n⚠️ Role is not admin:', session.user.role)
      }
    } else {
      console.log('\n❌ No user session found')
    }

  } catch (error) {
    console.error('💥 Error fetching session:', error)
  }
}

testSession()
