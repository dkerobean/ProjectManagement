'use client'

import { useMemo } from 'react'
import Table from '@/components/ui/Table'
import FileSegment from './FileSegment'
import FileRow from './FileRow'
import type { Files, Layout } from '../types'

type FileListProps = {
    fileList: Files
    layout: Layout
    onRename: (id: string) => void
    onDownload: (id: string) => void
    onShare: (id: string) => void
    onDelete: (id: string) => void
    onOpen: (id: string) => void
    onClick: (id: string) => void
}

const { TBody, THead, Th, Tr } = Table

const FileList = (props: FileListProps) => {
    const {
        layout,
        fileList,
        onDelete,
        onDownload,
        onShare,
        onRename,
        onOpen,
        onClick,
    } = props

    const folders = useMemo(() => {
        return fileList.filter((file) => file.fileType === 'directory')
    }, [fileList])

    const files = useMemo(() => {
        return fileList.filter((file) => file.fileType !== 'directory')
    }, [fileList])

    const getGridClassName = (layout: Layout) => {
        switch (layout) {
            case 'large-grid':
                return 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 mt-4 gap-6 lg:gap-8'
            case 'tiles':
                return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 mt-4 gap-3'
            case 'grid':
            default:
                return 'grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mt-4 gap-4 lg:gap-6'
        }
    }

    const renderFileSegment = (list: Files, isFolder?: boolean) => (
        <div className={getGridClassName(layout)}>
            {list.map((file) => (                <FileSegment
                    key={file.id}
                    fileType={file.fileType}
                    size={file.size}
                    name={file.name}
                    uploadDate={file.uploadDate}
                    recent={file.recent}
                    author={file.author}
                    variant={layout === 'tiles' ? 'compact' : layout === 'large-grid' ? 'large' : 'default'}
                    onClick={() => onClick(file.id)}
                    onDownload={() => onDownload(file.id)}
                    onShare={() => onShare(file.id)}
                    onDelete={() => onDelete(file.id)}
                    onRename={() => onRename(file.id)}
                    {...(isFolder ? { onOpen: () => onOpen(file.id) } : {})}
                />
            ))}
        </div>
    )

    const renderFileRow = (list: Files, isFolder?: boolean) => (
        <Table className="mt-4">
            <THead>
                <Tr>
                    <Th>File</Th>
                    <Th>Size</Th>
                    <Th>Type</Th>
                    <Th></Th>
                </Tr>
            </THead>
            <TBody>
                {list.map((file) => (                    <FileRow
                        key={file.id}
                        fileType={file.fileType}
                        size={file.size}
                        name={file.name}
                        onClick={() => onClick(file.id)}
                        onDownload={() => onDownload(file.id)}
                        onShare={() => onShare(file.id)}
                        onDelete={() => onDelete(file.id)}
                        onRename={() => onRename(file.id)}
                        {...(isFolder ? { onOpen: () => onOpen(file.id) } : {})}
                    />
                ))}
            </TBody>
        </Table>
    )

    return (
        <div>
            {folders.length > 0 && (
                <div>
                    <h4>Folders</h4>
                    {layout === 'list' ? renderFileRow(folders, true) : renderFileSegment(folders, true)}
                </div>
            )}
            {files.length > 0 && (
                <div className="mt-8">
                    <h4>Files</h4>
                    {layout === 'list' ? renderFileRow(files) : renderFileSegment(files)}
                </div>
            )}
        </div>
    )
}

export default FileList
