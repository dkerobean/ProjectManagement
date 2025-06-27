'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { defaultLoadingConfig, type PageLoadingConfig } from '@/types/navigation-loading'

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
                        // Enhanced page readiness detection
                        // 1. Document state
                        // 2. Images loaded
                        // 3. Fonts loaded
                        // 4. React components mounted
                        // 5. Minimum loading time for UX

                        // Get page-specific configuration
                        const getPageConfig = (): PageLoadingConfig => {
                            const globalConfig = defaultLoadingConfig.global
                            const pageConfig = Object.entries(defaultLoadingConfig.pages)
                                .find(([pattern]) => newPath.startsWith(pattern))?.[1]
                            
                            return { ...globalConfig, ...pageConfig }
                        }

                        const config = getPageConfig()
                        const isDocumentReady = document.readyState === 'complete'
                        const elapsedTime = loadingStartTime ? Date.now() - loadingStartTime : 0
                        const minimumLoadingTime = config.minimumLoadingTime || 500

                        // Check if all images are loaded
                        const areImagesLoaded = () => {
                            if (config.skipImageChecks) return true
                            const images = document.querySelectorAll('img')
                            return Array.from(images).every(img => img.complete && img.naturalHeight !== 0)
                        }

                        // Check if fonts are loaded
                        const areFontsLoaded = () => {
                            if (config.skipFontChecks) return Promise.resolve()
                            return document.fonts ? document.fonts.ready : Promise.resolve()
                        }

                        // Check if main content area exists (indicates React components mounted)
                        const isMainContentReady = () => {
                            const selectors = config.waitForSelectors || ['main', '[role="main"]', '.main-content']
                            return selectors.some(selector => document.querySelector(selector) !== null)
                        }

                        // Check if any loading skeletons are still present
                        const areSkeletonsGone = () => {
                            if (config.skipSkeletonChecks) return true
                            const baseSelectors = '[class*="skeleton"], [class*="loading"], .animate-pulse'
                            const ignoreSelectors = config.ignoreSelectors?.join(', ') || ''
                            const finalSelector = ignoreSelectors 
                                ? `${baseSelectors}:not(${ignoreSelectors})`
                                : baseSelectors
                            const skeletons = document.querySelectorAll(finalSelector)
                            return skeletons.length === 0
                        }

                        // Check if page has any error states
                        const hasNoErrors = () => {
                            const errorElements = document.querySelectorAll('[class*="error"], .error-boundary')
                            return errorElements.length === 0
                        }

                        // Run custom readiness check if provided
                        const customCheckPassed = async () => {
                            if (!config.customReadinessCheck) return true
                            try {
                                const result = config.customReadinessCheck()
                                return await Promise.resolve(result)
                            } catch {
                                return true // Don't block on custom check errors
                            }
                        }

                        const checkAllConditions = async () => {
                            try {
                                // Wait for fonts to load
                                await areFontsLoaded()
                                
                                // Run all checks including custom ones
                                const [customPassed] = await Promise.all([
                                    customCheckPassed()
                                ])
                                
                                const allChecks = 
                                    isDocumentReady &&
                                    areImagesLoaded() &&
                                    isMainContentReady() &&
                                    areSkeletonsGone() &&
                                    hasNoErrors() &&
                                    customPassed &&
                                    elapsedTime >= minimumLoadingTime

                                if (allChecks) {
                                    // Additional delay to ensure React hydration is complete
                                    setTimeout(() => {
                                        setIsLoading(false)
                                        setLoadingStartTime(null)
                                        setCurrentPath(newPath)
                                    }, 150)
                                } else {
                                    // Check again after a short delay, but respect max loading time
                                    const maxTime = config.maxLoadingTime || 5000
                                    if (elapsedTime < maxTime) {
                                        setTimeout(() => {
                                            checkAllConditions()
                                        }, 100)
                                    } else {
                                        // Force clear loading after max time
                                        console.warn(`Navigation loading timeout reached for ${newPath} - clearing loading state`)
                                        setIsLoading(false)
                                        setLoadingStartTime(null)
                                        setCurrentPath(newPath)
                                    }
                                }
                            } catch {
                                // Fallback to minimum time if any checks fail
                                const remainingTime = Math.max(
                                    minimumLoadingTime - elapsedTime,
                                    200
                                )
                                setTimeout(() => {
                                    setIsLoading(false)
                                    setLoadingStartTime(null)
                                    setCurrentPath(newPath)
                                }, remainingTime)
                            }
                        }

                        checkAllConditions()
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
