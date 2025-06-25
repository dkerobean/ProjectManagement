import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Landing from './(public-pages)/landing/components/Landing'

// Import config inline to debug import issues
const appConfig = {
    authenticatedEntryPath: '/dashboards/project',
    unAuthenticatedEntryPath: '/sign-in',
}

const Page = async () => {
    let session = null
    
    try {
        session = await auth()
    } catch (error) {
        console.error('❌ Auth function failed in main page:', error)
        // Continue without session - show landing page
    }    // Enhanced redirect handling with validation
    if (session?.user) {
        const redirectPath = appConfig.authenticatedEntryPath
        console.log('🔍 Debug appConfig:', JSON.stringify(appConfig, null, 2))
        console.log('✅ Authenticated user, redirecting to:', redirectPath)
        
        // Ensure we have a valid redirect path
        if (!redirectPath || redirectPath === 'undefined') {
            console.error('❌ Invalid redirect path, using fallback')
            redirect('/dashboards/project')
        } else {
            redirect(redirectPath)
        }
    }
    
    // If user is not logged in, show the landing page directly (no redirect)
    console.log('👤 Unauthenticated user, showing landing page')
    return <Landing />
}

export default Page
