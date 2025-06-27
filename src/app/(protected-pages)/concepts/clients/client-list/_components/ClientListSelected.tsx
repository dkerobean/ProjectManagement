'use client'

import { useState } from 'react'
import StickyFooter from '@/components/shared/StickyFooter'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar'
import Tooltip from '@/components/ui/Tooltip'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import RichTextEditor from '@/components/shared/RichTextEditor'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useClientListStore } from '../_store/clientListStore'
import { TbChecks } from 'react-icons/tb'

// Helper function to get default image for clients
const getDefaultClientImage = () => {
    // Use default image from Supabase storage
    return 'https://gafpwitcdoiviixlxnuz.supabase.co/storage/v1/object/public/client-images/default-client-avatar.png'
}

const ClientListSelected = () => {
    const clientList = useClientListStore((state) => state.clientList)
    const setClientList = useClientListStore(
        (state) => state.setClientList,
    )
    const selectedClient = useClientListStore(
        (state) => state.selectedClient,
    )
    const setSelectAllClient = useClientListStore(
        (state) => state.setSelectAllClient,
    )

    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false)
    const [sendMessageLoading, setSendMessageLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const handleDelete = () => {
        setDeleteConfirmationOpen(true)
    }

    const handleCancel = () => {
        setDeleteConfirmationOpen(false)
    }

    const handleConfirmDelete = async () => {
        setDeleteLoading(true)

        try {
            // Delete each selected client from the database
            const deletePromises = selectedClient.map(async (client) => {
                const response = await fetch(`/api/clients/${client.id}`, {
                    method: 'DELETE',
                })

                if (!response.ok) {
                    throw new Error(`Failed to delete client ${client.name}`)
                }

                return response.json()
            })

            await Promise.all(deletePromises)

            // Update local state after successful database deletion
            const newClientList = clientList.filter((client) => {
                return !selectedClient.some(
                    (selected) => selected.id === client.id,
                )
            })

            setSelectAllClient([])
            setClientList(newClientList)
            setDeleteConfirmationOpen(false)

            // Show success notification
            toast.push(
                <Notification type="success">
                    {selectedClient.length > 1
                        ? `${selectedClient.length} clients deleted successfully!`
                        : 'Client deleted successfully!'
                    }
                </Notification>,
                { placement: 'top-center' }
            )

        } catch (error) {
            console.error('Error deleting clients:', error)
            toast.push(
                <Notification type="danger">
                    Failed to delete clients. Please try again.
                </Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleSend = () => {
        setSendMessageLoading(true)
        setTimeout(() => {
            toast.push(
                <Notification type="success">Message sent!</Notification>,
                { placement: 'top-center' },
            )
            setSendMessageLoading(false)
            setSendMessageDialogOpen(false)
            setSelectAllClient([])
        }, 500)
    }

    return (
        <>
            {selectedClient.length > 0 && (
                <StickyFooter
                    className=" flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                    stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
                    defaultClass="container mx-auto px-8 rounded-xl border border-gray-200 dark:border-gray-600 mt-4"
                >
                    <div className="container mx-auto">
                        <div className="flex items-center justify-between">
                            <span>
                                {selectedClient.length > 0 && (
                                    <span className="flex items-center gap-2">
                                        <span className="text-lg text-primary">
                                            <TbChecks />
                                        </span>
                                        <span className="font-semibold flex items-center gap-1">
                                            <span className="heading-text">
                                                {selectedClient.length}{' '}
                                                Clients
                                            </span>
                                            <span>selected</span>
                                        </span>
                                    </span>
                                )}
                            </span>

                            <div className="flex items-center">
                                <Button
                                    size="sm"
                                    className="ltr:mr-3 rtl:ml-3"
                                    type="button"
                                    loading={deleteLoading}
                                    customColorClass={() =>
                                        'border-error ring-1 ring-error text-error hover:border-error hover:ring-error hover:text-error'
                                    }
                                    onClick={handleDelete}
                                >
                                    Delete
                                </Button>
                                <Button
                                    size="sm"
                                    variant="solid"
                                    onClick={() =>
                                        setSendMessageDialogOpen(true)
                                    }
                                >
                                    Message
                                </Button>
                            </div>
                        </div>
                    </div>
                </StickyFooter>
            )}
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title="Remove clients"
                onClose={handleCancel}
                onRequestClose={handleCancel}
                onCancel={handleCancel}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    {' '}
                    Are you sure you want to remove these clients? This action
                    can&apos;t be undo.{' '}
                </p>
            </ConfirmDialog>
            <Dialog
                isOpen={sendMessageDialogOpen}
                onRequestClose={() => setSendMessageDialogOpen(false)}
                onClose={() => setSendMessageDialogOpen(false)}
            >
                <h5 className="mb-2">Send Message</h5>
                <p>Send message to the following clients</p>
                <Avatar.Group
                    chained
                    omittedAvatarTooltip
                    className="mt-4"
                    maxCount={4}
                    omittedAvatarProps={{ size: 30 }}
                >
                    {selectedClient.map((client) => (
                        <Tooltip key={client.id} title={client.name}>
                            <Avatar size={30} src={client.image_url || getDefaultClientImage()} alt="" />
                        </Tooltip>
                    ))}
                </Avatar.Group>
                <div className="my-4">
                    <RichTextEditor content={''} />
                </div>
                <div className="ltr:justify-end flex items-center gap-2">
                    <Button
                        type="button"
                        onClick={() => setSendMessageDialogOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        loading={sendMessageLoading}
                        variant="solid"
                        onClick={handleSend}
                    >
                        Send
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

export default ClientListSelected
