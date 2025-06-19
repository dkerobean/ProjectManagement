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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const userId = getCurrentUserId()

        const { data: invoice, error } = await supabase
            .from('invoices')
            .select(`
                *,
                invoice_items (*)
            `)
            .eq('id', id)
            .eq('user_id', userId)
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            data: invoice
        })
    } catch (error) {
        console.error('Error fetching invoice:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch invoice' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const userId = getCurrentUserId()
        const body = await request.json()

        const { status } = body

        // Validate and normalize status
        if (status && !['Draft', 'Sent', 'Paid', 'draft', 'sent', 'paid'].includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Invalid status' },
                { status: 400 }
            )
        }

        // Normalize status to lowercase to match database constraint
        const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : undefined

        const { data: invoice, error } = await supabase
            .from('invoices')
            .update({
                status: normalizedStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            data: invoice
        })
    } catch (error) {
        console.error('Error updating invoice:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update invoice' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const userId = getCurrentUserId()

        // First delete invoice items
        const { error: itemsError } = await supabase
            .from('invoice_items')
            .delete()
            .eq('invoice_id', id)

        if (itemsError) {
            throw itemsError
        }

        // Then delete the invoice
        const { error: invoiceError } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (invoiceError) {
            throw invoiceError
        }

        return NextResponse.json({
            success: true
        })
    } catch (error) {
        console.error('Error deleting invoice:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete invoice' },
            { status: 500 }
        )
    }
}
