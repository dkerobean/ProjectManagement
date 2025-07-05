'use client'

import { useState, useEffect } from 'react'
import Timeline from '@/components/ui/Timeline'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Loading from '@/components/shared/Loading'
import { apiGetActivities, groupActivitiesByDate } from '@/services/ActivityService'
import { ActivityAvatar, ActivityEvent } from '@/components/view/Activity'
import { TbSearch, TbFilter, TbDownload } from 'react-icons/tb'
import isEmpty from 'lodash/isEmpty'
import dayjs from 'dayjs'
import type { Activity, ActivityFilters } from '@/services/ActivityService'

const ProjectDetailsActivity = ({ projectId }: { projectId: string }) => {
    const [isLoading, setIsLoading] = useState(false)
    const [activities, setActivities] = useState<Activity[]>([])
    const [groupedActivities, setGroupedActivities] = useState<ReturnType<typeof groupActivitiesByDate>>([])
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
    const [hasMore, setHasMore] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filters, setFilters] = useState<ActivityFilters>({
        entity_type: 'project',
        entity_id: projectId,
        limit: 20,
        page: 1,
    })

    const activityTypeOptions = [
        { label: 'All Activities', value: '' },
        { label: 'Project Updates', value: 'UPDATE-PROJECT' },
        { label: 'Task Updates', value: 'UPDATE-TICKET' },
        { label: 'Comments', value: 'COMMENT' },
        { label: 'File Uploads', value: 'ADD-FILES-TO-TICKET' },
        { label: 'Task Creation', value: 'CREATE-TICKET' },
        { label: 'Assignments', value: 'ASSIGN-TICKET' },
    ]

    const getActivities = async (loadMore = false) => {
        setIsLoading(true)
        
        try {
            const currentPage = loadMore ? pagination.page + 1 : 1
            const updatedFilters = { ...filters, page: currentPage }
            
            const response = await apiGetActivities(updatedFilters)
            const newActivities = response.data
            
            if (loadMore) {
                setActivities(prev => [...prev, ...newActivities])
            } else {
                setActivities(newActivities)
            }
            
            setPagination(response.pagination)
            setHasMore(response.pagination.page < response.pagination.totalPages)
            
        } catch (error) {
            console.error('Failed to fetch activities:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        getActivities()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters])

    useEffect(() => {
        setGroupedActivities(groupActivitiesByDate(activities))
    }, [activities])

    const onLoadMore = () => {
        if (hasMore && !isLoading) {
            getActivities(true)
        }
    }

    const handleFilterChange = (key: keyof ActivityFilters, value: string | undefined) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || undefined,
            page: 1, // Reset to first page when filtering
        }))
    }

    const handleSearch = (value: string) => {
        setSearchQuery(value)
        // Note: Search functionality would need backend support for text search
        // For now, we'll just update the UI
    }

    const exportActivities = () => {
        // Export activities to CSV
        const csvContent = activities.map(activity => ({
            Date: dayjs(activity.created_at).format('YYYY-MM-DD HH:mm:ss'),
            User: activity.user?.name || 'Unknown',
            Type: activity.type,
            Title: activity.title,
            Description: activity.description || '',
        }))
        
        const csvString = [
            Object.keys(csvContent[0] || {}).join(','),
            ...csvContent.map(row => Object.values(row).map(val => `"${val}"`).join(','))
        ].join('\n')
        
        const blob = new Blob([csvString], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `project-activities-${dayjs().format('YYYY-MM-DD')}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    return (
        <div>
            {/* Header with filters and search */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <h3 className="text-lg font-semibold">Project Activity</h3>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            icon={<TbFilter />}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            Filter
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            icon={<TbDownload />}
                            onClick={exportActivities}
                            disabled={activities.length === 0}
                        >
                            Export
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="mt-4">
                    <Input
                        placeholder="Search activities..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        prefix={<TbSearch className="text-gray-400" />}
                    />
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Activity Type</label>
                                <Select
                                    placeholder="All Activities"
                                    options={activityTypeOptions}
                                    value={activityTypeOptions.find(opt => opt.value === filters.activity_type)}
                                    onChange={(option) => handleFilterChange('activity_type', option?.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Start Date</label>
                                <Input
                                    type="date"
                                    value={filters.start_date || ''}
                                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">End Date</label>
                                <Input
                                    type="date"
                                    value={filters.end_date || ''}
                                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button
                                size="sm"
                                onClick={() => {
                                    setFilters({
                                        entity_type: 'project',
                                        entity_id: projectId,
                                        limit: 20,
                                        page: 1,
                                    })
                                    setSearchQuery('')
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Activity Timeline */}
            <Loading loading={isLoading && activities.length === 0}>
                <div>
                    {groupedActivities.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-500 mb-2">No activities found</div>
                            <div className="text-sm text-gray-400">
                                {filters.activity_type || searchQuery ? 
                                    'Try adjusting your filters or search terms' : 
                                    'Activities will appear here as team members work on this project'
                                }
                            </div>
                        </div>
                    ) : (
                        <>
                            {groupedActivities.map((log, index) => (
                                <div key={log.id + index} className="mb-8">
                                    <div className="mb-4 font-semibold uppercase text-sm text-gray-600 dark:text-gray-400">
                                        {dayjs.unix(log.date).format('dddd, DD MMMM YYYY')}
                                    </div>
                                    <Timeline>
                                        {isEmpty(log.events) ? (
                                            <Timeline.Item>No Activities</Timeline.Item>
                                        ) : (
                                            log.events.map((event, eventIndex) => (
                                                <Timeline.Item
                                                    key={log.id + event.type + eventIndex}
                                                    media={<ActivityAvatar data={event} />}
                                                >
                                                    <div className="mt-1">
                                                        <ActivityEvent data={event} />
                                                        <div className="text-xs text-gray-500 mt-2">
                                                            {dayjs.unix(event.dateTime).format('h:mm A')}
                                                        </div>
                                                    </div>
                                                </Timeline.Item>
                                            ))
                                        )}
                                    </Timeline>
                                </div>
                            ))}
                            
                            {/* Load More Button */}
                            <div className="text-center">
                                {hasMore ? (
                                    <Button 
                                        loading={isLoading && activities.length > 0} 
                                        onClick={onLoadMore}
                                        disabled={isLoading}
                                    >
                                        Load More Activities
                                    </Button>
                                ) : activities.length > 0 ? (
                                    <div className="text-sm text-gray-500">
                                        All activities loaded ({activities.length} total)
                                    </div>
                                ) : null}
                            </div>
                        </>
                    )}
                </div>
            </Loading>
        </div>
    )
}

export default ProjectDetailsActivity
