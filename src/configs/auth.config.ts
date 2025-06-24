import type { NextAuthConfig } from 'next-auth'
import validateCredential from '../server/actions/user/validateCredential'
import Credentials from 'next-auth/providers/credentials'
import Github from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import { createSupabaseServerClient } from '@/lib/supabase/server'

import type { SignInCredential } from '@/@types/auth'

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
        Credentials({            async authorize(credentials) {
                /** validate credentials from backend here */
                const user = await validateCredential(
                    credentials as SignInCredential,
                )
                if (!user) {
                    return null
                }

                return {
                    id: user.id,
                    name: user.userName,
                    email: user.email,
                    image: user.avatar,
                    role: user.role,
                    authority: [user.role],
                    timezone: user.timezone,
                    preferences: user.preferences,
                    avatar_url: user.avatar,
                }
            },
        }),
    ],    callbacks: {        async jwt({ token, user, account, trigger, session }) {
            // Following Context7 best practices for JWT callbacks
            
            // Handle session updates (avatar upload, etc.)
            if (trigger === "update" && session) {
                if (session.avatar_url) token.avatar_url = session.avatar_url
                if (session.image) token.image = session.image
                return token
            }

            // Handle initial sign in - keep this minimal and fast
            if (account && user) {
                // Use data from authorize function if available
                if (user.role) {
                    token.role = user.role
                    token.timezone = user.timezone || 'UTC'
                    token.preferences = user.preferences
                    token.avatar_url = user.avatar_url || user.image
                    token.name = user.name
                    token.authority = user.authority || [user.role]
                } else {
                    // Minimal fallback - avoid database calls in JWT callback
                    const adminEmails = ['admin@projectmgt.com', 'superadmin@projectmgt.com', 'frogman@gmail.com']
                    token.role = adminEmails.includes(user.email || '') ? 'admin' : 'member'
                    token.timezone = 'UTC'
                    token.preferences = undefined
                    token.avatar_url = user.image
                    token.name = user.name
                    token.authority = [token.role]
                }
            }
            
            return token
        },        async session({ session, token }) {
            // CRITICAL: Keep session callback minimal and fast (Context7 best practice)
            // Enhanced error handling - return session as-is if any issues
            if (!session?.user || !token) {
                console.error('❌ Session callback - missing session or token')
                return session
            }

            try {
                // Simple, fast session construction - exactly like Context7 examples
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
            } catch (error) {
                console.error('❌ Session callback error:', error)
                // Return original session on any error
                return session
            }
        },
        async signIn({ user, account }) {
            // Handle OAuth providers (Google, GitHub)
            if (account?.provider !== 'credentials') {
                try {
                    const supabase = await createSupabaseServerClient()

                    // Check if user exists in our database
                    const { data: existingUser } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', user.email)
                        .single()

                    if (!existingUser) {
                        // Create new user profile
                        const { error } = await supabase
                            .from('users')
                            .insert({
                                id: user.id,
                                email: user.email!,
                                name: user.name || '',
                                avatar_url: user.image || null,
                                timezone: 'UTC',
                                role: 'member',
                            })

                        if (error) {
                            console.error('Error creating user profile:', error)
                            return false
                        }
                    }
                } catch (error) {
                    console.error('Error in signIn callback:', error)
                    return false
                }
            }
            return true
        },
    },
} satisfies NextAuthConfig
