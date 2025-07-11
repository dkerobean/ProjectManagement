import UpcomingSchedule from './_components/UpcomingSchedule'
import TaskOverview from './_components/TaskOverview'
import CurrentTasks from './_components/CurrentTasks'
import Schedule from './_components/Schedule'
import ProjectOverview from './_components/ProjectOverview'
import RecentActivity from './_components/RecentActivity'
import getProjectDashboard from '@/server/actions/getProjectDashboardNew'
import getUpcomingCalendarEvents from '@/server/actions/getUpcomingCalendarEvents'
import getRecentActivities from '@/server/actions/getRecentActivities'

export default async function Page() {
    const data = await getProjectDashboard()
    const upcomingEvents = await getUpcomingCalendarEvents()
    const recentActivities = await getRecentActivities()

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col xl:flex-row gap-4">
                <div className="flex flex-col gap-4 flex-1 xl:max-w-[calc(100%-350px)]">
                    <ProjectOverview data={data.projectOverview} />
                    <Schedule data={data.schedule} />                </div>
                <div>
                    <UpcomingSchedule upcomingEvents={upcomingEvents} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="md:col-span-1 xl:col-span-1 order-1">
                    <CurrentTasks data={data.currentTasks} />
                </div>
                <div className="md:col-span-1 xl:col-span-1 order-2 xl:order-3">
                    <RecentActivity data={recentActivities} />
                </div>
                <div className="md:col-span-2 xl:col-span-1 order-3 xl:order-2">
                    <TaskOverview data={data.taskOverview} />
                </div>
            </div>
        </div>
    )
}
