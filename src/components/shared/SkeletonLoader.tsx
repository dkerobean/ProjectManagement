'use client'

import classNames from '@/utils/classNames'

interface SkeletonLoaderProps {
    /** Width of the skeleton */
    width?: string | number
    /** Height of the skeleton */
    height?: string | number
    /** Border radius variant */
    variant?: 'rectangular' | 'rounded' | 'circular'
    /** Animation type */
    animation?: 'pulse' | 'wave' | 'none'
    /** Number of lines for text skeleton */
    lines?: number
    /** Custom className */
    className?: string
}

const SkeletonLoader = ({
    width = '100%',
    height = '1rem',
    variant = 'rounded',
    animation = 'pulse',
    lines = 1,
    className
}: SkeletonLoaderProps) => {
    const baseClasses = 'bg-gray-200 dark:bg-gray-700'
    
    const variantClasses = {
        rectangular: '',
        rounded: 'rounded-md',
        circular: 'rounded-full'
    }
    
    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-pulse', // Could be enhanced with custom wave animation
        none: ''
    }
    
    const skeletonStyle = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    }
    
    const skeletonClasses = classNames(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
    )
    
    if (lines === 1) {
        return (
            <div
                className={skeletonClasses}
                style={skeletonStyle}
            />
        )
    }
    
    // Multi-line skeleton for text content
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, index) => (
                <div
                    key={index}
                    className={skeletonClasses}
                    style={{
                        ...skeletonStyle,
                        width: index === lines - 1 ? '75%' : skeletonStyle.width, // Last line shorter
                    }}
                />
            ))}
        </div>
    )
}

// Predefined skeleton components for common use cases
export const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
    <SkeletonLoader lines={lines} height="0.875rem" className={className} />
)

export const SkeletonTitle = ({ className }: { className?: string }) => (
    <SkeletonLoader width="60%" height="1.5rem" className={className} />
)

export const SkeletonButton = ({ className }: { className?: string }) => (
    <SkeletonLoader width="120px" height="2.5rem" variant="rounded" className={className} />
)

export const SkeletonAvatar = ({ size = 40, className }: { size?: number; className?: string }) => (
    <SkeletonLoader 
        width={size} 
        height={size} 
        variant="circular" 
        className={className} 
    />
)

export const SkeletonCard = ({ className }: { className?: string }) => (
    <div className={classNames('p-4 space-y-3', className)}>
        <SkeletonTitle />
        <SkeletonText lines={2} />
        <div className="flex gap-2 pt-2">
            <SkeletonButton />
            <SkeletonButton />
        </div>
    </div>
)

export const SkeletonTable = ({ 
    rows = 5, 
    columns = 4, 
    className 
}: { 
    rows?: number; 
    columns?: number; 
    className?: string 
}) => (
    <div className={classNames('space-y-2', className)}>
        {/* Table header */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
                <SkeletonLoader key={`header-${index}`} height="1rem" />
            ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div 
                key={`row-${rowIndex}`} 
                className="grid gap-4" 
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <SkeletonLoader key={`cell-${rowIndex}-${colIndex}`} height="1rem" />
                ))}
            </div>
        ))}
    </div>
)

export default SkeletonLoader