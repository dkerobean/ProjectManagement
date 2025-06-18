import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { z } from 'zod'

const updateProfileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    avatar_url: z.string().optional(),
    timezone: z.string().min(1, 'Timezone is required'),
    // Remove fields that don't exist in the database
    // dial_code, phone_number, country, address, postcode, city
})

export async function PUT(request: NextRequest) {
    try {
        console.log('🔄 PUT /api/user/profile - Starting request')

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const validatedData = updateProfileSchema.parse(body)

        let supabase
        let clientType = 'unknown'

        try {
            console.log('🔑 Creating Supabase service client...')
            supabase = createSupabaseServiceClient()
            clientType = 'service_role'
            console.log('✅ Service role client created successfully')

            // Test the service role client
            const { error: testError } = await supabase
                .from('users')
                .select('id')
                .limit(1)

            if (testError) {
                console.error('❌ Service role client test failed:', testError)
                throw new Error('Service role client test failed')
            }

            console.log('✅ Service role client test successful')
        } catch (serviceError) {
            console.warn('⚠️ Service role client failed:', serviceError)
            console.log('🔄 Falling back to authenticated server client...')

            const { createSupabaseServerClient } = await import('@/lib/supabase-server')
            supabase = await createSupabaseServerClient()
            clientType = 'authenticated'
            console.log('✅ Using authenticated server client')
        }

        console.log('📊 Client type selected:', clientType)

        // Debug: Check what role the client is using
        try {
            const { data: roleCheck } = await supabase.rpc('auth.role')
            console.log('🔍 Client auth role:', roleCheck)
        } catch (roleError) {
            console.log('⚠️ Could not check client role:', roleError)
        }

        const updateData = {
            id: session.user.id,
            name: validatedData.name,
            email: validatedData.email,
            avatar_url: validatedData.avatar_url || null,
            timezone: validatedData.timezone,
            updated_at: new Date().toISOString(),
            role: session.user.role || 'member'
        }

        const { data, error } = await supabase
            .from('users')
            .upsert(updateData, { onConflict: 'id' })
            .select()
            .single()

        if (error) {
            console.error('❌ Database error:', error)
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
        }

        console.log('✅ Profile updated successfully')
        return NextResponse.json({ success: true, data })

    } catch (error) {
        console.error('💥 Error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

export async function GET() {
    try {
        console.log('🔄 GET /api/user/profile - Starting request')

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('👤 GET request for user:', session.user.email)

        let supabase
        let clientType = 'unknown'

        try {
            console.log('🔑 GET: Creating Supabase service client...')
            supabase = createSupabaseServiceClient()
            clientType = 'service_role'
            console.log('✅ GET: Service role client created')
        } catch {
            console.warn('⚠️ GET: Service role failed, using authenticated client')
            const { createSupabaseServerClient } = await import('@/lib/supabase-server')
            supabase = await createSupabaseServerClient()
            clientType = 'authenticated'
        }

        console.log('📊 GET: Client type selected:', clientType)

        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

        if (error) {
            console.error('❌ Error fetching profile:', error)
            return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: profile })

    } catch (error) {
        console.error('💥 Error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
