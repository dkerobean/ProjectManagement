import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Schema for validating calendar event data
const createEventSchema = z.object({
    title: z.string().min(1, 'Event title is required'),
    start: z.string().refine((val) => {
        // Accept ISO 8601 datetime strings (including timezone)
        return !isNaN(Date.parse(val))
    }, 'Invalid start date format'),
    end: z.string().refine((val) => {
        // Accept ISO 8601 datetime strings (including timezone)
        return !isNaN(Date.parse(val))
    }, 'Invalid end date format').optional(),
    eventColor: z.string().min(1, 'Event color is required'),
    groupId: z.string().uuid().optional(),
})

const updateEventSchema = z.object({
    id: z.string().uuid('Invalid event ID'),
    title: z.string().min(1, 'Event title is required').optional(),
    start: z.string().refine((val) => {
        // Accept ISO 8601 datetime strings (including timezone)
        return !isNaN(Date.parse(val))
    }, 'Invalid start date format').optional(),
    end: z.string().refine((val) => {
        // Accept ISO 8601 datetime strings (including timezone)
        return !isNaN(Date.parse(val))
    }, 'Invalid end date format').optional(),
    eventColor: z.string().min(1, 'Event color is required').optional(),
    groupId: z.string().uuid().optional(),
})

// GET: Fetch all calendar events for the authenticated user
export async function GET() {
    try {
        console.log('🔄 GET /api/calendar/events - Starting request')

        const session = await auth()
        if (!session?.user?.id) {
            console.error('❌ Unauthorized: No session')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('✅ User authenticated:', session.user.id)

        const supabase = await createSupabaseServerClient()

        const { data: events, error } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', session.user.id)
            .order('start_date', { ascending: true })

        if (error) {
            console.error('❌ Database error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch events' },
                { status: 500 }
            )
        }

        console.log('✅ Fetched events:', events?.length || 0)

        // Transform database format to calendar format
        const calendarEvents = events?.map((event) => ({
            id: event.id,
            title: event.title,
            start: event.start_date,
            end: event.end_date,
            eventColor: event.event_color,
            groupId: event.group_id,
        })) || []

        return NextResponse.json({
            success: true,
            data: calendarEvents,
        })

    } catch (error) {
        console.error('💥 Calendar events GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST: Create a new calendar event
export async function POST(request: NextRequest) {
    try {
        console.log('🔄 POST /api/calendar/events - Starting request')

        const session = await auth()
        console.log('🔍 Session check in POST:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id,
            userEmail: session?.user?.email
        })

        if (!session?.user?.id) {
            console.error('❌ Unauthorized: No session or user ID')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('✅ User authenticated:', session.user.id)

        const body = await request.json()
        console.log('📥 Request body:', body)

        const validatedData = createEventSchema.parse(body)
        console.log('✅ Data validated successfully')

        const supabase = await createSupabaseServerClient()

        const eventData = {
            title: validatedData.title,
            start_date: validatedData.start,
            end_date: validatedData.end || null,
            event_color: validatedData.eventColor,
            group_id: validatedData.groupId || null,
            user_id: session.user.id,
        }

        console.log('💾 Inserting event into database:', eventData)

        // Since RLS is disabled, we ensure user_id is always set from session
        // This prevents any potential user_id spoofing
        if (eventData.user_id !== session.user.id) {
            console.error('❌ Security violation: user_id mismatch')
            return NextResponse.json(
                { error: 'Security violation' },
                { status: 403 }
            )
        }

        const { data: event, error } = await supabase
            .from('calendar_events')
            .insert(eventData)
            .select()
            .single()

        if (error) {
            console.error('❌ Database error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
            return NextResponse.json(
                { error: 'Failed to create event', details: error.message },
                { status: 500 }
            )
        }

        console.log('✅ Event created successfully:', event.id)

        // Transform to calendar format
        const calendarEvent = {
            id: event.id,
            title: event.title,
            start: event.start_date,
            end: event.end_date,
            eventColor: event.event_color,
            groupId: event.group_id,
        }

        return NextResponse.json({
            success: true,
            data: calendarEvent,
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Validation error:', error.errors)
            return NextResponse.json(
                { error: 'Invalid data format', details: error.errors },
                { status: 400 }
            )
        }

        console.error('💥 Calendar events POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT: Update an existing calendar event
export async function PUT(request: NextRequest) {
    try {
        console.log('🔄 PUT /api/calendar/events - Starting request')

        const session = await auth()
        if (!session?.user?.id) {
            console.error('❌ Unauthorized: No session')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('✅ User authenticated:', session.user.id)

        const body = await request.json()
        console.log('📥 Request body:', body)

        const validatedData = updateEventSchema.parse(body)
        console.log('✅ Data validated successfully')

        const supabase = await createSupabaseServerClient()

        // Build update object with only provided fields
        const updateData: {
            title?: string
            start_date?: string
            end_date?: string | null
            event_color?: string
            group_id?: string | null
        } = {}
        if (validatedData.title !== undefined) updateData.title = validatedData.title
        if (validatedData.start !== undefined) updateData.start_date = validatedData.start
        if (validatedData.end !== undefined) updateData.end_date = validatedData.end
        if (validatedData.eventColor !== undefined) updateData.event_color = validatedData.eventColor
        if (validatedData.groupId !== undefined) updateData.group_id = validatedData.groupId

        const { data: event, error } = await supabase
            .from('calendar_events')
            .update(updateData)
            .eq('id', validatedData.id)
            .eq('user_id', session.user.id) // Ensure user can only update their own events
            .select()
            .single()

        if (error) {
            console.error('❌ Database error:', error)
            return NextResponse.json(
                { error: 'Failed to update event' },
                { status: 500 }
            )
        }

        if (!event) {
            console.error('❌ Event not found or not owned by user')
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            )
        }

        console.log('✅ Event updated successfully:', event.id)

        // Transform to calendar format
        const calendarEvent = {
            id: event.id,
            title: event.title,
            start: event.start_date,
            end: event.end_date,
            eventColor: event.event_color,
            groupId: event.group_id,
        }

        return NextResponse.json({
            success: true,
            data: calendarEvent,
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Validation error:', error.errors)
            return NextResponse.json(
                { error: 'Invalid data format', details: error.errors },
                { status: 400 }
            )
        }

        console.error('💥 Calendar events PUT error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE: Delete a calendar event
export async function DELETE(request: NextRequest) {
    try {
        console.log('🔄 DELETE /api/calendar/events - Starting request')

        const session = await auth()
        if (!session?.user?.id) {
            console.error('❌ Unauthorized: No session')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('✅ User authenticated:', session.user.id)

        const { searchParams } = new URL(request.url)
        const eventId = searchParams.get('id')

        if (!eventId) {
            console.error('❌ Missing event ID')
            return NextResponse.json(
                { error: 'Event ID is required' },
                { status: 400 }
            )
        }

        console.log('📥 Event ID to delete:', eventId)

        const supabase = await createSupabaseServerClient()

        const { error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', eventId)
            .eq('user_id', session.user.id) // Ensure user can only delete their own events

        if (error) {
            console.error('❌ Database error:', error)
            return NextResponse.json(
                { error: 'Failed to delete event' },
                { status: 500 }
            )
        }

        console.log('✅ Event deleted successfully:', eventId)

        return NextResponse.json({
            success: true,
            message: 'Event deleted successfully',
        })

    } catch (error) {
        console.error('💥 Calendar events DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
