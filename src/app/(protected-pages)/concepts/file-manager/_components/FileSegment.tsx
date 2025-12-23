'use client'

import { useState } from 'react'
import FileItemDropdown from './FileItemDropdown'
import fileSizeUnit from '@/utils/fileSizeUnit'
import MediaSkeleton from '@/components/shared/loaders/MediaSkeleton'
import FileIcon, { getFileColor } from '@/components/view/FileIcon'
import { format } from 'date-fns'
import { 
    PiDownloadDuotone, 
    PiShareDuotone, 
    PiPencilDuotone,
    PiTrashDuotone,
    PiEyeDuotone
} from 'react-icons/pi'
import type { BaseFileItemProps } from '../types'

// Legacy type for backwards compatibility
// type FileSegmentProps = BaseFileItemProps

type ExtendedFileSegmentProps = BaseFileItemProps & {
    uploadDate?: number
    recent?: boolean
    author?: {
        name: string
        email: string
        img: string
    }
    variant?: 'default' | 'compact' | 'large'
}

const FileSegment = (props: ExtendedFileSegmentProps) => {
    const { 
        fileType, 
        size, 
        name, 
        onClick, 
        loading, 
        uploadDate,
        recent,
        author,
        onDownload,
        onShare,
        onRename,
        onDelete,
        variant = 'default',
        ...rest 
    } = props
    
    const [isHovered, setIsHovered] = useState(false)
    const isImageFile = fileType && ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(fileType.toLowerCase())
    const fileColor = getFileColor(fileType || '')
    
    if (loading) {
        return variant === 'compact' ? (
            <div className="bg-white rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 animate-pulse">
                <MediaSkeleton
                    avatarProps={{
                        width: 32,
                        height: 32,
                    }}
                />
                <div className="mt-2 space-y-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                </div>
            </div>
        ) : (
            <div className="bg-white rounded-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <MediaSkeleton
                    avatarProps={{
                        width: 64,
                        height: 64,
                    }}
                />
                <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
            </div>
        )
    }

    // Compact variant for tiles layout
    if (variant === 'compact') {
        return (
            <div
                className="group relative bg-white rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 transition-all duration-300 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer"
                role="button"
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* File Type Accent */}
                <div 
                    className="absolute top-0 left-0 w-full h-0.5 transition-all duration-300"
                    style={{ backgroundColor: fileColor }}
                />
                
                {/* Quick Actions Overlay for Compact */}
                <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-all duration-300 rounded-lg ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button 
                        onClick={onClick}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-md transition-all duration-200 hover:scale-110"
                        title="Preview"
                    >
                        <PiEyeDuotone size={14} />
                    </button>
                </div>
                
                {/* Compact File Icon */}
                <div className="flex flex-col items-center text-center">
                    <div className="mb-2">
                        <FileIcon type={fileType || ''} size={32} />
                    </div>
                    
                    {/* Compact File Info */}
                    <div className="w-full">
                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-tight line-clamp-2 mb-1">
                            {name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {fileSizeUnit(size || 0)}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className="group relative bg-white rounded-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer overflow-hidden"
            role="button"
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Recent Badge */}
            {recent && (
                <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Recent
                </div>
            )}
            
            {/* File Type Accent */}
            <div 
                className="absolute top-0 left-0 w-full h-1 transition-all duration-300"
                style={{ backgroundColor: fileColor }}
            />
            
            {/* Quick Actions Overlay */}
            <div className={`absolute inset-0 bg-black/50 flex items-center justify-center gap-3 transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {onDownload && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDownload(); }}
                        className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Download"
                    >
                        <PiDownloadDuotone size={18} />
                    </button>
                )}
                {onShare && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShare(); }}
                        className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Share"
                    >
                        <PiShareDuotone size={18} />
                    </button>
                )}
                <button 
                    onClick={onClick}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-all duration-200 hover:scale-110"
                    title="Preview"
                >
                    <PiEyeDuotone size={18} />
                </button>
                {onRename && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRename(); }}
                        className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Rename"
                    >
                        <PiPencilDuotone size={18} />
                    </button>
                )}
                {onDelete && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Delete"
                    >
                        <PiTrashDuotone size={18} />
                    </button>
                )}
            </div>
            
            {/* File Icon Section */}
            <div className="flex flex-col items-center text-center mb-4">
                <div className="mb-3 transform transition-transform duration-300 group-hover:scale-105">
                    {isImageFile ? (
                        <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl flex items-center justify-center overflow-hidden">
                                <FileIcon type={fileType || ''} size={48} />
                            </div>
                        </div>
                    ) : (
                        <div className="w-16 h-16 flex items-center justify-center">
                            <FileIcon type={fileType || ''} size={56} />
                        </div>
                    )}
                </div>
                
                {/* File Info */}
                <div className="space-y-1 w-full">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium" style={{ color: fileColor }}>
                            {fileType?.toUpperCase()}
                        </span>
                        <span>•</span>
                        <span>{fileSizeUnit(size || 0)}</span>
                    </div>
                    {uploadDate && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                            {format(new Date(uploadDate), 'MMM dd, yyyy')}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Author Info */}
            {author && (
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <img 
                        src={author.img && author.img.trim() !== '' ? author.img : `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random&size=24`} 
                        alt={author.name}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random&size=24`
                        }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {author.name}
                    </span>
                </div>
            )}
            
            {/* Fallback Dropdown Menu */}
            <div className={`absolute top-3 right-3 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                <FileItemDropdown {...rest} />
            </div>
        </div>
    )
}

export default FileSegment
