import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateProfileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    avatar_url: z.string().optional(),
    timezone: z.string().min(1, 'Timezone is required'),
    dial_code: z.string().optional(),
    phone_number: z.string().optional(),
    country: z.string().optional(),
    address: z.string().optional(),
    postcode: z.string().optional(),
    city: z.string().optional(),
})

/**
 * Simple and robust user profile update
 * Uses UPSERT to handle both create and update scenarios
 */
export async function PUT(request: NextRequest) {
    try {
        console.log('🔄 PUT /api/user/profile - Starting request')

        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - no valid session' },
                { status: 401 }
            )
        }

        // Parse and validate the request body
        const body = await request.json()
        console.log('📝 Parsing request body...')
        const validatedData = updateProfileSchema.parse(body)
        console.log('✅ Data validated successfully')

        // Create Supabase client with fallback
        console.log('🔗 Creating Supabase client...')
        let supabase
        let clientType = 'unknown'

        try {
            supabase = createSupabaseServiceClient()
            clientType = 'service_role'
            console.log('✅ Using service role client')
        } catch (error) {
            console.warn('⚠️ Service role not available, using authenticated server client')
            const { createSupabaseServerClient } = await import('@/lib/supabase/server')
            supabase = await createSupabaseServerClient()
            clientType = 'authenticated'
            console.log('✅ Using authenticated server client')
        }

        // Prepare update data
        const updateData = {
            id: session.user.id,
            name: validatedData.name,
            email: validatedData.email,
            avatar_url: validatedData.avatar_url || null,
            timezone: validatedData.timezone,
            dial_code: validatedData.dial_code || null,
            phone_number: validatedData.phone_number || null,
            country: validatedData.country || null,
            address: validatedData.address || null,
            postcode: validatedData.postcode || null,
            city: validatedData.city || null,
            updated_at: new Date().toISOString(),
            // Ensure admin users keep their role
            role: session.user.role || 'member'
        }

        console.log('📊 Upserting profile with client type:', clientType)

        // Use UPSERT to handle both create and update
        const { data, error } = await supabase
            .from('users')
            .upsert(updateData, {
                onConflict: 'id',
                ignoreDuplicates: false
            })
            .select()
            .single()

        if (error) {
            console.error('❌ Database error while upserting profile:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
                userId: session.user.id,
                clientType
            })

            return NextResponse.json(
                {
                    error: 'Failed to update profile',
                    message: error.message,
                    userId: session.user.id
                },
                { status: 500 }
            )
        }

        console.log('✅ Profile upserted successfully:', data.name)
        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            data
        })

    } catch (error) {
        console.error('💥 Unexpected error in PUT /api/user/profile:', error)

        if (error instanceof z.ZodError) {
            console.error('❌ Validation error:', error.errors)
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        console.log('🔍 GET /api/user/profile - Starting request')

        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - no valid session' },
                { status: 401 }
            )
        }

        console.log('📱 Session data:', {
            hasSession: !!session,
            userId: session.user.id,
            userEmail: session.user.email
        })

        // Create Supabase client with fallback
        console.log('🔗 Creating Supabase client...')
        let supabase
        let clientType = 'unknown'

        try {
            supabase = createSupabaseServiceClient()
            clientType = 'service_role'
            console.log('✅ Using service role client')
        } catch (error) {
            console.warn('⚠️ Service role not available, using authenticated server client')
            const { createSupabaseServerClient } = await import('@/lib/supabase/server')
            supabase = await createSupabaseServerClient()
            clientType = 'authenticated'
            console.log('✅ Using authenticated server client')
        }

        console.log('📊 Querying user profile for ID:', session.user.id)
        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

        if (error) {
            console.error('❌ Database error while fetching profile:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
                userId: session.user.id,
                clientType
            })

            return NextResponse.json(
                {
                    error: 'Failed to fetch profile',
                    message: error.message
                },
                { status: 500 }
            )
        }

        if (!profile) {
            return NextResponse.json(
                {
                    error: 'Profile not found',
                    message: 'User profile does not exist'
                },
                { status: 404 }
            )
        }

        console.log('✅ Profile retrieved successfully:', profile.name)
        return NextResponse.json({
            success: true,
            data: profile
        })

    } catch (error) {
        console.error('💥 Unexpected error in GET /api/user/profile:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
