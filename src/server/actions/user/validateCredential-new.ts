'use server'
import type { SignInCredential } from '@/@types/auth'
import { createClient } from '@supabase/supabase-js'

const validateCredential = async (values: SignInCredential) => {
    const { email, password } = values

    try {
        console.log('Validating credentials for:', email)

        // Create a Supabase client for authentication
        const supabaseAuth = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Attempt to sign in with Supabase
        const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            console.error('Supabase auth error:', authError)
            return null
        }

        if (!authData.user) {
            console.error('No user data returned from Supabase')
            return null
        }

        console.log('Supabase auth successful for user:', authData.user.id)
        console.log('User email confirmed:', authData.user.email_confirmed_at)

        // For now, skip the complex database query that causes policy recursion
        // and create a user profile from the auth data directly
        console.log('Creating profile from auth data to avoid policy issues')

        const userProfile = {
            id: authData.user.id,
            email: authData.user.email!,
            name: authData.user.user_metadata?.name || authData.user.email!.split('@')[0],
            role: 'member',
            timezone: 'UTC'
        }

        console.log('Profile created:', userProfile)

        // Return user data in the format expected by NextAuth
        return {
            id: authData.user.id,
            userName: userProfile.name,
            email: authData.user.email!,
            avatar: authData.user.user_metadata?.avatar_url,
            role: userProfile.role,
            timezone: userProfile.timezone,
            preferences: null,
        }
    } catch (error) {
        console.error('Error validating credentials:', error)
        return null
    }
}

export default validateCredential
