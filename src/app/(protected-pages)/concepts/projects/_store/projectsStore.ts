import { create } from 'zustand'

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
    metadata: Record<string, any> | null
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

    toggleProjectFavorite: (projectId, favorite) => set((state) => ({
        projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, favorite } : project
        )
    })),

    resetFilters: () => set({
        searchQuery: '',
        statusFilter: '',
        priorityFilter: '',
        currentPage: 1
    })
}))
