'use client'
import { useState, useEffect, useCallback } from 'react'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Link from 'next/link'
import useCurrentSession from '@/utils/hooks/useCurrentSession'
import useUserProfile from '@/hooks/useUserProfile'
import { getUserDisplayName, getUserAvatarUrl } from '@/utils/userProfile'
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

interface UserDropdownProps {
    signOutAction: () => Promise<void>
}

const _UserDropdown = ({ signOutAction }: UserDropdownProps) => {
    const { session } = useCurrentSession()
    const { user, profile, isLoading, refreshProfile, hasProfile } = useUserProfile()
    const [avatarKey, setAvatarKey] = useState(0) // Force re-render of avatar

    // Refresh profile data when needed
    const handleRefreshProfile = useCallback(async () => {
        console.log('🔄 Refreshing user profile data...')
        await refreshProfile()
        setAvatarKey(prev => prev + 1) // Force avatar refresh
        console.log('✅ Profile refresh completed')
    }, [refreshProfile])

    // Listen for profile updates (could be triggered by settings page)
    useEffect(() => {
        const handleProfileUpdate = () => {
            console.log('🔔 Profile update event received, refreshing...')
            handleRefreshProfile()
        }        // Listen for custom event from settings page
        console.log('👂 Setting up profile update event listener')
        window.addEventListener('profileUpdated', handleProfileUpdate)

        return () => {
            console.log('🧹 Cleaning up profile update event listener')
            window.removeEventListener('profileUpdated', handleProfileUpdate)
        }
    }, [handleRefreshProfile])

    const handleSignOut = async () => {
        await signOutAction()
    }

    // Use enhanced user data from session (includes cached profile)
    const currentUser = user || session?.user as ExtendedUser
    const displayName = getUserDisplayName(currentUser)
    const sessionUser = session?.user as ExtendedUser & { image?: string }
    const baseAvatarUrl = getUserAvatarUrl(currentUser) || sessionUser?.image

    // Add cache-busting timestamp to avatar URL to ensure fresh image loads
    const avatarUrl = baseAvatarUrl ? `${baseAvatarUrl}?t=${avatarKey}` : null

    console.log('🖼️ Avatar URL generation:', {
        hasUserData: !!user,
        hasProfile,
        baseAvatarUrl,
        avatarKey,
        finalAvatarUrl: avatarUrl,
        isLoading,        profileData: profile ? 'available' : 'not available'
    })

    const avatarProps = {
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
                    <Avatar key={avatarKey} size={32} {...avatarProps} />
                </div>
            }
            placement="bottom-end"
        >
            <Dropdown.Item variant="header">
                <div className="py-2 px-3 flex items-center gap-3">
                    <Avatar key={`header-${avatarKey}`} {...avatarProps} />
                    <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                            {displayName}
                        </div>
                        <div className="text-xs">
                            {currentUser?.email || 'No email available'}
                        </div>
                        {hasProfile && profile?.country && (
                            <div className="text-xs text-gray-500">
                                {profile.country}
                            </div>
                        )}
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

// Wrapper component to work with withHeaderItem HOC
const UserDropdownWrapper = () => {
    // This wrapper will receive the signOut action from its parent
    // For now, let's import it here to fix immediate issues
    // This should be refactored to receive it as a prop from the parent layout
    const handleSignOut = async () => {
        const { default: signOutAction } = await import('@/server/actions/auth/handleSignOut')
        await signOutAction()
    }

    return <_UserDropdown signOutAction={handleSignOut} />
}

const UserDropdown = withHeaderItem(UserDropdownWrapper)

export default UserDropdown
