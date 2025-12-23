import { redirect } from 'next/navigation'

/**
 * Project Dashboard Redirect
 * GoldTrader Pro - Redirect old project dashboard to gold dashboard
 */
export default function ProjectDashboardPage() {
  redirect('/gold')
}
