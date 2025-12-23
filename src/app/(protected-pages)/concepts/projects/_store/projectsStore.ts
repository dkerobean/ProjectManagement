import { create } from 'zustand'

// API Response type for projects
interface ApiProject {
    id: string
    name: string
    description: string | null
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
    priority: 'low' | 'medium' | 'high' | 'critical'
    owner_id: string
    start_date: string | null
    end_date: string | null
    budget: number | null
    metadata: Record<string, unknown> | null
    created_at: string
    updated_at: string
    owner?: {
        id: string
        name: string
        email: string
        avatar_url: string | null
    }
    project_members?: Array<{
        id: string
        role: string
        user: {
            id: string
            name: string
            email: string
            avatar_url: string | null
        }
    }>
    tasks?: Array<{
        id: string
        status: string
        priority: string
    }>
    taskCount?: number
    completedTasks?: number
    memberCount?: number
    progress?: number
}

export interface Project {
    id: string
    name: string
    description: string | null
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
    priority: 'low' | 'medium' | 'high' | 'critical'
    owner_id: string
    start_date: string | null
    end_date: string | null
    budget: number | null
    metadata: Record<string, unknown> | null
    created_at: string
    updated_at: string
    owner?: {
        id: string
        name: string
        email: string
        avatar_url: string | null
    }
    project_members?: Array<{
        id: string
        role: string
        user: {
            id: string
            name: string
            email: string
            avatar_url: string | null
        }
    }>
    tasks?: Array<{
        id: string
        status: string
        priority: string
    }>
    taskCount?: number
    completedTasks?: number
    memberCount?: number
    progress?: number
    favorite?: boolean
}

export interface ProjectMember {
    id: string
    name: string
    email: string
    avatar_url: string | null
}

interface ProjectsState {
    projects: Project[]
    selectedProject: Project | null
    isCreateModalOpen: boolean
    isEditModalOpen: boolean
    isDeleteModalOpen: boolean
    searchQuery: string
    statusFilter: string
    priorityFilter: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    currentPage: number
    totalPages: number
    isLoading: boolean
    isLoadingPreferences: boolean
    error: string | null
    projectMembers: ProjectMember[]
}

interface ProjectsActions {
    setProjects: (projects: Project[]) => void
    setSelectedProject: (project: Project | null) => void
    toggleCreateModal: () => void
    toggleEditModal: () => void
    toggleDeleteModal: () => void
    setSearchQuery: (query: string) => void
    setStatusFilter: (status: string) => void
    setPriorityFilter: (priority: string) => void
    setSortBy: (sortBy: string) => void
    setSortOrder: (order: 'asc' | 'desc') => void
    setCurrentPage: (page: number) => void
    setTotalPages: (pages: number) => void
    setIsLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    setProjectMembers: (members: ProjectMember[]) => void
    addProject: (project: Project) => void
    updateProject: (project: Project) => void
    deleteProject: (projectId: string) => void
    toggleProjectFavorite: (projectId: string, favorite: boolean) => void
    resetFilters: () => void
    loadProjects: () => Promise<void>
    loadUserPreferences: () => Promise<void>
    saveUserPreferences: (preferences: Record<string, unknown>) => Promise<void>
    deleteProjectFromApi: (projectId: string) => Promise<void>
    editProject: (projectId: string, projectData: Partial<Project>) => Promise<void>
}

export const useProjectsStore = create<ProjectsState & ProjectsActions>((set, get) => ({
    // State
    projects: [],
    selectedProject: null,
    isCreateModalOpen: false,
    isEditModalOpen: false,
    isDeleteModalOpen: false,
    searchQuery: '',
    statusFilter: '',
    priorityFilter: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    currentPage: 1,
    totalPages: 1,
    isLoading: false,
    isLoadingPreferences: false,
    error: null,
    projectMembers: [],

    // Actions
    setProjects: (projects) => set({ projects }),
    setSelectedProject: (project) => set({ selectedProject: project }),
    toggleCreateModal: () => set((state) => ({ isCreateModalOpen: !state.isCreateModalOpen })),
    toggleEditModal: () => set((state) => ({ isEditModalOpen: !state.isEditModalOpen })),
    toggleDeleteModal: () => set((state) => ({ isDeleteModalOpen: !state.isDeleteModalOpen })),
    setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),
    setStatusFilter: (statusFilter) => set({ statusFilter, currentPage: 1 }),
    setPriorityFilter: (priorityFilter) => set({ priorityFilter, currentPage: 1 }),
    setSortBy: (sortBy) => set({ sortBy }),
    setSortOrder: (sortOrder) => set({ sortOrder }),
    setCurrentPage: (currentPage) => set({ currentPage }),
    setTotalPages: (totalPages) => set({ totalPages }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setProjectMembers: (projectMembers) => set({ projectMembers }),

    addProject: (project) => set((state) => ({
        projects: [project, ...state.projects]
    })),

    updateProject: (updatedProject) => set((state) => ({
        projects: state.projects.map((project) =>
            project.id === updatedProject.id ? updatedProject : project
        ),
        selectedProject: state.selectedProject?.id === updatedProject.id ? updatedProject : state.selectedProject
    })),

    deleteProject: (projectId) => set((state) => ({
        projects: state.projects.filter((project) => project.id !== projectId),
        selectedProject: state.selectedProject?.id === projectId ? null : state.selectedProject
    })),

    toggleProjectFavorite: (projectId, favorite) => {
        console.log('🔄 toggleProjectFavorite called:', { projectId, favorite })
        
        set((state) => {
            const updatedProjects = state.projects.map((project) =>
                project.id === projectId ? { ...project, favorite } : project
            )

            // Save to server
            const favoriteProjects = updatedProjects
                .filter(p => p.favorite)
                .map(p => p.id)

            console.log('💾 Saving favorite projects to server:', favoriteProjects)
            useProjectsStore.getState().saveUserPreferences({ favoriteProjects })

            return { projects: updatedProjects }
        })
    },

    resetFilters: () => set({
        searchQuery: '',
        statusFilter: '',
        priorityFilter: '',
        currentPage: 1
    }),

    loadProjects: async () => {
        const state = get()
        
        // Prevent concurrent requests
        if (state.isLoading) {
            console.log('🔄 Already loading projects, skipping...')
            return
        }

        console.log('🔄 Loading projects from API...')
        set({ isLoading: true, error: null })

        try {
            const response = await fetch('/api/projects', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies for authentication
            })

            console.log('📊 API Response status:', response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ API Error:', response.status, errorText)
                throw new Error(`Failed to fetch projects: ${response.status}`)
            }

            const data = await response.json()
            console.log('📦 API Response data:', {
                totalProjects: data.data?.length || 0,
                hasData: !!data.data,
                pagination: data.pagination
            })

            // Transform API response to match our Project interface
            const transformedProjects: Project[] = data.data?.map((project: ApiProject) => ({
                id: project.id,
                name: project.name,
                description: project.description,
                status: project.status,
                priority: project.priority,
                owner_id: project.owner_id,
                start_date: project.start_date,
                end_date: project.end_date,
                budget: project.budget,
                metadata: project.metadata,
                created_at: project.created_at,
                updated_at: project.updated_at,
                owner: project.owner,
                project_members: project.project_members,
                tasks: project.tasks,
                taskCount: project.taskCount,
                completedTasks: project.completedTasks,
                memberCount: project.memberCount,
                progress: project.progress,
                favorite: false // Will be set from user preferences
            })) || []

            // First set the projects in the store
            set({
                projects: transformedProjects,
                isLoading: false,
                error: null
            })

            // Then load user preferences to set favorites (with a small delay to ensure state is updated)
            setTimeout(async () => {
                await useProjectsStore.getState().loadUserPreferences()
            }, 0)

            console.log(`✅ Successfully loaded ${transformedProjects.length} projects`)
        } catch (error) {
            console.error('❌ Error loading projects:', error)
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to load projects'
            })
        }
    },

    loadUserPreferences: async () => {
        const state = get()
        
        // Prevent concurrent requests
        if (state.isLoadingPreferences) {
            console.log('🔄 Already loading user preferences, skipping...')
            return
        }

        try {
            set({ isLoadingPreferences: true })
            console.log('🔍 Loading user preferences from API...')
            
            const currentState = get()
            console.log('🔍 Current projects count before loading preferences:', currentState.projects.length)
            
            const response = await fetch('/api/user/preferences', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            })

            if (response.ok) {
                const { data } = await response.json()
                const favoriteProjects = data.favoriteProjects || []
                
                console.log('🔍 Debug - favoriteProjects from API:', favoriteProjects)

                // Update projects with favorite status
                set((state) => {
                    const updatedProjects = state.projects.map((project) => ({
                        ...project,
                        favorite: favoriteProjects.includes(project.id)
                    }))
                    
                    console.log('🔍 Debug - projects before update:', state.projects.map(p => ({ id: p.id, name: p.name, favorite: p.favorite })))
                    console.log('🔍 Debug - projects after update:', updatedProjects.map(p => ({ id: p.id, name: p.name, favorite: p.favorite })))
                    
                    return {
                        projects: updatedProjects,
                        isLoadingPreferences: false
                    }
                })
                
                console.log('✅ Successfully loaded user preferences')
            } else {
                console.log('❌ Failed to load user preferences - response not ok:', response.status)
                set({ isLoadingPreferences: false })
            }
        } catch (error) {
            console.error('❌ Error loading user preferences:', error)
            set({ isLoadingPreferences: false })
        }
    },

    saveUserPreferences: async (preferences: Record<string, unknown>) => {
        try {
            console.log('💾 Saving user preferences:', preferences)
            
            const response = await fetch('/api/user/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(preferences),
            })

            if (!response.ok) {
                console.error('❌ Failed to save preferences - response not ok:', response.status)
                throw new Error('Failed to save preferences')
            }
            
            console.log('✅ Successfully saved user preferences')
        } catch (error) {
            console.error('❌ Error saving user preferences:', error)
        }
    },

    deleteProjectFromApi: async (projectId: string) => {
        try {
            set({ isLoading: true, error: null })

            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to delete project')
            }

            // Remove from local state
            set((state) => ({
                projects: state.projects.filter((project) => project.id !== projectId),
                selectedProject: state.selectedProject?.id === projectId ? null : state.selectedProject,
                isLoading: false
            }))

            console.log(`✅ Successfully deleted project: ${projectId}`)
        } catch (error) {
            console.error('❌ Error deleting project:', error)
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to delete project'
            })
            throw error
        }
    },

    editProject: async (projectId: string, projectData: Partial<Project>) => {
        try {
            set({ isLoading: true, error: null })

            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(projectData),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update project')
            }

            const { data: updatedProject } = await response.json()

            // Update local state
            set((state) => ({
                projects: state.projects.map((project) =>
                    project.id === projectId ? { ...project, ...updatedProject } : project
                ),
                selectedProject: state.selectedProject?.id === projectId
                    ? { ...state.selectedProject, ...updatedProject }
                    : state.selectedProject,
                isLoading: false
            }))

            console.log(`✅ Successfully updated project: ${projectId}`)
            return updatedProject
        } catch (error) {
            console.error('❌ Error updating project:', error)
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to update project'
            })
            throw error
        }
    }
}))
