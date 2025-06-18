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
                        console.log('🔍 Checking user email for admin fallback:', user.email)                        // Final fallback - assign admin role for admin emails
                        const adminEmails = ['admin@projectmgt.com', 'superadmin@projectmgt.com', 'frogman@gmail.com']
                        if (adminEmails.includes(user.email || '')) {
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
            console.log('🎭 Session callback - session.user.image:', session.user.image)            // Check if we need to refresh profile data (every 5 minutes)
            const now = new Date().toISOString()
            const lastSync = token.lastProfileSync
            const needsRefresh = !lastSync ||
                (new Date(now).getTime() - new Date(lastSync).getTime()) > 5 * 60 * 1000

            let profileData = token.profile            // Only try to refresh if we have a service role key configured
            if (needsRefresh && token.sub) {
                try {
                    // Check if service role key is properly configured
                    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                    if (serviceKey &&
                        serviceKey !== 'your_service_role_key_here' &&
                        serviceKey !== 'REPLACE_WITH_ACTUAL_SERVICE_ROLE_KEY_FROM_DASHBOARD' &&
                        serviceKey.startsWith('eyJ')) {

                        console.log('🔄 Refreshing user profile data in session...')
                        const supabase = await createSupabaseServerClient()
                        const { data: freshProfile } = await supabase
                            .from('users')
                            .select('phone_number, dial_code, country, address, postcode, city, created_at, updated_at, preferences')
                            .eq('id', token.sub)
                            .single()

                        if (freshProfile) {
                            profileData = {
                                phone_number: freshProfile.phone_number,
                                dial_code: freshProfile.dial_code,
                                country: freshProfile.country,
                                address: freshProfile.address,
                                postcode: freshProfile.postcode,
                                city: freshProfile.city,
                                created_at: freshProfile.created_at,
                                updated_at: freshProfile.updated_at,
                            }
                            console.log('✅ Profile data refreshed successfully')

                            // Update token for next session (if possible)
                            token.profile = profileData
                            token.preferences = freshProfile.preferences
                            token.lastProfileSync = now
                        }
                    } else {
                        console.warn('⚠️ Service role key not properly configured, skipping profile refresh')
                    }
                } catch (error) {
                    console.warn('⚠️ Failed to refresh profile data:', error)
                }
            }

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
                    profile: profileData,
                    lastProfileSync: token.lastProfileSync,
                },
            }

            console.log('🎯 Final session role:', finalSession.user.role, 'authority:', finalSession.user.authority)
            console.log('🎯 Final session avatar_url:', finalSession.user.avatar_url)
            console.log('📊 Profile data included:', !!finalSession.user.profile)
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
