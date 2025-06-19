'use client'

import { useState } from 'react'
import { TbDownload, TbExternalLink, TbFileText, TbPhoto, TbFileZip, TbMusic, TbVideo, TbFile, TbMaximize } from 'react-icons/tb'
import Button from '@/components/ui/Button'
import FileViewer from './FileViewer'
import type { File } from '../types'

type FilePreviewProps = {
    file: File
    onDownload?: () => void
}

const FilePreview = ({ file, onDownload }: FilePreviewProps) => {
    const [imageError, setImageError] = useState(false)
    const [videoError, setVideoError] = useState(false)
    const [showFullViewer, setShowFullViewer] = useState(false)

    // Helper function to determine file category
    const getFileCategory = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return 'image'
        if (mimeType.startsWith('video/')) return 'video'
        if (mimeType.startsWith('audio/')) return 'audio'
        if (mimeType === 'application/pdf') return 'pdf'
        if (mimeType.startsWith('text/') ||
            mimeType === 'application/json' ||
            mimeType === 'application/xml') return 'text'
        if (mimeType.includes('zip') ||
            mimeType.includes('rar') ||
            mimeType.includes('tar')) return 'archive'
        return 'other'
    }

    const fileCategory = getFileCategory(file.fileType)
    const fileUrl = file.srcUrl

    // Render different previews based on file type
    const renderPreview = () => {
        switch (fileCategory) {
            case 'image':
                if (imageError) {
                    return (
                        <div className="flex flex-col items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <TbPhoto size={48} className="text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Cannot preview image</span>
                        </div>
                    )
                }
                return (
                    <div className="relative">
                        <img
                            src={fileUrl}
                            alt={file.name}
                            className="max-h-64 w-full object-contain rounded-lg bg-gray-50 dark:bg-gray-800"
                            onError={() => setImageError(true)}
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                            <Button
                                size="xs"
                                variant="solid"
                                icon={<TbMaximize />}
                                onClick={() => setShowFullViewer(true)}
                                title="Full view"
                            />
                            <Button
                                size="xs"
                                variant="solid"
                                icon={<TbExternalLink />}
                                onClick={() => window.open(fileUrl, '_blank')}
                                title="Open in new tab"
                            />
                        </div>
                    </div>
                )

            case 'video':
                if (videoError) {
                    return (
                        <div className="flex flex-col items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <TbVideo size={48} className="text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Cannot preview video</span>
                            <Button
                                size="sm"
                                variant="solid"
                                className="mt-2"
                                onClick={() => window.open(fileUrl, '_blank')}
                            >
                                Open Video
                            </Button>
                        </div>
                    )
                }
                return (
                    <div className="relative">
                        <video
                            controls
                            className="max-h-64 w-full rounded-lg bg-gray-50 dark:bg-gray-800"
                            onError={() => setVideoError(true)}
                        >
                            <source src={fileUrl} type={file.fileType} />
                            Your browser does not support the video tag.
                        </video>
                        <div className="absolute top-2 right-2">
                            <Button
                                size="xs"
                                variant="solid"
                                icon={<TbMaximize />}
                                onClick={() => setShowFullViewer(true)}
                                title="Full view"
                            />
                        </div>
                    </div>
                )

            case 'audio':
                return (
                    <div className="flex flex-col items-center justify-center h-32 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <TbMusic size={48} className="text-blue-500 mb-3" />
                        <audio controls className="w-full max-w-xs">
                            <source src={fileUrl} type={file.fileType} />
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                )

            case 'pdf':
                return (
                    <div className="flex flex-col items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <TbFileText size={48} className="text-red-500 mb-3" />
                        <span className="text-sm font-medium mb-3">PDF Document</span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="solid"
                                onClick={() => setShowFullViewer(true)}
                                icon={<TbMaximize />}
                            >
                                Full View
                            </Button>
                            <Button
                                size="sm"
                                variant="plain"
                                onClick={() => window.open(fileUrl, '_blank')}
                            >
                                Open PDF
                            </Button>
                            {onDownload && (
                                <Button
                                    size="sm"
                                    variant="plain"
                                    icon={<TbDownload />}
                                    onClick={onDownload}
                                >
                                    Download
                                </Button>
                            )}
                        </div>
                    </div>
                )

            case 'text':
                return (
                    <div className="flex flex-col items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <TbFileText size={48} className="text-green-500 mb-3" />
                        <span className="text-sm font-medium mb-3">Text Document</span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="solid"
                                onClick={() => window.open(fileUrl, '_blank')}
                            >
                                View Content
                            </Button>
                            {onDownload && (
                                <Button
                                    size="sm"
                                    variant="plain"
                                    icon={<TbDownload />}
                                    onClick={onDownload}
                                >
                                    Download
                                </Button>
                            )}
                        </div>
                    </div>
                )

            case 'archive':
                return (
                    <div className="flex flex-col items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <TbFileZip size={48} className="text-yellow-500 mb-3" />
                        <span className="text-sm font-medium mb-3">Archive File</span>
                        <span className="text-xs text-gray-500 mb-3">
                            {file.fileType.toUpperCase()} format
                        </span>
                        {onDownload && (
                            <Button
                                size="sm"
                                variant="solid"
                                icon={<TbDownload />}
                                onClick={onDownload}
                            >
                                Download
                            </Button>
                        )}
                    </div>
                )

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <TbFile size={48} className="text-gray-400 mb-3" />
                        <span className="text-sm font-medium mb-2">Unknown File Type</span>
                        <span className="text-xs text-gray-500 mb-3">
                            {file.fileType || 'No MIME type'}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="solid"
                                onClick={() => window.open(fileUrl, '_blank')}
                            >
                                Open File
                            </Button>
                            {onDownload && (
                                <Button
                                    size="sm"
                                    variant="plain"
                                    icon={<TbDownload />}
                                    onClick={onDownload}
                                >
                                    Download
                                </Button>
                            )}
                        </div>
                    </div>
                )
        }
    }

    return (
        <div className="w-full">
            <div className="mb-4">
                <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    File Preview
                </h6>
                {renderPreview()}
            </div>

            {/* File metadata */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <span className="text-gray-500">Format:</span>
                        <span className="ml-1 font-medium">{file.fileType}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Category:</span>
                        <span className="ml-1 font-medium capitalize">{fileCategory}</span>
                    </div>
                </div>
            </div>

            {/* File Viewer Modal */}
            <FileViewer
                file={file}
                isOpen={showFullViewer}
                onClose={() => setShowFullViewer(false)}
                onDownload={onDownload}
            />
        </div>
    )
}

export default FilePreview
