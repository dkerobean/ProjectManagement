import classNames from '@/utils/classNames'
import Link from '@/components/ui/DebugLink'
import type { CommonProps } from '@/@types/common'
import type { ComponentPropsWithoutRef } from 'react'

interface ActionLink extends CommonProps, ComponentPropsWithoutRef<'a'> {
    themeColor?: boolean
    href?: string
    reloadDocument?: boolean
}

const ActionLink = (props: ActionLink) => {    const {
        children,
        className,
        themeColor = true,
        href = '',
        ...rest
    } = props

    const classNameProps = {
        className: classNames(
            themeColor && 'text-primary',
            'hover:underline',
            className,
        ),
    }

    // Only render Link if href is valid
    if (!href || href === '' || href === 'undefined') {
        return (
            <span {...classNameProps}>
                {children}
            </span>
        )
    }

    return (
        <Link href={href} {...classNameProps} {...rest}>
            {children}
        </Link>
    )
}

export default ActionLink
