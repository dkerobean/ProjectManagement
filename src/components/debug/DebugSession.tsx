// Debug script to check your session and role
// Add this temporarily to your SignInClient or any client component

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export const DebugSession = () => {
    const { data: session, status } = useSession()

    useEffect(() => {
        console.log('Session status:', status)
        console.log('Session data:', session)
        console.log('User role:', session?.user?.role)
        console.log('User authority:', session?.user?.authority)
    }, [session, status])

    return null
}

// Add <DebugSession /> to any page to see the session info
