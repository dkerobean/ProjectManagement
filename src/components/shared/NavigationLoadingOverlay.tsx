'use client'

import { Spinner } from '@/components/ui'
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext'
import classNames from '@/utils/classNames'

interface NavigationLoadingOverlayProps {
    className?: string
}

const NavigationLoadingOverlay = ({ className }: NavigationLoadingOverlayProps) => {
    const { isLoading } = useNavigationLoading()

    if (!isLoading) return null

    return (
        <div
            className={classNames(
                'fixed inset-0 z-50 flex items-center justify-center',
                'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md',
                'transition-all duration-200 ease-in-out',
                className
            )}
        >
            <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/90 dark:bg-gray-800/90 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                <div className="relative">
                    <Spinner
                        size={40}
                        className="text-primary"
                        isSpining={true}
                    />
                    {/* Pulse ring effect */}
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Loading page...
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Please wait while we prepare everything
                    </p>
                </div>
                {/* Progress indicator dots */}
                <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="w-2 h-2 bg-primary/40 rounded-full animate-pulse"
                            style={{
                                animationDelay: `${i * 0.2}s`,
                                animationDuration: '1.4s'
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default NavigationLoadingOverlay
