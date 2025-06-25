'use client'

import Link from 'next/link'
import { useNavigationLoading } from './NavigationLoading'
import type { ComponentProps } from 'react'

interface LoadingLinkProps extends ComponentProps<typeof Link> {
    showLoading?: boolean
}

const LoadingLink = ({
    showLoading = true,
    onClick,
    href,
    children,
    ...props
}: LoadingLinkProps) => {
    const { setLoading } = useNavigationLoading()

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (showLoading && href) {
            setLoading(true)
        }

        // Call original onClick if provided
        onClick?.(e)
    }

    return (
        <Link
            href={href}
            onClick={handleClick}
            {...props}
        >
            {children}
        </Link>
    )
}

export default LoadingLink
