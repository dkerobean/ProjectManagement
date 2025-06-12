import { Suspense } from 'react'
import ProjectsProvider from './_components/ProjectsProvider'
import ProjectsHeader from './_components/ProjectsHeader'
import ProjectsContent from './_components/ProjectsContent'
import ProjectFormModal from './_components/ProjectFormModal'
import ProjectDeleteModal from './_components/ProjectDeleteModal'
import getProjectsForCrud from '@/server/actions/getProjectsForCrud'
import getScrumboardMembers from '@/server/actions/getSrcumboardMembers'

export default async function ProjectsPage() {
    const projectList = await getProjectsForCrud()
    const projectMembers = await getScrumboardMembers()

    return (
        <ProjectsProvider
            projectList={projectList}
            projectMembers={projectMembers}
        >
            <div className="min-h-screen bg-gray-50">
                <Suspense fallback={<div>Loading...</div>}>
                    <ProjectsHeader />
                </Suspense>
                <ProjectsContent />

                {/* Modals */}
                <ProjectFormModal />
                <ProjectDeleteModal />
            </div>
        </ProjectsProvider>
    )
}
