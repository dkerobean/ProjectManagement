'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Tag from '@/components/ui/Tag'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import { TbCircle, TbCircleCheck } from 'react-icons/tb'
import dayjs from 'dayjs'

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

type Task = {
    id: string
    title: string
    status: TaskStatus
    priority?: 'low' | 'medium' | 'high'
    due_date?: string
    created_by?: string
    tags?: string[]
    assignees?: Array<{
        id: string
        name: string
        img: string
    }>
}

type TasksByStatus = {
    todo: Task[]
    in_progress: Task[]
    review: Task[]
    done: Task[]
}

const statusLabels = {
    todo: 'To Do',
    in_progress: 'In Progress', 
    review: 'To Review',
    done: 'Completed'
}

const taskLabelColors: Record<string, string> = {
    'Live issue': 'bg-red-100 text-red-700 border-red-200',
    'Task': 'bg-blue-100 text-blue-700 border-blue-200',
    'Bug': 'bg-amber-100 text-amber-700 border-amber-200',
    'Low priority': 'bg-purple-100 text-purple-700 border-purple-200',
}

const priorityColors: Record<string, string> = {
    'low': 'bg-purple-100 text-purple-700 border-purple-200',
    'medium': 'bg-amber-100 text-amber-700 border-amber-200',
    'high': 'bg-red-100 text-red-700 border-red-200',
}

interface SortableTaskItemProps {
    task: Task
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void
}

function SortableTaskItem({ task, onStatusChange }: SortableTaskItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const handleToggleComplete = () => {
        const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done'
        onStatusChange(task.id, newStatus)
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white rounded-lg border border-gray-200 p-4 mb-3 hover:shadow-sm transition-shadow cursor-grab active:cursor-grabbing"
        >
            <div className="flex items-start justify-between mb-3">
                <button
                    onClick={handleToggleComplete}
                    className="flex-shrink-0 mr-3 mt-0.5 text-gray-400 hover:text-blue-500 transition-colors"
                >
                    {task.status === 'done' ? (
                        <TbCircleCheck className="w-5 h-5 text-blue-500" />
                    ) : (
                        <TbCircle className="w-5 h-5" />
                    )}
                </button>
                <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-gray-900 text-sm leading-tight ${
                        task.status === 'done' ? 'line-through text-gray-500' : ''
                    }`}>
                        {task.title}
                    </h4>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Priority Tag */}
                    {task.priority && (
                        <Tag className={`text-xs px-2 py-1 ${priorityColors[task.priority]}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority
                        </Tag>
                    )}
                    
                    {/* Custom Tags */}
                    {task.tags?.map((tag, index) => (
                        <Tag key={index} className={`text-xs px-2 py-1 ${taskLabelColors[tag] || 'bg-gray-100 text-gray-700'}`}>
                            {tag}
                        </Tag>
                    ))}
                </div>

                <div className="flex items-center gap-3 ml-3">
                    {/* Due Date */}
                    {task.due_date && (
                        <span className="text-xs text-gray-500">
                            {dayjs(task.due_date).format('MMM DD')}
                        </span>
                    )}
                    
                    {/* Assignees */}
                    {task.assignees && task.assignees.length > 0 && (
                        <UsersAvatarGroup 
                            users={task.assignees}
                            size={24}
                            maxDisplay={3}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

interface DroppableColumnProps {
    status: TaskStatus
    tasks: Task[]
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void
}

function DroppableColumn({ status, tasks, onStatusChange }: DroppableColumnProps) {
    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-lg">
                    {statusLabels[status]}
                </h3>
                <span className="text-sm text-gray-500 bg-white rounded-full px-2 py-1">
                    {tasks.length}
                </span>
            </div>
            
            <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    {tasks.map((task) => (
                        <SortableTaskItem
                            key={task.id}
                            task={task}
                            onStatusChange={onStatusChange}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    )
}

const ProjectDetailsTask = () => {
    const params = useParams()
    const projectId = params?.id as string
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTask, setActiveTask] = useState<Task | null>(null)
    
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    // Fetch tasks for the current project
    const fetchTasks = async () => {
        if (!projectId) return

        try {
            setIsLoading(true)
            setError(null)
            
            const response = await fetch(`/api/projects/${projectId}/tasks`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })
            
            if (response.ok) {
                const result = await response.json()
                console.log('✅ Tasks fetched:', result.data)
                setTasks(result.data || [])
            } else {
                const errorData = await response.json()
                console.error('❌ Failed to fetch tasks:', errorData)
                setError('Failed to load tasks')
            }
        } catch (error) {
            console.error('❌ Network error:', error)
            setError('Network error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    // Update task status in database
    const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: newStatus,
                    completed_at: newStatus === 'done' ? new Date().toISOString() : null
                }),
            })
            
            if (!response.ok) {
                throw new Error('Failed to update task status')
            }
            
            console.log('✅ Task status updated:', taskId, newStatus)
        } catch (error) {
            console.error('❌ Failed to update task status:', error)
            // Revert the local change
            fetchTasks()
        }
    }

    const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
        // Update locally first for immediate feedback
        setTasks(prev => prev.map(task => 
            task.id === taskId ? { ...task, status: newStatus } : task
        ))
        
        // Update in database
        updateTaskStatus(taskId, newStatus)
    }

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const task = tasks.find(t => t.id === active.id)
        setActiveTask(task || null)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveTask(null)
        
        if (!over) return
        
        const taskId = active.id as string
        const newStatus = over.id as TaskStatus
        
        const task = tasks.find(t => t.id === taskId)
        if (task && task.status !== newStatus) {
            handleStatusChange(taskId, newStatus)
        }
    }

    useEffect(() => {
        const loadTasks = async () => {
            if (!projectId) return

            try {
                setIsLoading(true)
                setError(null)
                
                const response = await fetch(`/api/projects/${projectId}/tasks`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                })
                
                if (response.ok) {
                    const result = await response.json()
                    console.log('✅ Tasks fetched:', result.data)
                    setTasks(result.data || [])
                } else {
                    const errorData = await response.json()
                    console.error('❌ Failed to fetch tasks:', errorData)
                    setError('Failed to load tasks')
                }
            } catch (error) {
                console.error('❌ Network error:', error)
                setError('Network error occurred')
            } finally {
                setIsLoading(false)
            }
        }

        loadTasks()
    }, [projectId])

    // Group tasks by status
    const tasksByStatus: TasksByStatus = {
        todo: tasks.filter(task => task.status === 'todo'),
        in_progress: tasks.filter(task => task.status === 'in_progress'),
        review: tasks.filter(task => task.status === 'review'),
        done: tasks.filter(task => task.status === 'done'),
    }

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
                <p className="text-red-500 mb-2">Failed to load tasks</p>
                <p className="text-sm text-gray-500">{error}</p>
                <button 
                    onClick={fetchTasks} 
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
            </div>
        )
    }

    return (
        <DndContext 
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(Object.keys(statusLabels) as TaskStatus[]).map((status) => (
                    <div key={status} id={status}>
                        <DroppableColumn
                            status={status}
                            tasks={tasksByStatus[status]}
                            onStatusChange={handleStatusChange}
                        />
                    </div>
                ))}
            </div>
            
            <DragOverlay>
                {activeTask ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-lg rotate-3">
                        <div className="flex items-start justify-between mb-3">
                            <TbCircle className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900 text-sm">
                                    {activeTask.title}
                                </h4>
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}

export default ProjectDetailsTask
