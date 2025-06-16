'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import useTheme from '@/utils/hooks/useTheme'
import { PiSunDuotone, PiMoonDuotone, PiPaletteDuotone } from 'react-icons/pi'
import type { Mode } from '@/@types/theme'

const _ThemeToggle = () => {
    const theme = useTheme((state) => state)
    const { mode, setMode } = theme

    const toggleTheme = () => {
        const newMode: Mode = mode === 'light' ? 'dark' : 'light'
        setMode(newMode)
    }

    const isDark = mode === 'dark'

    return (
        <Dropdown
            className="flex"
            toggleClassName="flex items-center"
            renderTitle={
                <Button
                    variant="plain"
                    size="sm"
                    icon={isDark ? <PiMoonDuotone className="text-lg" /> : <PiSunDuotone className="text-lg" />}
                    className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                />
            }
            placement="bottom-end"
        >
            <Dropdown.Item variant="header">
                <div className="py-2 px-3 flex items-center gap-3">
                    <PiPaletteDuotone className="text-lg" />
                    <span className="font-medium">Theme</span>
                </div>
            </Dropdown.Item>
            <Dropdown.Item variant="divider" />
            <Dropdown.Item
                eventKey="light"
                className={`gap-3 ${mode === 'light' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                onClick={() => setMode('light')}
            >
                <PiSunDuotone className="text-lg text-yellow-500" />
                <span>Light Mode</span>
                {mode === 'light' && (
                    <span className="ml-auto text-blue-500">✓</span>
                )}
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="dark"
                className={`gap-3 ${mode === 'dark' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                onClick={() => setMode('dark')}
            >
                <PiMoonDuotone className="text-lg text-blue-400" />
                <span>Dark Mode</span>
                {mode === 'dark' && (
                    <span className="ml-auto text-blue-500">✓</span>
                )}
            </Dropdown.Item>
        </Dropdown>
    )
}

const ThemeToggle = withHeaderItem(_ThemeToggle)

export default ThemeToggle
