'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface NavigationLoadingContextType {
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType | undefined>(undefined)

export const useNavigationLoading = () => {
    const context = useContext(NavigationLoadingContext)
    if (!context) {
        throw new Error('useNavigationLoading must be used within a NavigationLoadingProvider')
    }
    return context
}

interface NavigationLoadingProviderProps {
    children: ReactNode
}

export const NavigationLoadingProvider = ({ children }: NavigationLoadingProviderProps) => {
    const [isLoading, setIsLoading] = useState(false)
    const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null)
    const [currentPath, setCurrentPath] = useState<string>('')
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Auto-clear loading state when route changes and page is ready
    useEffect(() => {
        const newPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

        if (isLoading && currentPath !== newPath) {
            // Path has changed, wait for the new page to be fully ready
            const checkPageReady = () => {
                if (typeof window !== 'undefined') {
                    // Wait for multiple frames to ensure page is fully rendered
                    const waitForPageReady = () => {
                        // Check if page is ready by waiting for:
                        // 1. Document to be ready
                        // 2. All images to be loaded (if any)
                        // 3. A reasonable delay for React components to mount

                        const isDocumentReady = document.readyState === 'complete'
                        const elapsedTime = loadingStartTime ? Date.now() - loadingStartTime : 0
                        const minimumLoadingTime = 500 // Show loading for at least 500ms for better UX

                        if (isDocumentReady && elapsedTime >= minimumLoadingTime) {
                            // Additional delay to ensure React components are mounted
                            setTimeout(() => {
                                setIsLoading(false)
                                setLoadingStartTime(null)
                                setCurrentPath(newPath)
                            }, 200) // Extra 200ms for component mounting
                        } else {
                            // Wait for the remaining minimum time
                            const remainingTime = Math.max(
                                minimumLoadingTime - elapsedTime,
                                isDocumentReady ? 200 : 500
                            )
                            setTimeout(() => {
                                setIsLoading(false)
                                setLoadingStartTime(null)
                                setCurrentPath(newPath)
                            }, remainingTime)
                        }
                    }

                    // Use multiple requestAnimationFrame calls to ensure everything is rendered
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            waitForPageReady()
                        })
                    })
                }
            }

            // Small delay before checking to ensure navigation has started
            setTimeout(checkPageReady, 50)
        } else if (!isLoading) {
            // Update current path when not loading
            setCurrentPath(newPath)
        }
    }, [pathname, searchParams, isLoading, loadingStartTime, currentPath])

    // Auto-clear loading state after maximum timeout (5 seconds)
    useEffect(() => {
        if (isLoading) {
            const timeout = setTimeout(() => {
                console.warn('Navigation loading timeout reached - clearing loading state')
                setIsLoading(false)
                setLoadingStartTime(null)
            }, 5000) // Maximum 5 seconds loading time

            return () => clearTimeout(timeout)
        }
    }, [isLoading])

    // Track when loading starts
    const setIsLoadingWithTime = (loading: boolean) => {
        if (loading) {
            setLoadingStartTime(Date.now())
        }
        setIsLoading(loading)
    }

    return (
        <NavigationLoadingContext.Provider value={{ isLoading, setIsLoading: setIsLoadingWithTime }}>
            {children}
        </NavigationLoadingContext.Provider>
    )
}
