import { createSupabaseServerClient } from '@/lib/supabase/server'
import { auth } from '@/auth'

const getSrcumboardMembers = async () => {
    try {
        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.warn('No session found in getSrcumboardMembers, returning empty arrays')
            return {
                participantMembers: [],
                allMembers: [],
            }
        }

        const supabase = await createSupabaseServerClient()

        // Fetch basic user information
        const { data: allUsers, error: usersError } = await supabase
            .from('users')
            .select('id, name, email, avatar_url')
            .order('name')

        if (usersError) {
            console.error('Error fetching users:', usersError)
            return {
                participantMembers: [],
                allMembers: [],
            }
        }

        // Transform users to expected format
        const transformedUsers = (allUsers || []).map(user => ({
            id: user.id,
            name: user.name || 'Unknown User',
            email: user.email || '',
            img: user.avatar_url || '/img/avatars/thumb-1.jpg'
        }))

        return {
            participantMembers: transformedUsers,
            allMembers: transformedUsers,
        }
    } catch (error) {
        console.error('Error in getSrcumboardMembers:', error)
        return {
            participantMembers: [],
            allMembers: [],
        }
    }
}

export default getSrcumboardMembers
