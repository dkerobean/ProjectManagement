'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Dialog from '@/components/ui/Dialog'
import { Card } from '@/components/ui'

// Note: Since this is now a client component, we'll handle metadata differently
// You might want to use a separate server component wrapper for SEO

interface Project {
    id: string
    name: string
    color?: string
}

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

interface ProjectsResponse {
    success: boolean
    data: Project[]
    message: string
}

interface CreateTaskData {
    title: string
    status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
    priority: 'critical' | 'high' | 'medium' | 'low'
    project_id: string
    due_date?: string
    assigned_to?: string
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
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [filter, setFilter] = useState({
        status: '',
        priority: '',
        project_id: ''
    })
    const [newTask, setNewTask] = useState<CreateTaskData>({
        title: '',
        status: 'todo',
        priority: 'medium',
        project_id: '',
        due_date: '',
        assigned_to: ''
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

    const fetchProjects = useCallback(async () => {
        try {
            const response = await fetch('/api/projects')
            const data: ProjectsResponse = await response.json()
            
            if (response.ok && data.success) {
                setProjects(data.data)
            }
        } catch (err) {
            console.error('Error fetching projects:', err)
        }
    }, [])

    const updateTaskStatus = async (taskId: string, newStatus: 'todo' | 'done') => {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            })

            const data = await response.json()

            if (response.ok && data.success) {
                // Refresh tasks to show updated status
                fetchTasks()
            } else {
                alert(data.error || 'Failed to update task status')
            }
        } catch (err) {
            console.error('Error updating task status:', err)
            alert('An error occurred while updating the task')
        }
    }

    const createTask = async () => {
        if (!newTask.title.trim() || !newTask.project_id) {
            alert('Please provide a title and select a project')
            return
        }

        try {
            setCreateLoading(true)
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTask),
            })

            const data = await response.json()

            if (response.ok && data.success) {
                // Reset form
                setNewTask({
                    title: '',
                    status: 'todo',
                    priority: 'medium',
                    project_id: '',
                    due_date: '',
                    assigned_to: ''
                })
                setShowCreateModal(false)
                // Refresh tasks
                fetchTasks()
            } else {
                alert(data.error || 'Failed to create task')
            }
        } catch (err) {
            console.error('Error creating task:', err)
            alert('An error occurred while creating the task')
        } finally {
            setCreateLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
        fetchProjects()
    }, [fetchTasks, fetchProjects])

    const TaskCard = ({ task }: { task: Task }) => {
        const isCompleted = task.status === 'done'
        
        const handleToggleComplete = () => {
            const newStatus = isCompleted ? 'todo' : 'done'
            updateTaskStatus(task.id, newStatus)
        }

        return (
            <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow ${isCompleted ? 'opacity-75' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                        <button
                            onClick={handleToggleComplete}
                            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors hover:scale-110 ${
                                isCompleted 
                                    ? 'bg-green-500 border-green-500 text-white' 
                                    : 'border-gray-300 hover:border-green-400'
                            }`}
                        >
                            {isCompleted && (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                        <div className="flex-1">
                            <Link
                                href={`/concepts/projects/tasks/${task.id}`}
                                className={`text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-400 ${
                                    isCompleted 
                                        ? 'text-gray-500 dark:text-gray-400 line-through' 
                                        : 'text-gray-900 dark:text-white'
                                }`}
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
    }

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
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Project
                        </label>
                        <Select
                            value={filter.project_id ? 
                                { value: filter.project_id, label: projects.find(p => p.id === filter.project_id)?.name || 'Unknown Project' } : null}
                            onChange={(selectedOption: any) => 
                                setFilter(prev => ({ ...prev, project_id: selectedOption?.value || '' }))
                            }
                            options={[
                                { value: '', label: 'All Projects' },
                                ...projects.map(project => ({
                                    value: project.id,
                                    label: project.name
                                }))
                            ]}
                            placeholder="All Projects"
                            isClearable
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Status
                        </label>
                        <Select
                            value={filter.status ? { value: filter.status, label: filter.status.replace('_', ' ') } : null}
                            onChange={(selectedOption: any) => 
                                setFilter(prev => ({ ...prev, status: selectedOption?.value || '' }))
                            }
                            options={[
                                { value: '', label: 'All Statuses' },
                                { value: 'todo', label: 'To Do' },
                                { value: 'in_progress', label: 'In Progress' },
                                { value: 'review', label: 'Review' },
                                { value: 'done', label: 'Done' },
                                { value: 'blocked', label: 'Blocked' }
                            ]}
                            placeholder="All Statuses"
                            isClearable
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Priority
                        </label>
                        <Select
                            value={filter.priority ? { value: filter.priority, label: filter.priority } : null}
                            onChange={(selectedOption: any) => 
                                setFilter(prev => ({ ...prev, priority: selectedOption?.value || '' }))
                            }
                            options={[
                                { value: '', label: 'All Priorities' },
                                { value: 'critical', label: 'Critical' },
                                { value: 'high', label: 'High' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'low', label: 'Low' }
                            ]}
                            placeholder="All Priorities"
                            isClearable
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <Button
                            variant="default"
                            onClick={fetchTasks}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="solid"
                            onClick={() => setShowCreateModal(true)}
                        >
                            Add Task
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Content */}
            <Card>
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <div className="text-red-500 text-lg mb-4">⚠️</div>
                        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                        <Button
                            variant="solid"
                            onClick={fetchTasks}
                        >
                            Try Again
                        </Button>
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
                            <Button 
                                variant="solid"
                                asElement={Link}
                                href="/concepts/projects/project-list"
                            >
                                View Projects
                            </Button>
                            <Button 
                                variant="default"
                                asElement={Link}
                                href="/concepts/projects/dashboard"
                            >
                                Project Dashboard
                            </Button>
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
            </Card>

            {/* Create Task Modal */}
            <Dialog
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                width={600}
            >
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Create New Task
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Title *
                            </label>
                            <Input
                                type="text"
                                value={newTask.title}
                                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter task title"
                            />
                        </div>


                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Project *
                            </label>
                            <Select
                                value={projects.find(p => p.id === newTask.project_id) ? 
                                    { value: newTask.project_id, label: projects.find(p => p.id === newTask.project_id)?.name } : null}
                                onChange={(selectedOption: any) => 
                                    setNewTask(prev => ({ ...prev, project_id: selectedOption?.value || '' }))
                                }
                                options={projects.map(project => ({
                                    value: project.id,
                                    label: project.name
                                }))}
                                placeholder="Select a project"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Priority
                                </label>
                                <Select
                                    value={{ value: newTask.priority, label: newTask.priority }}
                                    onChange={(selectedOption: any) => 
                                        setNewTask(prev => ({ ...prev, priority: selectedOption?.value }))
                                    }
                                    options={[
                                        { value: 'low', label: 'Low' },
                                        { value: 'medium', label: 'Medium' },
                                        { value: 'high', label: 'High' },
                                        { value: 'critical', label: 'Critical' }
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Status
                                </label>
                                <Select
                                    value={{ value: newTask.status, label: newTask.status.replace('_', ' ') }}
                                    onChange={(selectedOption: any) => 
                                        setNewTask(prev => ({ ...prev, status: selectedOption?.value }))
                                    }
                                    options={[
                                        { value: 'todo', label: 'To Do' },
                                        { value: 'in_progress', label: 'In Progress' },
                                        { value: 'review', label: 'Review' },
                                        { value: 'done', label: 'Done' },
                                        { value: 'blocked', label: 'Blocked' }
                                    ]}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Due Date
                            </label>
                            <Input
                                type="date"
                                value={newTask.due_date}
                                onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            variant="default"
                            onClick={() => setShowCreateModal(false)}
                            disabled={createLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="solid"
                            onClick={createTask}
                            disabled={createLoading || !newTask.title.trim() || !newTask.project_id}
                            loading={createLoading}
                        >
                            {createLoading ? 'Creating...' : 'Create Task'}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default ProjectTasksPage
