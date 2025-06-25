import React from 'react'
import PostLoginLayout from '@/components/layouts/PostLoginLayout'
import { NavigationLoadingProvider } from '@/components/shared/NavigationLoading'
import { ReactNode } from 'react'

const Layout = async ({ children }: { children: ReactNode }) => {
    return (
        <NavigationLoadingProvider>
            <PostLoginLayout>{children}</PostLoginLayout>
        </NavigationLoadingProvider>
    )
}

export default Layout
