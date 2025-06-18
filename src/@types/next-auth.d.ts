import type { DefaultSession, DefaultUser } from 'next-auth'
import type { DefaultJWT } from 'next-auth/jwt'

export type UserRole = 'admin' | 'project_manager' | 'member' | 'viewer'

export interface UserPreferences {
    notifications?: {
        email?: boolean
        push?: boolean
        desktop?: boolean
    }
    theme?: 'light' | 'dark' | 'system'
    language?: string
}

export interface UserProfile {
    phone_number?: string
    dial_code?: string
    country?: string
    address?: string
    postcode?: string
    city?: string
    created_at?: string
    updated_at?: string
}

declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id: string
            role: UserRole
            authority: string[]
            timezone: string
            preferences?: UserPreferences
            avatar_url?: string | null
            profile?: UserProfile
            lastProfileSync?: string
        } & DefaultSession['user']
    }

    interface User extends DefaultUser {
        role: UserRole
        authority: string[]
        timezone: string
        preferences?: UserPreferences
        avatar_url?: string | null
        profile?: UserProfile
    }
}

declare module 'next-auth/jwt' {
    interface JWT extends DefaultJWT {
        role: UserRole
        authority: string[]
        timezone: string
        preferences?: UserPreferences
        avatar_url?: string | null
        profile?: UserProfile
        lastProfileSync?: string
    }
}
