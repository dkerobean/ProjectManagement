import { auth } from '@/auth'
import appConfig from '@/configs/app.config'
import { redirect } from 'next/navigation'

const Page = async () => {
    const session = await auth()

    // Redirect based on authentication status
    if (session) {
        redirect(appConfig.authenticatedEntryPath)
    } else {
        redirect(appConfig.unAuthenticatedEntryPath)
    }
}

export default Page
