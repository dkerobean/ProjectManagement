import { NextResponse } from 'next/server'
import checkEnvironmentVariables from '@/utils/env-checker'

// GET /api/health - Health check endpoint with environment validation
export async function GET() {
    try {
        console.log('🏥 Health check endpoint called')

        // Check environment variables
        const envCheck = checkEnvironmentVariables()

        const response = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            envConfigured: envCheck,
            checks: {
                supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
                                   !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('REPLACE_WITH'),
                nextAuthUrl: !!process.env.NEXTAUTH_URL,
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
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        )
    }
}
