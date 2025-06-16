'use client'
import { useState, useEffect, useCallback } from 'react'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Link from 'next/link'
import signOut from '@/server/actions/auth/handleSignOut'
import useCurrentSession from '@/utils/hooks/useCurrentSession'
import {
    PiUserDuotone,
    PiGearDuotone,
    PiPulseDuotone,
    PiSignOutDuotone,
} from 'react-icons/pi'

import type { JSX } from 'react'

type DropdownList = {
    label: string
    path: string
    icon: JSX.Element
}

// Extended user type to include avatar_url
interface ExtendedUser {
    name?: string | null
    email?: string | null
    image?: string | null
    avatar_url?: string | null
}

interface UserProfile {
    avatar_url?: string | null
    name?: string | null
    email?: string | null
}

const dropdownItemList: DropdownList[] = [
    {
        label: 'Profile',
        path: '/concepts/account/settings',
        icon: <PiUserDuotone />,
    },
    {
        label: 'Account Setting',
        path: '/concepts/account/settings',
        icon: <PiGearDuotone />,
    },
    {
        label: 'Activity Log',
        path: '/concepts/account/activity-log',
        icon: <PiPulseDuotone />,
    },
]

const _UserDropdown = () => {
    const { session } = useCurrentSession()
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [avatarKey, setAvatarKey] = useState(0) // Force re-render of avatar

    const userId = (session?.user as ExtendedUser & { id?: string })?.id    // Fetch fresh user profile data
    const fetchUserProfile = useCallback(async () => {
        if (userId) {
            try {
                console.log('🔄 Fetching fresh user profile for userId:', userId)
                const response = await fetch('/api/user/profile')
                console.log('📡 Profile fetch response status:', response.status)

                if (response.ok) {
                    const data = await response.json()
                    console.log('✅ Fresh profile data received:', data.data)
                    setUserProfile(data.data)
                    setAvatarKey(prev => prev + 1) // Force avatar refresh
                    console.log('🖼️ Avatar key updated, forcing re-render')
                } else {
                    console.error('❌ Profile fetch failed:', await response.text())
                }
            } catch (error) {
                console.error('❌ Profile fetch error:', error)
            }
        } else {
            console.log('⚠️ No userId available for profile fetch')
        }
    }, [userId])

    // Fetch profile on mount and when session changes
    useEffect(() => {
        fetchUserProfile()
    }, [fetchUserProfile])    // Listen for profile updates (could be triggered by settings page)
    useEffect(() => {
        const handleProfileUpdate = () => {
            console.log('🔔 Profile update event received, refreshing avatar...')
            fetchUserProfile()
        }

        // Listen for custom event from settings page
        console.log('👂 Setting up profile update event listener')
        window.addEventListener('profileUpdated', handleProfileUpdate)

        return () => {
            console.log('🧹 Cleaning up profile update event listener')
            window.removeEventListener('profileUpdated', handleProfileUpdate)
        }
    }, [fetchUserProfile])

    const handleSignOut = async () => {
        await signOut()
    }    // Use fresh profile data if available, otherwise fallback to session
    const currentUser = userProfile || session?.user as ExtendedUser
    const baseAvatarUrl = currentUser?.avatar_url || (session?.user as ExtendedUser)?.image

    // Add cache-busting timestamp to avatar URL to ensure fresh image loads
    const avatarUrl = baseAvatarUrl ? `${baseAvatarUrl}?t=${avatarKey}` : null

    console.log('🖼️ Avatar URL generation:', {
        userProfile: !!userProfile,
        sessionUser: !!(session?.user),
        baseAvatarUrl,
        avatarKey,
        finalAvatarUrl: avatarUrl
    })

    const avatarProps = {
        key: avatarKey, // Force re-render when avatar changes
        ...(avatarUrl
            ? { src: avatarUrl }
            : { icon: <PiUserDuotone /> }),
    }

    return (
        <Dropdown
            className="flex"
            toggleClassName="flex items-center"
            renderTitle={
                <div className="cursor-pointer flex items-center">
                    <Avatar size={32} {...avatarProps} />
                </div>
            }
            placement="bottom-end"
        >            <Dropdown.Item variant="header">
                <div className="py-2 px-3 flex items-center gap-3">
                    <Avatar {...avatarProps} />
                    <div>                        <div className="font-bold text-gray-900 dark:text-gray-100">
                            {currentUser?.name || 'Anonymous'}
                        </div>
                        <div className="text-xs">
                            {currentUser?.email || 'No email available'}
                        </div>
                    </div>
                </div>
            </Dropdown.Item>
            <Dropdown.Item variant="divider" />
            {dropdownItemList.map((item) => (
                <Dropdown.Item
                    key={item.label}
                    eventKey={item.label}
                    className="px-0"
                >
                    <Link className="flex h-full w-full px-2" href={item.path}>
                        <span className="flex gap-2 items-center w-full">
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </span>
                    </Link>
                </Dropdown.Item>
            ))}
            <Dropdown.Item variant="divider" />
            <Dropdown.Item
                eventKey="Sign Out"
                className="gap-2"
                onClick={handleSignOut}
            >
                <span className="text-xl">
                    <PiSignOutDuotone />
                </span>
                <span>Sign Out</span>
            </Dropdown.Item>
        </Dropdown>
    )
}

const UserDropdown = withHeaderItem(_UserDropdown)

export default UserDropdown
