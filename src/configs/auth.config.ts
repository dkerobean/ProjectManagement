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
            // Handle session updates (like avatar upload)
            if (trigger === "update" && session) {
                console.log('🔄 JWT callback - updating token from session:', session)
                // Update token with session data
                if (session.avatar_url) {
                    token.avatar_url = session.avatar_url
                }
                if (session.image) {
                    token.image = session.image
                }
                console.log('✅ JWT callback - updated token avatar_url:', token.avatar_url)
                return token
            }

            // Handle initial sign in
            if (account && user) {
                console.log('🔧 JWT callback - processing user:', user.email, 'with role:', user.role)

                // First, try to use the user data from the authorize function
                // This data already handled the RLS issue
                if (user.role) {
                    console.log('✅ Using user data from authorize function')
                    token.role = user.role
                    token.timezone = user.timezone || 'UTC'
                    token.preferences = user.preferences || undefined
                    token.avatar_url = user.avatar_url || user.image
                    token.name = user.name
                    token.authority = user.authority || [user.role]
                } else {
                    // Fallback: try database, then hardcoded admin
                    try {
                        console.log('🔍 Trying database lookup as fallback...')
                        const supabase = await createSupabaseServerClient()
                        const { data: profile } = await supabase
                            .from('users')
                            .select('*')
                            .eq('email', user.email)
                            .single()

                        if (profile) {
                            console.log('✅ Database lookup successful')
                            token.role = profile.role
                            token.timezone = profile.timezone
                            token.preferences = profile.preferences || undefined
                            token.avatar_url = profile.avatar_url
                            token.name = profile.name
                            token.authority = [profile.role]
                        } else {
                            throw new Error('No profile found')
                        }                    } catch (error) {
                        console.error('⚠️ Database lookup failed, using hardcoded admin fallback:', (error as Error).message)
                        console.log('🔍 Checking user email for admin fallback:', user.email)

                        // Final fallback - assign admin role for admin email
                        if (user.email === 'admin@projectmgt.com') {
                            console.log('🔑 Assigning admin role for admin email:', user.email)
                            token.role = 'admin'
                            token.timezone = 'UTC'
                            token.preferences = undefined
                            token.avatar_url = user.image
                            token.name = user.name || 'Admin'
                            token.authority = ['admin']
                        } else {
                            console.log('👤 Assigning member role for regular user:', user.email)
                            token.role = 'member'
                            token.timezone = 'UTC'
                            token.preferences = undefined
                            token.avatar_url = user.image
                            token.name = user.name
                            token.authority = ['member']
                        }
                    }
                }

                console.log('🎯 Final token role:', token.role, 'for user:', user.email)
            }
            return token
        },        async session({ session, token }) {
            /** apply extra user attributes here, for example, we add 'authority' & 'id' in this section */
            console.log('🎭 Session callback - token role:', token.role, 'for user:', token.email || session.user.email)
            console.log('🎭 Session callback - token avatar_url:', token.avatar_url)
            console.log('🎭 Session callback - session.user.image:', session.user.image)

            const finalSession = {
                ...session,
                user: {
                    ...session.user,
                    id: token.sub,
                    role: token.role || 'member',
                    timezone: token.timezone || 'UTC',
                    preferences: token.preferences,
                    avatar_url: token.avatar_url || session.user.image,
                    authority: token.authority || [token.role || 'member'],
                },
            }

            console.log('🎯 Final session role:', finalSession.user.role, 'authority:', finalSession.user.authority)
            console.log('🎯 Final session avatar_url:', finalSession.user.avatar_url)
            return finalSession
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
