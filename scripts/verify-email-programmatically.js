// Script to manually verify email addresses using Supabase client
// This requires admin privileges and should be run server-side

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Note: Use service role key, not anon key

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function verifyUserEmail(userEmail) {
  try {
    // Update user to mark email as confirmed
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId, // You'd need to get the user ID first
      {
        email_confirm: true
      }
    )

    if (error) {
      console.error('Error verifying email:', error)
      return false
    }

    console.log('Email verified successfully:', data)
    return true
  } catch (error) {
    console.error('Unexpected error:', error)
    return false
  }
}

async function getUserByEmail(email) {
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching users:', error)
      return null
    }

    const user = users.find(u => u.email === email)
    return user
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

// Example usage
async function main() {
  const email = 'user@example.com'
  const user = await getUserByEmail(email)

  if (user) {
    console.log('User found:', user.id)
    console.log('Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No')

    if (!user.email_confirmed_at) {
      console.log('Verifying email...')
      // You would call the verification function here
    }
  } else {
    console.log('User not found')
  }
}

// Uncomment to run
// main().catch(console.error)

export { verifyUserEmail, getUserByEmail }
