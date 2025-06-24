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
                'bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm',
                'transition-opacity duration-150',
                className
            )}
        >
            <div className="flex flex-col items-center gap-3">
                <Spinner
                    size={32}
                    className="text-primary"
                    isSpining={true}
                />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Loading...
                </p>
            </div>
        </div>
    )
}

export default NavigationLoadingOverlay
