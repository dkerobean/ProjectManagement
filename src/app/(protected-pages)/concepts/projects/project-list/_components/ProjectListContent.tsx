'use client'

import Card from '@/components/ui/Card'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import Link from 'next/link'
import ProgressionBar from './ProgressionBar'
import { useProjectListStore } from '../_store/projectListStore'
import { TbClipboardCheck, TbStarFilled, TbStar } from 'react-icons/tb'

const ProjectListContent = () => {
    const { projectList, updateProjectFavorite } = useProjectListStore()

    const handleToggleFavorite = (id: string, value: boolean) => {
        updateProjectFavorite({ id, value })
    }

    return (
        <div>
            {/* Favorite Section - Card Layout */}
            {projectList?.filter((project) => project.favourite).length > 0 && (
                <>
                    <h5 className="mb-3">Favorite</h5>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {projectList
                            ?.filter((project) => project.favourite)
                            .map((project) => (
                                <Card key={project.id} bodyClass="h-full">
                                    <div className="flex flex-col h-full justify-between">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h6 className="font-bold text-lg mb-1 hover:text-primary">
                                                    {project.name}
                                                </h6>
                                                <p className="text-gray-600 mb-2 text-base">
                                                    {project.desc}
                                                </p>
                                            </div>
                                            <div
                                                className="text-amber-400 cursor-pointer text-xl ml-2 mt-1 hover:text-amber-500 transition-colors"
                                                role="button"
                                                onClick={() =>
                                                    handleToggleFavorite(
                                                        project.id,
                                                        false,
                                                    )
                                                }
                                            >
                                                <TbStarFilled />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-4 mt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-grow">
                                                    <ProgressionBar
                                                        progression={project.progression}
                                                    />
                                                </div>
                                                <span className="font-bold">
                                                    {project.progression}%
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <UsersAvatarGroup
                                                    users={project.member}
                                                />
                                                <div className="inline-flex items-center gap-1">
                                                    <TbClipboardCheck className="text-xl" />
                                                    <span>
                                                        {project.completedTask} /{' '}
                                                        {project.totalTask}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                    </div>
                </>
            )}
            <div className="mt-8">
                {projectList?.filter((project) => !project.favourite).length >
                    0 && <h5 className="mb-3">Other projects</h5>}
                <div className="flex flex-col gap-4">
                    {projectList
                        ?.filter((project) => !project.favourite)
                        .map((project) => (
                            <Card key={project.id}>
                                <div className="grid gap-x-4 grid-cols-12">
                                    <div className="my-1 sm:my-0 col-span-12 sm:col-span-2 md:col-span-3 lg:col-span-3 md:flex md:items-center">
                                        <div className="flex flex-col">
                                            <h6 className="font-bold hover:text-primary">
                                                <Link
                                                    href={`/concepts/projects/project-details/${project.id}`}
                                                >
                                                    {project.name}
                                                </Link>
                                            </h6>
                                            <span>{project.category}</span>
                                        </div>
                                    </div>
                                    <div className="my-1 sm:my-0 col-span-12 sm:col-span-2 md:col-span-2 lg:col-span-2 md:flex md:items-center md:justify-end">
                                        <div className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-full text-xs">
                                            <TbClipboardCheck className="text-base mr-1" />
                                            <span className="whitespace-nowrap">
                                                {project.completedTask} / {project.totalTask}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="my-1 sm:my-0 col-span-12 md:col-span-2 lg:col-span-3 md:flex md:items-center">
                                        <ProgressionBar
                                            progression={project.progression}
                                        />
                                    </div>
                                    <div className="my-1 sm:my-0 col-span-12 md:col-span-3 lg:col-span-3 md:flex md:items-center">
                                        <UsersAvatarGroup
                                            users={project.member}
                                        />
                                    </div>
                                    <div className="my-1 sm:my-0 col-span-12 sm:col-span-1 flex md:items-center justify-end">
                                        <div
                                            className="cursor-pointer text-lg text-gray-400 hover:text-amber-400 transition-colors"
                                            role="button"
                                            onClick={() =>
                                                handleToggleFavorite(
                                                    project.id,
                                                    true,
                                                )
                                            }
                                        >
                                            <TbStar />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                </div>
            </div>
        </div>
    )
}

export default ProjectListContent
