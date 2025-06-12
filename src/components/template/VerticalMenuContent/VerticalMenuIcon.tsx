import navigationIcon from '@/configs/navigation-icon.config'
import { TbCircle } from 'react-icons/tb'
import type { ElementType, ComponentPropsWithRef } from 'react'

type VerticalMenuIconProps = {
    icon: string
    gutter?: string
}

export const Icon = <T extends ElementType>({
    component,
    ...props
}: {
    header: T
} & ComponentPropsWithRef<T>) => {
    const Component = component
    return <Component {...props} />
}

const VerticalMenuIcon = ({ icon }: VerticalMenuIconProps) => {
    if (typeof icon !== 'string' && !icon) {
        return <></>
    }

    return (
        <>
            {icon && (
                <span className={`text-2xl`}>
                    {navigationIcon[icon] || <TbCircle />}
                </span>
            )}
        </>
    )
}

export default VerticalMenuIcon
