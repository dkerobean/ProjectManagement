import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gafpwitcdoiviixlxnuz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjQxNTksImV4cCI6MjA2NTA0MDE1OX0.RNdmc2PkTYA6oQ-4HRPoRp-z-iinT8v5d6pWx9YRPhk'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For now, we'll simulate user authentication
// In a real app, you'd get this from your auth system
const getCurrentUserId = () => {
    // This is a mock user ID - in reality you'd get this from your auth system
    return 'a8fa04b3-d73c-4048-980a-e94db5ebf70c'
}

export async function GET() {
    try {
        const userId = getCurrentUserId()

        const { data: paymentMethods, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            data: paymentMethods || []
        })
    } catch (error) {
        console.error('Error fetching payment methods:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch payment methods' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = getCurrentUserId()
        const body = await request.json()

        const { method_name, payment_instructions } = body

        // Validate required fields
        if (!method_name || !payment_instructions) {
            return NextResponse.json(
                { success: false, error: 'Method name and payment instructions are required' },
                { status: 400 }
            )
        }

        const { data: paymentMethod, error } = await supabase
            .from('payment_methods')
            .insert({
                user_id: userId,
                method_name,
                payment_instructions,
            })
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            data: paymentMethod
        })
    } catch (error) {
        console.error('Error creating payment method:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create payment method' },
            { status: 500 }
        )
    }
}
