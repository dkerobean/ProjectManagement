import { useMemo, type JSX } from 'react'
import type { CommonProps } from '@/@types/common'
import Simple from './Simple'
import Split from './Split'
import Side from './Side'

type LayoutType = 'simple' | 'split' | 'side'

type Layouts = Record<
    LayoutType,
    <T extends CommonProps>(props: T) => JSX.Element
>

const currentLayoutType: LayoutType = 'side'

const layouts: Layouts = {
    simple: Simple,
    split: Split,
    side: Side,
}

const AuthLayout = ({ children }: CommonProps) => {
    const Layout = useMemo(() => {
        return layouts[currentLayoutType]
    }, [])

    return <Layout>{children}</Layout>
}

export default AuthLayout
