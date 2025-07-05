import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import DatePicker from '@/components/ui/DatePicker'
import Select from '@/components/ui/Select'
import RichTextEditor from '@/components/shared/RichTextEditor'
import { FormItem, Form } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { createProjectActivity } from '@/services/ActivityService'
import useResponsive from '@/utils/hooks/useResponsive'
import dayjs from 'dayjs'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'

type FormSchema = {
    name: string
    description: string
    status: 'active' | 'archived' | 'completed' | 'on_hold'
    priority: 'critical' | 'high' | 'medium' | 'low'
    due_date?: string
    color?: string
    notification?: string[]
}

const validationSchema: ZodType<FormSchema> = z.object({
    name: z.string().min(1, { message: 'Project name is required' }).max(255, { message: 'Project name too long' }),
    description: z.string().min(1, { message: 'Project description is required' }),
    status: z.enum(['active', 'archived', 'completed', 'on_hold']),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    due_date: z.string().optional(),
    color: z.string().optional(),
    notification: z.array(z.string()).optional(),
})

type ProjectDetailsSettingProps = {
    projectId: string
    name: string
    description: string
    status: 'active' | 'archived' | 'completed' | 'on_hold'
    priority: 'critical' | 'high' | 'medium' | 'low'
    due_date?: string
    color?: string
    onUpdate: () => void
}

const ProjectDetailsSetting = ({
    projectId,
    name,
    description,
    status,
    priority,
    due_date,
    color,
    onUpdate,
}: ProjectDetailsSettingProps) => {
    const [isLoading, setIsLoading] = useState(false)
    
    const {
        handleSubmit,
        formState: { errors },
        control,
        reset,
    } = useForm<FormSchema>({
        defaultValues: {
            name,
            description,
            status,
            priority,
            due_date,
            color: color || '#3B82F6',
            notification: ['Email'],
        },
        resolver: zodResolver(validationSchema),
    })

    const { smaller } = useResponsive()

    const onSubmit = async (formData: FormSchema) => {
        setIsLoading(true)
        
        try {
            const updateData = {
                name: formData.name,
                description: formData.description,
                status: formData.status,
                priority: formData.priority,
                due_date: formData.due_date,
                color: formData.color,
            }

            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update project')
            }

            await response.json()
            
            // Create activity for project update
            try {
                await createProjectActivity(projectId, 'updated', {
                    changes: Object.keys(updateData),
                    project_name: formData.name,
                })
            } catch (activityError) {
                console.error('Failed to create activity:', activityError)
                // Don't fail the whole operation if activity creation fails
            }
            
            toast.push(
                <Notification
                    title="Project updated successfully"
                    type="success"
                />,
                { placement: 'top-center' }
            )

            onUpdate()

        } catch (error) {
            console.error('Update project error:', error)
            toast.push(
                <Notification
                    title="Failed to update project"
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

    const statusOptions = [
        { label: 'Active', value: 'active' },
        { label: 'On Hold', value: 'on_hold' },
        { label: 'Completed', value: 'completed' },
        { label: 'Archived', value: 'archived' },
    ]

    const priorityOptions = [
        { label: 'Critical', value: 'critical' },
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
    ]

    return (
        <Form
            layout={smaller.lg ? 'vertical' : 'horizontal'}
            labelWidth={250}
            onSubmit={handleSubmit(onSubmit)}
        >
            <FormItem
                label="Project name"
                invalid={Boolean(errors.name)}
                errorMessage={errors.name?.message}
            >
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <Input
                            autoComplete="off"
                            placeholder="Enter project name"
                            {...field}
                        />
                    )}
                />
            </FormItem>
            
            <FormItem
                label="Project description"
                invalid={Boolean(errors.description)}
                errorMessage={errors.description?.message}
                className="items-start"
            >
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <RichTextEditor
                            content={field.value}
                            invalid={Boolean(errors.description)}
                            onChange={({ html }) => {
                                field.onChange(html)
                            }}
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="Project status"
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
            
            <FormItem
                label="Due date"
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
                                field.onChange(date ? dayjs(date).format('YYYY-MM-DD') : undefined)
                            }
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="Project color"
                invalid={Boolean(errors.color)}
                errorMessage={errors.color?.message}
            >
                <Controller
                    name="color"
                    control={control}
                    render={({ field }) => (
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={field.value || '#3B82F6'}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                            />
                            <Input
                                value={field.value || '#3B82F6'}
                                onChange={(e) => field.onChange(e.target.value)}
                                placeholder="#3B82F6"
                                className="w-24"
                            />
                        </div>
                    )}
                />
            </FormItem>
            
            <FormItem label="Notifications">
                <Controller
                    name="notification"
                    control={control}
                    render={({ field }) => (
                        <Checkbox.Group
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                        >
                            {['Email', 'Push notification', 'Slack', 'SMS'].map(
                                (notification) => (
                                    <Checkbox
                                        key={notification}
                                        value={notification}
                                    >
                                        {notification}
                                    </Checkbox>
                                ),
                            )}
                        </Checkbox.Group>
                    )}
                />
            </FormItem>

            <div className="flex justify-end gap-3">
                <Button 
                    type="button" 
                    onClick={() => reset()}
                    disabled={isLoading}
                >
                    Reset
                </Button>
                <Button 
                    type="submit" 
                    variant="solid"
                    loading={isLoading}
                >
                    Update Project
                </Button>
            </div>
        </Form>
    )
}

export default ProjectDetailsSetting
