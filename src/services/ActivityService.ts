export type ActivityType = 
    | 'UPDATE-TICKET' 
    | 'COMMENT' 
    | 'ADD-TAGS-TO-TICKET' 
    | 'ADD-FILES-TO-TICKET' 
    | 'CREATE-TICKET' 
    | 'COMMENT-MENTION' 
    | 'ASSIGN-TICKET'
    | 'CREATE-PROJECT'
    | 'UPDATE-PROJECT'
    | 'DELETE-PROJECT'
    | 'JOIN-PROJECT'
    | 'LEAVE-PROJECT'
    | 'UPLOAD-FILE'

export type Activity = {
    id: string
    user_id: string
    type: ActivityType
    title: string
    description?: string
    entity_type?: string
    entity_id?: string
    metadata?: Record<string, any>
    created_at: string
    updated_at: string
    user?: {
        id: string
        name: string
        email: string
        avatar_url?: string
    }
}

export type GroupedActivity = {
    id: string
    date: number
    events: Array<{
        id: string
        type: ActivityType
        dateTime: number
        ticket?: string
        status?: number
        userName: string
        userImg?: string
        comment?: string
        tags?: string[]
        files?: string[]
        assignee?: string
        title: string
        description?: string
        metadata?: Record<string, any>
    }>
}

export type ActivityFilters = {
    entity_type?: string
    entity_id?: string
    user_id?: string
    activity_type?: ActivityType
    start_date?: string
    end_date?: string
    page?: number
    limit?: number
}

export const apiGetActivities = async (filters: ActivityFilters = {}) => {
    const searchParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString())
        }
    })

    const response = await fetch(`/api/activities?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch activities')
    }

    return response.json()
}

export const apiCreateActivity = async (activityData: {
    type: ActivityType
    title: string
    description?: string
    entity_type?: string
    entity_id?: string
    metadata?: Record<string, any>
}) => {
    const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
    })

    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create activity')
    }

    return response.json()
}

// Helper function to transform activities into grouped format for Timeline component
export const groupActivitiesByDate = (activities: Activity[]): GroupedActivity[] => {
    const grouped: Record<string, GroupedActivity> = {}

    activities.forEach((activity) => {
        const date = new Date(activity.created_at)
        const dateKey = date.toDateString()
        const dateTimestamp = Math.floor(date.getTime() / 1000)

        if (!grouped[dateKey]) {
            grouped[dateKey] = {
                id: dateKey,
                date: dateTimestamp,
                events: [],
            }
        }

        grouped[dateKey].events.push({
            id: activity.id,
            type: activity.type,
            dateTime: Math.floor(new Date(activity.created_at).getTime() / 1000),
            userName: activity.user?.name || 'Unknown User',
            userImg: activity.user?.avatar_url || '',
            title: activity.title,
            description: activity.description,
            metadata: activity.metadata,
            ticket: activity.metadata?.ticket,
            status: activity.metadata?.status,
            comment: activity.metadata?.comment,
            tags: activity.metadata?.tags,
            files: activity.metadata?.files,
            assignee: activity.metadata?.assignee,
        })
    })

    // Sort by date (newest first)
    return Object.values(grouped).sort((a, b) => b.date - a.date)
}

// Predefined activity templates for common project actions
export const createProjectActivity = (projectId: string, action: 'created' | 'updated' | 'deleted', metadata?: Record<string, any>) => {
    const activityMap = {
        created: {
            type: 'CREATE-PROJECT' as ActivityType,
            title: 'Project Created',
            description: 'Created a new project',
        },
        updated: {
            type: 'UPDATE-PROJECT' as ActivityType,
            title: 'Project Updated',
            description: 'Updated project details',
        },
        deleted: {
            type: 'DELETE-PROJECT' as ActivityType,
            title: 'Project Deleted',
            description: 'Deleted project',
        },
    }

    const activityData = activityMap[action]
    
    return apiCreateActivity({
        ...activityData,
        entity_type: 'project',
        entity_id: projectId,
        metadata: metadata || {},
    })
}

export const createTaskActivity = (taskId: string, action: 'created' | 'updated' | 'commented' | 'assigned', metadata?: Record<string, any>) => {
    const activityMap = {
        created: {
            type: 'CREATE-TICKET' as ActivityType,
            title: 'Task Created',
            description: 'Created a new task',
        },
        updated: {
            type: 'UPDATE-TICKET' as ActivityType,
            title: 'Task Updated',
            description: 'Updated task details',
        },
        commented: {
            type: 'COMMENT' as ActivityType,
            title: 'Comment Added',
            description: 'Added a comment to the task',
        },
        assigned: {
            type: 'ASSIGN-TICKET' as ActivityType,
            title: 'Task Assigned',
            description: 'Assigned task to team member',
        },
    }

    const activityData = activityMap[action]
    
    return apiCreateActivity({
        ...activityData,
        entity_type: 'task',
        entity_id: taskId,
        metadata: metadata || {},
    })
}

export const createFileActivity = (entityType: string, entityId: string, filename: string, metadata?: Record<string, any>) => {
    return apiCreateActivity({
        type: 'ADD-FILES-TO-TICKET',
        title: 'File Uploaded',
        description: `Uploaded file: ${filename}`,
        entity_type: entityType,
        entity_id: entityId,
        metadata: {
            filename,
            ...metadata,
        },
    })
}