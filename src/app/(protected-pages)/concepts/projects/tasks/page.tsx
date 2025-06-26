'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// Note: Since this is now a client component, we'll handle metadata differently
// You might want to use a separate server component wrapper for SEO

interface Task {
    id: string
    title: string
    description?: string
    status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
    priority: 'critical' | 'high' | 'medium' | 'low'
    created_at: string
    due_date?: string
    assigned_to?: string
    project: {
        id: string
        name: string
        color?: string
    }
    assigned_to_user?: {
        id: string
        name: string
        email: string
        avatar_url?: string
    }
}

interface TasksResponse {
    success: boolean
    data: Task[]
    total: number
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

const ProjectTasksPage = () => {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState({
        status: '',
        priority: '',
        project_id: ''
    })

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const params = new URLSearchParams()
            if (filter.status) params.append('status', filter.status)
            if (filter.priority) params.append('priority', filter.priority)
            if (filter.project_id) params.append('project_id', filter.project_id)

            const response = await fetch(`/api/tasks?${params.toString()}`)
            const data: TasksResponse = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch tasks')
            }

            if (data.success) {
                setTasks(data.data)
            } else {
                throw new Error(data.message || 'Failed to fetch tasks')
            }
        } catch (err) {
            console.error('Error fetching tasks:', err)
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    const TaskCard = ({ task }: { task: Task }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <Link
                        href={`/concepts/projects/tasks/${task.id}`}
                        className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                        {task.title}
                    </Link>
                    {task.description && (
                        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm line-clamp-2">
                            {task.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                </span>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                        {task.project.name}
                    </span>
                    {task.assigned_to_user && (
                        <span>• {task.assigned_to_user.name}</span>
                    )}
                </div>
                {task.due_date && (
                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                )}
            </div>
        </div>
    )

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Project Tasks
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Manage and track all tasks across your projects
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            value={filter.status}
                            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">All Statuses</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Priority
                        </label>
                        <select
                            value={filter.priority}
                            onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">All Priorities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={fetchTasks}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <div className="text-red-500 text-lg mb-4">⚠️</div>
                        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                        <button
                            onClick={fetchTasks}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Try Again
                        </button>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No Tasks Found
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            You don&apos;t have any tasks yet, or none match your current filters.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/concepts/projects/project-list"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                View Projects
                            </Link>
                            <Link
                                href="/concepts/projects/dashboard"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Project Dashboard
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Tasks ({tasks.length})
                            </h2>
                        </div>
                        <div className="grid gap-4">
                            {tasks.map(task => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProjectTasksPage
