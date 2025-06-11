import { useContext } from 'react'
import SessionContext from '@/components/auth/AuthProvider/SessionContext'

const useCurrentSession = () => {
    const context = useContext(SessionContext)
    
    // Return the session with proper fallback
    return {
        session: context || {
            expires: '',
            user: {},
        },
    }
}

export default useCurrentSession
