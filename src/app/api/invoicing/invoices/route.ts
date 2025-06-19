import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gafpwitcdoiviixlxnuz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjQxNTksImV4cCI6MjA2NTA0MDE1OX0.RNdmc2PkTYA6oQ-4HRPoRp-z-iinT8v5d6pWx9YRPhk'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface InvoiceItem {
    description: string
    quantity: number
    rate: number
}

// For now, we'll simulate user authentication
// In a real app, you'd get this from your auth system
const getCurrentUserId = () => {
    // This is a mock user ID - in reality you'd get this from your auth system
    return 'a8fa04b3-d73c-4048-980a-e94db5ebf70c'
}

// Generate a unique invoice number
const generateInvoiceNumber = async (userId: string) => {
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
        return `INV-${currentYear}-${Date.now()}`
    }

    const nextSequence = (invoices?.length || 0) + 1
    return `INV-${currentYear}-${nextSequence.toString().padStart(4, '0')}`
}

export async function GET() {
    try {
        const userId = getCurrentUserId()

        const { data: invoices, error } = await supabase
            .from('invoices')
            .select(`
                *,
                invoice_items (*)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            data: invoices || []
        })
    } catch (error) {
        console.error('Error fetching invoices:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch invoices' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = getCurrentUserId()
        const body = await request.json()

        const {
            client_name,
            client_email,
            client_address,
            issue_date,
            due_date,
            notes,
            items,
            payment_method_id,
            payment_instructions,
            tax_rate = 0,
            status = 'Draft'
        } = body

        // Validate required fields
        if (!client_name || !issue_date || !due_date || !items || items.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Client name, dates, and items are required' },
                { status: 400 }
            )
        }

        // Generate invoice number
        const invoice_number = await generateInvoiceNumber(userId)

        // Calculate totals
        const subtotal = items.reduce((sum: number, item: InvoiceItem) => sum + (item.quantity * item.rate), 0)
        const tax_amount = (subtotal * tax_rate) / 100
        const total = subtotal + tax_amount

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                user_id: userId,
                created_by: userId,
                invoice_number,
                client_name,
                client_email,
                client_address,
                issue_date,
                date: issue_date,
                due_date,
                status,
                subtotal,
                tax_rate,
                tax_amount,
                total,
                notes,
                payment_method_id,
                payment_instructions,
            })
            .select()
            .single()

        if (invoiceError) {
            throw invoiceError
        }

        // Create invoice items
        const invoiceItems = items.map((item: InvoiceItem, index: number) => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
            position: index
        }))

        const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(invoiceItems)

        if (itemsError) {
            throw itemsError
        }

        // Fetch the complete invoice with items
        const { data: completeInvoice, error: fetchError } = await supabase
            .from('invoices')
            .select(`
                *,
                invoice_items (*)
            `)
            .eq('id', invoice.id)
            .single()

        if (fetchError) {
            throw fetchError
        }

        return NextResponse.json({
            success: true,
            data: completeInvoice
        })
    } catch (error) {
        console.error('Error creating invoice:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create invoice' },
            { status: 500 }
        )
    }
}
