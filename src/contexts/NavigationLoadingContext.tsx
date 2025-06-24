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
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Auto-clear loading state when route changes
    useEffect(() => {
        setIsLoading(false)
    }, [pathname, searchParams])

    return (
        <NavigationLoadingContext.Provider value={{ isLoading, setIsLoading }}>
            {children}
        </NavigationLoadingContext.Provider>
    )
}
