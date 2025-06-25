import Logo from '@/components/template/Logo'
import useTheme from '@/utils/hooks/useTheme'
import appConfig from '@/configs/app.config'
import Link from '@/components/ui/DebugLink'
import type { Mode } from '@/@types/theme'

const HeaderLogo = ({ mode }: { mode?: Mode }) => {
    const defaultMode = useTheme((state) => state.mode)

    return (
        <Link href={appConfig.authenticatedEntryPath || '/dashboards/project'}>
            <Logo
                imgClass="max-h-10"
                mode={mode || defaultMode}
                className="hidden lg:block"
            />
        </Link>
    )
}

export default HeaderLogo
