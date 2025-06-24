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
        // Try service client first, fallback to anon client if service role not available
        let supabase
        try {
            supabase = createSupabaseServiceClient()
            console.log('✅ Using service role client')
        } catch (error) {
            console.warn('⚠️ Service role not available, using authenticated server client:', error)
            // Use the regular server client which handles authentication properly
            const { createSupabaseServerClient } = await import('@/lib/supabase/server')
            supabase = await createSupabaseServerClient()
            console.log('✅ Using authenticated server client as fallback')
        }

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
                
                // Determine role based on session user role or email
                let userRole = session.user.role || 'member'
                const adminEmails = ['admin@projectmgt.com', 'superadmin@projectmgt.com', 'frogman@gmail.com']
                if (adminEmails.includes(session.user.email || '')) {
                    userRole = 'admin'
                }
                
                console.log('🎯 Assigning role during profile creation:', userRole, 'for email:', session.user.email)
                
                const { data: newProfile, error: createError } = await supabase
                    .from('users')
                    .insert({
                        id: session.user.id,
                        email: session.user.email!,
                        name: session.user.name || session.user.email!.split('@')[0],
                        role: userRole,
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
        // Try service client first, fallback to authenticated server client
        let supabase
        let isUsingServiceRole = false
        try {
            supabase = createSupabaseServiceClient()
            isUsingServiceRole = true
            console.log('✅ Using service role client')
        } catch (error) {
            console.warn('⚠️ Service role not available, using authenticated server client:', error)
            // Use the regular server client which handles authentication properly
            const { createSupabaseServerClient } = await import('@/lib/supabase/server')
            supabase = await createSupabaseServerClient()
            isUsingServiceRole = false
            console.log('✅ Using authenticated server client as fallback')
            
            // Test authentication with the server client
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            console.log('🔍 Auth check:', { 
                hasUser: !!user, 
                userId: user?.id, 
                userEmail: user?.email,
                authError: authError?.message 
            })
        }

        const updatePayload = {
            ...validatedData,
            updated_at: new Date().toISOString(),
        }
        console.log('📊 Updating profile with payload:', updatePayload)
        console.log('🔑 Using service role client:', isUsingServiceRole)

        const { data, error } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', session.user.id)
            .select()
            .single()

        console.log('📊 Update result:', { data: !!data, error: error ? error.code : null })

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

                console.log('🔍 Email search result:', { 
                    found: !!existingUser, 
                    error: emailError ? emailError.code : null,
                    existingUserId: existingUser?.id,
                    sessionUserId: session.user.id
                })

                if (existingUser && !emailError) {
                    console.log('📧 Found existing user by session email during update, updating profile...')
                    console.log('🆔 Existing user ID:', existingUser.id, 'Session user ID:', session.user.id)

                    // If we're using the authenticated client and user exists, 
                    // just update the existing record (don't change the ID)
                    if (!isUsingServiceRole && existingUser.id === session.user.id) {
                        console.log('✅ User IDs match, updating existing profile...')
                        const { data: updatedUser, error: updateError } = await supabase
                            .from('users')
                            .update(updatePayload)
                            .eq('id', session.user.id)
                            .select()
                            .single()

                        if (updateError) {
                            console.error('❌ Error updating existing profile:', updateError)
                            return NextResponse.json(
                                { 
                                    error: 'Failed to update profile', 
                                    details: updateError,
                                    userId: session.user.id
                                },
                                { status: 500 }
                            )
                        }

                        console.log('✅ Profile updated successfully:', updatedUser.name)
                        return NextResponse.json({
                            success: true,
                            message: 'Profile updated successfully',
                            data: updatedUser
                        })
                    }
                    
                    // For service role or ID mismatch cases, update with ID change
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
                
                // Determine role based on session user role or email
                let userRole = session.user.role || 'member'
                const adminEmails = ['admin@projectmgt.com', 'superadmin@projectmgt.com', 'frogman@gmail.com']
                if (adminEmails.includes(session.user.email || '') || adminEmails.includes(validatedData.email)) {
                    userRole = 'admin'
                }
                
                console.log('🎯 Assigning role during profile creation:', userRole, 'for email:', validatedData.email)
                
                const { data: newProfile, error: createError } = await supabase
                    .from('users')
                    .insert({
                        id: session.user.id,
                        email: validatedData.email,
                        name: validatedData.name,
                        role: userRole,
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

        // Check if it's a service role key error
        if (error instanceof Error && error.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
            console.error('🔑 Service role key configuration error:', error.message)
            return NextResponse.json(
                { 
                    error: 'Configuration error', 
                    message: 'Service role key needs to be configured properly',
                    hint: 'Please check your environment variables'
                },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
