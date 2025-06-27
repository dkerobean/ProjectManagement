'use client'

import { usePageReadiness } from '@/hooks/usePageReadiness'
import { SkeletonCard, SkeletonTable } from '@/components/shared/SkeletonLoader'
import { useState, useEffect } from 'react'

// Example of how to use the enhanced loading system in a page component
const EnhancedPageExample = () => {
    // Simulate data fetching
    const [projectsData, setProjectsData] = useState(null)
    const [tasksData, setTasksData] = useState(null)
    const [projectsLoading, setProjectsLoading] = useState(true)
    const [tasksLoading, setTasksLoading] = useState(true)

    // Simulate API calls
    useEffect(() => {
        // Simulate projects API call
        setTimeout(() => {
            setProjectsData([{ id: 1, name: 'Project 1' }, { id: 2, name: 'Project 2' }])
            setProjectsLoading(false)
        }, 1000)

        // Simulate tasks API call
        setTimeout(() => {
            setTasksData([{ id: 1, title: 'Task 1' }, { id: 2, title: 'Task 2' }])
            setTasksLoading(false)
        }, 1500)
    }, [])

    // Use the page readiness hook
    const { isPageReady } = usePageReadiness({
        dataDependencies: [
            {
                data: projectsData,
                loading: projectsLoading,
                error: null
            },
            {
                data: tasksData,
                loading: tasksLoading,
                error: null
            }
        ],
        requiredElements: ['.projects-section', '.tasks-section'],
        customCheck: () => {
            // Custom check: ensure we have at least one project or task
            return (projectsData && projectsData.length > 0) || (tasksData && tasksData.length > 0)
        },
        readyDelay: 200 // Small delay after everything is ready
    })

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Enhanced Loading Example
            </h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Projects Section */}
                <div className="projects-section">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                        Projects
                    </h2>
                    
                    {projectsLoading ? (
                        <div className="space-y-4">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {projectsData?.map((project: { id: number; name: string }) => (
                                <div key={project.id} className="p-4 border rounded-lg bg-white dark:bg-gray-800">
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                        {project.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Project details and description would go here.
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tasks Section */}
                <div className="tasks-section">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                        Tasks
                    </h2>
                    
                    {tasksLoading ? (
                        <SkeletonTable rows={3} columns={3} />
                    ) : (
                        <div className="space-y-3">
                            {tasksData?.map((task: { id: number; title: string }) => (
                                <div key={task.id} className="flex items-center p-3 border rounded-lg bg-white dark:bg-gray-800">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                            {task.title}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Task description and details.
                                        </p>
                                    </div>
                                    <button className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary-600">
                                        View
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Status indicator */}
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isPageReady ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Page Status: {isPageReady ? 'Ready' : 'Loading...'}
                    </span>
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <p>Projects: {projectsLoading ? 'Loading...' : 'Loaded'}</p>
                    <p>Tasks: {tasksLoading ? 'Loading...' : 'Loaded'}</p>
                </div>
            </div>
        </div>
    )
}

export default EnhancedPageExample