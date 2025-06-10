'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import SpaceSignBoard from '@/assets/svg/SpaceSignBoard'
import { getRoleDisplayName } from '@/utils/roleBasedAccess'
import appConfig from '@/configs/app.config'
import type { UserRole } from '@/@types/next-auth'

const Page = () => {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [hasRedirected, setHasRedirected] = useState(false)

    // Redirect to login if not authenticated, but only once
    useEffect(() => {
        if (status === 'loading' || hasRedirected) return
        
        if (status === 'unauthenticated') {
            setHasRedirected(true)
            // Simple redirect without callback URL to prevent loops
            router.replace(appConfig.unAuthenticatedEntryPath)
            return
        }
    }, [status, router, hasRedirected])

    const handleSignOut = async () => {
        await signOut({ 
            callbackUrl: appConfig.unAuthenticatedEntryPath 
        })
    }

    const handleBackToLogin = () => {
        router.push(appConfig.unAuthenticatedEntryPath)
    }

    // Show loading state while checking session
    if (status === 'loading') {
        return (
            <Container className="h-full">
                <div className="h-full flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="mt-4 text-gray-600">Checking authentication...</p>
                </div>
            </Container>
        )
    }

    // If user is not authenticated, show sign in option
    if (status === 'unauthenticated') {
        return (
            <Container className="h-full">
                <div className="h-full flex flex-col items-center justify-center">
                    <SpaceSignBoard height={280} width={280} />
                    <div className="mt-10 text-center max-w-md">
                        <h3 className="mb-2">Authentication Required</h3>
                        <p className="text-base mb-6">
                            You need to sign in to access this page.
                        </p>
                        
                        <Button
                            variant="solid"
                            className="w-full"
                            onClick={handleBackToLogin}
                        >
                            Sign In
                        </Button>
                    </div>
                </div>
            </Container>
        )
    }

    return (
        <Container className="h-full">
            <div className="h-full flex flex-col items-center justify-center">
                <SpaceSignBoard height={280} width={280} />
                <div className="mt-10 text-center max-w-md">                    <h3 className="mb-2">Access Denied!</h3>
                    <p className="text-base mb-4">
                        You don&apos;t have permission to access this page.
                    </p>
                    
                    {session?.user && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Current role: <span className="font-medium">
                                {getRoleDisplayName(session.user.role as UserRole)}
                            </span>
                        </p>
                    )}
                    
                    <div className="space-y-3">
                        <Button
                            variant="solid"
                            className="w-full"
                            onClick={() => router.push('/dashboard/overview')}
                        >
                            Go to Dashboard
                        </Button>
                        
                        <Button
                            variant="plain"
                            className="w-full"
                            onClick={() => router.back()}
                        >
                            Go Back
                        </Button>

                        <Button
                            variant="plain"
                            className="w-full text-red-600 hover:text-red-700"
                            onClick={handleSignOut}
                        >
                            Sign Out & Login as Different User
                        </Button>
                    </div>
                    
                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            If you believe you should have access to this page, 
                            please contact your administrator or try signing in with a different account.
                        </p>
                    </div>
                </div>
            </div>
        </Container>
    )
}

export default Page
