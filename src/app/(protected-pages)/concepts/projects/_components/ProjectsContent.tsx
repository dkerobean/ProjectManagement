'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useProjectsStore, type Project } from '../_store/projectsStore'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Progress from '@/components/ui/Progress'
import ProjectActionsDropdown from './ProjectActionsDropdown'
import {
    TbStar,
    TbStarFilled,
    TbClipboardCheck
} from 'react-icons/tb'
import Link from 'next/link'

const ProjectsContent = () => {
    const loadedRef = useRef(false)
    
    const {
        projects,
        searchQuery,
        statusFilter,
        priorityFilter,
        sortBy,
        sortOrder,
        toggleProjectFavorite,
        loadProjects
    } = useProjectsStore()

    // Load projects and preferences on component mount
    useEffect(() => {
        if (!loadedRef.current && (!projects || projects.length === 0)) {
            console.log('🚀 ProjectsContent: Initializing projects load...')
            loadedRef.current = true
            loadProjects() // This already calls loadUserPreferences internally
        }
    }, [loadProjects, projects])

    // Filter and sort projects
    const filteredProjects = useMemo(() => {
        if (!Array.isArray(projects)) {
            return []
        }
        
        const filtered = projects.filter((project) => {
            const matchesSearch = !searchQuery ||
                project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.description?.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesStatus = !statusFilter || project.status === statusFilter
            const matchesPriority = !priorityFilter || project.priority === priorityFilter

            return matchesSearch && matchesStatus && matchesPriority
        })

        // Sort projects
        filtered.sort((a, b) => {
            let aValue = a[sortBy as keyof typeof a]
            let bValue = b[sortBy as keyof typeof b]

            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0
            if (aValue == null) return sortOrder === 'asc' ? 1 : -1
            if (bValue == null) return sortOrder === 'asc' ? -1 : 1

            if (typeof aValue === 'string') aValue = aValue.toLowerCase()
            if (typeof bValue === 'string') bValue = bValue.toLowerCase()

            if (sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
            }
        })

        return filtered
    }, [projects, searchQuery, statusFilter, priorityFilter, sortBy, sortOrder])

    // Separate favorite and regular projects
    const favoriteProjects = filteredProjects.filter(project => project?.favorite) || []
    const regularProjects = filteredProjects.filter(project => !project?.favorite) || []

    const FavoriteProjectCard = ({ project }: { project: Project }) => (
        <Card key={project.id} bodyClass="p-6">
            <div className="flex flex-col h-full">
                {/* Header with star and actions */}
                <div className="flex justify-between items-start mb-4">
                    <Link href={`/concepts/projects/project-details/${project.id}`}>
                        <h4 className="font-bold hover:text-primary cursor-pointer text-gray-900">
                            {project.name}
                        </h4>
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => toggleProjectFavorite(project.id, false)}
                            className="text-amber-400 hover:text-amber-500 text-xl"
                        >
                            <TbStarFilled />
                        </button>
                        <ProjectActionsDropdown project={project} />
                    </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                    {project.description || 'Most of you are familiar with the virtues of a programmer'}
                </p>

                {/* Progress */}
                <div className="mb-4">
                    <Progress
                        percent={project.progress || 0}
                        size="sm"
                        showInfo={false}
                        className="mb-2"
                        customColorClass={project.progress && project.progress > 80 ? 'bg-green-500' : project.progress && project.progress > 50 ? 'bg-yellow-500' : 'bg-red-500'}
                    />
                </div>

                {/* Bottom row with task count and avatars */}
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1 text-gray-600">
                        <TbClipboardCheck className="text-lg" />
                        <span className="font-medium text-sm">
                            {project.completedTasks || 27} / {project.taskCount || 32}
                        </span>
                    </div>

                    {/* Progress percentage */}
                    <span className="font-bold text-lg text-gray-900">
                        {project.progress || 80}%
                    </span>
                </div>

                {/* Team Avatars */}
                <div className="flex -space-x-2 mt-4">
                    {project.project_members && Array.isArray(project.project_members) && project.project_members.length > 0 ? (
                        <>
                            {project.project_members.slice(0, 3).map((member) => (
                                <Avatar
                                    key={member.id}
                                    size={32}
                                    src={member.user?.avatar_url || undefined}
                                    alt={member.user?.name || 'Team member'}
                                    className="border-2 border-white"
                                />
                            ))}
                            {project.project_members.length > 3 && (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border-2 border-white text-xs font-medium text-gray-600">
                                    +{project.project_members.length - 3}
                                </div>
                            )}
                        </>
                    ) : (
                        // Default avatars for demo
                        <>
                            <Avatar size={32} className="border-2 border-white bg-blue-500 text-white" alt="User 1">U1</Avatar>
                            <Avatar size={32} className="border-2 border-white bg-green-500 text-white" alt="User 2">U2</Avatar>
                        </>
                    )}
                </div>
            </div>
        </Card>
    )

    const RegularProjectCard = ({ project }: { project: Project }) => (
        <Card key={project.id} bodyClass="p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                        <Link href={`/concepts/projects/project-details/${project.id}`}>
                            <h6 className="font-bold hover:text-primary cursor-pointer text-gray-900">
                                {project.name}
                            </h6>
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                            {project.description?.split(' ').slice(0, 8).join(' ') || 'Web Backend Application'}
                        </p>
                    </div>
                </div>

                {/* Task count */}
                <div className="flex items-center gap-1 text-gray-600 mr-4">
                    <TbClipboardCheck className="text-base" />
                    <span className="text-sm font-medium">
                        {project.completedTasks || 19} / {project.taskCount || 27}
                    </span>
                </div>

                {/* Progress */}
                <div className="w-32 mr-4">
                    <Progress
                        percent={project.progress || 73}
                        size="sm"
                        showInfo={false}
                        customColorClass={project.progress && project.progress > 80 ? 'bg-green-500' : project.progress && project.progress > 50 ? 'bg-yellow-500' : 'bg-red-500'}
                    />
                </div>

                {/* Progress percentage */}
                <div className="w-12 text-right mr-4">
                    <span className="font-bold text-gray-900">
                        {project.progress || 73}%
                    </span>
                </div>

                {/* Team Avatars */}
                <div className="flex -space-x-2 mr-4">
                    {project.project_members && Array.isArray(project.project_members) && project.project_members.length > 0 ? (
                        <>
                            {project.project_members.slice(0, 2).map((member) => (
                                <Avatar
                                    key={member.id}
                                    size={28}
                                    src={member.user?.avatar_url || undefined}
                                    alt={member.user?.name || 'Team member'}
                                    className="border-2 border-white"
                                />
                            ))}
                            {project.project_members.length > 2 && (
                                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 border-2 border-white text-xs font-medium text-gray-600">
                                    +{project.project_members.length - 2}
                                </div>
                            )}
                        </>
                    ) : (
                        // Default avatars for demo
                        <>
                            <Avatar size={28} className="border-2 border-white bg-purple-500 text-white" alt="User 1">U1</Avatar>
                            <Avatar size={28} className="border-2 border-white bg-indigo-500 text-white" alt="User 2">U2</Avatar>
                        </>
                    )}
                </div>

                {/* Star button and actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => toggleProjectFavorite(project.id, true)}
                        className="text-gray-400 hover:text-amber-400 text-lg"
                    >
                        <TbStar />
                    </button>
                    <ProjectActionsDropdown project={project} />
                </div>
            </div>
        </Card>
    )

    return (
        <div className="px-6 py-4">
            {/* Favorites Section */}
            {favoriteProjects.length > 0 && (
                <div className="mb-8">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TbStarFilled className="text-amber-400" />
                        Favorite
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favoriteProjects.map((project) => (
                            <FavoriteProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                </div>
            )}

            {/* Regular Projects Section */}
            {regularProjects.length > 0 && (
                <div>
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">
                        Other projects
                    </h5>
                    <div className="space-y-4">
                        {regularProjects.map((project) => (
                            <RegularProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredProjects.length === 0 && (
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                        <TbClipboardCheck className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-500 mb-6">
                        {searchQuery || statusFilter || priorityFilter
                            ? 'Try adjusting your search or filters to find what you\'re looking for.'
                            : 'Get started by creating your first project.'
                        }
                    </p>
                    <Button variant="solid" onClick={() => useProjectsStore.getState().toggleCreateModal()}>
                        Create New Project
                    </Button>
                </div>
            )}
        </div>
    )
}

export default ProjectsContent
