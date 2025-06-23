import { auth } from '@/auth'
import appConfig from '@/configs/app.config'
import { redirect } from 'next/navigation'

const Page = async () => {
    const session = await auth()

    // Redirect based on authentication status
    if (session) {
        // If user is logged in, skip landing page and go directly to dashboard
        redirect(appConfig.authenticatedEntryPath)
    } else {
        // If user is not logged in, show the landing page
        redirect(appConfig.unAuthenticatedEntryPath)
    }
}

export default Page
