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
    }

    /** Enhanced role-based access control */
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
        }

        // Temporarily disable additional role-based routing for debugging
        // Will re-enable once we confirm basic auth is working
        console.log('Access granted for path:', nextUrl.pathname)
    }
})

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api)(.*)'],
}
