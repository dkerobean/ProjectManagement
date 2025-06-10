import NextAuth from 'next-auth'

import authConfig from '@/configs/auth.config'
import {
    authRoutes as _authRoutes,
    publicRoutes as _publicRoutes,
    protectedRoutes,
} from '@/configs/routes.config'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import appConfig from '@/configs/app.config'
import { hasRole, type UserRole } from '@/utils/roleBasedAccess'

const { auth } = NextAuth(authConfig)

const publicRoutes = Object.entries(_publicRoutes).map(([key]) => key)
const authRoutes = Object.entries(_authRoutes).map(([key]) => key)

const apiAuthPrefix = `${appConfig.apiPrefix}/auth`

export default auth((req) => {
    const { nextUrl } = req
    const isSignedIn = !!req.auth

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
    const isAuthRoute = authRoutes.includes(nextUrl.pathname)

    /** Skip auth middleware for api routes */
    if (isApiAuthRoute) return

    if (isAuthRoute) {
        if (isSignedIn) {
            /** Redirect to authenticated entry path if signed in & path is auth route */
            return Response.redirect(
                new URL(appConfig.authenticatedEntryPath, nextUrl),
            )
        }
        return
    }

    /** Redirect to authenticated entry path if signed in & path is public route */
    if (!isSignedIn && !isPublicRoute) {
        let callbackUrl = nextUrl.pathname
        if (nextUrl.search) {
            callbackUrl += nextUrl.search
        }

        return Response.redirect(
            new URL(
                `${appConfig.unAuthenticatedEntryPath}?${REDIRECT_URL_KEY}=${callbackUrl}`,
                nextUrl,
            ),
        )
    }    /** Enhanced role-based access control */
    if (isSignedIn && nextUrl.pathname !== '/access-denied') {
        console.log('Middleware check for path:', nextUrl.pathname)
        console.log('User role:', req.auth?.user?.role)
        console.log('User authority:', req.auth?.user?.authority)
        
        const routeMeta = protectedRoutes[nextUrl.pathname]

        if (routeMeta && routeMeta.authority && routeMeta.authority.length > 0) {
            const userRole = req.auth?.user?.role as UserRole
            const userAuthority = req.auth?.user?.authority || []

            // Check if user has required role using role hierarchy
            const hasRequiredRole = routeMeta.authority.some((requiredRole: string) => {
                // Check both legacy authority array and new role-based system
                return userAuthority.includes(requiredRole) ||
                       hasRole(userRole, requiredRole as UserRole)
            })

            console.log('Route requires authority:', routeMeta.authority)
            console.log('User has required role:', hasRequiredRole)

            if (!hasRequiredRole) {
                console.log('Access denied: insufficient authority')
                return Response.redirect(
                    new URL('/access-denied', nextUrl),
                )
            }
        }// Additional role-based route protection
        const roleBasedRoutes: Record<string, UserRole[]> = {
            '/admin': ['admin'],
            '/user-management': ['admin'],
            '/system-settings': ['admin'],
            '/audit-logs': ['admin'],
            '/concepts/projects/project-management': ['admin', 'project_manager'],
            '/concepts/projects/team-management': ['admin', 'project_manager'],
            '/analytics': ['admin', 'project_manager'],
            '/concepts/projects': ['admin', 'project_manager', 'member'],
            '/concepts/tasks': ['admin', 'project_manager', 'member'],
            '/concepts/files': ['admin', 'project_manager', 'member'],
            // Allow dashboard access for all authenticated users
            '/dashboards': ['admin', 'project_manager', 'member', 'viewer'],
        }        // Check if current path matches any role-based route (exact match or starts with)
        const currentRoute = Object.keys(roleBasedRoutes).find(route =>
            nextUrl.pathname === route || nextUrl.pathname.startsWith(route + '/')
        )

        if (currentRoute) {
            const requiredRoles = roleBasedRoutes[currentRoute]
            const userRole = req.auth?.user?.role as UserRole

            console.log('Route-based check for:', currentRoute)
            console.log('Required roles:', requiredRoles)
            console.log('User role:', userRole)

            const hasAccess = requiredRoles.some(role => hasRole(userRole, role))

            console.log('Has access:', hasAccess)

            if (!hasAccess) {
                console.log('Access denied: insufficient role for route')
                return Response.redirect(
                    new URL('/access-denied', nextUrl),
                )
            }
        }
    }
})

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api)(.*)'],
}
