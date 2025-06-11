const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...')

    // Use anon key first to see if we can access the table
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // List all users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(10)

    if (error) {
      console.error('❌ Error fetching users:', error)
      console.log('\n📝 This might be due to Row Level Security (RLS) policies.')
      console.log('The anon key might not have permission to read the users table.')
      return
    }

    console.log('✅ Found', users.length, 'users:')
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Role: ${user.role}`)
    })

    // Check specifically for our admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@projectmgt.com')
      .single()

    if (adminError) {
      console.error('\n❌ Admin user lookup error:', adminError)
    } else {
      console.log('\n✅ Found admin user:', adminUser)
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

checkUsers()
