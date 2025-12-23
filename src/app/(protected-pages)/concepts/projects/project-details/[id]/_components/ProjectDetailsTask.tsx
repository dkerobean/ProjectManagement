'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Tag from '@/components/ui/Tag'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Upload from '@/components/ui/Upload'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import UploadMedia from '@/assets/svg/UploadMedia'
import AddTaskButton from './AddTaskButton'
import TaskCreationModal from './TaskCreationModal'
import { TbCircle, TbCircleCheck, TbPaperclip, TbPlus } from 'react-icons/tb'
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
    attachment_count?: number
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
    onAttachmentUpdate: (taskId: string) => void
}

function SortableTaskItem({ task, onStatusChange, onAttachmentUpdate }: SortableTaskItemProps) {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    
    const handleUploadDialogClose = () => {
        setUploadDialogOpen(false)
        setUploadedFiles([])
    }

    const handleUpload = async () => {
        if (uploadedFiles.length === 0) return

        setIsUploading(true)

        try {
            const formData = new FormData()

            uploadedFiles.forEach((file) => {
                formData.append('files', file)
            })

            formData.append('entity_type', 'task')
            formData.append('entity_id', task.id)

            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed')
            }

            onAttachmentUpdate(task.id)

            handleUploadDialogClose()

            toast.push(
                <Notification
                    title={`Successfully uploaded ${result.files.length} file(s) to task`}
                    type="success"
                />,
                { placement: 'top-center' }
            )

        } catch (error) {
            console.error('Upload error:', error)
            toast.push(
                <Notification
                    title="Upload failed"
                    type="danger"
                >
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                </Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileChange = (files: File[]) => {
        const maxSize = 500 * 1024 * 1024
        const oversizedFiles = files.filter(file => file.size > maxSize)

        if (oversizedFiles.length > 0) {
            toast.push(
                <Notification
                    title="File size limit exceeded"
                    type="warning"
                >
                    Some files exceed the 500MB limit and were not added.
                </Notification>,
                { placement: 'top-center' }
            )

            const validFiles = files.filter(file => file.size <= maxSize)
            setUploadedFiles(validFiles)
        } else {
            setUploadedFiles(files)
        }
    }
    
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
        <>
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
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setUploadDialogOpen(true)
                        }}
                        className="flex-shrink-0 ml-2 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Add attachment"
                    >
                        <TbPlus className="w-4 h-4" />
                    </button>
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
                        {/* Attachment indicator */}
                        {task.attachment_count && task.attachment_count > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <TbPaperclip className="w-3 h-3" />
                                <span>{task.attachment_count}</span>
                            </div>
                        )}

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
                                avatarProps={{ size: 24 }}
                                maxCount={3}
                            />
                        )}
                    </div>
                </div>
            </div>

            <Dialog
                isOpen={uploadDialogOpen}
                onClose={handleUploadDialogClose}
                onRequestClose={handleUploadDialogClose}
            >
                <h4>Upload Files to Task</h4>
                <div className="text-sm text-gray-600 mt-2 mb-4">
                    Task: {task.title}<br />
                    Maximum file size: 500MB per file
                </div>
                <Upload
                    draggable
                    className="mt-6 bg-gray-100 dark:bg-transparent"
                    onChange={handleFileChange}
                    onFileRemove={setUploadedFiles}
                    multiple
                >
                    <div className="my-4 text-center">
                        <div className="text-6xl mb-4 flex justify-center">
                            <UploadMedia height={150} width={200} />
                        </div>
                        <p className="font-semibold">
                            <span className="text-gray-800 dark:text-white">
                                Drop your files here, or{' '}
                            </span>
                            <span className="text-blue-500">browse</span>
                        </p>
                        <p className="mt-1 font-semibold opacity-60 dark:text-white">
                            through your machine
                        </p>
                    </div>
                </Upload>
                {uploadedFiles.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm font-medium mb-2">
                            Files to upload ({uploadedFiles.length}):
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {uploadedFiles.map((file, index) => (
                                <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="mt-4">
                    <Button
                        block
                        loading={isUploading}
                        variant="solid"
                        disabled={uploadedFiles.length === 0}
                        onClick={handleUpload}
                    >
                        Upload {uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s)` : ''}
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

interface DroppableColumnProps {
    status: TaskStatus
    tasks: Task[]
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void
    onAttachmentUpdate: (taskId: string) => void
    onTaskCreated: () => void
    projectId: string
}

function DroppableColumn({ status, tasks, onStatusChange, onAttachmentUpdate, onTaskCreated, projectId }: DroppableColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    })

    return (
        <div
            ref={setNodeRef}
            className={`bg-gray-50 rounded-lg p-4 min-h-[200px] transition-colors ${
                isOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
            }`}
        >
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
                            onAttachmentUpdate={onAttachmentUpdate}
                        />
                    ))}
                    <div className="mt-3">
                        <AddTaskButton
                            projectId={projectId}
                            status={status}
                            onTaskCreated={onTaskCreated}
                        />
                    </div>
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

    const handleAttachmentUpdate = async (taskId: string) => {
        // Fetch updated attachment count for the task
        try {
            const response = await fetch(`/api/files?entity_type=task&entity_id=${taskId}`)
            if (response.ok) {
                const result = await response.json()
                const attachmentCount = result.list?.length || 0
                
                setTasks(prev => prev.map(task =>
                    task.id === taskId ? { ...task, attachment_count: attachmentCount } : task
                ))
            }
        } catch (error) {
            console.error('Failed to fetch attachment count:', error)
        }
    }

    const handleTaskCreated = () => {
        // Refresh tasks list after new task creation
        fetchTasks()
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
        <div>
            {/* Task Board Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold">Task Board</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage tasks across different stages
                    </p>
                </div>
                <TaskCreationModal
                    projectId={projectId}
                    onTaskCreated={handleTaskCreated}
                />
            </div>

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
                            onAttachmentUpdate={handleAttachmentUpdate}
                            onTaskCreated={handleTaskCreated}
                            projectId={projectId}
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
        </div>
    )
}

export default ProjectDetailsTask
