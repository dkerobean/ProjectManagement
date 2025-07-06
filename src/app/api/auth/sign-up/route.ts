import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const { email, password, name } = await request.json()

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: { message: 'Email, password, and name are required' } },
                { status: 400 }
            )
        }

        console.log('🔐 Creating new user account for:', email)

        // Create a Supabase client for authentication
        const supabaseAuth = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Create user with Supabase Auth
        const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                },
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://project-management-delta-dun.vercel.app'}/sign-in?email_verified=true`
            }
        })

        if (authError) {
            console.error('❌ Supabase auth signup error:', authError)
            return NextResponse.json(
                { error: { message: authError.message } },
                { status: 400 }
            )
        }

        if (!authData.user) {
            console.error('❌ No user data returned from Supabase signup')
            return NextResponse.json(
                { error: { message: 'Failed to create user account' } },
                { status: 500 }
            )
        }

        console.log('✅ Supabase auth signup successful for user:', authData.user.id)

        // Create user profile in database using server client
        try {
            const supabase = await createSupabaseServerClient()
            const { error: profileError } = await supabase
                .from('users')
                .insert([
                    {
                        id: authData.user.id,
                        email: email,
                        name: name,
                        role: 'member',
                        timezone: 'UTC',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }
                ])

            if (profileError) {
                console.error('❌ Error creating user profile:', profileError)
                // Note: User is already created in auth, but profile creation failed
                // This is still considered a success for the user
            } else {
                console.log('✅ User profile created successfully')
            }
        } catch (profileError) {
            console.error('❌ Exception creating user profile:', profileError)
            // Continue - auth user is created successfully
        }

        return NextResponse.json({
            message: 'Account created successfully',
            user: {
                id: authData.user.id,
                email: authData.user.email,
                emailConfirmed: !!authData.user.email_confirmed_at,
            }
        })

    } catch (error) {
        console.error('❌ Sign up API error:', error)
        return NextResponse.json(
            { error: { message: 'An unexpected error occurred. Please try again.' } },
            { status: 500 }
        )
    }
}
