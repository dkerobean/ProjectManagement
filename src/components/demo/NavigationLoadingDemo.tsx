'use client'

import { Button } from '@/components/ui'
import { useNavigateWithLoading } from '@/hooks/useNavigateWithLoading'
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext'

const NavigationLoadingDemo = () => {
    const { navigate } = useNavigateWithLoading()
    const { setIsLoading, isLoading } = useNavigationLoading()

    const testNavigation = () => {
        // Navigate to different pages to test loading
        navigate('/app/dashboards/project')
    }

    const testManualLoading = () => {
        setIsLoading(true)
        // Simulate some async operation
        setTimeout(() => {
            setIsLoading(false)
        }, 2000)
    }

    return (
        <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-4">Navigation Loading Test</h3>
            <div className="flex gap-4 flex-wrap">
                <Button 
                    onClick={testNavigation}
                    disabled={isLoading}
                >
                    Test Navigation Loading
                </Button>
                <Button 
                    onClick={testManualLoading}
                    variant="plain"
                    disabled={isLoading}
                >
                    Test Manual Loading (2s)
                </Button>
                <Button 
                    onClick={() => navigate('/app/calendar')}
                    variant="plain"
                    disabled={isLoading}
                >
                    Go to Calendar
                </Button>
                <Button 
                    onClick={() => navigate('/app/projects')}
                    variant="plain"
                    disabled={isLoading}
                >
                    Go to Projects
                </Button>
            </div>
            {isLoading && (
                <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                    Loading is active...
                </p>
            )}
        </div>
    )
}

export default NavigationLoadingDemo
