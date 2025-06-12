'use client'

import { useState } from 'react'
import { useProjectsStore } from '../_store/projectsStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { TbPlus, TbSearch, TbFilter, TbRefresh } from 'react-icons/tb'

const ProjectsHeader = () => {
    const {
        searchQuery,
        statusFilter,
        priorityFilter,
        sortBy,
        sortOrder,
        isLoading,
        setSearchQuery,
        setStatusFilter,
        setPriorityFilter,
        setSortBy,
        setSortOrder,
        toggleCreateModal,
        resetFilters,
        loadProjects,
        loadUserPreferences
    } = useProjectsStore()

    const handleRefresh = async () => {
        await loadProjects()
        await loadUserPreferences()
    }

    const [showFilters, setShowFilters] = useState(false)

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'planning', label: 'Planning' },
        { value: 'active', label: 'Active' },
        { value: 'on_hold', label: 'On Hold' },
        { value: 'completed', label: 'Completed' },
        { value: 'archived', label: 'Archived' }
    ]

    const priorityOptions = [
        { value: '', label: 'All Priorities' },
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
    ]

    const sortOptions = [
        { value: 'created_at', label: 'Created Date' },
        { value: 'updated_at', label: 'Updated Date' },
        { value: 'name', label: 'Name' },
        { value: 'status', label: 'Status' },
        { value: 'priority', label: 'Priority' }
    ]

    return (
        <div className="bg-white border-b border-gray-200 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Main Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                        <p className="text-gray-600 mt-1">Manage and track all your projects</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center gap-3">
                        <Button
                            variant="solid"
                            icon={<TbRefresh />}
                            loading={isLoading}
                            onClick={handleRefresh}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="solid"
                            icon={<TbPlus />}
                            onClick={toggleCreateModal}
                        >
                            New Project
                        </Button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <Input
                            placeholder="Search projects by name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            prefix={<TbSearch className="text-gray-400" />}
                            className="w-full"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <Button
                        variant="default"
                        icon={<TbFilter />}
                        onClick={() => setShowFilters(!showFilters)}
                        className={showFilters ? 'bg-blue-50 text-blue-600' : ''}
                    >
                        Filters
                    </Button>
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <Select
                                    value={statusOptions.find(option => option.value === statusFilter) || null}
                                    onChange={(option: { value: string; label: string } | null) => setStatusFilter(option?.value || '')}
                                    options={statusOptions}
                                    placeholder="Select status"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Priority
                                </label>
                                <Select
                                    value={priorityOptions.find(option => option.value === priorityFilter) || null}
                                    onChange={(option: { value: string; label: string } | null) => setPriorityFilter(option?.value || '')}
                                    options={priorityOptions}
                                    placeholder="Select priority"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sort By
                                </label>
                                <Select
                                    value={sortOptions.find(option => option.value === sortBy) || null}
                                    onChange={(option: { value: string; label: string } | null) => setSortBy(option?.value || 'created_at')}
                                    options={sortOptions}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Order
                                </label>
                                <Select
                                    value={sortOrder === 'desc' ? { value: 'desc', label: 'Descending' } : { value: 'asc', label: 'Ascending' }}
                                    onChange={(option: { value: string; label: string } | null) => setSortOrder((option?.value as 'asc' | 'desc') || 'desc')}
                                    options={[
                                        { value: 'desc', label: 'Descending' },
                                        { value: 'asc', label: 'Ascending' }
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <Button
                                variant="default"
                                size="sm"
                                onClick={resetFilters}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProjectsHeader
