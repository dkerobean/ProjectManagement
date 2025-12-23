'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { createTaskActivity } from '@/services/ActivityService'
import { TbPlus, TbCheck, TbX } from 'react-icons/tb'

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

type AddTaskButtonProps = {
    projectId: string
    status: TaskStatus
    onTaskCreated: () => void
}

const AddTaskButton = ({ projectId, status, onTaskCreated }: AddTaskButtonProps) => {
    const [isCreating, setIsCreating] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [taskTitle, setTaskTitle] = useState('')
    const [taskPriority, setTaskPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium')

    const priorityOptions = [
        { label: 'Critical', value: 'critical' },
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
    ]

    const handleCreateTask = async () => {
        if (!taskTitle.trim()) {
            toast.push(
                <Notification
                    title="Task title is required"
                    type="warning"
                />,
                { placement: 'top-center' }
            )
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch(`/api/projects/${projectId}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: taskTitle.trim(),
                    status: status,
                    priority: taskPriority,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to create task')
            }

            const result = await response.json()

            // Create activity for task creation
            try {
                await createTaskActivity(result.data.id, 'created', {
                    task_title: taskTitle.trim(),
                    task_priority: taskPriority,
                    task_status: status,
                })
            } catch (activityError) {
                console.error('Failed to create activity:', activityError)
                // Don't fail the whole operation if activity creation fails
            }

            toast.push(
                <Notification
                    title="Task created successfully"
                    type="success"
                />,
                { placement: 'top-center' }
            )

            // Reset form
            setTaskTitle('')
            setTaskPriority('medium')
            setIsCreating(false)
            
            // Notify parent to refresh tasks
            onTaskCreated()

        } catch (error) {
            console.error('Create task error:', error)
            toast.push(
                <Notification
                    title="Failed to create task"
                    type="danger"
                >
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                </Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setTaskTitle('')
        setTaskPriority('medium')
        setIsCreating(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleCreateTask()
        } else if (e.key === 'Escape') {
            handleCancel()
        }
    }

    if (isCreating) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-3">
                <div className="space-y-3">
                    <Input
                        placeholder="Enter task title..."
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="text-sm"
                    />
                    <div className="flex items-center gap-2">
                        <Select
                            size="sm"
                            placeholder="Priority"
                            options={priorityOptions}
                            value={priorityOptions.find(option => option.value === taskPriority)}
                            onChange={(option) => setTaskPriority((option?.value as 'critical' | 'high' | 'medium' | 'low') || 'medium')}
                            className="flex-1"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="solid"
                            onClick={handleCreateTask}
                            loading={isLoading}
                            disabled={!taskTitle.trim()}
                            icon={<TbCheck />}
                        >
                            Add Task
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                            icon={<TbX />}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Button
            variant="outline"
            size="sm"
            block
            className="border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={() => setIsCreating(true)}
            icon={<TbPlus />}
        >
            Add Task
        </Button>
    )
}

export default AddTaskButton