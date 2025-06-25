import { useSession } from 'next-auth/react'

const useCurrentSession = () => {
    const { data: session, status } = useSession()
    
    // Return the session with proper structure expected by components
    return {
        session: session || null,
        status
    }
}

export default useCurrentSession
