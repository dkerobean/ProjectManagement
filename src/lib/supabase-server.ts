import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/@types/database'

// Helper function to validate environment variables
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }
  
  return { supabaseUrl, supabaseAnonKey }
}

export async function createSupabaseServerClient() {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
    const cookieStore = cookies()

    return createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Handle error if needed
              console.error('Error setting cookie:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options, maxAge: 0 })
            } catch (error) {
              console.error('Error removing cookie:', error)
            }
          },
        },
      }
    )
  } catch (error) {
    console.error('Failed to create Supabase server client:', error)
    throw error
  }
}

export async function createSupabaseServerComponentClient() {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
    const cookieStore = cookies()

    return createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {
            // No-op for server components
          },
          remove() {
            // No-op for server components
          },
        },
      }
    )
  } catch (error) {
    console.error('Failed to create Supabase server component client:', error)
    throw error
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
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Get it from: https://supabase.com/dashboard/project/gafpwitcdoiviixlxnuz/settings/api')
  }

  if (key === 'your_service_role_key_here' || key === 'REPLACE_WITH_ACTUAL_SERVICE_ROLE_KEY_FROM_DASHBOARD') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured properly - still using placeholder value. Please set the actual service role key from Supabase dashboard: https://supabase.com/dashboard/project/gafpwitcdoiviixlxnuz/settings/api')
  }

  // Validate that it looks like a JWT
  if (!key.startsWith('eyJ')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY does not look like a valid JWT token')
  }

  console.log('✅ Service client configuration valid')

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
