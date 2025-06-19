import { auth } from '@/auth'

export async function getCurrentUser() {
    try {
        // Get the session from NextAuth
        const session = await auth()
        
        if (!session?.user) {
            return null
        }
        
        return {
            id: session.user.id || session.user.email, // Use id if available, fallback to email
            email: session.user.email,
            name: session.user.name,
        }
    } catch (error) {
        console.error('Error getting current user:', error)
        return null
    }
}

export async function getCurrentUserId(): Promise<string | null> {
    const user = await getCurrentUser()
    return user?.id || null
}
