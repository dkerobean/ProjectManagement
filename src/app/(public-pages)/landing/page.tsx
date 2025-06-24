import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import appConfig from '@/configs/app.config'
import Landing from "./components/Landing"

const Page = async () => {
    let session = null
    
    try {
        session = await auth()
    } catch (error) {
        console.error('❌ Auth function failed in landing page:', error)
        // Continue without session - show landing page
    }
    
    // If user is already authenticated, redirect to dashboard
    if (session?.user) {
        redirect(appConfig.authenticatedEntryPath)
    }
    
    return (
        <Landing />
    )
}

export default Page