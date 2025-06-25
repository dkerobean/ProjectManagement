'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'

// Create context for navigation loading state
const NavigationLoadingContext = createContext<{
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
}>({
    isLoading: false,
    setLoading: () => {}
})

export const useNavigationLoading = () => useContext(NavigationLoadingContext)

interface NavigationLoadingProviderProps {
    children: React.ReactNode
}

export const NavigationLoadingProvider = ({ children }: NavigationLoadingProviderProps) => {
    const [isLoading, setIsLoading] = useState(false)
    const pathname = usePathname()

    // Auto-clear loading when pathname changes
    useEffect(() => {
        if (isLoading) {
            // Add a small delay to ensure the page is fully rendered
            const timer = setTimeout(() => {
                setIsLoading(false)
                console.log('✅ Navigation loading cleared for:', pathname)
            }, 100)

            return () => clearTimeout(timer)
        }
    }, [pathname, isLoading])

    const setLoading = (loading: boolean) => {
        console.log(loading ? '🔄 Navigation loading started' : '✅ Navigation loading ended')
        setIsLoading(loading)
    }

    return (
        <NavigationLoadingContext.Provider value={{ isLoading, setLoading }}>
            {isLoading && (
                <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg text-center">
                        <Spinner size="40px" />
                        <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
                            Loading page...
                        </p>
                    </div>
                </div>
            )}
            {children}
        </NavigationLoadingContext.Provider>
    )
}
