import ProjectListProvider from './_components/ProjectListProvider'
import ProjectListHeaderWithQuery from './_components/ProjectListHeaderWithQuery'
import ProjectListContent from './_components/ProjectListContent'
import getProjects from '@/server/actions/getProjects'
import getSrcumboardMembers from '@/server/actions/getSrcumboardMembers'
import { Suspense } from 'react'

export default async function Page() {
    const projectList = await getProjects()
    const projectMembers = await getSrcumboardMembers()

    return (
        <ProjectListProvider
            projectList={projectList}
            projectMembers={projectMembers}
        >
            <div>
                <Suspense fallback={<div>Loading...</div>}>
                    <ProjectListHeaderWithQuery />
                </Suspense>
                <ProjectListContent />
            </div>
        </ProjectListProvider>
    )
}
