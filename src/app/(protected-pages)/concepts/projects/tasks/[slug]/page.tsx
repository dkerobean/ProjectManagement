'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Task {
    id: string
    title: string
    description?: string
    status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
    priority: 'critical' | 'high' | 'medium' | 'low'
    created_at: string
    updated_at: string
    due_date?: string
    start_date?: string
    estimated_hours?: number
    actual_hours?: number
    completed_at?: string
    tags?: string[]
    project: {
        id: string
        name: string
        color?: string
    }
    created_by_user?: {
        id: string
        name: string
        email: string
        avatar_url?: string
    }
    assigned_to_user?: {
        id: string
        name: string
        email: string
        avatar_url?: string
    }
}

interface TaskResponse {
    success: boolean
    data?: Task
    message: string
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'todo': return 'bg-gray-100 text-gray-800'
        case 'in_progress': return 'bg-blue-100 text-blue-800'
        case 'review': return 'bg-yellow-100 text-yellow-800'
        case 'done': return 'bg-green-100 text-green-800'
        case 'blocked': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'critical': return 'bg-red-100 text-red-800'
        case 'high': return 'bg-orange-100 text-orange-800'
        case 'medium': return 'bg-yellow-100 text-yellow-800'
        case 'low': return 'bg-green-100 text-green-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

const ProjectTaskDetailPage = () => {
    const params = useParams()
    const slug = params?.slug as string
    const [task, setTask] = useState<Task | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTask = async () => {
            if (!slug) return

            try {
                setLoading(true)
                setError(null)

                const response = await fetch(`/api/tasks/${slug}`)
                const data: TaskResponse = await response.json()

                if (!response.ok) {
                    if (response.status === 404) {
                        notFound()
                        return
                    }
                    throw new Error(data.message || 'Failed to fetch task')
                }

                if (data.success && data.data) {
                    setTask(data.data)
                } else {
                    throw new Error(data.message || 'Failed to fetch task')
                }
            } catch (err) {
                console.error('Error fetching task:', err)
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                setLoading(false)
            }
        }

        fetchTask()
    }, [slug])

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading task details...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                    <div className="text-red-500 text-lg mb-4">⚠️</div>
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <Link
                        href="/concepts/projects/tasks"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        ← Back to Tasks
                    </Link>
                </div>
            </div>
        )
    }

    if (!task) {
        return notFound()
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <Link
                        href="/concepts/projects/tasks"
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                        Tasks
                    </Link>
                    <span>›</span>
                    <span className="text-gray-900 dark:text-white">{task.title}</span>
                </nav>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {task.title}
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Description
                        </h2>
                        {task.description ? (
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {task.description}
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 italic">
                                No description provided
                            </p>
                        )}
                    </div>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Tags
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {task.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Project Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Project
                        </h3>
                        <div className="flex items-center gap-3">
                            {task.project.color && (
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: task.project.color }}
                                />
                            )}
                            <span className="font-medium text-gray-900 dark:text-white">
                                {task.project.name}
                            </span>
                        </div>
                    </div>

                    {/* Assignee */}
                    {task.assigned_to_user && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Assigned To
                            </h3>
                            <div className="flex items-center gap-3">
                                {task.assigned_to_user.avatar_url ? (
                                    <img
                                        src={task.assigned_to_user.avatar_url}
                                        alt={task.assigned_to_user.name}
                                        className="w-8 h-8 rounded-full"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {task.assigned_to_user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {task.assigned_to_user.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {task.assigned_to_user.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dates & Time */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Timeline
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Created:</span>
                                <span className="text-gray-900 dark:text-white">
                                    {new Date(task.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            {task.start_date && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Start Date:</span>
                                    <span className="text-gray-900 dark:text-white">
                                        {new Date(task.start_date).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            {task.due_date && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Due Date:</span>
                                    <span className="text-gray-900 dark:text-white">
                                        {new Date(task.due_date).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            {task.completed_at && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Completed:</span>
                                    <span className="text-gray-900 dark:text-white">
                                        {new Date(task.completed_at).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Time Tracking */}
                    {(task.estimated_hours || task.actual_hours) && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Time Tracking
                            </h3>
                            <div className="space-y-3 text-sm">
                                {task.estimated_hours && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Estimated:</span>
                                        <span className="text-gray-900 dark:text-white">
                                            {task.estimated_hours}h
                                        </span>
                                    </div>
                                )}
                                {task.actual_hours && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Actual:</span>
                                        <span className="text-gray-900 dark:text-white">
                                            {task.actual_hours}h
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Actions
                        </h3>
                        <div className="space-y-3">
                            <Link
                                href="/concepts/projects/tasks"
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                ← Back to Tasks
                            </Link>
                            <Link
                                href={`/concepts/projects/project-details/${task.project.id}`}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                View Project
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProjectTaskDetailPage
