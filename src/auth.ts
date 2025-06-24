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
        ...authConfig.callbacks,
        async redirect({ url, baseUrl }) {
            console.log('🔄 Auth redirect callback triggered:', { url, baseUrl })
            
            // If url is a relative path, prepend baseUrl
            if (url.startsWith("/")) {
                const finalUrl = `${baseUrl}${url}`
                console.log('✅ Redirecting to relative URL:', finalUrl)
                return finalUrl
            }
            
            // If url is on the same origin, allow it
            if (new URL(url).origin === baseUrl) {
                console.log('✅ Redirecting to same origin URL:', url)
                return url
            }
            
            // Fallback to authenticated entry path
            const fallbackUrl = `${baseUrl}${appConfig.authenticatedEntryPath}`
            console.log('⚠️ Using fallback redirect:', fallbackUrl)
            return fallbackUrl
        },
    },
})
