'use client'

import { Spinner } from '@/components/ui'
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext'
import classNames from '@/utils/classNames'

interface NavigationLoadingIndicatorProps {
    className?: string
    size?: number
}

const NavigationLoadingIndicator = ({
    className,
    size = 16
}: NavigationLoadingIndicatorProps) => {
    const { isLoading } = useNavigationLoading()

    if (!isLoading) return null

    return (
        <Spinner
            size={size}
            className={classNames(
                'text-primary animate-spin',
                className
            )}
            isSpining={true}
        />
    )
}

export default NavigationLoadingIndicator
