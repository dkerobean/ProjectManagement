'use client'

import { ReactNode, useEffect } from 'react'
import { useProjectsStore, Project, ProjectMember } from '../_store/projectsStore'

interface ProjectData {
    id: string
    name: string
    category: string
    desc: string
    attachmentCount: number
    totalTask: number
    completedTask: number
    progression: number
    dayleft?: number
    status: string
    member: Array<{
        id: string
        name: string
        email: string
        img: string
    }>
    cover: string
    priority: string
    createdAt: string
    updatedAt: string
    favourite?: boolean
    rawData?: {
        description?: string
        start_date?: string
        end_date?: string
        budget?: number
        metadata?: Record<string, unknown>
        owner?: {
            id: string
            name: string
            email: string
            avatar_url: string | null
        }
        project_members?: Array<{
            id: string
            role: string
            user: {
                id: string
                name: string
                email: string
                avatar_url: string | null
            }
        }>
        tasks?: Array<{
            id: string
            status: string
            priority: string
        }>
    }
}

interface MemberData {
    id: string
    name: string
    email: string
    img: string
}

interface ProjectsProviderProps {
    children: ReactNode
    projectList: ProjectData[]
    projectMembers: {
        participantMembers: MemberData[]
        allMembers: MemberData[]
    }
}

const ProjectsProvider = ({ children, projectList, projectMembers }: ProjectsProviderProps) => {
    const { setProjects, setProjectMembers } = useProjectsStore()

    useEffect(() => {
        // Transform the data to match our store structure
        const transformedProjects: Project[] = projectList.map((project: ProjectData) => ({
            id: project.id,
            name: project.name,
            description: project.desc || null,
            status: project.status as Project['status'],
            priority: project.priority as Project['priority'],
            owner_id: project.rawData?.owner?.id || '',
            start_date: project.rawData?.start_date || null,
            end_date: project.rawData?.end_date || null,
            budget: project.rawData?.budget || null,
            metadata: project.rawData?.metadata || { color: project.cover, template: project.category },
            created_at: project.createdAt,
            updated_at: project.updatedAt,
            favorite: project.favourite || false,
            taskCount: project.totalTask || 0,
            completedTasks: project.completedTask || 0,
            memberCount: project.member?.length || 0,
            progress: project.progression || 0,
            owner: project.rawData?.owner,
            project_members: project.rawData?.project_members,
            tasks: project.rawData?.tasks
        }))

        // Use allMembers from the projectMembers object
        const transformedMembers: ProjectMember[] = (projectMembers.allMembers || []).map((member: MemberData) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            avatar_url: member.img // Note: the data uses 'img' instead of 'avatar_url'
        }))

        setProjects(transformedProjects)
        setProjectMembers(transformedMembers)
    }, [projectList, projectMembers, setProjects, setProjectMembers])

    return <>{children}</>
}

export default ProjectsProvider
