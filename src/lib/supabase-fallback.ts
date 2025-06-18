import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client using anon key with user context
 * This is a fallback for when service role key is not available
 */
export function createSupabaseAnonClient(userAccessToken?: string) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // If we have a user access token, set it for this session
  if (userAccessToken) {
    client.auth.setSession({
      access_token: userAccessToken,
      refresh_token: '', // Not needed for our use case
    })
  }

  return client
}

/**
 * Create a Supabase client that works with authenticated users
 * Uses service role if available, falls back to anon with user context
 */
export async function createSupabaseUserClient() {
  // Try service role first
  try {
    const serviceClient = createSupabaseServiceClient()
    return serviceClient
  } catch (error) {
    console.warn('⚠️ Service role not available, using anon client:', error)

    // Fallback to anon client
    return createSupabaseAnonClient()
  }
}

export function createSupabaseServiceClient() {
  console.log('🔑 Creating Supabase service client...')
  console.log('🌐 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
  console.log('🔐 Service key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  if (key === 'your_service_role_key_here' || key === 'REPLACE_WITH_ACTUAL_SERVICE_ROLE_KEY_FROM_DASHBOARD') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured properly - still using placeholder')
  }

  // Validate that it looks like a JWT
  if (!key.startsWith('eyJ')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY does not look like a valid JWT token')
  }

  console.log('✅ Service client configuration valid')

  return createClient(url, key)
}
