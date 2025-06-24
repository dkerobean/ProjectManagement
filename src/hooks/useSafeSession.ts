'use client'

import { useSession } from "next-auth/react"
import { useCallback } from 'react'
import type { Session } from 'next-auth'

export interface SafeUser {
    id: string
    name: string
    email: string
    image: string
    role: string
    timezone: string
    authority: string[]
    avatar_url?: string
    preferences?: Record<string, unknown>
}

export interface SafeSessionReturn {
    isAuthenticated: boolean
    isLoading: boolean
    user: SafeUser
    updateSession: () => Promise<Session | null>
    session: Session | null
}

/**
 * Safe session hook following Context7 best practices
 * Provides fallback values and safe destructuring to prevent production errors
 */
export default function useSafeSession(): SafeSessionReturn {
    const { data: session, status, update } = useSession()
    
    // Safe session building with comprehensive fallbacks
    const safeSession = session || null
    const user = safeSession?.user
    
    // Construct safe user object with all required fields - using unknown cast for production safety
    const safeUser: SafeUser = {
        id: (user as unknown as SafeUser)?.id || '',
        name: user?.name || '',
        email: user?.email || '',
        image: user?.image || '/default-avatar.jpg',
        role: (user as unknown as SafeUser)?.role || 'guest',
        timezone: (user as unknown as SafeUser)?.timezone || 'UTC',
        authority: Array.isArray((user as unknown as SafeUser)?.authority) 
            ? (user as unknown as SafeUser).authority
            : [(user as unknown as SafeUser)?.role || 'guest'],
        avatar_url: (user as unknown as SafeUser)?.avatar_url || user?.image || '/default-avatar.jpg',
        preferences: (user as unknown as SafeUser)?.preferences || undefined,
    }

    // Safe session update function with error handling
    const updateSession = useCallback(async (): Promise<Session | null> => {
        try {
            const result = await update()
            return result || null
        } catch (error) {
            console.error('❌ Session update failed:', error)
            return null
        }
    }, [update])
    
    return {
        isAuthenticated: status === 'authenticated',
        isLoading: status === 'loading',
        user: safeUser,
        updateSession,
        session: safeSession,
    }
}

/**
 * Hook specifically for checking authentication status
 */
export function useAuthStatus() {
    const { isAuthenticated, isLoading } = useSafeSession()
    return { isAuthenticated, isLoading }
}

/**
 * Hook for getting safe user data only
 */
export function useSafeUser() {
    const { user, isAuthenticated } = useSafeSession()
    return { user, isAuthenticated }
}
