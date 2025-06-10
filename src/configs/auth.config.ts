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
        }),
        Credentials({
            async authorize(credentials) {
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
                }
            },
        }),
    ],    callbacks: {
        async jwt({ token, user, account }) {
            // Handle initial sign in
            if (account && user) {
                // Store additional user info in token
                try {
                    const supabase = await createSupabaseServerClient()
                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', user.email)
                        .single()

                    if (profile) {
                        token.role = profile.role
                        token.timezone = profile.timezone
                        token.preferences = profile.preferences
                        token.avatar_url = profile.avatar_url
                        token.name = profile.name
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error)
                }
            }
            return token
        },
        async session({ session, token }) {
            /** apply extra user attributes here, for example, we add 'authority' & 'id' in this section */
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.sub,
                    role: token.role || 'member',
                    timezone: token.timezone || 'UTC',
                    preferences: token.preferences || null,
                    avatar_url: token.avatar_url || session.user.image,
                    authority: [token.role || 'member'],
                },
            }
        },
        async signIn({ user, account, profile }) {
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
