import ProjectDashboardProvider from './_components/ProjectDashboardProvider'
import ProjectDashboardHeader from './_components/ProjectDashboardHeader'
import ProjectDashboardContent from './_components/ProjectDashboardContent'
import getProjects from '@/server/actions/getProjects'
import getSrcumboardMembers from '@/server/actions/getSrcumboardMembers'

export default async function ProjectDashboardPage() {
    const projectList = await getProjects()
    const projectMembers = await getSrcumboardMembers()

    return (
        <ProjectDashboardProvider
            projectList={projectList}
            projectMembers={projectMembers}
        >
            <div>
                <ProjectDashboardHeader />
                <ProjectDashboardContent />
            </div>
        </ProjectDashboardProvider>
    )
}
