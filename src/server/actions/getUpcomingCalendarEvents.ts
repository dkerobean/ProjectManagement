import { createSafeSupabaseServerClient } from '@/lib/supabase-safe'
import { auth } from '@/auth'
import dayjs from 'dayjs'

export default async function getUpcomingCalendarEvents() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return []
        }

        const supabase = await createSafeSupabaseServerClient()
        if (!supabase) {
            // Supabase not configured - return empty array for development
            console.warn('⚠️ Supabase not configured - returning empty calendar events')
            return []
        }

        // Get events from today onwards (including current/today's events)
        const today = new Date()
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

        const { data: events, error } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', session.user.id)
            .gte('start_date', startOfToday.toISOString())
            .lte('start_date', nextWeek.toISOString())
            .order('start_date', { ascending: true })
            .limit(20)

        if (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching upcoming calendar events:', error)
            }
            return []
        }

        // Transform to the format expected by UpcomingSchedule
        const upcomingEvents = (events || []).map(event => {
            const startDate = new Date(event.start_date)
            const endDate = new Date(event.end_date)
            const eventDate = dayjs(startDate).format('YYYY-MM-DD')
            const today = dayjs(new Date()).format('YYYY-MM-DD')

            // Determine if this is a current event (happening today)
            const isCurrentEvent = eventDate === today ||
                (dayjs(startDate).isBefore(dayjs(), 'day') && dayjs(endDate).isAfter(dayjs(), 'day'))

            return {
                id: event.id,
                type: determineEventType(event.title),
                label: event.title + (isCurrentEvent ? ' (Current)' : ''),
                time: startDate,
                date: eventDate,
                isCurrentEvent,
                eventColor: event.event_color || 'blue'
            }
        })

        return upcomingEvents

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Error in getUpcomingCalendarEvents:', error)
        }
        return []
    }
}

// Helper function to determine event type based on title or other properties
function determineEventType(title: string): 'meeting' | 'task' | 'event' | 'breaks' | 'holiday' | 'workshops' | 'reminders' {
    const titleLower = title.toLowerCase()

    if (titleLower.includes('meeting') || titleLower.includes('standup') || titleLower.includes('call')) {
        return 'meeting'
    }
    if (titleLower.includes('task') || titleLower.includes('work') || titleLower.includes('complete')) {
        return 'task'
    }
    if (titleLower.includes('break') || titleLower.includes('lunch')) {
        return 'breaks'
    }
    if (titleLower.includes('workshop') || titleLower.includes('training')) {
        return 'workshops'
    }
    if (titleLower.includes('reminder') || titleLower.includes('deadline')) {
        return 'reminders'
    }
    if (titleLower.includes('holiday') || titleLower.includes('vacation')) {
        return 'holiday'
    }

    return 'event' // Default type
}
