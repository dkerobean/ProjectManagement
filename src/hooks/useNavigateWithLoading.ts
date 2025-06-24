'use client'

import { useRouter } from 'next/navigation'
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext'
import { useCallback } from 'react'

interface NavigateOptions {
    showLoading?: boolean
    loadingDelay?: number
    maxLoadingTime?: number
}

export const useNavigateWithLoading = () => {
    const router = useRouter()
    const { setIsLoading } = useNavigationLoading()

    const navigate = useCallback((
        path: string,
        options: NavigateOptions = { showLoading: true, loadingDelay: 0, maxLoadingTime: 5000 }
    ) => {
        // Guard against undefined or empty paths
        if (!path || path === '' || path === 'undefined') {
            console.error('❌ Navigation attempted with invalid path:', path)
            return
        }

        if (options.showLoading) {
            // Show loading immediately for better responsiveness
            setIsLoading(true)
        }

        // Perform the navigation - loading will be cleared by NavigationLoadingContext when page is ready
        router.push(path)
    }, [router, setIsLoading])

    const replace = useCallback((
        path: string,
        options: NavigateOptions = { showLoading: true, loadingDelay: 0, maxLoadingTime: 5000 }
    ) => {
        // Guard against undefined or empty paths
        if (!path || path === '' || path === 'undefined') {
            console.error('❌ Navigation replace attempted with invalid path:', path)
            return
        }

        if (options.showLoading) {
            // Show loading immediately for better responsiveness
            setIsLoading(true)
        }

        // Perform the navigation - loading will be cleared by NavigationLoadingContext when page is ready
        router.replace(path)
    }, [router, setIsLoading])

    const back = useCallback((
        options: NavigateOptions = { showLoading: true, loadingDelay: 0, maxLoadingTime: 5000 }
    ) => {
        if (options.showLoading) {
            // Show loading immediately for better responsiveness
            setIsLoading(true)
        }

        // Perform the navigation - loading will be cleared by NavigationLoadingContext when page is ready
        router.back()
    }, [router, setIsLoading])

    return {
        navigate,
        replace,
        back,
        push: navigate, // Alias for navigate
    }
}
