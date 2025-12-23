import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Github from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'

/**
 * Auth Config for Edge Runtime (Middleware)
 * This config doesn't import MongoDB - it's used for session validation only
 * The full auth config with MongoDB is in auth.config.ts
 */
export default {
    providers: [
        Github({
            clientId: process.env.GITHUB_AUTH_CLIENT_ID,
            clientSecret: process.env.GITHUB_AUTH_CLIENT_SECRET,
        }),
        Google({
            clientId: process.env.GOOGLE_AUTH_CLIENT_ID,
            clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
        }),
        Credentials({
            // This doesn't do actual validation - just defines the provider
            // Actual validation happens in auth.config.ts
            credentials: {
                email: {},
                password: {},
            },
            async authorize() {
                // Actual auth happens in auth.config.ts (Node.js runtime)
                // This is just for edge middleware compatibility
                return null
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Handle session updates
            if (trigger === "update" && session) {
                if (session.avatar_url) token.avatar_url = session.avatar_url
                if (session.image) token.image = session.image
                return token
            }

            // Handle initial sign in
            if (user) {
                token.role = user.role || 'member'
                token.timezone = user.timezone || 'UTC'
                token.preferences = user.preferences
                token.avatar_url = user.avatar_url || user.image
                token.name = user.name
                token.authority = user.authority || [user.role || 'member']
            }
            
            return token
        },
        async session({ session, token }) {
            if (!session?.user || !token) {
                return session
            }

            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.sub || '',
                    role: token.role || 'member',
                    timezone: token.timezone || 'UTC',
                    preferences: token.preferences,
                    avatar_url: token.avatar_url || session.user.image || '/default-avatar.jpg',
                    authority: token.authority || [token.role || 'member'],
                },
            }
        },
    },
} satisfies NextAuthConfig
