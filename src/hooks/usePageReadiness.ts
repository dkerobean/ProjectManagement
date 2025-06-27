'use client'

import { useEffect, useState } from 'react'
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext'

interface UsePageReadinessOptions {
    /** Array of data dependencies that should be loaded */
    dataDependencies?: Array<{
        data: unknown
        loading: boolean
        error?: unknown
    }>
    /** Custom readiness check function */
    customCheck?: () => boolean | Promise<boolean>
    /** Elements that should be present for page to be ready */
    requiredElements?: string[]
    /** Auto-clear loading when ready (default: true) */
    autoClearLoading?: boolean
    /** Delay after all conditions are met (default: 0) */
    readyDelay?: number
}

export const usePageReadiness = ({
    dataDependencies = [],
    customCheck,
    requiredElements = [],
    autoClearLoading = true,
    readyDelay = 0
}: UsePageReadinessOptions = {}) => {
    const [isPageReady, setIsPageReady] = useState(false)
    const { isLoading, setIsLoading } = useNavigationLoading()

    useEffect(() => {
        const checkPageReadiness = async () => {
            try {
                // Check if all data dependencies are loaded
                const allDataLoaded = dataDependencies.every(dep => 
                    !dep.loading && dep.data !== undefined && !dep.error
                )

                // Check if all required elements are present
                const allElementsPresent = requiredElements.length === 0 || 
                    requiredElements.every(selector => document.querySelector(selector) !== null)

                // Run custom check if provided
                let customCheckPassed = true
                if (customCheck) {
                    try {
                        const result = customCheck()
                        customCheckPassed = await Promise.resolve(result)
                    } catch {
                        customCheckPassed = false
                    }
                }

                const ready = allDataLoaded && allElementsPresent && customCheckPassed

                if (ready && !isPageReady) {
                    if (readyDelay > 0) {
                        setTimeout(() => {
                            setIsPageReady(true)
                            if (autoClearLoading && isLoading) {
                                setIsLoading(false)
                            }
                        }, readyDelay)
                    } else {
                        setIsPageReady(true)
                        if (autoClearLoading && isLoading) {
                            setIsLoading(false)
                        }
                    }
                }
            } catch (error) {
                console.warn('Error checking page readiness:', error)
                // Don't block page from being ready on error
                setIsPageReady(true)
                if (autoClearLoading && isLoading) {
                    setIsLoading(false)
                }
            }
        }

        // Check readiness on mount and when dependencies change
        checkPageReadiness()

        // Also check periodically if not ready yet
        if (!isPageReady) {
            const interval = setInterval(checkPageReadiness, 100)
            return () => clearInterval(interval)
        }
    }, [
        isPageReady,
        isLoading,
        setIsLoading,
        autoClearLoading,
        readyDelay,
        customCheck,
        JSON.stringify(dataDependencies.map(dep => ({ 
            hasData: !!dep.data, 
            loading: dep.loading, 
            hasError: !!dep.error 
        }))),
        JSON.stringify(requiredElements)
    ])

    // Reset ready state when navigation starts
    useEffect(() => {
        if (isLoading && isPageReady) {
            setIsPageReady(false)
        }
    }, [isLoading, isPageReady])

    return {
        isPageReady,
        setPageReady: setIsPageReady,
        clearLoading: () => setIsLoading(false)
    }
}

// Hook specifically for SWR integration
export const usePageReadinessWithSWR = (
    swrResults: Array<{ data: unknown; isLoading: boolean; error: unknown }>,
    options?: Omit<UsePageReadinessOptions, 'dataDependencies'>
) => {
    const dataDependencies = swrResults.map(result => ({
        data: result.data,
        loading: result.isLoading,
        error: result.error
    }))

    return usePageReadiness({
        ...options,
        dataDependencies
    })
}

// Hook for React Query integration
export const usePageReadinessWithReactQuery = (
    queryResults: Array<{ data: unknown; isLoading: boolean; error: unknown }>,
    options?: Omit<UsePageReadinessOptions, 'dataDependencies'>
) => {
    const dataDependencies = queryResults.map(result => ({
        data: result.data,
        loading: result.isLoading,
        error: result.error
    }))

    return usePageReadiness({
        ...options,
        dataDependencies
    })
}