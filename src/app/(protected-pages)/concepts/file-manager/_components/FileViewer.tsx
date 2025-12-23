'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { TbDownload, TbX, TbMaximize, TbExternalLink } from 'react-icons/tb'
import type { File } from '../types'

type FileViewerProps = {
    file: File | null
    isOpen: boolean
    onClose: () => void
    onDownload?: () => void
}

const FileViewer = ({ file, isOpen, onClose, onDownload }: FileViewerProps) => {
    const [imageError, setImageError] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    if (!file) return null

    const getFileCategory = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return 'image'
        if (mimeType.startsWith('video/')) return 'video'
        if (mimeType.startsWith('audio/')) return 'audio'
        if (mimeType === 'application/pdf') return 'pdf'
        if (mimeType.startsWith('text/') ||
            mimeType === 'application/json' ||
            mimeType === 'application/xml') return 'text'
        return 'other'
    }

    const fileCategory = getFileCategory(file.fileType)

    const renderFullContent = () => {
        switch (fileCategory) {
            case 'image':
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        {imageError ? (
                            <div className="text-center">
                                <p className="text-gray-500 mb-4">Cannot display image</p>
                                <Button onClick={() => window.open(file.srcUrl, '_blank')}>
                                    Open in New Tab
                                </Button>
                            </div>
                        ) : (
                            <img
                                src={file.srcUrl}
                                alt={file.name}
                                className="max-w-full max-h-full object-contain"
                                onError={() => setImageError(true)}
                            />
                        )}
                    </div>
                )

            case 'video':
                return (
                    <div className="flex items-center justify-center h-full">
                        <video
                            controls
                            className="max-w-full max-h-full"
                            autoPlay={false}
                        >
                            <source src={file.srcUrl} type={file.fileType} />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                )

            case 'audio':
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-semibold mb-2">{file.name}</h3>
                            <p className="text-gray-500">Audio File</p>
                        </div>
                        <audio controls className="w-full max-w-md">
                            <source src={file.srcUrl} type={file.fileType} />
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                )

            case 'pdf':
                return (
                    <div className="h-full">
                        <iframe
                            src={file.srcUrl}
                            className="w-full h-full border-0"
                            title={file.name}
                        />
                    </div>
                )

            case 'text':
                return (
                    <div className="h-full">
                        <iframe
                            src={file.srcUrl}
                            className="w-full h-full border-0 bg-white"
                            title={file.name}
                        />
                    </div>
                )

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold mb-2">{file.name}</h3>
                            <p className="text-gray-500 mb-4">
                                File type: {file.fileType}
                            </p>
                            <p className="text-gray-400 mb-6">
                                This file type cannot be previewed in the browser.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="solid"
                                    onClick={() => window.open(file.srcUrl, '_blank')}
                                    icon={<TbExternalLink />}
                                >
                                    Open in New Tab
                                </Button>
                                {onDownload && (
                                    <Button
                                        variant="plain"
                                        onClick={onDownload}
                                        icon={<TbDownload />}
                                    >
                                        Download
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={true}
            shouldCloseOnEsc={true}
            className={isFullscreen ? 'fixed inset-0 z-50' : ''}
            width={isFullscreen ? '100vw' : 1000}
            height={isFullscreen ? '100vh' : 700}
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold truncate max-w-md" title={file.name}>
                            {file.name}
                        </h3>
                        <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {file.fileType}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<TbMaximize />}
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                        />
                        {onDownload && (
                            <Button
                                size="sm"
                                variant="plain"
                                icon={<TbDownload />}
                                onClick={onDownload}
                                title="Download file"
                            />
                        )}
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<TbExternalLink />}
                            onClick={() => window.open(file.srcUrl, '_blank')}
                            title="Open in new tab"
                        />
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<TbX />}
                            onClick={onClose}
                            title="Close"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {renderFullContent()}
                </div>
            </div>
        </Dialog>
    )
}

export default FileViewer
