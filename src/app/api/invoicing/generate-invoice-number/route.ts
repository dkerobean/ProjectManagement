import { NextResponse } from 'next/server'
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
        const currentYear = new Date().getFullYear()

        // Count existing invoices for this user in the current year
        const { data: invoices, error } = await supabase
            .from('invoices')
            .select('invoice_number')
            .eq('user_id', userId)
            .like('invoice_number', `INV-${currentYear}-%`)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error counting invoices:', error)
            // Fallback to timestamp-based number
            const fallbackNumber = `INV-${currentYear}-${Date.now()}`
            return NextResponse.json({
                success: true,
                data: { invoice_number: fallbackNumber }
            })
        }

        const nextSequence = (invoices?.length || 0) + 1
        const invoice_number = `INV-${currentYear}-${nextSequence.toString().padStart(4, '0')}`

        return NextResponse.json({
            success: true,
            data: { invoice_number }
        })
    } catch (error) {
        console.error('Error generating invoice number:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to generate invoice number' },
            { status: 500 }
        )
    }
}
