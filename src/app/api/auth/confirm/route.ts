import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        const next = searchParams.get('next') || '/dashboards/project'

        console.log('🔐 Auth confirmation request:', { 
            token_hash: token_hash ? '***' : 'null',
            type, 
            next,
            url: request.url 
        })

        if (!token_hash || !type) {
            console.error('❌ Missing token_hash or type parameter')
            return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
        }

        // Create Supabase client for auth verification
        const supabaseAuth = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Verify the OTP token
        const { data, error } = await supabaseAuth.auth.verifyOtp({
            token_hash,
            type: type as any,
        })

        if (error) {
            console.error('❌ Token verification failed:', error.message)
            return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
        }

        if (!data.user) {
            console.error('❌ No user data returned from token verification')
            return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
        }

        console.log('✅ Email verification successful for user:', data.user.email)

        // For email confirmation, update the user's email_confirmed_at if needed
        if (type === 'email' && data.user.email_confirmed_at) {
            try {
                const supabase = await createSupabaseServerClient()
                
                // Update user profile to mark email as confirmed
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ 
                        email_confirmed_at: data.user.email_confirmed_at,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', data.user.id)

                if (updateError) {
                    console.error('❌ Error updating user email confirmation:', updateError)
                }
            } catch (error) {
                console.error('❌ Exception updating user profile:', error)
            }
        }

        // Create success response with redirect
        const successUrl = new URL(next, request.url)
        successUrl.searchParams.set('verified', 'true')
        
        console.log('✅ Redirecting to:', successUrl.toString())
        return NextResponse.redirect(successUrl)

    } catch (error) {
        console.error('❌ Auth confirmation error:', error)
        return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
    }
}