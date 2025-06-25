import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function DashboardRedirectPage() {
    // Get session to ensure user is authenticated
    const session = await auth()
    
    if (!session) {
        // If not authenticated, redirect to sign in
        redirect('/sign-in')
    }
    
    // Immediately redirect to project dashboard
    redirect('/dashboards/project')
}
