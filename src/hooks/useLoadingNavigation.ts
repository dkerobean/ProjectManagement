'use client'

import { useRouter } from 'next/navigation'
import { useNavigationLoading } from '@/components/shared/NavigationLoading'

export const useLoadingNavigation = () => {
    const router = useRouter()
    const { setLoading } = useNavigationLoading()

    const push = (href: string) => {
        setLoading(true)
        router.push(href)
    }

    const replace = (href: string) => {
        setLoading(true)
        router.replace(href)
    }

    const back = () => {
        setLoading(true)
        router.back()
    }

    const forward = () => {
        setLoading(true)
        router.forward()
    }

    const refresh = () => {
        setLoading(true)
        router.refresh()
    }

    return {
        push,
        replace,
        back,
        forward,
        refresh,
        // Original router methods without loading (for edge cases)
        router: {
            push: router.push,
            replace: router.replace,
            back: router.back,
            forward: router.forward,
            refresh: router.refresh,
        }
    }
}

export default useLoadingNavigation
