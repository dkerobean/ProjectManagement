import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    console.log('🔍 Environment check API route hit:', request.url)
    
    const envVars = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'Set' : 'Missing',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
        NODE_ENV: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        url: request.url
    }
    
    console.log('Environment variables status:', envVars)
    
    return NextResponse.json(envVars)
}
