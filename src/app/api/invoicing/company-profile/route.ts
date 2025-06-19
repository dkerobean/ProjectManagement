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

        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error
        }

        return NextResponse.json({
            success: true,
            data: profile
        })
    } catch (error) {
        console.error('Error fetching company profile:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch company profile' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = getCurrentUserId()
        const body = await request.json()

        const { company_name, company_address, phone_number, contact_email, logo_url } = body

        // Validate required fields
        if (!company_name) {
            return NextResponse.json(
                { success: false, error: 'Company name is required' },
                { status: 400 }
            )
        }

        const { data: profile, error } = await supabase
            .from('user_profiles')
            .insert({
                user_id: userId,
                company_name,
                company_address,
                phone_number,
                contact_email,
                logo_url,
            })
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            data: profile
        })
    } catch (error) {
        console.error('Error creating company profile:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create company profile' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const userId = getCurrentUserId()
        const body = await request.json()

        const { company_name, company_address, phone_number, contact_email, logo_url } = body

        // Validate required fields
        if (!company_name) {
            return NextResponse.json(
                { success: false, error: 'Company name is required' },
                { status: 400 }
            )
        }

        const { data: profile, error } = await supabase
            .from('user_profiles')
            .update({
                company_name,
                company_address,
                phone_number,
                contact_email,
                logo_url,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            data: profile
        })
    } catch (error) {
        console.error('Error updating company profile:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update company profile' },
            { status: 500 }
        )
    }
}
