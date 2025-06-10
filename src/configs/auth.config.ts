import type { NextAuthConfig } from 'next-auth'
import validateCredential from '../server/actions/user/validateCredential'
import Credentials from 'next-auth/providers/credentials'
import Github from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import { createSupabaseServerClient } from '@/lib/supabase-server'

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
        }),        Credentials({
            async authorize(credentials) {
                /** validate credentials from backend here */
                const user = await validateCredential(
                    credentials as SignInCredential,
                )
                if (!user) {
                    return null
                }

                console.log('Credentials provider - user from validateCredential:', user)

                return {
                    id: user.id,
                    name: user.userName,
                    email: user.email,
                    image: user.avatar,
                    role: user.role,
                    timezone: user.timezone,
                    preferences: user.preferences,
                }
            },
        }),
    ],    callbacks: {        async jwt({ token, user, account }) {
            // Handle initial sign in
            if (account && user) {
                console.log('JWT callback - account provider:', account.provider)
                console.log('JWT callback - user object:', user)

                // For credentials provider, the user object should contain the role
                if (account.provider === 'credentials') {
                    // Type assertion to access custom properties from validateCredential
                    const userWithRole = user as typeof user & { role?: string; timezone?: string; preferences?: any }
                    token.role = userWithRole.role || 'member'
                    token.timezone = userWithRole.timezone || 'UTC'
                    token.preferences = userWithRole.preferences || undefined
                    token.avatar_url = user.image
                    token.name = user.name                } else {
                    // For OAuth providers, default to member role for now
                    token.role = 'member'
                    token.timezone = 'UTC'
                    token.preferences = undefined
                    token.avatar_url = user.image
                    token.name = user.name
                }

                console.log('JWT token role set to:', token.role)
            }
            return token
        },        async session({ session, token }) {
            /** apply extra user attributes here, for example, we add 'authority' & 'id' in this section */
            console.log('Session callback - token role:', token.role)
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.sub,
                    role: token.role || 'member',
                    timezone: token.timezone || 'UTC',
                    preferences: token.preferences || undefined,
                    avatar_url: token.avatar_url || session.user.image,
                    authority: [token.role || 'member'],
                },
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
