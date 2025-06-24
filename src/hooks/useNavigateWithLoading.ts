'use client'

import { useRouter } from 'next/navigation'
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext'
import { useCallback } from 'react'

interface NavigateOptions {
    showLoading?: boolean
    loadingDelay?: number
}

export const useNavigateWithLoading = () => {
    const router = useRouter()
    const { setIsLoading } = useNavigationLoading()

    const navigate = useCallback((
        path: string, 
        options: NavigateOptions = { showLoading: true, loadingDelay: 100 }
    ) => {
        if (options.showLoading) {
            // Small delay to prevent flash for very fast navigations
            setTimeout(() => {
                setIsLoading(true)
            }, options.loadingDelay || 100)
        }
        
        router.push(path)
    }, [router, setIsLoading])

    const replace = useCallback((
        path: string, 
        options: NavigateOptions = { showLoading: true, loadingDelay: 100 }
    ) => {
        if (options.showLoading) {
            setTimeout(() => {
                setIsLoading(true)
            }, options.loadingDelay || 100)
        }
        
        router.replace(path)
    }, [router, setIsLoading])

    const back = useCallback((
        options: NavigateOptions = { showLoading: true, loadingDelay: 100 }
    ) => {
        if (options.showLoading) {
            setTimeout(() => {
                setIsLoading(true)
            }, options.loadingDelay || 100)
        }
        
        router.back()
    }, [router, setIsLoading])

    return {
        navigate,
        replace,
        back,
        push: navigate, // Alias for navigate
    }
}
