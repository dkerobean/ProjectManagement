'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Table from '@/components/ui/Table'
import Avatar from '@/components/ui/Avatar'
import Loading from '@/components/shared/Loading'
import fileSizeUnit from '@/utils/fileSizeUnit'
import FileIcon from '@/components/view/FileIcon'
import dayjs from 'dayjs'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Upload from '@/components/ui/Upload'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import UploadMedia from '@/assets/svg/UploadMedia'

type FileSegmentProps = {
    name: string
    fileType: string
    size: number
}

const { TBody, THead, Th, Tr, Td } = Table

const FileSegment = ({ fileType, size, name }: FileSegmentProps) => {
    return (
        <div
            className="bg-white rounded-2xl dark:bg-gray-800 border border-gray-200 dark:border-transparent p-2.5 lg:p-3.5 flex items-center gap-2 transition-all hover:shadow-[0_0_1rem_0.25rem_rgba(0,0,0,0.04),0px_2rem_1.5rem_-1rem_rgba(0,0,0,0.12)] cursor-pointer"
            role="button"
        >
            <div className="text-3xl">
                <FileIcon type={fileType} size={35} />
            </div>
            <div>
                <div className="font-bold heading-text">{name}</div>
                <span className="text-xs">{fileSizeUnit(size)}</span>
            </div>
        </div>
    )
}

const ProjectDetailsAttachments = ({ projectId }: { projectId: string }) => {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    
    const { data, isLoading, mutate } = useSWR(
        [`/api/files?entity_type=project&entity_id=${projectId}`],
        async () => {
            const response = await fetch(`/api/files?entity_type=project&entity_id=${projectId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch files')
            }
            return response.json()
        },
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const handleUploadDialogClose = () => {
        setUploadDialogOpen(false)
        setUploadedFiles([])
    }

    const handleUpload = async () => {
        if (uploadedFiles.length === 0) return

        setIsUploading(true)

        try {
            const formData = new FormData()

            uploadedFiles.forEach((file) => {
                formData.append('files', file)
            })

            formData.append('entity_type', 'project')
            formData.append('entity_id', projectId)

            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed')
            }

            mutate()

            handleUploadDialogClose()

            toast.push(
                <Notification
                    title={`Successfully uploaded ${result.files.length} file(s)`}
                    type="success"
                />,
                { placement: 'top-center' }
            )

        } catch (error) {
            console.error('Upload error:', error)
            toast.push(
                <Notification
                    title="Upload failed"
                    type="danger"
                >
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                </Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileChange = (files: File[]) => {
        const maxSize = 500 * 1024 * 1024
        const oversizedFiles = files.filter(file => file.size > maxSize)

        if (oversizedFiles.length > 0) {
            toast.push(
                <Notification
                    title="File size limit exceeded"
                    type="warning"
                >
                    Some files exceed the 500MB limit and were not added.
                </Notification>,
                { placement: 'top-center' }
            )

            const validFiles = files.filter(file => file.size <= maxSize)
            setUploadedFiles(validFiles)
        } else {
            setUploadedFiles(files)
        }
    }

    return (
        <Loading loading={isLoading}>
            <div className="flex justify-between items-center mb-6">
                <h4>Recently added</h4>
                <Button variant="solid" onClick={() => setUploadDialogOpen(true)}>
                    Upload Files
                </Button>
            </div>
            
            <div>
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mt-4 gap-4 lg:gap-6">
                    {data &&
                        data.list
                            .filter((file) => file.recent)
                            .map((file) => (
                                <FileSegment
                                    key={file.id}
                                    fileType={file.fileType}
                                    size={file.size}
                                    name={file.name}
                                />
                            ))}
                </div>
            </div>
            
            <div className="mt-10">
                <h4>Others files</h4>
                <Table className="mt-6">
                    <THead>
                        <Tr>
                            <Th>File</Th>
                            <Th>Size</Th>
                            <Th>Upload date</Th>
                            <Th>Last modified</Th>
                            <Th>Uploaded by</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {data &&
                            data.list
                                .filter((file) => !file.recent)
                                .map((file) => (
                                    <Tr
                                        key={file.id}
                                        className="cursor-pointer"
                                    >
                                        <Td>
                                            <div className="flex items-center gap-2">
                                                <div className="text-2xl">
                                                    <FileIcon
                                                        type={file.fileType}
                                                        size={35}
                                                    />
                                                </div>
                                                <div className="font-bold heading-text">
                                                    {file.name}
                                                </div>
                                            </div>
                                        </Td>
                                        <Td className="font-semibold text-nowrap">
                                            {fileSizeUnit(file.size)}
                                        </Td>
                                        <Td className="font-semibold text-nowrap">
                                            {dayjs
                                                .unix(file.uploadDate)
                                                .format('DD MMM YYYY')}
                                        </Td>
                                        <Td className="font-semibold">
                                            {dayjs
                                                .unix(
                                                    file.activities[0]
                                                        .timestamp,
                                                )
                                                .format('DD MMM YYYY')}
                                        </Td>
                                        <Td>
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    size={28}
                                                    src={file.author.img}
                                                />
                                                <span className="heading-text font-bold">
                                                    {file.author.name}
                                                </span>
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                    </TBody>
                </Table>
            </div>

            <Dialog
                isOpen={uploadDialogOpen}
                onClose={handleUploadDialogClose}
                onRequestClose={handleUploadDialogClose}
            >
                <h4>Upload Files to Project</h4>
                <div className="text-sm text-gray-600 mt-2 mb-4">
                    Maximum file size: 500MB per file
                </div>
                <Upload
                    draggable
                    className="mt-6 bg-gray-100 dark:bg-transparent"
                    onChange={handleFileChange}
                    onFileRemove={setUploadedFiles}
                    multiple
                >
                    <div className="my-4 text-center">
                        <div className="text-6xl mb-4 flex justify-center">
                            <UploadMedia height={150} width={200} />
                        </div>
                        <p className="font-semibold">
                            <span className="text-gray-800 dark:text-white">
                                Drop your files here, or{' '}
                            </span>
                            <span className="text-blue-500">browse</span>
                        </p>
                        <p className="mt-1 font-semibold opacity-60 dark:text-white">
                            through your machine
                        </p>
                    </div>
                </Upload>
                {uploadedFiles.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm font-medium mb-2">
                            Files to upload ({uploadedFiles.length}):
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {uploadedFiles.map((file, index) => (
                                <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="mt-4">
                    <Button
                        block
                        loading={isUploading}
                        variant="solid"
                        disabled={uploadedFiles.length === 0}
                        onClick={handleUpload}
                    >
                        Upload {uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s)` : ''}
                    </Button>
                </div>
            </Dialog>
        </Loading>
    )
}

export default ProjectDetailsAttachments
