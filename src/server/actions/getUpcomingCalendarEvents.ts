import { createSupabaseServerClient } from '@/lib/supabase-server'
import { auth } from '@/auth'
import dayjs from 'dayjs'

export default async function getUpcomingCalendarEvents() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.warn('No session found in getUpcomingCalendarEvents, returning empty array')
            return []
        }

        const supabase = await createSupabaseServerClient()

        // Get events for the next 7 days
        const today = new Date()
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

        const { data: events, error } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', session.user.id)
            .gte('start_date', today.toISOString())
            .lte('start_date', nextWeek.toISOString())
            .order('start_date', { ascending: true })
            .limit(10)

        if (error) {
            console.error('Error fetching upcoming calendar events:', error)
            return []
        }

        // Transform to the format expected by UpcomingSchedule
        const upcomingEvents = (events || []).map(event => ({
            id: event.id,
            type: determineEventType(event.title), // Helper function to map event titles to types
            label: event.title,
            time: new Date(event.start_date),
            date: dayjs(event.start_date).format('YYYY-MM-DD')
        }))

        return upcomingEvents

    } catch (error) {
        console.error('Error in getUpcomingCalendarEvents:', error)
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
