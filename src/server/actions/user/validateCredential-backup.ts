'use server'
import type { SignInCredential } from '@/@types/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
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
        console.log('User email confirmed:', authData.user.email_confirmed_at)        // Get user profile from database
        const supabase = await createSupabaseServerClient()
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single()

        if (profileError) {
            console.error('Profile fetch error:', profileError)
            
            // Handle specific policy recursion error
            if (profileError.code === '42P17') {
                console.log('Database policy recursion detected - creating minimal profile')
                // For now, create a minimal user profile from auth data
                const minimalProfile = {
                    id: authData.user.id,
                    email: authData.user.email,
                    name: authData.user.user_metadata?.name || authData.user.email!.split('@')[0],
                    role: 'member',
                    timezone: 'UTC'
                }
                
                return {
                    id: authData.user.id,
                    userName: minimalProfile.name,
                    email: authData.user.email!,
                    avatar: authData.user.user_metadata?.avatar_url,
                    role: minimalProfile.role,
                    timezone: minimalProfile.timezone,
                    preferences: null,
                }
            }
            
            return null
        }

        if (!profile) {
            console.error('No profile found for user:', authData.user.id)
            return null
        }

        console.log('Profile found:', profile)

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
