'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import type { UserProfile } from '@/@types/next-auth'

interface UseUserProfileReturn {
    profile: UserProfile | null
    isLoading: boolean
    user: {
        id?: string
        name?: string | null
        email?: string | null
        role?: string
        authority?: string[]
        timezone?: string
        avatar_url?: string | null
        lastProfileSync?: string
    } | null
    hasProfile: boolean
    isAdmin: boolean
    isMember: boolean
    refreshProfile: () => Promise<void>
}

/**
 * Custom hook to access user profile data from NextAuth session
 * This provides easy access to cached user profile information
 * without needing to make API calls every time
 */
export const useUserProfile = (): UseUserProfileReturn => {
    const { data: session, status, update } = useSession()

    const memoizedData = useMemo(() => {
        const user = session?.user
        const profile = user?.profile || null
        const isLoading = status === 'loading'
        const hasProfile = !!profile
        const isAdmin = user?.role === 'admin' || user?.authority?.includes('admin') || false
        const isMember = user?.role === 'member' || user?.authority?.includes('member') || false

        return {
            profile,
            isLoading,
            user: user ? {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                authority: user.authority,
                timezone: user.timezone,
                avatar_url: user.avatar_url,
                lastProfileSync: user.lastProfileSync,
            } : null,
            hasProfile,
            isAdmin,
            isMember,
        }
    }, [session, status])

    const refreshProfile = async () => {
        try {
            console.log('🔄 Refreshing user profile session...')
            await update()
            console.log('✅ Profile session refreshed')
        } catch (error) {
            console.error('❌ Failed to refresh profile session:', error)
        }
    }

    return {
        ...memoizedData,
        refreshProfile,
    }
}

export default useUserProfile
