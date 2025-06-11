const { createClient } = require('@supabase/supabase-js')
const { createSupabaseServerClient } = require('../src/lib/supabase-server')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function debugLoginIssue() {
  const email = 'admin@projectmgt.com'
  const password = 'Admin123!'

  console.log('🔍 Debugging login issue for:', email)

  try {
    // Check environment variables
    console.log('📋 Environment variables:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')

    // Try to authenticate with Supabase
    console.log('\n🔐 Testing Supabase authentication...')
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

    // Check user profile in database
    console.log('\n👤 Checking user profile in database...')
    const supabase = await createSupabaseServerClient()
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError)

      // Check if user exists with email instead
      console.log('\n🔍 Checking by email...')
      const { data: emailProfile, error: emailError } = await supabase
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

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

debugLoginIssue()
