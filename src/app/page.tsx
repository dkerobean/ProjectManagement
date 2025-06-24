import { auth } from '@/auth'
import appConfig from '@/configs/app.config'
import { redirect } from 'next/navigation'
import Landing from './(public-pages)/landing/components/Landing'

const Page = async () => {
    let session = null
    
    try {
        session = await auth()
    } catch (error) {
        console.error('❌ Auth function failed in main page:', error)
        // Continue without session - show landing page
    }

    // Enhanced redirect handling with validation
    if (session?.user) {
        const redirectPath = appConfig.authenticatedEntryPath
        
        // Validate redirect path to prevent undefined routes
        if (redirectPath && redirectPath !== '' && redirectPath !== 'undefined') {
            console.log('✅ Authenticated user, redirecting to:', redirectPath)
            redirect(redirectPath)
        } else {
            console.warn('⚠️ Invalid authenticated entry path, using fallback')
            redirect('/dashboard')
        }
    }
    
    // If user is not logged in, show the landing page directly (no redirect)
    console.log('👤 Unauthenticated user, showing landing page')
    return <Landing />
}

export default Page
