import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/@types/database'

export function createSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Export singleton instance for use in client components
export const supabase = createSupabaseClient()
