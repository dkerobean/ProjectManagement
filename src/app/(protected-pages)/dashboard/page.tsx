import { redirect } from 'next/navigation'

export default function DashboardRedirect() {
    // Redirect /dashboard to the actual dashboard route
    redirect('/dashboards/project')
}
