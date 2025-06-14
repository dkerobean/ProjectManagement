import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Progress from '@/components/ui/Progress'
import Tag from '@/components/ui/Tag'
import dayjs from 'dayjs'

type ProjectDetailsOverviewProps = {
    content: string
    isContentEdit: boolean
    onContentChange: (content: string) => void
    setIsContentEdit: (isEdit: boolean) => void
    client: Partial<{
        clientName: string
        skateHolder: {
            name: string
            img: string
        }
        projectManager: {
            name: string
            img: string
        }
    }>
    schedule: Partial<{
        startDate: number
        dueDate: number
        status: string
        completion: number
    }>
}

type ProjectData = {
    id: string
    name: string
    description: string
    status: string
    priority: string
    start_date: string
    end_date: string
    due_date: string
    created_at: string
    owner: {
        name: string
        email: string
        avatar_url: string
    }
    project_members: Array<{
        user: {
            name: string
            email: string
            avatar_url: string
        }
        role: string
    }>
    taskCount: number
    completedTasks: number
    progress: number
}

const ProjectDetailsOverview = (props: ProjectDetailsOverviewProps) => {
    const params = useParams()
    const projectId = params?.id as string
    const [projectData, setProjectData] = useState<ProjectData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Fetch real project data from the database
    useEffect(() => {
        const fetchProjectData = async () => {
            if (!projectId) return

            try {
                setIsLoading(true)

                const response = await fetch(`/api/projects/${projectId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                })

                if (response.ok) {
                    const result = await response.json()
                    setProjectData(result.data)
                } else {
                    console.error('Failed to fetch project data:', response.statusText)
                }
            } catch (error) {
                console.error('Error fetching project data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProjectData()
    }, [projectId])

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    if (!projectData) {
        return (
            <div className="flex justify-center items-center py-12">
                <p className="text-gray-500">Failed to load project data</p>
            </div>
        )
    }

    // Get project manager (owner or first admin member)
    const projectManager = projectData.owner || projectData.project_members?.find(m => m.role === 'admin')?.user

    // Get stake holder (first member if different from manager)
    const stakeHolder = projectData.project_members?.find(m =>
        m.user.email !== projectManager?.email
    )?.user || projectManager

    return (
        <div className="flex gap-8">
            {/* Main Content Area */}
            <div className="flex-1">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-4">Project overview</h2>
                    <div className="prose max-w-none text-gray-600">
                        {projectData.description ? (
                            <p>{projectData.description}</p>
                        ) : (
                            <p>
                                This project is currently in development. The team is working on delivering
                                high-quality results according to the specified requirements and timeline.
                            </p>
                        )}
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                    <div className="text-gray-600 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Project Status</h4>
                                <p>
                                    The project is currently <strong>{projectData.status}</strong> and has been
                                    actively worked on since {dayjs(projectData.created_at).format('MMMM YYYY')}.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Priority Level</h4>
                                <p>
                                    This project has been assigned a <strong>{projectData.priority}</strong> priority
                                    level, indicating its importance within the current project portfolio.
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Team & Progress</h4>
                            <p>
                                The project team consists of {projectData.project_members?.length || 1} members
                                working collaboratively to achieve the project goals. Currently,
                                <strong> {projectData.completedTasks} out of {projectData.taskCount} tasks</strong>
                                have been completed, representing {projectData.progress}% progress.
                            </p>
                        </div>

                        {projectData.due_date && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                                <p>
                                    The project is scheduled for completion by {dayjs(projectData.due_date).format('MMMM DD, YYYY')}.
                                    The team is committed to delivering all objectives within the specified timeframe
                                    while maintaining high quality standards.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-80">
                <Card className="mb-6">
                    <h4 className="font-semibold mb-4">Project Information</h4>
                    <div className="space-y-4">
                        <div>
                            <span className="text-sm font-medium text-gray-600">Project Name:</span>
                            <p className="font-medium">{projectData.name}</p>
                        </div>

                        {stakeHolder && (
                            <div>
                                <span className="text-sm font-medium text-gray-600">Stake holder:</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Avatar
                                        size={25}
                                        src={stakeHolder.avatar_url || '/img/avatars/thumb-1.jpg'}
                                        alt=""
                                    />
                                    <span className="font-medium">{stakeHolder.name}</span>
                                </div>
                            </div>
                        )}

                        {projectManager && (
                            <div>
                                <span className="text-sm font-medium text-gray-600">Project manager:</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Avatar
                                        size={25}
                                        src={projectManager.avatar_url || '/img/avatars/thumb-2.jpg'}
                                        alt=""
                                    />
                                    <span className="font-medium">{projectManager.name}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                <Card>
                    <h4 className="font-semibold mb-4">Schedule</h4>
                    <div className="space-y-4">
                        {projectData.start_date && (
                            <div>
                                <span className="text-sm font-medium text-gray-600">Start date:</span>
                                <p className="font-medium">
                                    {dayjs(projectData.start_date).format('ddd, DD MMM YYYY')}
                                </p>
                            </div>
                        )}

                        {projectData.due_date && (
                            <div>
                                <span className="text-sm font-medium text-gray-600">Due date:</span>
                                <p className="font-medium">
                                    {dayjs(projectData.due_date).format('ddd, DD MMM YYYY')}
                                </p>
                            </div>
                        )}

                        <div>
                            <span className="text-sm font-medium text-gray-600">Status:</span>
                            <div className="mt-1">
                                <Tag className={`rounded-full px-3 py-1 ${
                                    projectData.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                        : projectData.status === 'completed'
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : 'bg-blue-100 text-blue-700 border-blue-200'
                                }`}>
                                    {projectData.status.charAt(0).toUpperCase() + projectData.status.slice(1)}
                                </Tag>
                            </div>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-gray-600">Completion:</span>
                            <div className="mt-2">
                                <Progress
                                    percent={projectData.progress}
                                    trailClass="bg-gray-200"
                                    customColorClass={
                                        projectData.progress > 70 ? 'bg-green-500' :
                                        projectData.progress > 40 ? 'bg-amber-500' : 'bg-red-500'
                                    }
                                    size="sm"
                                />
                                <div className="text-right mt-1">
                                    <span className="text-lg font-bold text-gray-900">
                                        {projectData.progress}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-gray-600">Tasks:</span>
                            <p className="font-medium">
                                {projectData.completedTasks} / {projectData.taskCount} completed
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default ProjectDetailsOverview
