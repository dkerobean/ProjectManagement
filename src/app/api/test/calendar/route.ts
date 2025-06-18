import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Simple test endpoint to verify Supabase connection and auth
export async function GET() {
    try {
        console.log('🧪 Testing Supabase connection and auth...')

        // Test auth
        const session = await auth()
        console.log('🔍 Session test:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id,
            userEmail: session?.user?.email
        })

        if (!session?.user?.id) {
            return NextResponse.json({ 
                error: 'No authentication',
                session: null
            }, { status: 401 })
        }

        // Test Supabase connection
        const supabase = await createSupabaseServerClient()
        console.log('✅ Supabase client created')

        // Test database query
        const { data, error } = await supabase
            .from('calendar_events')
            .select('count(*)')
            .eq('user_id', session.user.id)

        if (error) {
            console.error('❌ Database test error:', error)
            return NextResponse.json({ 
                error: 'Database connection failed',
                details: error.message,
                session: {
                    userId: session.user.id,
                    email: session.user.email
                }
            }, { status: 500 })
        }

        console.log('✅ Database test successful')

        return NextResponse.json({
            success: true,
            message: 'All tests passed',
            session: {
                userId: session.user.id,
                email: session.user.email
            },
            databaseResult: data
        })

    } catch (error) {
        console.error('💥 Test error:', error)
        return NextResponse.json({
            error: 'Test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
