'use client'

import classNames from '@/utils/classNames'
import useResponsive from '@/utils/hooks/useResponsive'
import {
    TbFileInfo,
    TbChecklist,
    TbSettings,
    TbCalendarStats,
    TbPaperclip,
} from 'react-icons/tb'

type ProjectDetailsNavigationProps = {
    selected: string
    onChange: (value: string) => void
}

const navigation = [
    { label: 'Overview', value: 'overview', icon: <TbFileInfo /> },
    { label: 'Tasks', value: 'tasks', icon: <TbChecklist /> },
    { label: 'Attachments', value: 'attachments', icon: <TbPaperclip /> },
    { label: 'Activities', value: 'activity', icon: <TbCalendarStats /> },
    { label: 'Settings', value: 'settings', icon: <TbSettings /> },
]

const ProjectDetailsNavigation = ({
    selected,
    onChange,
}: ProjectDetailsNavigationProps) => {
    const { smaller } = useResponsive()
    
    const handleClick = (value: string) => {
        onChange(value)
    }

    // Mobile horizontal scrolling navigation
    if (smaller.xl) {
        return (
            <div className="w-full mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {navigation.map((nav) => (
                        <button
                            key={nav.value}
                            className={classNames(
                                'flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-transparent font-semibold transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px]',
                                'text-sm sm:text-base',
                                'dark:hover:text-gray-100 text-gray-900 dark:text-white',
                                selected === nav.value
                                    ? 'border-primary bg-primary/10'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                            )}
                            onClick={() => handleClick(nav.value)}
                        >
                            <span className="text-lg sm:text-xl">{nav.icon}</span>
                            <span className="hidden sm:inline">{nav.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // Desktop vertical navigation
    return (
        <div className="w-[250px] flex-shrink-0">
            <div className="flex flex-col gap-2">
                {navigation.map((nav) => (
                    <div key={nav.value}>
                        <button
                            className={classNames(
                                'flex items-center gap-2 w-full px-3.5 py-2.5 rounded-full border-2 border-transparent font-semibold transition-colors dark:hover:text-gray-100 text-gray-900 dark:text-white min-h-[44px]',
                                selected === nav.value
                                    ? 'border-primary bg-primary/10'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                            )}
                            onClick={() => handleClick(nav.value)}
                        >
                            <span className="text-xl">{nav.icon}</span>
                            <span>{nav.label}</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ProjectDetailsNavigation
