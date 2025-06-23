import { auth } from '@/auth'
import appConfig from '@/configs/app.config'
import { redirect } from 'next/navigation'
import Landing from './(public-pages)/landing/components/Landing'

const Page = async () => {
    const session = await auth()

    // Redirect based on authentication status
    if (session) {
        // If user is logged in, skip landing page and go directly to dashboard
        redirect(appConfig.authenticatedEntryPath)
    }
    
    // If user is not logged in, show the landing page directly (no redirect)
    return <Landing />
}

export default Page
