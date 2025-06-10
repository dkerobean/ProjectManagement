'use client'

import { useSession } from 'next-auth/react'
import Container from '@/components/shared/Container'
import { RoleGuard } from '@/components/auth/RoleGuard'
import Button from '@/components/ui/Button'

const AdminTestPage = () => {
    const { data: session } = useSession()

    return (
        <RoleGuard requiredRole="admin">
            <Container>
                <div className="max-w-4xl mx-auto py-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <h1 className="text-2xl font-bold mb-4">Admin Only Page</h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            This page can only be accessed by users with admin role.
                        </p>

                        {session?.user && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <h3 className="font-semibold mb-2">Current User Info:</h3>
                                <p><strong>Name:</strong> {session.user.name}</p>
                                <p><strong>Email:</strong> {session.user.email}</p>
                                <p><strong>Role:</strong> {session.user.role}</p>
                                <p><strong>User ID:</strong> {session.user.id}</p>
                            </div>
                        )}

                        <div className="mt-6">
                            <h3 className="font-semibold mb-2">Admin Functions:</h3>
                            <div className="space-y-2">
                                <Button variant="solid" className="mr-2">
                                    Manage Users
                                </Button>
                                <Button variant="solid" className="mr-2">
                                    System Settings
                                </Button>
                                <Button variant="solid">
                                    View Audit Logs
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </RoleGuard>
    )
}

export default AdminTestPage
