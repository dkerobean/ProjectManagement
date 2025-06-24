import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updatePreferencesSchema = z.object({
    favoriteProjects: z.array(z.string()).optional(),
    notifications: z.object({
        email: z.boolean().optional(),
        push: z.boolean().optional(),
        desktop: z.boolean().optional(),
    }).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().optional(),
})

// GET /api/user/preferences - Get user preferences
export async function GET() {
    try {
        console.log('🔍 GET /api/user/preferences - Starting request')

        const session = await auth()
        if (!session?.user?.id) {
            console.log('❌ No session or user ID found')
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const supabase = await createSupabaseServerClient()

        const { data: user, error } = await supabase
            .from('users')
            .select('preferences')
            .eq('id', session.user.id)
            .single()

        if (error) {
            console.error('❌ Database error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch preferences' },
                { status: 500 }
            )
        }

        console.log('✅ Successfully fetched user preferences')
        return NextResponse.json({
            data: user?.preferences || {}
        })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT /api/user/preferences - Update user preferences
export async function PUT(request: NextRequest) {
    try {
        console.log('🔄 PUT /api/user/preferences - Starting request')

        const session = await auth()
        if (!session?.user?.id) {
            console.log('❌ No session or user ID found')
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const body = await request.json()
        console.log('📝 Request body:', body)

        // Validate the request body
        const validationResult = updatePreferencesSchema.safeParse(body)
        if (!validationResult.success) {
            console.log('❌ Validation failed:', validationResult.error.errors)
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.errors
                },
                { status: 400 }
            )
        }

        const updateData = validationResult.data
        const supabase = await createSupabaseServerClient()

        // Get current preferences to merge with new data
        const { data: currentUser, error: fetchError } = await supabase
            .from('users')
            .select('preferences')
            .eq('id', session.user.id)
            .single()

        if (fetchError) {
            console.error('❌ Database error:', fetchError)
            return NextResponse.json(
                { error: 'Failed to fetch current preferences' },
                { status: 500 }
            )
        }

        // Merge current preferences with new data
        const currentPreferences = currentUser?.preferences || {}
        const newPreferences = { ...currentPreferences, ...updateData }

        // Update user preferences
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
                preferences: newPreferences,
                updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id)
            .select('preferences')
            .single()

        if (updateError) {
            console.error('❌ Database error:', updateError)
            return NextResponse.json(
                { error: 'Failed to update preferences' },
                { status: 500 }
            )
        }

        console.log('✅ Successfully updated user preferences')
        return NextResponse.json({
            data: updatedUser.preferences,
            message: 'Preferences updated successfully'
        })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
