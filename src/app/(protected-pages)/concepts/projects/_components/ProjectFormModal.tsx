'use client'

import { useState, useEffect } from 'react'
import { useProjectsStore } from '../_store/projectsStore'
import { useProjectListStore } from '../project-list/_store/projectListStore'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import DatePicker from '@/components/ui/DatePicker'
import FormItem from '@/components/ui/Form/FormItem'
import FormContainer from '@/components/ui/Form/FormContainer'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import Avatar from '@/components/ui/Avatar'
import { components } from 'react-select'
import type { OptionProps, MultiValueGenericProps } from 'react-select'

const { MultiValueLabel } = components

// Custom option component for team member selection
const CustomTeamMemberOption = ({ innerProps, label, data, isSelected }: OptionProps<TeamMemberOption>) => {
    return (
        <div
            className={`flex items-center justify-between p-2 cursor-pointer ${
                isSelected
                    ? 'bg-gray-100 dark:bg-gray-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            {...innerProps}
        >
            <div className="flex items-center gap-2">
                <Avatar shape="circle" size={20} src={data.img} />
                <span className="font-semibold heading-text">{label}</span>
            </div>
        </div>
    )
}

// Custom multi-value label component for selected team members
const CustomMultiValueLabel = ({ children, ...props }: MultiValueGenericProps<TeamMemberOption, true>) => {
    const { img } = props.data
    return (
        <MultiValueLabel {...props}>
            <div className="inline-flex items-center">
                <Avatar
                    className="mr-1 rtl:ml-1"
                    shape="circle"
                    size={15}
                    src={img}
                />
                {children}
            </div>
        </MultiValueLabel>
    )
}

interface TeamMemberOption {
    value: string
    label: string
    img: string
}

interface ApiMember {
    id: string
    name: string
    img: string
}

interface MembersApiResponse {
    allMembers?: ApiMember[]
}

interface ApiProjectMember {
    id: string
    role: string
    user: {
        id: string
        name: string
        email: string
        avatar_url: string | null
    }
}

interface ApiTask {
    id: string
    status: string
    priority: string
}

interface ApiProject {
    id: string
    name: string
    description: string | null
    status: string
    priority: string
    start_date: string | null
    end_date: string | null
    created_at: string
    updated_at: string
    metadata?: {
        color?: string
        template?: string
    }
    project_members?: ApiProjectMember[]
    tasks?: ApiTask[]
}

interface ProjectFormData {
    name: string
    description: string
    status: string
    priority: string
    start_date: Date | null
    end_date: Date | null
    color: string
    team_members: TeamMemberOption[]
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

    const { updateProjectList } = useProjectListStore()

    const isOpen = isCreateModalOpen || isEditModalOpen
    const isEdit = isEditModalOpen && selectedProject

    const [formData, setFormData] = useState<ProjectFormData>({
        name: '',
        description: '',
        status: 'active',
        priority: 'medium',
        start_date: null,
        end_date: null,
        color: '#3B82F6',
        team_members: []
    })

    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [availableMembers, setAvailableMembers] = useState<TeamMemberOption[]>([])

    // Transform API project data to project list format
    const updateProjectListStore = (apiProject: ApiProject) => {
        try {
            const tasks = apiProject.tasks || []
            const completedTasks = tasks.filter((task: ApiTask) => task.status === 'done')
            const progression = tasks.length > 0
                ? Math.round((completedTasks.length / tasks.length) * 100)
                : 0

            const transformedProject = {
                id: apiProject.id,
                name: apiProject.name,
                category: apiProject.metadata?.template || 'other',
                desc: apiProject.description || '',
                attachmentCount: 0,
                totalTask: tasks.length,
                completedTask: completedTasks.length,
                progression,
                dayleft: apiProject.end_date ?
                    Math.max(0, Math.ceil((new Date(apiProject.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : undefined,
                status: apiProject.status,
                member: apiProject.project_members?.map((member: ApiProjectMember) => {
                    // Ensure we have a valid avatar URL or fallback
                    const avatarUrl = member.user.avatar_url && member.user.avatar_url.trim()
                        ? member.user.avatar_url
                        : '/img/avatars/thumb-1.jpg';

                    return {
                        id: member.user.id,
                        name: member.user.name || 'Team Member',
                        email: member.user.email || '',
                        img: avatarUrl
                    };
                }) || [],
                cover: apiProject.metadata?.color || '#3B82F6',
                priority: apiProject.priority || 'medium',
                createdAt: apiProject.created_at,
                updatedAt: apiProject.updated_at,
                favourite: false
            }

            updateProjectList(transformedProject)
        } catch (error) {
            console.error('Error updating project list store:', error)
        }
    }

    // Fetch available team members
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await fetch('/api/projects/scrum-board/members')
                if (response.ok) {
                    const data: MembersApiResponse = await response.json()
                    const memberOptions: TeamMemberOption[] = data.allMembers?.map((member: ApiMember) => ({
                        value: member.id,
                        label: member.name,
                        img: member.img
                    })) || []
                    setAvailableMembers(memberOptions)
                }
            } catch (error) {
                console.error('Error fetching team members:', error)
            }
        }

        if (isOpen) {
            fetchMembers()
        }
    }, [isOpen])

    useEffect(() => {
        if (isEdit && selectedProject) {
            setFormData({
                name: selectedProject.name,
                description: selectedProject.description || '',
                status: selectedProject.status,
                priority: selectedProject.priority,
                start_date: selectedProject.start_date ? new Date(selectedProject.start_date) : null,
                end_date: selectedProject.end_date ? new Date(selectedProject.end_date) : null,
                color: (selectedProject.metadata as { color?: string })?.color || '#3B82F6',
                team_members: [] // TODO: Load existing team members if available
            })
        } else {
            setFormData({
                name: '',
                description: '',
                status: 'active',
                priority: 'medium',
                start_date: null,
                end_date: null,
                color: '#3B82F6',
                team_members: []
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
                metadata: {
                    color: formData.color
                },
                team_members: formData.team_members.map(member => member.value)
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

                // Also update the project list store with transformed data
                // Wait for the next tick to ensure UI updates correctly
                setTimeout(() => {
                    updateProjectListStore(newProject)
                }, 0)

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
                    color: '#3B82F6',
                    team_members: []
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

                    <FormItem label="Team Members">
                        <Select
                            isMulti
                            placeholder="Select team members"
                            value={formData.team_members}
                            onChange={(selectedOptions) => {
                                setFormData({
                                    ...formData,
                                    team_members: selectedOptions ? [...selectedOptions] : []
                                })
                            }}
                            options={availableMembers}
                            components={{
                                Option: CustomTeamMemberOption,
                                MultiValueLabel: CustomMultiValueLabel,
                            }}
                            className="mb-4"
                        />
                    </FormItem>

                    <FormItem label="Color">
                        <Select
                            value={colorOptions.find(option => option.value === formData.color)}
                            onChange={(option) => setFormData({ ...formData, color: option?.value || '#3B82F6' })}
                            options={colorOptions}
                        />
                    </FormItem>
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
