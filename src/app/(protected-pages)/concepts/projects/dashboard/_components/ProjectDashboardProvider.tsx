'use client'

import { useEffect } from 'react'
import { useProjectListStore } from '../../project-list/_store/projectListStore'
import type { ProjectList, ProjectMembers } from '../../project-list/types'
import type { CommonProps } from '@/@types/common'

interface ProjectDashboardProviderProps extends CommonProps {
    projectList: ProjectList
    projectMembers: ProjectMembers
}

const ProjectDashboardProvider = ({
    children,
    projectList,
    projectMembers,
}: ProjectDashboardProviderProps) => {
    const setProjectList = useProjectListStore((state) => state.setProjectList)
    const setMembers = useProjectListStore((state) => state.setMembers)

    useEffect(() => {
        setProjectList(projectList)
        setMembers(
            projectMembers.allMembers.map((item) => ({
                value: item.id,
                label: item.name,
                img: item.img,
            })),
        )
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <>{children}</>
}

export default ProjectDashboardProvider
