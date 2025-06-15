import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Card from '@/components/ui/Card'
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
            {/* Left Content Area */}
            <div className="flex-1">
                {/* Project description */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Project description</h2>
                    <div className="text-gray-600 leading-relaxed">
                        <p>{projectData.description || 'No description available for this project.'}</p>
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-80">
                {/* Project Members Card */}
                <Card className="mb-6 bg-gray-50">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Project members</h4>
                    <div className="space-y-3">
                        {/* Project Owner */}
                        {projectData.owner && (
                            <div className="flex items-center gap-3">
                                <Avatar
                                    size={32}
                                    src={projectData.owner.avatar_url || '/img/avatars/thumb-2.jpg'}
                                    alt={projectData.owner.name || 'Project Owner'}
                                />
                                <span className="font-medium text-gray-700">
                                    {projectData.owner.name}
                                </span>
                            </div>
                        )}

                        {/* Project Members (excluding owner) */}
                        {projectData.project_members?.filter(member => member.user?.id !== projectData.owner?.id).slice(0, 3).map((member) => (
                            <div key={member.id} className="flex items-center gap-3">
                                <Avatar
                                    size={32}
                                    src={member.user?.avatar_url || '/img/avatars/thumb-1.jpg'}
                                    alt={member.user?.name || 'Team Member'}
                                />
                                <span className="font-medium text-gray-700">
                                    {member.user?.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Schedule Card */}
                <Card className="bg-gray-50">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Schedule</h4>
                    <div className="space-y-4">
                        <div>
                            <span className="text-sm font-medium text-gray-600">Start date:</span>
                            <p className="font-medium text-gray-700">
                                {projectData.start_date ?
                                    dayjs(projectData.start_date).format('ddd, DD MMM YYYY') :
                                    'Sat, 09 Mar 2024'
                                }
                            </p>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-gray-600">Due date:</span>
                            <p className="font-medium text-gray-700">
                                {projectData.due_date ?
                                    dayjs(projectData.due_date).format('ddd, DD MMM YYYY') :
                                    'Sun, 09 Mar 2025'
                                }
                            </p>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-gray-600">Status:</span>
                            <div className="mt-1">
                                <Tag className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                    projectData.status === 'active' || projectData.status === 'in_progress'
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : projectData.status === 'completed'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : projectData.status === 'on_hold'
                                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}>
                                    {projectData.status === 'active' ? 'In progress' :
                                     projectData.status === 'in_progress' ? 'In progress' :
                                     projectData.status.replace('_', ' ')}
                                </Tag>
                            </div>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-gray-600">Completion:</span>
                            <div className="mt-2 flex items-center justify-between">
                                <Progress
                                    percent={projectData.progress}
                                    trailClass="bg-gray-200"
                                    customColorClass="bg-blue-500"
                                    size="sm"
                                    className="flex-1 mr-3"
                                />
                                <span className="text-xl font-bold text-gray-900">
                                    {projectData.progress}%
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default ProjectDetailsOverview
