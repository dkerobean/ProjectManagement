'use client'

import { useEffect, useState } from 'react'
import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react'
import SessionContext from './SessionContext'
import type { Session as NextAuthSession } from 'next-auth'

type Session = NextAuthSession | null

type AuthProviderProps = {
    session: Session | null
    children: React.ReactNode
}

// Inner component that syncs NextAuth session with our custom context
const SessionSyncProvider = ({ children, initialSession }: { children: React.ReactNode, initialSession: Session }) => {
    const { data: nextAuthSession } = useSession()
    const [currentSession, setCurrentSession] = useState<Session>(initialSession)

    useEffect(() => {
        // Update our custom session context whenever NextAuth session changes
        setCurrentSession(nextAuthSession || null)
    }, [nextAuthSession])

    return (
        <SessionContext.Provider value={currentSession}>
            {children}
        </SessionContext.Provider>
    )
}

const AuthProvider = (props: AuthProviderProps) => {
    const { session, children } = props

    return (
        /** NextAuth session provider for client hooks */
        <NextAuthSessionProvider session={session} refetchOnWindowFocus={false}>
            {/* Custom session provider that syncs with NextAuth */}
            <SessionSyncProvider initialSession={session}>
                {children}
            </SessionSyncProvider>
        </NextAuthSessionProvider>
    )
}

export default AuthProvider
