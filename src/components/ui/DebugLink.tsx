'use client'

import NextLink from 'next/link'
import { ComponentProps, forwardRef } from 'react'

type LinkProps = ComponentProps<typeof NextLink>

const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ href, ...props }, ref) => {
    // Debug logging for undefined href
    if (href === undefined || href === null) {
        console.error('🚨 Link component received undefined/null href!', {
            href,
            props,
            stack: new Error().stack
        })
        
        // Return a span instead of crashing
        return <span ref={ref} {...props} style={{ color: 'red', textDecoration: 'underline' }} />
    }
    
    return <NextLink ref={ref} href={href} {...props} />
})

Link.displayName = 'DebugLink'

export default Link
