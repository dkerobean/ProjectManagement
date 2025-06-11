const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function debugLoginIssue() {
  const email = 'admin@projectmgt.com'
  const password = 'Admin123!'

  console.log('🔍 Debugging login issue for:', email)

  try {
    // Try to authenticate with Supabase
    console.log('🔐 Testing Supabase authentication...')
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error('❌ Supabase auth error:', authError)
      return
    }

    if (!authData.user) {
      console.error('❌ No user data returned from Supabase')
      return
    }

    console.log('✅ Supabase auth successful')
    console.log('User ID:', authData.user.id)
    console.log('Email confirmed:', authData.user.email_confirmed_at ? '✅ Yes' : '❌ No')

    // Check user profile in database using service role key
    console.log('\n👤 Checking user profile in database...')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError)

      // Check if user exists with email instead
      console.log('\n🔍 Checking by email...')
      const { data: emailProfile, error: emailError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (emailError) {
        console.error('❌ Email profile fetch error:', emailError)
      } else {
        console.log('✅ Found profile by email:', emailProfile)
      }
      return
    }

    if (!profile) {
      console.error('❌ No profile found for user')
      return
    }

    console.log('✅ Profile found:')
    console.log('- ID:', profile.id)
    console.log('- Name:', profile.name)
    console.log('- Email:', profile.email)
    console.log('- Role:', profile.role)
    console.log('- Created:', profile.created_at)

    // Test the validateCredential logic
    console.log('\n🧪 Testing validateCredential logic...')
    const result = {
      id: profile.id,
      userName: profile.name,
      email: profile.email,
      avatar: profile.avatar_url,
      role: profile.role,
      timezone: profile.timezone,
      preferences: profile.preferences,
    }
    console.log('✅ validateCredential would return:', result)

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

debugLoginIssue()
