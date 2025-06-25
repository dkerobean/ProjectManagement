import { NextResponse } from 'next/server'

export async function GET() {
    console.log('🧪 Test route hit: /api/debug/env')
    
    return NextResponse.json({
        message: 'Environment Variables Debug',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        vercel: process.env.VERCEL,
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✅' : 'Missing ❌',
        supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌',
        nextauth_url: process.env.NEXTAUTH_URL ? 'Set ✅' : 'Missing ❌',
        nextauth_secret: process.env.NEXTAUTH_SECRET ? 'Set ✅' : 'Missing ❌',
        service_role: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set ✅' : 'Missing ❌'
    })
}
