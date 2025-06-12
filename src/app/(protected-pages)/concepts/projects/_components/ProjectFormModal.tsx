'use client'

import { useState, useEffect } from 'react'
import { useProjectsStore } from '../_store/projectsStore'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import DatePicker from '@/components/ui/DatePicker'
import FormItem from '@/components/ui/Form/FormItem'
import FormContainer from '@/components/ui/Form/FormContainer'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

interface ProjectFormData {
    name: string
    description: string
    status: string
    priority: string
    start_date: Date | null
    end_date: Date | null
    budget: string
    color: string
}

const ProjectFormModal = () => {
    const {
        isCreateModalOpen,
        isEditModalOpen,
        selectedProject,
        toggleCreateModal,
        toggleEditModal,
        addProject,
        updateProject
    } = useProjectsStore()

    const isOpen = isCreateModalOpen || isEditModalOpen
    const isEdit = isEditModalOpen && selectedProject

    const [formData, setFormData] = useState<ProjectFormData>({
        name: '',
        description: '',
        status: 'active',
        priority: 'medium',
        start_date: null,
        end_date: null,
        budget: '',
        color: '#3B82F6'
    })

    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (isEdit && selectedProject) {
            setFormData({
                name: selectedProject.name,
                description: selectedProject.description || '',
                status: selectedProject.status,
                priority: selectedProject.priority,
                start_date: selectedProject.start_date ? new Date(selectedProject.start_date) : null,
                end_date: selectedProject.end_date ? new Date(selectedProject.end_date) : null,
                budget: selectedProject.budget ? selectedProject.budget.toString() : '',
                color: selectedProject.metadata?.color || '#3B82F6'
            })
        } else {
            setFormData({
                name: '',
                description: '',
                status: 'active',
                priority: 'medium',
                start_date: null,
                end_date: null,
                budget: '',
                color: '#3B82F6'
            })
        }
        setErrors({})
    }, [isEdit, selectedProject, isOpen])

    const statusOptions = [
        { value: 'planning', label: 'Planning' },
        { value: 'active', label: 'Active' },
        { value: 'on_hold', label: 'On Hold' },
        { value: 'completed', label: 'Completed' },
        { value: 'archived', label: 'Archived' }
    ]

    const priorityOptions = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
    ]

    const colorOptions = [
        { value: '#3B82F6', label: 'Blue' },
        { value: '#EF4444', label: 'Red' },
        { value: '#10B981', label: 'Green' },
        { value: '#F59E0B', label: 'Yellow' },
        { value: '#8B5CF6', label: 'Purple' },
        { value: '#EC4899', label: 'Pink' },
        { value: '#6B7280', label: 'Gray' }
    ]

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Project name is required'
        } else if (formData.name.length > 255) {
            newErrors.name = 'Project name must be less than 255 characters'
        }

        if (formData.description.length > 1000) {
            newErrors.description = 'Description must be less than 1000 characters'
        }

        if (formData.budget && isNaN(parseFloat(formData.budget))) {
            newErrors.budget = 'Budget must be a valid number'
        }

        if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
            newErrors.end_date = 'End date must be after start date'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        setIsLoading(true)

        try {
            const projectData = {
                name: formData.name,
                description: formData.description || null,
                status: formData.status as 'planning' | 'active' | 'on_hold' | 'completed' | 'archived',
                priority: formData.priority as 'low' | 'medium' | 'high' | 'critical',
                start_date: formData.start_date ? formData.start_date.toISOString().split('T')[0] : null,
                end_date: formData.end_date ? formData.end_date.toISOString().split('T')[0] : null,
                budget: formData.budget ? parseFloat(formData.budget) : null,
                metadata: {
                    color: formData.color
                }
            }

            if (isEdit && selectedProject) {
                // Update existing project
                const response = await fetch(`/api/projects/${selectedProject.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(projectData),
                })

                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || 'Failed to update project')
                }

                const { data: updatedProject } = await response.json()
                updateProject(updatedProject)

                toast.push(
                    <Notification type="success" title="Success">
                        Project updated successfully
                    </Notification>
                )

                toggleEditModal()
            } else {
                // Create new project
                const response = await fetch('/api/projects', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(projectData),
                })

                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || 'Failed to create project')
                }

                const { data: newProject } = await response.json()
                addProject(newProject)

                toast.push(
                    <Notification type="success" title="Success">
                        Project created successfully
                    </Notification>
                )

                toggleCreateModal()
            }
        } catch (error) {
            console.error('Error saving project:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    {error instanceof Error ? error.message : 'An unexpected error occurred'}
                </Notification>
            )
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        if (isCreateModalOpen) {
            toggleCreateModal()
        } else {
            toggleEditModal()
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleClose}
            onAfterClose={() => {
                setFormData({
                    name: '',
                    description: '',
                    status: 'active',
                    priority: 'medium',
                    start_date: null,
                    end_date: null,
                    budget: '',
                    color: '#3B82F6'
                })
                setErrors({})
            }}
        >
            <div className="max-w-md w-full">
                <h5 className="mb-4 text-lg font-semibold">
                    {isEdit ? 'Edit Project' : 'Create New Project'}
                </h5>

                <FormContainer>
                    <FormItem
                        label="Project Name"
                        invalid={!!errors.name}
                        errorMessage={errors.name}
                        asterisk
                    >
                        <Input
                            placeholder="Enter project name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </FormItem>

                    <FormItem
                        label="Description"
                        invalid={!!errors.description}
                        errorMessage={errors.description}
                    >
                        <Input
                            textArea
                            rows={3}
                            placeholder="Project description (optional)"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </FormItem>

                    <div className="grid grid-cols-2 gap-4">
                        <FormItem label="Status">
                            <Select
                                value={statusOptions.find(option => option.value === formData.status)}
                                onChange={(option) => setFormData({ ...formData, status: option?.value || 'active' })}
                                options={statusOptions}
                            />
                        </FormItem>

                        <FormItem label="Priority">
                            <Select
                                value={priorityOptions.find(option => option.value === formData.priority)}
                                onChange={(option) => setFormData({ ...formData, priority: option?.value || 'medium' })}
                                options={priorityOptions}
                            />
                        </FormItem>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormItem label="Start Date">
                            <DatePicker
                                value={formData.start_date}
                                onChange={(date) => setFormData({ ...formData, start_date: date })}
                                placeholder="Select start date"
                            />
                        </FormItem>

                        <FormItem
                            label="End Date"
                            invalid={!!errors.end_date}
                            errorMessage={errors.end_date}
                        >
                            <DatePicker
                                value={formData.end_date}
                                onChange={(date) => setFormData({ ...formData, end_date: date })}
                                placeholder="Select end date"
                            />
                        </FormItem>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormItem
                            label="Budget"
                            invalid={!!errors.budget}
                            errorMessage={errors.budget}
                        >
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                prefix="$"
                            />
                        </FormItem>

                        <FormItem label="Color">
                            <Select
                                value={colorOptions.find(option => option.value === formData.color)}
                                onChange={(option) => setFormData({ ...formData, color: option?.value || '#3B82F6' })}
                                options={colorOptions}
                            />
                        </FormItem>
                    </div>
                </FormContainer>

                <div className="text-right mt-6">
                    <Button
                        className="ltr:mr-2 rtl:ml-2"
                        variant="plain"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        onClick={handleSubmit}
                        loading={isLoading}
                    >
                        {isEdit ? 'Update Project' : 'Create Project'}
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default ProjectFormModal
