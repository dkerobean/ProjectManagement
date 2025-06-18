'use server'
import type { SignInCredential } from '@/@types/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const validateCredential = async (values: SignInCredential) => {
    const { email, password } = values

    try {
        console.log('🔐 Validating credentials for:', email)

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
            console.error('❌ Supabase auth error:', authError)
            return null
        }

        if (!authData.user) {
            console.error('❌ No user data returned from Supabase')
            return null
        }

        console.log('✅ Supabase auth successful for user:', authData.user.id)
        console.log('📧 Email confirmed:', authData.user.email_confirmed_at ? 'Yes' : 'No')

        // Try to get user profile from database
        try {
            const supabase = await createSupabaseServerClient()
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single()

            if (profile && !profileError) {
                console.log('✅ Profile found from database:', profile.name, `(${profile.role})`)
                return {
                    id: profile.id,
                    userName: profile.name,
                    email: profile.email,
                    avatar: profile.avatar_url,
                    role: profile.role,
                    timezone: profile.timezone,
                    preferences: profile.preferences,
                }
            }

            console.warn('⚠️ Profile lookup failed, using auth data fallback:', profileError?.message)
        } catch (dbError) {
            console.warn('⚠️ Database connection issue, using auth data fallback:', dbError)
        }

        // Fallback: Create user data from auth information
        console.log('📝 Using fallback user data from Supabase auth')
        console.log('🔍 Email for role assignment:', email)

        // Check if user is admin based on email
        const adminEmails = ['admin@projectmgt.com', 'superadmin@projectmgt.com', 'frogman@gmail.com']
        const fallbackRole = adminEmails.includes(email) ? 'admin' : 'member'
        console.log('🎯 Assigned fallback role:', fallbackRole)

        const fallbackUser = {
            id: authData.user.id,
            userName: authData.user.user_metadata?.name ||
                     authData.user.user_metadata?.full_name ||
                     email.split('@')[0],
            email: authData.user.email!,
            avatar: authData.user.user_metadata?.avatar_url || null,
            role: fallbackRole,
            timezone: 'UTC',
            preferences: null,
        }

        console.log('✅ Returning fallback user data:', fallbackUser)
        return fallbackUser
    } catch (error) {
        console.error('💥 Error validating credentials:', error)
        return null
    }
}

export default validateCredential
