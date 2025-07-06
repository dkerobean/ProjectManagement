import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const next = searchParams.get('next') || '/dashboards/project'

        console.log('🔐 Auth callback request:', { 
            code: code ? '***' : 'null',
            next,
            url: request.url 
        })

        if (!code) {
            console.error('❌ Missing code parameter')
            return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
        }

        // Create Supabase client for auth
        const supabaseAuth = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Exchange code for session
        const { data, error } = await supabaseAuth.auth.exchangeCodeForSession(code)

        if (error) {
            console.error('❌ Code exchange failed:', error.message)
            return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
        }

        if (!data.user) {
            console.error('❌ No user data returned from code exchange')
            return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
        }

        console.log('✅ Code exchange successful for user:', data.user.email)

        // Create success response with redirect
        const successUrl = new URL(next, request.url)
        successUrl.searchParams.set('authenticated', 'true')
        
        console.log('✅ Redirecting to:', successUrl.toString())
        return NextResponse.redirect(successUrl)

    } catch (error) {
        console.error('❌ Auth callback error:', error)
        return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
    }
}