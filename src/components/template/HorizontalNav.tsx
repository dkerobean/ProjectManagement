'use client'

import HorizontalMenuContent from './HorizontalMenuContent'
import { useSession } from 'next-auth/react'
import useNavigation from '@/utils/hooks/useNavigation'
import queryRoute from '@/utils/queryRoute'
import appConfig from '@/configs/app.config'
import { usePathname } from 'next/navigation'

const HorizontalNav = ({
    translationSetup = appConfig.activeNavTranslation,
}: {
    translationSetup?: boolean
}) => {
    const pathname = usePathname()

    const route = queryRoute(pathname)

    const currentRouteKey = route?.key || ''

    const { data: session } = useSession()

    const { navigationTree } = useNavigation()

    return (
        <HorizontalMenuContent
            navigationTree={navigationTree}
            routeKey={currentRouteKey}
            userAuthority={session?.user?.authority || []}
            translationSetup={translationSetup}
        />
    )
}

export default HorizontalNav
