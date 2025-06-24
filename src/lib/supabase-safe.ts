import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Safe Supabase client creator that handles missing service role key gracefully
 * Returns null if service role key is not configured (for development)
 */
export async function createSafeSupabaseServerClient() {
    // Check if service role key is properly configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY.includes('REPLACE_WITH')) {
        console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not configured - some features will be disabled in development')
        return null
    }

    try {
        return await createSupabaseServerClient()
    } catch (error) {
        console.error('❌ Failed to create Supabase client:', error)
        return null
    }
}

/**
 * Check if Supabase is properly configured for server-side operations
 */
export function isSupabaseConfigured(): boolean {
    return !!(process.env.SUPABASE_SERVICE_ROLE_KEY &&
              !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('REPLACE_WITH'))
}
