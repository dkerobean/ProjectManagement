import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
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

export async function GET() {
    try {
        console.log('🔍 GET /api/user/profile - Starting request')
        
        // Get the current session
        const session = await auth()
        console.log('📱 Session data:', {
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email
        })
        
        if (!session?.user?.id) {
            console.log('❌ No session or user ID found')
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        console.log('🔗 Creating Supabase client...')
        // Get user profile from Supabase
        const supabase = await createSupabaseServerClient()
        
        console.log('📊 Querying user profile for ID:', session.user.id)
        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

        if (error) {
            // If user doesn't exist, try to find by email first
            if (error.code === 'PGRST116') {
                console.log('👤 User not found by ID, checking by email...')
                
                // Try to find user by email
                const { data: existingUser, error: emailError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', session.user.email!)
                    .single()

                if (existingUser && !emailError) {
                    console.log('📧 Found existing user by email, updating ID mapping...')
                    
                    // User exists with different ID, update the existing record with new auth ID
                    const { data: updatedUser, error: updateError } = await supabase
                        .from('users')
                        .update({ id: session.user.id })
                        .eq('email', session.user.email!)
                        .select()
                        .single()

                    if (updateError) {
                        console.error('❌ Error updating user ID:', updateError)
                        return NextResponse.json(
                            { error: 'Failed to sync user profile' }, 
                            { status: 500 }
                        )
                    }

                    console.log('✅ User ID updated successfully:', updatedUser.name)
                    return NextResponse.json(updatedUser)
                }

                // If no user found by email either, create new user
                console.log('👤 Creating new user profile...')
                const { data: newProfile, error: createError } = await supabase
                    .from('users')
                    .insert({
                        id: session.user.id,
                        email: session.user.email!,
                        name: session.user.name || session.user.email!.split('@')[0],
                        role: 'member',
                        timezone: 'UTC'
                    })
                    .select()
                    .single()

                if (createError) {
                    console.error('❌ Error creating user profile:', createError)
                    return NextResponse.json(
                        { error: 'Failed to create user profile' }, 
                        { status: 500 }
                    )
                }

                console.log('✅ User profile created successfully:', newProfile.name)
                return NextResponse.json(newProfile)
            }

            console.error('❌ Database error while fetching profile:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            })
            return NextResponse.json(
                { error: 'Failed to fetch profile' },
                { status: 500 }
            )
        }

        console.log('✅ Profile fetched successfully:', {
            id: profile?.id,
            name: profile?.name,
            email: profile?.email
        })

        return NextResponse.json(profile || {})

    } catch (error) {
        console.error('💥 Unexpected error in GET /api/user/profile:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        console.log('🔄 PUT /api/user/profile - Starting request')
        
        // Get the current session
        const session = await auth()
        console.log('📱 Session data:', {
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email
        })
        
        if (!session?.user?.id) {
            console.log('❌ No session or user ID found')
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        console.log('📝 Parsing request body...')
        // Parse and validate the request body
        const body = await request.json()
        console.log('📄 Request body:', body)
        
        console.log('✅ Validating data with schema...')
        const validatedData = updateProfileSchema.parse(body)
        console.log('✅ Data validated successfully:', validatedData)

        console.log('🔗 Creating Supabase client...')
        // Update user profile in Supabase
        const supabase = await createSupabaseServerClient()
        
        const updatePayload = {
            ...validatedData,
            updated_at: new Date().toISOString(),
        }
        console.log('📊 Updating profile with payload:', updatePayload)
        
        const { data, error } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', session.user.id)
            .select()
            .single()

        if (error) {
            // If user doesn't exist, try to find by email first (same logic as GET)
            if (error.code === 'PGRST116') {
                console.log('👤 User not found during update, checking by session email...')
                
                // Try to find user by session email (not form email in case user is changing email)
                const { data: existingUser, error: emailError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', session.user.email!)
                    .single()

                if (existingUser && !emailError) {
                    console.log('📧 Found existing user by session email during update, updating ID and profile...')
                    
                    // User exists with different ID, update the existing record with new auth ID AND profile data
                    const { data: updatedUser, error: updateError } = await supabase
                        .from('users')
                        .update({
                            id: session.user.id,
                            ...updatePayload
                        })
                        .eq('email', session.user.email!)
                        .select()
                        .single()

                    if (updateError) {
                        console.error('❌ Error updating user ID and profile:', updateError)
                        return NextResponse.json(
                            { error: 'Failed to sync and update user profile', details: updateError.message }, 
                            { status: 500 }
                        )
                    }

                    console.log('✅ User ID and profile updated successfully:', updatedUser.name)
                    return NextResponse.json({
                        success: true,
                        message: 'Profile updated successfully',
                        data: updatedUser
                    })
                }

                // If no user found by email either, create new user
                console.log('👤 Creating new user profile during update...')
                const { data: newProfile, error: createError } = await supabase
                    .from('users')
                    .insert({
                        id: session.user.id,
                        email: validatedData.email,
                        name: validatedData.name,
                        role: 'member',
                        timezone: validatedData.timezone,
                        // Include other fields from the update payload
                        ...(validatedData.dial_code && { dial_code: validatedData.dial_code }),
                        ...(validatedData.phone_number && { phone_number: validatedData.phone_number }),
                        ...(validatedData.country && { country: validatedData.country }),
                        ...(validatedData.address && { address: validatedData.address }),
                        ...(validatedData.postcode && { postcode: validatedData.postcode }),
                        ...(validatedData.city && { city: validatedData.city }),
                        ...(validatedData.avatar_url && { avatar_url: validatedData.avatar_url }),
                    })
                    .select()
                    .single()

                if (createError) {
                    console.error('❌ Error creating user profile during update:', createError)
                    return NextResponse.json(
                        { error: 'Failed to create user profile', details: createError.message }, 
                        { status: 500 }
                    )
                }

                console.log('✅ User profile created during update:', newProfile.name)
                return NextResponse.json({
                    success: true,
                    message: 'Profile created successfully',
                    data: newProfile
                })
            }

            console.error('❌ Database error while updating profile:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
                userId: session.user.id
            })
            return NextResponse.json(
                { error: 'Failed to update profile', details: error.message },
                { status: 500 }
            )
        }

        console.log('✅ Profile updated successfully:', {
            id: data?.id,
            name: data?.name,
            email: data?.email
        })

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
