import type { NextAuthConfig } from 'next-auth'
import validateCredential from '../server/actions/user/validateCredential'
import Credentials from 'next-auth/providers/credentials'
import Github from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import connectToDatabase from '@/lib/mongodb'
import User from '@/models/User'

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
                    role: user.role,
                    authority: [user.role],
                    timezone: user.timezone,
                    preferences: user.preferences,
                    avatar_url: user.avatar,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account, trigger, session }) {
            // Following Context7 best practices for JWT callbacks
            console.log('🔍 JWT Callback:', { 
                trigger, 
                hasUser: !!user, 
                hasAccount: !!account, 
                tokenSub: token.sub,
                userEmail: user?.email 
            })

            // Handle session updates (avatar upload, etc.)
            if (trigger === "update" && session) {
                if (session.avatar_url) token.avatar_url = session.avatar_url
                if (session.image) token.image = session.image
                return token
            }

            // Handle initial sign in - keep this minimal and fast
            if (account && user) {
                console.log('🔍 JWT - Processing initial sign-in for:', user.email)
                // Use data from authorize function if available
                if (user.role) {
                    token.role = user.role
                    token.timezone = user.timezone || 'UTC'
                    token.preferences = user.preferences
                    token.avatar_url = user.avatar_url || user.image
                    token.name = user.name
                    token.authority = user.authority || [user.role]
                    console.log('✅ JWT - User data from authorize:', { role: user.role, email: user.email })
                } else {
                    // Minimal fallback - avoid database calls in JWT callback
                    const adminEmails = ['admin@projectmgt.com', 'superadmin@projectmgt.com', 'frogman@gmail.com']
                    token.role = adminEmails.includes(user.email || '') ? 'admin' : 'member'
                    token.timezone = 'UTC'
                    token.preferences = undefined
                    token.avatar_url = user.image
                    token.name = user.name
                    token.authority = [token.role]
                    console.log('✅ JWT - Using fallback data for:', user.email)
                }
            }
            
            console.log('🔍 JWT - Final token:', { sub: token.sub, role: token.role, email: token.email })
            return token
        },
        async session({ session, token }) {
            // CRITICAL: Keep session callback minimal and fast (Context7 best practice)
            console.log('🔍 Session Callback:', { 
                hasSession: !!session, 
                hasUser: !!session?.user, 
                hasToken: !!token,
                tokenSub: token?.sub,
                sessionEmail: session?.user?.email 
            })
            
            // Enhanced error handling - return session as-is if any issues
            if (!session?.user || !token) {
                console.error('❌ Session callback - missing session or token')
                return session
            }

            try {
                // Simple, fast session construction - exactly like Context7 examples
                const enhancedSession = {
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
                console.log('✅ Session enhanced for:', session.user.email, 'Role:', token.role)
                return enhancedSession
            } catch (error) {
                console.error('❌ Session callback error:', error)
                // Return original session on any error
                return session
            }
        },
        async signIn({ user, account }) {
            // Handle OAuth providers (Google, GitHub) - create user in MongoDB
            if (account?.provider !== 'credentials') {
                try {
                    await connectToDatabase()

                    // Check if user exists in MongoDB
                    const existingUser = await User.findOne({ email: user.email?.toLowerCase() })

                    if (!existingUser) {
                        // Create new user profile in MongoDB
                        await User.create({
                            email: user.email?.toLowerCase(),
                            password: 'oauth-no-password-' + Date.now(), // Placeholder for OAuth users
                            name: user.name || 'User',
                            avatar: user.image || null,
                            role: 'member',
                            timezone: 'UTC',
                            isActive: true,
                        })
                        console.log('✅ OAuth user created in MongoDB:', user.email)
                    } else {
                        // Update avatar if changed
                        if (user.image && existingUser.avatar !== user.image) {
                            await User.findByIdAndUpdate(existingUser._id, { avatar: user.image })
                        }
                        console.log('✅ OAuth user exists in MongoDB:', user.email)
                    }
                } catch (error) {
                    console.error('❌ Error in signIn callback:', error)
                    // Don't block login for database errors
                    return true
                }
            }
            return true
        },
    },
} satisfies NextAuthConfig

