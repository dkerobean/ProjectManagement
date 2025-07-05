'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import DatePicker from '@/components/ui/DatePicker'
import Dialog from '@/components/ui/Dialog'
import { FormItem, Form } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { createTaskActivity } from '@/services/ActivityService'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import { TbPlus } from 'react-icons/tb'

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

type TaskCreationModalProps = {
    projectId: string
    defaultStatus?: TaskStatus
    onTaskCreated: () => void
    trigger?: React.ReactNode
}

type FormSchema = {
    title: string
    description?: string
    status: TaskStatus
    priority: 'critical' | 'high' | 'medium' | 'low'
    due_date?: string
    estimated_hours?: number
    tags?: string[]
}

const validationSchema = z.object({
    title: z.string().min(1, 'Task title is required').max(255, 'Task title too long'),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done']),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    due_date: z.string().optional(),
    estimated_hours: z.number().min(0).optional(),
    tags: z.array(z.string()).optional(),
})

const TaskCreationModal = ({ 
    projectId, 
    defaultStatus = 'todo', 
    onTaskCreated, 
    trigger 
}: TaskCreationModalProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [tagInput, setTagInput] = useState('')

    const {
        handleSubmit,
        formState: { errors },
        control,
        reset,
        watch,
        setValue,
    } = useForm<FormSchema>({
        defaultValues: {
            title: '',
            description: '',
            status: defaultStatus,
            priority: 'medium',
            due_date: '',
            estimated_hours: undefined,
            tags: [],
        },
        resolver: zodResolver(validationSchema),
    })

    const watchedTags = watch('tags') || []

    const statusOptions = [
        { label: 'To Do', value: 'todo' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'To Review', value: 'review' },
        { label: 'Completed', value: 'done' },
    ]

    const priorityOptions = [
        { label: 'Critical', value: 'critical' },
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
    ]

    const handleClose = () => {
        setIsOpen(false)
        reset()
        setTagInput('')
    }

    const addTag = () => {
        if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
            setValue('tags', [...watchedTags, tagInput.trim()])
            setTagInput('')
        }
    }

    const removeTag = (tagToRemove: string) => {
        setValue('tags', watchedTags.filter(tag => tag !== tagToRemove))
    }

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTag()
        }
    }

    const onSubmit = async (formData: FormSchema) => {
        setIsLoading(true)

        try {
            const taskData = {
                title: formData.title.trim(),
                description: formData.description?.trim(),
                status: formData.status,
                priority: formData.priority,
                due_date: formData.due_date,
                estimated_hours: formData.estimated_hours,
                tags: formData.tags || [],
            }

            const response = await fetch(`/api/projects/${projectId}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskData),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to create task')
            }

            const result = await response.json()

            // Create activity for task creation
            try {
                await createTaskActivity(result.data.id, 'created', {
                    task_title: formData.title.trim(),
                    task_priority: formData.priority,
                    task_status: formData.status,
                    task_tags: formData.tags,
                    task_due_date: formData.due_date,
                })
            } catch (activityError) {
                console.error('Failed to create activity:', activityError)
            }

            toast.push(
                <Notification
                    title="Task created successfully"
                    type="success"
                />,
                { placement: 'top-center' }
            )

            handleClose()
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

    return (
        <>
            {trigger ? (
                <div onClick={() => setIsOpen(true)}>{trigger}</div>
            ) : (
                <Button
                    variant="solid"
                    onClick={() => setIsOpen(true)}
                    icon={<TbPlus />}
                >
                    New Task
                </Button>
            )}

            <Dialog
                isOpen={isOpen}
                onClose={handleClose}
                onRequestClose={handleClose}
            >
                <div className="p-6">
                    <h4 className="mb-6">Create New Task</h4>
                    
                    <Form
                        layout="vertical"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <FormItem
                            label="Task Title"
                            invalid={Boolean(errors.title)}
                            errorMessage={errors.title?.message}
                        >
                            <Controller
                                name="title"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        placeholder="Enter task title..."
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem
                            label="Description"
                            invalid={Boolean(errors.description)}
                            errorMessage={errors.description?.message}
                        >
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <textarea
                                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        placeholder="Task description (optional)..."
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        <div className="grid grid-cols-2 gap-4">
                            <FormItem
                                label="Status"
                                invalid={Boolean(errors.status)}
                                errorMessage={errors.status?.message}
                            >
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            placeholder="Select status"
                                            options={statusOptions}
                                            value={statusOptions.find(option => option.value === field.value)}
                                            onChange={(option) => field.onChange(option?.value)}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Priority"
                                invalid={Boolean(errors.priority)}
                                errorMessage={errors.priority?.message}
                            >
                                <Controller
                                    name="priority"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            placeholder="Select priority"
                                            options={priorityOptions}
                                            value={priorityOptions.find(option => option.value === field.value)}
                                            onChange={(option) => field.onChange(option?.value)}
                                        />
                                    )}
                                />
                            </FormItem>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormItem
                                label="Due Date"
                                invalid={Boolean(errors.due_date)}
                                errorMessage={errors.due_date?.message}
                            >
                                <Controller
                                    name="due_date"
                                    control={control}
                                    render={({ field }) => (
                                        <DatePicker
                                            placeholder="Select due date"
                                            value={field.value ? new Date(field.value) : undefined}
                                            onChange={(date) =>
                                                field.onChange(date ? dayjs(date).format('YYYY-MM-DD') : '')
                                            }
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Estimated Hours"
                                invalid={Boolean(errors.estimated_hours)}
                                errorMessage={errors.estimated_hours?.message}
                            >
                                <Controller
                                    name="estimated_hours"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            placeholder="Hours"
                                            value={field.value || ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                    )}
                                />
                            </FormItem>
                        </div>

                        <FormItem label="Tags">
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add tag..."
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        onClick={addTag}
                                        disabled={!tagInput.trim()}
                                    >
                                        Add
                                    </Button>
                                </div>
                                {watchedTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {watchedTags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </FormItem>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                type="button"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="solid"
                                loading={isLoading}
                            >
                                Create Task
                            </Button>
                        </div>
                    </Form>
                </div>
            </Dialog>
        </>
    )
}

export default TaskCreationModal