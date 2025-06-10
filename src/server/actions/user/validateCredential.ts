'use server'
import type { SignInCredential } from '@/@types/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const validateCredential = async (values: SignInCredential) => {
    const { email, password } = values

    try {
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

        if (authError || !authData.user) {
            return null
        }

        // Get user profile from database
        const supabase = await createSupabaseServerClient()
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single()

        if (profileError || !profile) {
            return null
        }

        // Return user data in the format expected by NextAuth
        return {
            id: profile.id,
            userName: profile.name,
            email: profile.email,
            avatar: profile.avatar_url,
            role: profile.role,
            timezone: profile.timezone,
            preferences: profile.preferences,
        }
    } catch (error) {
        console.error('Error validating credentials:', error)
        return null
    }
}

export default validateCredential
