import NextAuth from 'next-auth'
import appConfig from '@/configs/app.config'
import authConfig from '@/configs/auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
    pages: {
        signIn: appConfig.unAuthenticatedEntryPath,
        error: appConfig.unAuthenticatedEntryPath,
    },
    session: {
        strategy: "jwt",
        maxAge: 4 * 60 * 60, // 4 hours
    },
    debug: process.env.NODE_ENV === "development",
    ...authConfig,
    callbacks: {
        ...authConfig.callbacks,        redirect({ url, baseUrl }) {
            console.log('🔄 NextAuth redirect callback:', { url, baseUrl, NODE_ENV: process.env.NODE_ENV })

            // Safety check: prevent localhost redirects in production
            if (process.env.NODE_ENV === 'production' && baseUrl.includes('localhost')) {
                console.error('❌ Production environment using localhost baseUrl:', baseUrl)
                console.error('❌ Check NEXTAUTH_URL environment variable in Vercel dashboard')
            }

            // If url is relative, make it absolute
            if (url.startsWith('/')) {
                const targetUrl = `${baseUrl}${url}`
                console.log('📍 Redirecting to relative URL:', targetUrl)
                return targetUrl
            }

            // If url is absolute and same origin, allow it
            if (url.startsWith(baseUrl)) {
                console.log('📍 Redirecting to same origin URL:', url)
                return url
            }

            // Default to project dashboard for successful auth
            const defaultUrl = `${baseUrl}/dashboards/project`
            console.log('📍 Using default redirect URL:', defaultUrl)
            return defaultUrl
        }
    },
})
