import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'
import Progress from '@/components/ui/Progress'
import Tag from '@/components/ui/Tag'
import dayjs from 'dayjs'

type ProjectData = {
    id: string
    name: string
    description: string
    status: string
    priority: string
    start_date: string
    due_date: string
    created_at: string
    owner: {
        id: string
        name: string
        email: string
        avatar_url: string
    }
    project_members: Array<{
        id: string
        role: string
        user: {
            id: string
            name: string
            email: string
            avatar_url: string
        }
    }>
    tasks: Array<{
        id: string
        title: string
        status: string
        priority: string
    }>
    taskCount: number
    completedTasks: number
    progress: number
}

const ProjectDetailsOverview = () => {
    const params = useParams()
    const projectId = params?.id as string
    const [projectData, setProjectData] = useState<ProjectData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch real project data from the database
    useEffect(() => {
        const fetchProjectData = async () => {
            if (!projectId) {
                setError('No project ID provided')
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)
                setError(null)

                console.log('🔍 Fetching project data for ID:', projectId)

                const response = await fetch(`/api/projects/${projectId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                })

                console.log('📡 Response status:', response.status)

                if (response.ok) {
                    const result = await response.json()
                    console.log('✅ Project data received:', result)
                    setProjectData(result.data)
                } else {
                    const errorText = await response.text()
                    console.error('❌ API Error:', response.status, errorText)
                    setError(`API Error: ${response.status} - ${response.statusText}`)
                }
            } catch (error) {
                console.error('❌ Network error:', error)
                setError(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center py-12">
                <p className="text-red-500 mb-2">Failed to load project data</p>
                <p className="text-sm text-gray-500">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
            </div>
        )
    }

    if (!projectData) {
        return (
            <div className="flex justify-center items-center py-12">
                <p className="text-gray-500">No project data available</p>
            </div>
        )
    }

    return (
        <div className="flex gap-8">
            {/* Main Content Area */}
            <div className="flex-1">
                {/* Project Description */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Project Description</h2>
                    <div className="prose max-w-none text-gray-600">
                        <p>{projectData.description || 'No description available for this project.'}</p>
                    </div>
                </div>

                {/* Project Information */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Project Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Project Members */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Project Members</h4>
                            <div className="space-y-3">
                                {/* Project Owner */}
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        size={40}
                                        src={projectData.owner?.avatar_url}
                                        alt={projectData.owner?.name || 'Project Owner'}
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">{projectData.owner?.name || 'Project Owner'}</p>
                                        <p className="text-sm text-gray-500">Owner</p>
                                    </div>
                                </div>

                                {/* Project Members */}
                                {projectData.project_members?.slice(0, 3).map((member) => (
                                    <div key={member.id} className="flex items-center gap-3">
                                        <Avatar
                                            size={40}
                                            src={member.user?.avatar_url}
                                            alt={member.user?.name || 'Team Member'}
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">{member.user?.name || 'Team Member'}</p>
                                            <p className="text-sm text-gray-500 capitalize">{member.role || 'Member'}</p>
                                        </div>
                                    </div>
                                ))}

                                {projectData.project_members && projectData.project_members.length > 3 && (
                                    <p className="text-sm text-gray-500 ml-12">
                                        +{projectData.project_members.length - 3} more members
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Tasks & Status */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Project Status</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Tasks:</span>
                                    <span className="font-medium">{projectData.completedTasks}/{projectData.taskCount}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Status:</span>
                                    <Tag className={`capitalize ${
                                        projectData.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        projectData.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                        projectData.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {projectData.status.replace('_', ' ')}
                                    </Tag>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Completion:</span>
                                    <span className="font-medium">{projectData.progress}%</span>
                                </div>

                                <div className="mt-2">
                                    <Progress
                                        percent={projectData.progress}
                                        size="sm"
                                        customColorClass={
                                            projectData.progress >= 80 ? 'bg-green-500' :
                                            projectData.progress >= 50 ? 'bg-yellow-500' :
                                            'bg-red-500'
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Schedule */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Schedule</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Start Date</h4>
                            <p className="text-gray-600">
                                {projectData.start_date ?
                                    dayjs(projectData.start_date).format('MMMM DD, YYYY') :
                                    'Not specified'
                                }
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Due Date</h4>
                            <p className="text-gray-600">
                                {projectData.due_date ?
                                    dayjs(projectData.due_date).format('MMMM DD, YYYY') :
                                    'Not specified'
                                }
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Duration</h4>
                            <p className="text-gray-600">
                                {projectData.start_date && projectData.due_date ?
                                    `${dayjs(projectData.due_date).diff(dayjs(projectData.start_date), 'day')} days` :
                                    'Not calculated'
                                }
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Priority</h4>
                            <Tag className={`capitalize ${
                                projectData.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                projectData.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                projectData.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                            }`}>
                                {projectData.priority}
                            </Tag>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProjectDetailsOverview
