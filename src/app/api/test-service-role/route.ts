import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function GET() {
    try {
        console.log('🧪 Testing Supabase service role connection...')

        // Test the service client
        const supabase = createSupabaseServiceClient()

        // Try a simple query
        const { data, error } = await supabase
            .from('users')
            .select('id, email, role')
            .limit(1)

        if (error) {
            console.error('❌ Service role test failed:', error)
            return NextResponse.json({
                success: false,
                error: error.message,
                details: error
            }, { status: 500 })
        }

        console.log('✅ Service role test successful')
        return NextResponse.json({
            success: true,
            message: 'Service role key is working correctly',
            userCount: data?.length || 0
        })

    } catch (error) {
        console.error('💥 Service role test error:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
