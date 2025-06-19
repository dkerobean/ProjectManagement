'use client'

import { useEffect } from 'react'
import Table from '@/components/ui/Table'
import TableRowSkeleton from '@/components/shared/loaders/TableRowSkeleton'
import FileManagerHeader from './FileManagerHeader'
import FileSegment from './FileSegment'
import FileList from './FileList'
import FileDetails from './FileDetails'
import FileManagerDeleteDialog from './FileManagerDeleteDialog'
import FileManagerInviteDialog from './FileManagerInviteDialog'
import FileManagerRenameDialog from './FileManagerRenameDialog'
import { useFileManagerStore } from '../_store/useFileManagerStore'
import useSWRMutation from 'swr/mutation'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

const { THead, Th, Tr } = Table

async function getFiles(_: string, { arg }: { arg: { entityType?: string; entityId?: string } }) {
    const params = new URLSearchParams()
    if (arg.entityType) params.append('entity_type', arg.entityType)
    if (arg.entityId) params.append('entity_id', arg.entityId)

    const response = await fetch(`/api/files?${params.toString()}`)
    if (!response.ok) {
        throw new Error('Failed to fetch files')
    }
    return response.json()
}

async function deleteFile(_: string, { arg }: { arg: string }) {
    const response = await fetch(`/api/files/${arg}`, {
        method: 'DELETE',
    })
    if (!response.ok) {
        throw new Error('Failed to delete file')
    }
    return response.json()
}

const FileManager = () => {
    const {
        layout,
        fileList,
        setFileList,
        deleteDialog,
        setDeleteDialog,
        setInviteDialog,
        setRenameDialog,
        setDirectories,
        setSelectedFile,
    } = useFileManagerStore()

    const { trigger: triggerGetFiles, isMutating: isLoadingFiles } = useSWRMutation(
        '/api/files',
        getFiles,
        {
            onSuccess: (resp) => {
                setDirectories(resp.directory || [])
                setFileList(resp.list || [])
            },
            onError: (error) => {
                console.error('Failed to fetch files:', error)
                toast.push(
                    <Notification type="danger" title="Error">
                        Failed to load files. Please try again.
                    </Notification>,
                    { placement: 'top-center' }
                )
            }
        },
    )

    const { trigger: triggerDeleteFile, isMutating: isDeletingFile } = useSWRMutation(
        '/api/files/delete',
        deleteFile,
        {
            onSuccess: (resp) => {
                // Remove deleted file from list
                setFileList(fileList.filter(file => file.id !== deleteDialog.id))
                setDeleteDialog({ id: '', open: false })
                toast.push(
                    <Notification type="success" title="Success">
                        File deleted successfully
                    </Notification>,
                    { placement: 'top-center' }
                )
            },
            onError: (error) => {
                console.error('Failed to delete file:', error)
                toast.push(
                    <Notification type="danger" title="Error">
                        Failed to delete file. Please try again.
                    </Notification>,
                    { placement: 'top-center' }
                )
            }
        },
    )

    useEffect(() => {
        // Load files on component mount
        triggerGetFiles({})
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleShare = (id: string) => {
        setInviteDialog({ id, open: true })
    }

    const handleDelete = (id: string) => {
        setDeleteDialog({ id, open: true })
    }

    const handleConfirmDelete = () => {
        if (deleteDialog.id) {
            triggerDeleteFile(deleteDialog.id)
        }
    }

    const handleDownload = (id: string) => {
        const file = fileList.find(f => f.id === id)
        if (!file) return

        // Create download link
        const link = document.createElement('a')
        link.href = file.srcUrl
        link.download = file.name
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.push(
            <Notification type="success" title="Download Started">
                {file.name}
            </Notification>,
            { placement: 'top-center' }
        )
    }

    const handleRename = (id: string) => {
        setRenameDialog({ id, open: true })
    }

    const handleOpen = (id: string) => {
        // For future directory implementation
        console.log('Opening file/directory:', id)
    }

    const handleEntryClick = () => {
        // Refresh files list
        triggerGetFiles({})
    }

    const handleDirectoryClick = (id: string) => {
        // For future directory implementation
        console.log('Directory clicked:', id)
    }

    const handleClick = (fileId: string) => {
        setSelectedFile(fileId)
    }

    return (
        <>
            <div>
                <FileManagerHeader
                    onEntryClick={handleEntryClick}
                    onDirectoryClick={handleDirectoryClick}
                />
                <div className="mt-6">
                    {isLoadingFiles ? (
                        layout === 'grid' ? (
                            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mt-4 gap-4 lg:gap-6">
                                {Array.from(Array(4).keys()).map((item) => (
                                    <FileSegment
                                        key={item}
                                        loading={isLoadingFiles}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Table>
                                <THead>
                                    <Tr>
                                        <Th>File</Th>
                                        <Th>Size</Th>
                                        <Th>Type</Th>
                                        <Th></Th>
                                    </Tr>
                                </THead>
                                <TableRowSkeleton
                                    avatarInColumns={[0]}
                                    columns={4}
                                    rows={5}
                                    avatarProps={{
                                        width: 30,
                                        height: 30,
                                    }}
                                />
                            </Table>
                        )
                    ) : (
                        <FileList
                            fileList={fileList}
                            layout={layout}
                            onDownload={handleDownload}
                            onShare={handleShare}
                            onDelete={handleDelete}
                            onRename={handleRename}
                            onOpen={handleOpen}
                            onClick={handleClick}
                        />
                    )}
                </div>
            </div>
            <FileDetails onShare={handleShare} />
            <FileManagerDeleteDialog onConfirm={handleConfirmDelete} />
            <FileManagerInviteDialog />
            <FileManagerRenameDialog />
        </>
    )
}

export default FileManager
