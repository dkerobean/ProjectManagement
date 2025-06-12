'use client'

import { useState } from 'react'
import Dropdown from '@/components/ui/Dropdown'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { useProjectsStore, type Project } from '../_store/projectsStore'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
    TbDotsVertical, 
    TbEdit, 
    TbTrash, 
    TbEye,
    TbX
} from 'react-icons/tb'
import { useRouter } from 'next/navigation'

interface ProjectActionsDropdownProps {
    project: Project
}

const editProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
})

type EditProjectForm = z.infer<typeof editProjectSchema>

const ProjectActionsDropdown = ({ project }: ProjectActionsDropdownProps) => {
    const router = useRouter()
    const { editProject, deleteProjectFromApi } = useProjectsStore()
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<EditProjectForm>({
        resolver: zodResolver(editProjectSchema),
        defaultValues: {
            name: project.name,
            description: project.description || '',
            status: project.status,
            priority: project.priority,
        }
    })

    const statusOptions = [
        { label: 'Planning', value: 'planning' },
        { label: 'Active', value: 'active' },
        { label: 'On Hold', value: 'on_hold' },
        { label: 'Completed', value: 'completed' },
        { label: 'Archived', value: 'archived' },
    ]

    const priorityOptions = [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' },
    ]

    const handleView = () => {
        router.push(`/concepts/projects/project-details/${project.id}`)
    }

    const handleEdit = () => {
        reset({
            name: project.name,
            description: project.description || '',
            status: project.status,
            priority: project.priority,
        })
        setIsEditDialogOpen(true)
    }

    const handleDelete = () => {
        setIsDeleteDialogOpen(true)
    }

    const onEditSubmit = async (data: EditProjectForm) => {
        try {
            setIsLoading(true)
            await editProject(project.id, data)
            
            toast.push(
                <Notification title="Success" type="success">
                    Project updated successfully!
                </Notification>
            )
            
            setIsEditDialogOpen(false)
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    {error instanceof Error ? error.message : 'Failed to update project'}
                </Notification>
            )
        } finally {
            setIsLoading(false)
        }
    }

    const onDeleteConfirm = async () => {
        try {
            setIsLoading(true)
            await deleteProjectFromApi(project.id)
            
            toast.push(
                <Notification title="Success" type="success">
                    Project deleted successfully!
                </Notification>
            )
            
            setIsDeleteDialogOpen(false)
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    {error instanceof Error ? error.message : 'Failed to delete project'}
                </Notification>
            )
        } finally {
            setIsLoading(false)
        }
    }

    const dropdownItems = [
        {
            key: 'view',
            name: 'View Details',
            icon: <TbEye />,
            onClick: handleView,
        },
        {
            key: 'edit',
            name: 'Edit Project',
            icon: <TbEdit />,
            onClick: handleEdit,
        },
        {
            key: 'delete',
            name: 'Delete Project',
            icon: <TbTrash />,
            onClick: handleDelete,
            className: 'text-red-600 hover:text-red-700',
        },
    ]

    return (
        <>
            <Dropdown
                placement="bottom-end"
                renderTitle={
                    <Button 
                        variant="plain" 
                        size="sm" 
                        icon={<TbDotsVertical />}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                    />
                }
            >
                {dropdownItems.map((item) => (
                    <Dropdown.Item
                        key={item.key}
                        eventKey={item.key}
                        onClick={item.onClick}
                        className={item.className}
                    >
                        <div className="flex items-center gap-2">
                            {item.icon}
                            <span>{item.name}</span>
                        </div>
                    </Dropdown.Item>
                ))}
            </Dropdown>

            {/* Edit Project Dialog */}
            <Dialog
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onRequestClose={() => setIsEditDialogOpen(false)}
            >
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold">Edit Project</h5>
                    <Button
                        variant="plain"
                        size="sm"
                        icon={<TbX />}
                        onClick={() => setIsEditDialogOpen(false)}
                    />
                </div>

                <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Project Name
                        </label>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="Enter project name"
                                    invalid={!!errors.name}
                                />
                            )}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Description
                        </label>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    textArea
                                    rows={3}
                                    placeholder="Enter project description"
                                />
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Status
                            </label>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={statusOptions.find(option => option.value === field.value)}
                                        onChange={(option) => field.onChange(option?.value)}
                                        options={statusOptions}
                                        placeholder="Select status"
                                    />
                                )}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Priority
                            </label>
                            <Controller
                                name="priority"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={priorityOptions.find(option => option.value === field.value)}
                                        onChange={(option) => field.onChange(option?.value)}
                                        options={priorityOptions}
                                        placeholder="Select priority"
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="plain"
                            onClick={() => setIsEditDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            loading={isLoading}
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onRequestClose={() => setIsDeleteDialogOpen(false)}
            >
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold">Delete Project</h5>
                    <Button
                        variant="plain"
                        size="sm"
                        icon={<TbX />}
                        onClick={() => setIsDeleteDialogOpen(false)}
                    />
                </div>

                <div className="mb-6">
                    <p className="text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete &ldquo;{project.name}&rdquo;? This action cannot be undone.
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="plain"
                        onClick={() => setIsDeleteDialogOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        onClick={onDeleteConfirm}
                        loading={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Delete Project
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

export default ProjectActionsDropdown
