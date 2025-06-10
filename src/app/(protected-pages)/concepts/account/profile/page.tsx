'use client'

import { useState } from 'react'
import Container from '@/components/shared/Container'
import UserProfileManagement from '@/components/auth/UserProfileManagement'
import { useRolePermissions } from '@/components/auth/RoleGuard'

const UserProfilePage = () => {
    const [message, setMessage] = useState('')
    const { isAdmin } = useRolePermissions()

    return (
        <Container>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        User Profile
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your personal information and preferences.
                    </p>
                </div>

                {message && (
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-blue-800 dark:text-blue-200">{message}</p>
                    </div>
                )}

                <UserProfileManagement
                    setMessage={setMessage}
                    showRoleSelection={isAdmin}
                    allowRoleChange={isAdmin}
                />
            </div>
        </Container>
    )
}

export default UserProfilePage
