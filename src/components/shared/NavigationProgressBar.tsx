'use client'

import { useEffect, useState } from 'react'
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext'
import classNames from '@/utils/classNames'

interface NavigationProgressBarProps {
    className?: string
    height?: number
    color?: string
}

const NavigationProgressBar = ({ 
    className,
    height = 3,
    color = 'bg-primary'
}: NavigationProgressBarProps) => {
    const { isLoading } = useNavigationLoading()
    const [progress, setProgress] = useState(0)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        let interval: NodeJS.Timeout

        if (isLoading) {
            setIsVisible(true)
            setProgress(0)
            
            // Simulate progress
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev
                    return prev + Math.random() * 10
                })
            }, 200)
        } else {
            // Complete the progress bar
            setProgress(100)
            setTimeout(() => {
                setIsVisible(false)
                setProgress(0)
            }, 300)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isLoading])

    if (!isVisible) return null

    return (
        <div 
            className={classNames(
                'fixed top-0 left-0 right-0 z-50',
                'transition-opacity duration-300',
                isVisible ? 'opacity-100' : 'opacity-0',
                className
            )}
            style={{ height }}
        >
            <div 
                className={classNames(
                    'h-full transition-all duration-300 ease-out',
                    color
                )}
                style={{ 
                    width: `${progress}%`,
                    boxShadow: progress > 0 ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
                }}
            />
        </div>
    )
}

export default NavigationProgressBar
