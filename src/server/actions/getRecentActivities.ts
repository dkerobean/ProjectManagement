import { createSupabaseServerClient } from '@/lib/supabase-server'
import { auth } from '@/auth'

export default async function getRecentActivities() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            // No session - return empty array
            return []
        }

        const supabase = await createSupabaseServerClient()

        // Fetch recent activities from the activities table
        const { data: activities, error } = await supabase
            .from('activities')
            .select(`
                id,
                type,
                title,
                description,
                entity_type,
                entity_id,
                metadata,
                created_at,
                user_id
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(10)

        if (error) {
            // Log error for debugging - server action
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching recent activities:', error)
            }
            return []
        }

        // Get user data for the activities
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, first_name, last_name, avatar_url')
            .eq('id', session.user.id)
            .single()

        if (userError) {
            // Log error for debugging - server action
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching user data:', userError)
            }
        }

        // Transform activities to match the expected format
        const transformedActivities = (activities || []).map(activity => {
            const metadata = (activity.metadata as Record<string, unknown>) || {}
            
            return {
                type: activity.type,
                dateTime: new Date(activity.created_at).getTime(),
                ticket: (metadata.ticket as string) || `${activity.entity_type?.toUpperCase()}-${activity.entity_id?.substring(0, 6)}`,
                status: mapActivityTypeToStatus(activity.type),
                userName: userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User' : 'User',
                userImg: userData?.avatar_url || '/img/avatars/thumb-1.jpg',
                comment: activity.description || activity.title,
                tags: (metadata.tags as string[]) || [],
                files: (metadata.files as string[]) || [],
                assignee: (metadata.assignee as string) || undefined,
            }
        })

        return transformedActivities

    } catch (error) {
        // Log error for debugging - server action
        if (process.env.NODE_ENV === 'development') {
            console.error('Error in getRecentActivities:', error)
        }
        return []
    }
}

// Helper function to map activity types to status codes
function mapActivityTypeToStatus(activityType: string): number {
    switch (activityType) {
        case 'UPDATE-TICKET':
            return 1 // In progress/updated
        case 'COMMENT':
            return 2 // Commented
        case 'ADD-TAGS-TO-TICKET':
            return 3 // Tagged
        case 'ADD-FILES-TO-TICKET':
            return 4 // File attached
        case 'CREATE-TICKET':
        case 'CREATE-PROJECT':
        case 'PROJECT-COMPLETED':
            return 0 // Created/completed
        case 'PROJECT-REACTIVATED':
            return 1 // Reactivated/in progress
        case 'COMMENT-MENTION':
            return 5 // Mentioned
        case 'ASSIGN-TICKET':
            return 6 // Assigned
        default:
            return 1 // Default to in progress
    }
}
