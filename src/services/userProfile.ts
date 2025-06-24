import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface UserProfile {
    phone_number?: string
    dial_code?: string
    country?: string
    address?: string
    postcode?: string
    city?: string
    created_at?: string
    updated_at?: string
    preferences?: Record<string, unknown>
}

/**
 * Separate service for fetching user profile data
 * Call this only when you actually need the profile data, not in session callback
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        // Check if service role key is properly configured
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!serviceKey || 
            serviceKey === 'your_service_role_key_here' ||
            serviceKey === 'REPLACE_WITH_ACTUAL_SERVICE_ROLE_KEY_FROM_DASHBOARD' ||
            !serviceKey.startsWith('eyJ')) {
            console.warn('⚠️ Service role key not properly configured')
            return null
        }

        const supabase = await createSupabaseServerClient()
        const { data: profile, error } = await supabase
            .from('users')
            .select('phone_number, dial_code, country, address, postcode, city, created_at, updated_at, preferences')
            .eq('id', userId)
            .single()

        if (error) {
            console.error('❌ Failed to fetch user profile:', error)
            return null
        }

        return profile
    } catch (error) {
        console.error('❌ Error fetching user profile:', error)
        return null
    }
}

/**
 * Hook to get user profile data in client components
 * Usage: const profile = await getUserProfile(session.user.id)
 */
export function useUserProfile() {
    // You can implement caching, SWR, or React Query here if needed
    return { getUserProfile }
}
