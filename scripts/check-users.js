// Script to check users in Supabase
// Run this with: node scripts/check-users.js

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env.local file.')
  console.log('Required variables:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkUsers() {
  try {
    console.log('🔍 Checking Supabase users...\n')

    // Check auth.users (Supabase auth table)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    console.log(`📊 Found ${authUsers.users.length} users in auth.users:`)
    authUsers.users.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? '✅ Yes' : '❌ No'}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`)
    })

    // Check custom users table
    console.log('\n' + '='.repeat(50))
    console.log('📋 Checking custom users table...\n')

    const { data: customUsers, error: customError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (customError) {
      console.error('❌ Error fetching custom users:', customError)
      return
    }

    console.log(`📊 Found ${customUsers.length} users in custom users table:`)
    customUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user.id}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Timezone: ${user.timezone}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
    })

    // Check for mismatches
    console.log('\n' + '='.repeat(50))
    console.log('🔍 Checking for mismatches...\n')

    const authUserIds = new Set(authUsers.users.map(u => u.id))
    const customUserIds = new Set(customUsers.map(u => u.id))

    const authOnlyUsers = authUsers.users.filter(u => !customUserIds.has(u.id))
    const customOnlyUsers = customUsers.filter(u => !authUserIds.has(u.id))

    if (authOnlyUsers.length > 0) {
      console.log('⚠️  Users in auth.users but not in custom users table:')
      authOnlyUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`)
      })
    }

    if (customOnlyUsers.length > 0) {
      console.log('⚠️  Users in custom users table but not in auth.users:')
      customOnlyUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`)
      })
    }

    if (authOnlyUsers.length === 0 && customOnlyUsers.length === 0) {
      console.log('✅ All users are properly synchronized!')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the check
checkUsers().then(() => {
  console.log('\n✨ User check complete!')
  process.exit(0)
})
