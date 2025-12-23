'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Upload from '@/components/ui/Upload'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import UploadMedia from '@/assets/svg/UploadMedia'
import { useFileManagerStore } from '../_store/useFileManagerStore'

const UploadFile = () => {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const { setFileList, fileList } = useFileManagerStore()

    const handleUploadDialogClose = () => {
        setUploadDialogOpen(false)
        setUploadedFiles([])
    }

    const handleUpload = async () => {
        if (uploadedFiles.length === 0) return

        setIsUploading(true)

        try {
            const formData = new FormData()

            // Add all files to FormData
            uploadedFiles.forEach((file) => {
                formData.append('files', file)
            })

            // Add entity information if needed (for future use)
            // formData.append('entity_type', 'general')
            // formData.append('entity_id', 'some-id')

            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed')
            }
              // Transform uploaded files to match the expected format
            const newFiles = result.files.map((file: {
                id: string;
                name: string;
                type: string;
                url: string;
                size: number;
                uploadedAt: string;
            }) => ({
                id: file.id,
                name: file.name,
                fileType: file.type,
                srcUrl: file.url,
                size: file.size,
                uploadDate: new Date(file.uploadedAt).getTime(),
                recent: true,
                author: {
                    name: 'Current User',
                    email: '',
                    img: ''
                },
                activities: [],
                permissions: []
            }))

            // Add new files to the beginning of the list
            setFileList([...newFiles, ...fileList])

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
        // Check file size limit (500MB per file)
        const maxSize = 500 * 1024 * 1024 // 500MB
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

            // Filter out oversized files
            const validFiles = files.filter(file => file.size <= maxSize)
            setUploadedFiles(validFiles)
        } else {
            setUploadedFiles(files)
        }
    }

    return (
        <>
            <Button variant="solid" onClick={() => setUploadDialogOpen(true)}>
                Upload
            </Button>
            <Dialog
                isOpen={uploadDialogOpen}
                onClose={handleUploadDialogClose}
                onRequestClose={handleUploadDialogClose}
            >
                <h4>Upload Files</h4>
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
        </>
    )
}

export default UploadFile
