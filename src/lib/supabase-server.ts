import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/@types/database'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function createSupabaseServerComponentClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Server Component - no-op
        },
      },
    }
  )
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

  return createClient<Database>(url, key)
}
