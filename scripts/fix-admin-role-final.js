const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function checkAndFixAdminRole() {
  const email = 'admin@projectmgt.com'

  console.log('🔍 Checking and fixing admin role for:', email)

  try {
    // Use service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('📋 Checking current user data...')

    // First, check if user exists by email
    const { data: users, error: getUserError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)

    if (getUserError) {
      console.error('❌ Error fetching user:', getUserError)
      return
    }

    console.log('👥 Found users with email:', users)

    if (!users || users.length === 0) {
      console.log('➕ Creating admin user...')

      // Create the admin user
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: 'e5ec073f-f4c1-4790-b7e4-45cd08a3dfec', // Use the known user ID
          email: email,
          name: 'Admin',
          role: 'admin',
          timezone: 'UTC',
          avatar_url: null,
          preferences: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating admin user:', createError)
      } else {
        console.log('✅ Created admin user:', newUser)
      }
    } else {
      // Update existing user to admin
      const user = users[0]
      console.log('📝 Current user role:', user.role)

      if (user.role !== 'admin') {
        console.log('🔄 Updating user role to admin...')

        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            role: 'admin',
            updated_at: new Date().toISOString()
          })
          .eq('email', email)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Error updating user role:', updateError)
        } else {
          console.log('✅ Updated user role to admin:', updatedUser)
        }
      } else {
        console.log('✅ User already has admin role')
      }
    }

    // Verify the final state
    console.log('\n🔍 Final verification...')
    const { data: finalUser, error: finalError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (finalError) {
      console.error('❌ Error in final verification:', finalError)
    } else {
      console.log('✅ Final user state:')
      console.log('- ID:', finalUser.id)
      console.log('- Email:', finalUser.email)
      console.log('- Name:', finalUser.name)
      console.log('- Role:', finalUser.role)
      console.log('- Created:', finalUser.created_at)
      console.log('- Updated:', finalUser.updated_at)
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

checkAndFixAdminRole()
