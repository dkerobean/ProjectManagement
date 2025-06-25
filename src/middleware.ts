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
// import createIntlMiddleware from 'next-intl/middleware'
// import { routing } from './i18n/routing'
// import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

// Create the next-intl middleware (disabled for now)
// const handleI18nRouting = createIntlMiddleware(routing)

const publicRoutes = Object.entries(_publicRoutes).map(([key]) => key)
const authRoutes = Object.entries(_authRoutes).map(([key]) => key)

const apiAuthPrefix = `${appConfig.apiPrefix}/auth`

export default auth((req) => {
    const { nextUrl } = req
    const isSignedIn = !!req.auth

    console.log('🔍 Middleware check:', {
        pathname: nextUrl.pathname,
        search: nextUrl.search,
        isSignedIn,
        hasUser: !!req.auth?.user,
        userEmail: req.auth?.user?.email
    })

    // Enhanced guard against undefined routes and prevent infinite loops
    if (nextUrl.pathname === '/undefined' || 
        nextUrl.pathname.includes('/undefined/') || 
        nextUrl.pathname.includes('undefined') ||
        nextUrl.pathname === '/null' ||
        nextUrl.pathname.includes('/null/')) {
        console.warn('⚠️ Detected invalid route, redirecting:', nextUrl.pathname)
        // Always redirect to home to prevent loops
        return Response.redirect(new URL('/', nextUrl))
    }

    // Prevent redirect loops - if we've already redirected multiple times, just serve the page
    const redirectCount = parseInt(nextUrl.searchParams.get('_redirects') || '0')
    if (redirectCount > 2) {
        console.error('❌ Too many redirects detected, serving home page')
        return Response.redirect(new URL('/', nextUrl))
    }

    // Don't apply intl middleware to API routes, static files, or Next.js internals
    if (nextUrl.pathname.startsWith('/api/') || 
        nextUrl.pathname.startsWith('/_next/') || 
        nextUrl.pathname.startsWith('/_vercel/') || 
        nextUrl.pathname.includes('.')) {
        
        // Only these API routes require authentication
        if (nextUrl.pathname.startsWith('/api/')) {
            const protectedApiRoutes = ['/api/user', '/api/profile', '/api/admin']
            const requiresAuth = protectedApiRoutes.some(route => nextUrl.pathname.startsWith(route))
            if (!requiresAuth) return
        } else {
            return
        }
    }

    // Handle i18n routing for non-API routes with error handling (disabled for debugging)
    // if (!nextUrl.pathname.startsWith('/api/') && 
    //     !nextUrl.pathname.startsWith('/_next/') && 
    //     !nextUrl.pathname.startsWith('/_vercel/') && 
    //     !nextUrl.pathname.includes('.')) {
    //     try {
    //         const response = handleI18nRouting(req as NextRequest)
    //         // If i18n middleware returns a redirect/rewrite, use it
    //         if (response && response.status !== 200) {
    //             return response
    //         }
    //     } catch (error) {
    //         console.warn('⚠️ i18n middleware error, continuing with auth:', error)
    //         // Continue with auth logic even if i18n fails
    //     }
    // }

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
    const isAuthRoute = authRoutes.includes(nextUrl.pathname)

    /** Skip auth middleware for api routes */
    if (isApiAuthRoute) return

    if (isAuthRoute) {
        if (isSignedIn) {
            /** Redirect to authenticated entry path if signed in & path is auth route */
            return Response.redirect(
                new URL('/dashboards/project', nextUrl),
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
                `/sign-in?${REDIRECT_URL_KEY}=${callbackUrl}`,
                nextUrl,
            ),
        )
    }

    /** Enhanced role-based access control */
    if (isSignedIn && nextUrl.pathname !== '/access-denied') {
        // Add null checks for auth object to prevent production errors
        if (!req.auth || !req.auth.user) {
            console.error('❌ Middleware - auth or auth.user is undefined despite isSignedIn being true')
            return Response.redirect(new URL('/sign-in', nextUrl))
        }
        
        const userRole = req.auth.user.role as UserRole
        const userAuthority = req.auth.user.authority || []

        // Debug logging
        console.log('🔍 Middleware check for:', nextUrl.pathname)
        console.log('👤 User role:', userRole)
        console.log('🔑 User authority:', userAuthority)
        console.log('📧 User email:', req.auth.user.email)

        const routeMeta = protectedRoutes[nextUrl.pathname]

        if (routeMeta && routeMeta.authority && routeMeta.authority.length > 0) {

            // Check if user has required role using role hierarchy
            const hasRequiredRole = routeMeta.authority.some((requiredRole: string) => {
                // Check both legacy authority array and new role-based system
                return userAuthority.includes(requiredRole) ||
                       hasRole(userRole, requiredRole as UserRole)
            })

            console.log('📋 Route authority required:', routeMeta.authority)
            console.log('✅ Has required role:', hasRequiredRole)

            if (!hasRequiredRole) {
                console.log('❌ Access denied - redirecting to /access-denied')
                return Response.redirect(
                    new URL('/access-denied', nextUrl),
                )
            }
        }

        // Additional role-based route protection
        const roleBasedRoutes: Record<string, UserRole[]> = {
            '/admin': ['admin'],
            '/user-management': ['admin'],
            '/system-settings': ['admin'],
            '/audit-logs': ['admin'],
            '/project-management': ['admin', 'project_manager'],
            '/team-management': ['admin', 'project_manager'],
            '/analytics': ['admin', 'project_manager'],
            '/projects': ['admin', 'project_manager', 'member'],
            '/tasks': ['admin', 'project_manager', 'member'],
            '/files': ['admin', 'project_manager', 'member'],
        }

        // Check if current path matches any role-based route
        const currentRoute = Object.keys(roleBasedRoutes).find(route =>
            nextUrl.pathname.startsWith(route)
        )

        if (currentRoute) {
            const requiredRoles = roleBasedRoutes[currentRoute]
            
            // Additional null check for safety
            if (!req.auth || !req.auth.user) {
                console.error('❌ Middleware - auth.user undefined during role check')
                return Response.redirect(new URL('/sign-in', nextUrl))
            }
            
            const userRole = req.auth.user.role as UserRole

            const hasAccess = requiredRoles.some(role => hasRole(userRole, role))

            if (!hasAccess) {
                return Response.redirect(
                    new URL('/access-denied', nextUrl),
                )
            }
        }
    }

    // Skip intl middleware for now to isolate the issue
    return null
})

export const config = {
    matcher: [
        // Match all pathnames except for
        // - API routes that don't need auth or i18n
        // - Static files (those with a dot in the path)
        // - _next and _vercel internals
        '/((?!api/_next|_vercel|.*\\..*).*)' 
    ],
}
