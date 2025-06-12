'use client'

import { useState, useMemo } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Progress from '@/components/ui/Progress'
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import GrowShrinkValue from '@/components/shared/GrowShrinkValue'
import { NumericFormat } from 'react-number-format'
import classNames from '@/utils/classNames'
import Link from 'next/link'
import { useProjectListStore } from '../../project-list/_store/projectListStore'
import {
    TbProgressBolt,
    TbCopyCheck,
    TbClock,
    TbUsers,
    TbTarget,
    TbCalendar,
    TbTrendingUp
} from 'react-icons/tb'
import type { ReactNode } from 'react'

type StatisticCardProps = {
    title: string
    value: number | string | ReactNode
    icon: ReactNode
    className: string
    growShrink?: number
    description?: string
}

type ProjectCardProps = {
    id: string
    name: string
    description?: string
    status: string
    progress: number
    dueDate?: string
    teamMembers: Array<{ img: string; name: string }>
    priority: string
    category?: string
    totalTask: number
    completedTask: number
}

type FilterOption = {
    value: string
    label: string
}

// Helper function to determine project status based on progression
const getProjectStatus = (progression: number, completedTask: number, totalTask: number) => {
    if (completedTask === totalTask && totalTask > 0) return 'Completed'
    if (progression === 0) return 'Planning'
    if (progression < 30) return 'Starting'
    if (progression < 70) return 'In Progress'
    if (progression < 100) return 'Finishing'
    return 'Completed'
}

// Helper function to determine priority based on days left or progression
const getProjectPriority = (progression: number, dayleft?: number) => {
    if (dayleft !== undefined && dayleft <= 7) return 'High'
    if (progression < 30 && dayleft !== undefined && dayleft <= 30) return 'High'
    if (progression > 70) return 'Low'
    return 'Medium'
}

const statusColors: Record<string, string> = {
    'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
    'Starting': 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100',
    'Planning': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    'Finishing': 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
}

const priorityColors: Record<string, string> = {
    'High': 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
    'Medium': 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
    'Low': 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
}

const StatisticCard = ({ title, value, icon, className, growShrink, description }: StatisticCardProps) => {
    return (
        <Card className={classNames('p-6', className)}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {title}
                    </div>
                    <div className="text-2xl font-bold mb-1">{value}</div>
                    {growShrink !== undefined && (
                        <div className="flex items-center gap-1">
                            <GrowShrinkValue
                                className="text-sm font-medium"
                                value={growShrink}
                                suffix="%"
                                positiveIcon="+"
                                negativeIcon=""
                            />
                            <span className="text-xs text-gray-500">vs last month</span>
                        </div>
                    )}
                    {description && (
                        <div className="text-xs text-gray-500 mt-1">{description}</div>
                    )}
                </div>
                <div className="text-2xl text-gray-600 dark:text-gray-400">{icon}</div>
            </div>
        </Card>
    )
}

const ProjectCard = ({
    id,
    name,
    description,
    status,
    progress,
    dueDate,
    teamMembers,
    priority,
    category,
    totalTask,
    completedTask
}: ProjectCardProps) => {
    return (
        <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <Link href={`/concepts/projects/project-details/${id}`}>
                        <h6 className="font-semibold hover:text-primary cursor-pointer">
                            {name}
                        </h6>
                    </Link>
                    {description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {description}
                        </p>
                    )}
                    {category && (
                        <span className="text-xs text-gray-500 mt-1 block">{category}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Tag className={priorityColors[priority] || priorityColors['Medium']}>
                        {priority}
                    </Tag>
                    <Tag className={statusColors[status] || statusColors['Planning']}>
                        {status}
                    </Tag>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress
                    percent={progress}
                    size="sm"
                    customColorClass={
                        progress >= 80 ? 'bg-green-500' :
                        progress >= 50 ? 'bg-blue-500' :
                        progress >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                    }
                />
            </div>

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <TbCalendar className="text-base" />
                        <span>{completedTask}/{totalTask} tasks</span>
                    </div>
                    {dueDate && (
                        <div className="text-sm text-orange-600 dark:text-orange-400">
                            {dueDate} days left
                        </div>
                    )}
                </div>
                <div className="flex items-center -space-x-2">
                    {teamMembers.slice(0, 4).map((member, index) => (
                        <Avatar
                            key={index}
                            size="sm"
                            src={member.img}
                            alt={member.name}
                            className="border-2 border-white dark:border-gray-700"
                        />
                    ))}
                    {teamMembers.length > 4 && (
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-700">
                            +{teamMembers.length - 4}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}

const ProjectDashboardContent = () => {
    const { projectList } = useProjectListStore()
    const [statusFilter, setStatusFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [sortBy, setSortBy] = useState('name')

    // Calculate statistics from actual project data
    const statistics = useMemo(() => {
        if (!projectList) return {
            totalProjects: 0,
            activeProjects: 0,
            completedProjects: 0,
            planningProjects: 0,
            avgProgress: 0,
            totalTasks: 0,
            completedTasks: 0
        }

        const totalProjects = projectList.length
        const totalTasks = projectList.reduce((sum, p) => sum + p.totalTask, 0)
        const completedTasks = projectList.reduce((sum, p) => sum + p.completedTask, 0)
        const avgProgress = totalProjects > 0
            ? Math.round(projectList.reduce((sum, p) => sum + p.progression, 0) / totalProjects)
            : 0

        // Count projects by derived status
        const projectsWithStatus = projectList.map(p => ({
            ...p,
            derivedStatus: getProjectStatus(p.progression, p.completedTask, p.totalTask)
        }))

        return {
            totalProjects,
            activeProjects: projectsWithStatus.filter(p => p.derivedStatus === 'In Progress').length,
            completedProjects: projectsWithStatus.filter(p => p.derivedStatus === 'Completed').length,
            planningProjects: projectsWithStatus.filter(p => p.derivedStatus === 'Planning').length,
            avgProgress,
            totalTasks,
            completedTasks
        }
    }, [projectList])

    const statusOptions: FilterOption[] = [
        { value: 'all', label: 'All Statuses' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Starting', label: 'Starting' },
        { value: 'Planning', label: 'Planning' },
        { value: 'Finishing', label: 'Finishing' },
    ]

    const priorityOptions: FilterOption[] = [
        { value: 'all', label: 'All Priorities' },
        { value: 'High', label: 'High Priority' },
        { value: 'Medium', label: 'Medium Priority' },
        { value: 'Low', label: 'Low Priority' },
    ]

    const sortOptions: FilterOption[] = [
        { value: 'name', label: 'Project Name' },
        { value: 'progression', label: 'Progress' },
        { value: 'dayleft', label: 'Days Left' },
        { value: 'category', label: 'Category' },
    ]

    const filteredProjects = useMemo(() => {
        if (!projectList) return []

        return projectList
            .map(project => {
                const status = getProjectStatus(project.progression, project.completedTask, project.totalTask)
                const priority = getProjectPriority(project.progression, project.dayleft)
                return {
                    ...project,
                    derivedStatus: status,
                    derivedPriority: priority
                }
            })
            .filter(project => statusFilter === 'all' || project.derivedStatus === statusFilter)
            .filter(project => priorityFilter === 'all' || project.derivedPriority === priorityFilter)
            .sort((a, b) => {
                switch (sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name)
                    case 'progression':
                        return b.progression - a.progression
                    case 'dayleft':
                        if (!a.dayleft && !b.dayleft) return 0
                        if (!a.dayleft) return 1
                        if (!b.dayleft) return -1
                        return a.dayleft - b.dayleft
                    case 'category':
                        return (a.category || '').localeCompare(b.category || '')
                    default:
                        return 0
                }
            })
    }, [projectList, statusFilter, priorityFilter, sortBy])

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatisticCard
                    title="Total Projects"
                    value={statistics.totalProjects}
                    icon={<TbProgressBolt />}
                    className="border-l-4 border-l-blue-500"
                    growShrink={12.5}
                />
                <StatisticCard
                    title="Active Projects"
                    value={statistics.activeProjects}
                    icon={<TbTrendingUp />}
                    className="border-l-4 border-l-green-500"
                    growShrink={8.2}
                />
                <StatisticCard
                    title="Completed Projects"
                    value={statistics.completedProjects}
                    icon={<TbCopyCheck />}
                    className="border-l-4 border-l-emerald-500"
                    growShrink={15.3}
                />
                <StatisticCard
                    title="Average Progress"
                    value={`${statistics.avgProgress}%`}
                    icon={<TbTarget />}
                    className="border-l-4 border-l-purple-500"
                    growShrink={-2.1}
                />
            </div>

            {/* Progress Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h6 className="font-semibold">Task Progress</h6>
                        <TbClock className="text-xl text-gray-500" />
                    </div>
                    <div className="mb-3">
                        <div className="text-2xl font-bold">{statistics.completedTasks}</div>
                        <div className="text-sm text-gray-500">of {statistics.totalTasks} tasks completed</div>
                    </div>
                    <Progress
                        percent={statistics.totalTasks > 0 ? Math.round((statistics.completedTasks / statistics.totalTasks) * 100) : 0}
                        size="sm"
                    />
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h6 className="font-semibold">Planning Phase</h6>
                        <TbTarget className="text-xl text-gray-500" />
                    </div>
                    <div className="text-2xl font-bold">{statistics.planningProjects}</div>
                    <div className="text-sm text-gray-500 mb-3">Projects in planning</div>
                    <div className="flex items-center gap-1">
                        <GrowShrinkValue
                            className="text-sm font-medium"
                            value={-12.3}
                            suffix="%"
                            positiveIcon="+"
                            negativeIcon=""
                        />
                        <span className="text-xs text-gray-500">vs last month</span>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h6 className="font-semibold">Team Productivity</h6>
                        <TbUsers className="text-xl text-gray-500" />
                    </div>
                    <div className="text-2xl font-bold">94%</div>
                    <div className="text-sm text-gray-500 mb-3">Overall efficiency</div>
                    <div className="flex items-center gap-1">
                        <GrowShrinkValue
                            className="text-sm font-medium"
                            value={5.7}
                            suffix="%"
                            positiveIcon="+"
                            negativeIcon=""
                        />
                        <span className="text-xs text-gray-500">vs last week</span>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h6 className="font-semibold">Upcoming Deadlines</h6>
                        <TbCalendar className="text-xl text-gray-500" />
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                        {projectList?.filter(p => p.dayleft && p.dayleft <= 7).length || 0}
                    </div>
                    <div className="text-sm text-gray-500 mb-3">Next 7 days</div>
                    <Link href="/concepts/projects/tasks">
                        <Button variant="default" size="xs" className="w-full">
                            View Tasks
                        </Button>
                    </Link>
                </Card>
            </div>

            {/* Project Filters and Actions */}
            <Card className="p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                    <h5>Active Projects</h5>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Select
                                size="sm"
                                placeholder="Filter by Status"
                                value={statusOptions.find(option => option.value === statusFilter)}
                                options={statusOptions}
                                onChange={(option) => setStatusFilter(option?.value || 'all')}
                                className="w-[150px]"
                            />
                            <Select
                                size="sm"
                                placeholder="Filter by Priority"
                                value={priorityOptions.find(option => option.value === priorityFilter)}
                                options={priorityOptions}
                                onChange={(option) => setPriorityFilter(option?.value || 'all')}
                                className="w-[150px]"
                            />
                            <Select
                                size="sm"
                                placeholder="Sort by"
                                value={sortOptions.find(option => option.value === sortBy)}
                                options={sortOptions}
                                onChange={(option) => setSortBy(option?.value || 'name')}
                                className="w-[120px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Project Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            id={project.id}
                            name={project.name}
                            description={project.desc}
                            status={project.derivedStatus}
                            progress={project.progression}
                            dueDate={project.dayleft?.toString()}
                            teamMembers={project.member || []}
                            priority={project.derivedPriority}
                            category={project.category}
                            totalTask={project.totalTask}
                            completedTask={project.completedTask}
                        />
                    ))}
                </div>

                {filteredProjects.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-500 mb-4">No projects found matching your filters</div>
                        <Button variant="default" onClick={() => {
                            setStatusFilter('all')
                            setPriorityFilter('all')
                        }}>
                            Clear Filters
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default ProjectDashboardContent
