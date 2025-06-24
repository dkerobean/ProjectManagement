import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

// Minimal auth config for testing
const authConfig: NextAuthConfig = {
    providers: [
        Credentials({
            async authorize(credentials) {
                // Simple test authorization
                if (credentials?.email === 'test@example.com' && credentials?.password === 'test123') {
                    return {
                        id: '1',
                        name: 'Test User',
                        email: 'test@example.com',
                        role: 'member',
                        authority: ['member'],
                    }
                }
                return null
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.authority = user.authority
            }
            return token
        },
        async session({ session, token }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.sub,
                    role: token.role || 'member',
                    authority: token.authority || ['member'],
                },
            }
        },
        async signIn({ user, account }) {
            // Only allow credentials
            return account?.provider === 'credentials'
        },
    },
}

export default authConfig
