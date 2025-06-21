import { NextResponse } from 'next/server'
import checkEnvironmentVariables from '@/utils/env-checker'

// GET /api/health - Health check endpoint with environment validation
export async function GET() {
    try {
        console.log('🏥 Health check endpoint called')

        // Check environment variables
        const envCheck = checkEnvironmentVariables()

        // Test Supabase connection
        let supabaseConnectionTest = false
        try {
            const { createClient } = await import('@supabase/supabase-js')
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
            
            if (supabaseUrl && supabaseKey && !supabaseKey.includes('REPLACE_WITH')) {
                const supabase = createClient(supabaseUrl, supabaseKey)
                const { error } = await supabase.from('profiles').select('count').limit(1)
                supabaseConnectionTest = !error
                console.log('Supabase test result:', { success: !error, error: error?.message })
            }
        } catch (error) {
            console.log('Supabase connection test failed:', error)
        }

        const response = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            envConfigured: envCheck,
            supabaseConnectionTest,
            vercelRegion: process.env.VERCEL_REGION || 'unknown',
            vercelUrl: process.env.VERCEL_URL || 'unknown',
            nodeVersion: process.version,
            checks: {
                supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
                supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
                                   !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('REPLACE_WITH'),
                supabaseServiceKeyPlaceholder: process.env.SUPABASE_SERVICE_ROLE_KEY?.includes('REPLACE_WITH') || false,
                nextAuthUrl: !!process.env.NEXTAUTH_URL,
                nextAuthUrlValue: process.env.NEXTAUTH_URL,
                nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
            }
        }

        console.log('✅ Health check completed:', response)

        return NextResponse.json(response)

    } catch (error) {
        console.error('❌ Health check failed:', error)

        return NextResponse.json(
            {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        )
    }
}
