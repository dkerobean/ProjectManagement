'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { hasRole, getUserRole, type UserRole } from '@/utils/roleBasedAccess'
import Button from '@/components/ui/Button'
import type { ComponentType, ReactNode } from 'react'

interface WithRoleAuthProps {
    requiredRole: UserRole
    fallbackComponent?: ReactNode
    redirectTo?: string
    children?: ReactNode
}

interface RoleGuardProps {
    requiredRole: UserRole
    fallback?: ReactNode
    redirectTo?: string
    children: ReactNode
}

/**
 * Higher-order component for role-based access control
 */
export function withRoleAuth<P extends object>(
    WrappedComponent: ComponentType<P>,
    requiredRole: UserRole,
    options: {
        fallback?: ReactNode
        redirectTo?: string
    } = {}
) {
    const ComponentWithRoleAuth = (props: P) => {
        const { data: session, status } = useSession()
        const router = useRouter()
        const [isAuthorized, setIsAuthorized] = useState(false)
        const [isLoading, setIsLoading] = useState(true)

        useEffect(() => {
            if (status === 'loading') return

            if (status === 'unauthenticated') {
                if (options.redirectTo) {
                    router.push(options.redirectTo)
                } else {
                    router.push('/auth/sign-in-simple')
                }
                return
            }

            const userRole = getUserRole(session)
            const authorized = hasRole(userRole, requiredRole)

            setIsAuthorized(authorized)
            setIsLoading(false)

            if (!authorized && options.redirectTo) {
                router.push(options.redirectTo)
            }
        }, [session, status, router])

        if (status === 'loading' || isLoading) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
            )
        }

        if (!isAuthorized) {
            return (
                options.fallback || (
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center max-w-md">
                            <div className="text-red-600 mb-4">
                                <svg
                                    className="w-16 h-16 mx-auto"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                            <p className="text-gray-600 mb-6">
                                You don&apos;t have permission to access this page.
                                Contact your administrator if you believe this is an error.
                            </p>
                            <Button
                                variant="solid"
                                onClick={() => router.push('/dashboard/overview')}
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    </div>
                )
            )
        }

        return <WrappedComponent {...props} />
    }

    ComponentWithRoleAuth.displayName = `withRoleAuth(${WrappedComponent.displayName || WrappedComponent.name})`

    return ComponentWithRoleAuth
}

/**
 * Component for role-based conditional rendering
 */
export function RoleGuard({ requiredRole, fallback, redirectTo, children }: RoleGuardProps) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (status === 'loading') return

        if (status === 'unauthenticated') {
            if (redirectTo) {
                router.push(redirectTo)
            }
            setIsLoading(false)
            return
        }

        const userRole = getUserRole(session)
        const authorized = hasRole(userRole, requiredRole)

        setIsAuthorized(authorized)
        setIsLoading(false)

        if (!authorized && redirectTo) {
            router.push(redirectTo)
        }
    }, [session, status, router, requiredRole, redirectTo])

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!isAuthorized) {
        return <>{fallback || null}</>
    }

    return <>{children}</>
}

/**
 * Hook for checking user permissions
 */
export function useRolePermissions() {
    const { data: session } = useSession()
    const userRole = getUserRole(session)

    return {
        userRole,
        hasRole: (requiredRole: UserRole) => hasRole(userRole, requiredRole),
        isAdmin: hasRole(userRole, 'admin'),
        isProjectManager: hasRole(userRole, 'project_manager'),
        isMember: hasRole(userRole, 'member'),
        isViewer: userRole === 'viewer',
    }
}
