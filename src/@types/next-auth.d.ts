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

declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id: string
            role: UserRole
            authority: string[]
            timezone: string
            preferences?: UserPreferences
            avatar_url?: string | null
        } & DefaultSession['user']
    }

    interface User extends DefaultUser {
        role: UserRole
        authority: string[]
        timezone: string
        preferences?: UserPreferences
        avatar_url?: string | null
    }
}

declare module 'next-auth/jwt' {
    interface JWT extends DefaultJWT {
        role: UserRole
        authority: string[]
        timezone: string
        preferences?: UserPreferences
        avatar_url?: string | null
    }
}
