'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { apiGetClient, apiDeleteClient } from '@/services/ClientsService'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { TbPencil, TbTrash, TbMail, TbPhone, TbBuilding, TbMapPin } from 'react-icons/tb'
import type { Client } from '../../../types'

// Helper function to get default image for clients
const getDefaultClientImage = () => {
    // Use default image from Supabase storage
    return 'https://gafpwitcdoiviixlxnuz.supabase.co/storage/v1/object/public/client-images/default-client-avatar.png'
}

type ClientDetailsProps = {
    clientId: string
}

const statusColor: Record<string, string> = {
    active: 'bg-emerald-200 dark:bg-emerald-200 text-gray-900 dark:text-gray-900',
    inactive: 'bg-red-200 dark:bg-red-200 text-gray-900 dark:text-gray-900',
}

const ClientDetails = ({ clientId }: ClientDetailsProps) => {
    const router = useRouter()
    const [client, setClient] = useState<Client | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [, setIsDeleting] = useState(false)

    useEffect(() => {
        const fetchClient = async () => {
            try {
                setIsLoading(true)
                console.log('Fetching client with ID:', clientId)
                type ApiResponse = 
                    | { success: true; data: Client }
                    | { success: false; error: string }
                
                const response = await apiGetClient<ApiResponse, { id: string }>({ id: clientId })
                console.log('API Response:', response)

                // Check if response is valid and has the expected structure
                if (response && typeof response === 'object') {
                    if (response.success && 'data' in response) {
                        console.log('Setting client data:', response.data)
                        setClient(response.data)
                        return
                    } else if (!response.success && 'error' in response) {
                        console.error('API Error:', response.error)
                        toast.push(
                            <Notification type="danger">
                                {response.error}
                            </Notification>,
                            { placement: 'top-center' }
                        )
                        return
                    }
                }
                
                console.error('Unexpected response format:', response)
                toast.push(
                    <Notification type="danger">
                        Received unexpected data format from server
                    </Notification>,
                    { placement: 'top-center' }
                )
            } catch (error: unknown) {
                console.error('Error fetching client:', error)
                // Check if it's an Axios error
                if (error && typeof error === 'object') {
                    const axiosError = error as {
                        response?: { data?: unknown; status?: number; headers?: unknown }
                        request?: unknown
                        message?: string
                    }
                    if (axiosError.response) {
                        console.error('Response data:', axiosError.response.data)
                        console.error('Response status:', axiosError.response.status)
                        console.error('Response headers:', axiosError.response.headers)
                    } else if (axiosError.request) {
                        console.error('No response received:', axiosError.request)
                    } else if (axiosError.message) {
                        console.error('Error:', axiosError.message)
                    }
                }
                
                toast.push(
                    <Notification type="danger">
                        Failed to load client data. Please check the console for details.
                    </Notification>,
                    { placement: 'top-center' }
                )
            } finally {
                setIsLoading(false)
            }
        }

        if (clientId) {
            console.log('Client ID detected, starting fetch...')
            fetchClient()
        } else {
            console.error('No client ID provided')
            setIsLoading(false)
        }
    }, [clientId])

    const handleEdit = () => {
        router.push(`/concepts/clients/client-edit/${clientId}`)
    }

    const handleDelete = () => {
        setDeleteConfirmationOpen(true)
    }

    const handleConfirmDelete = async () => {
        setIsDeleting(true)
        try {
            await apiDeleteClient({ id: clientId })

            toast.push(
                <Notification type="success">
                    Client deleted successfully!
                </Notification>,
                { placement: 'top-center' }
            )

            router.push('/concepts/clients/client-list')
        } catch (error) {
            console.error('Error deleting client:', error)
            toast.push(
                <Notification type="danger">
                    Failed to delete client. Please try again.
                </Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsDeleting(false)
            setDeleteConfirmationOpen(false)
        }
    }

    if (isLoading) {
        return (
            <Container>
                <div className="max-w-4xl mx-auto">
                    <AdaptiveCard>
                        <div className="animate-pulse">
                            <div className="flex items-center mb-6">
                                <div className="w-24 h-24 bg-gray-200 rounded-full mr-6"></div>
                                <div className="flex-1">
                                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                                </div>
                            </div>
                        </div>
                    </AdaptiveCard>
                </div>
            </Container>
        )
    }

    if (!client) {
        return (
            <Container>
                <div className="max-w-4xl mx-auto">
                    <AdaptiveCard>
                        <div className="text-center py-8">
                            <h4 className="text-gray-500">Client not found</h4>
                        </div>
                    </AdaptiveCard>
                </div>
            </Container>
        )
    }

    return (
        <Container>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Card */}
                <AdaptiveCard>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Avatar
                                size={96}
                                src={client.image_url || getDefaultClientImage()}
                                className="mr-6"
                            />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {client.name}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                    {client.company || 'No company specified'}
                                </p>
                                <Tag className={statusColor[client.status]}>
                                    <span className="capitalize">{client.status}</span>
                                </Tag>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                icon={<TbPencil />}
                                onClick={handleEdit}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="solid"
                                customColorClass={() =>
                                    'border-error ring-1 ring-error text-error hover:border-error hover:ring-error hover:text-error bg-transparent'
                                }
                                icon={<TbTrash />}
                                onClick={handleDelete}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </AdaptiveCard>

                {/* Contact Information */}
                <AdaptiveCard>
                    <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center">
                            <TbMail className="text-xl text-gray-400 mr-3" />
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">{client.email}</p>
                            </div>
                        </div>

                        {client.phone && (
                            <div className="flex items-center">
                                <TbPhone className="text-xl text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="font-medium">{client.phone}</p>
                                </div>
                            </div>
                        )}

                        {client.company && (
                            <div className="flex items-center">
                                <TbBuilding className="text-xl text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-500">Company</p>
                                    <p className="font-medium">{client.company}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </AdaptiveCard>

                {/* Address Information */}
                {(client.address || client.city || client.state || client.country) && (
                    <AdaptiveCard>
                        <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                        <div className="flex items-start">
                            <TbMapPin className="text-xl text-gray-400 mr-3 mt-1" />
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Address</p>
                                <div className="space-y-1">
                                    {client.address && <p>{client.address}</p>}
                                    <p>
                                        {[client.city, client.state, client.postal_code]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </p>
                                    {client.country && <p>{client.country}</p>}
                                </div>
                            </div>
                        </div>
                    </AdaptiveCard>
                )}

                {/* Additional Information */}
                <AdaptiveCard>
                    <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-500">Client Since</p>
                            <p className="font-medium">
                                {new Date(client.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Last Updated</p>
                            <p className="font-medium">
                                {new Date(client.updated_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </AdaptiveCard>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title="Delete Client"
                confirmText="Delete"
                cancelText="Cancel"
                onClose={() => setDeleteConfirmationOpen(false)}
                onCancel={() => setDeleteConfirmationOpen(false)}
                onConfirm={handleConfirmDelete}
            >
                <p>Are you sure you want to delete this client? This action cannot be undone.</p>
            </ConfirmDialog>
        </Container>
    )
}

export default ClientDetails
