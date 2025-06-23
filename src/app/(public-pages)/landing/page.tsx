import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import appConfig from '@/configs/app.config'
import Landing from "./components/Landing"

const Page = async () => {
    const session = await auth()
    
    // If user is already authenticated, redirect to dashboard
    if (session) {
        redirect(appConfig.authenticatedEntryPath)
    }
    
    return (
        <Landing />
    )
}

export default Page