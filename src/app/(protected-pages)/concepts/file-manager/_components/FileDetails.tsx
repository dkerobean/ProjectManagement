'use client'

import { useMemo } from 'react'
import Drawer from '@/components/ui/Drawer'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import CloseButton from '@/components/ui/CloseButton'
import FileType from './FileType'
import FilePreview from './FilePreview'
import fileSizeUnit from '@/utils/fileSizeUnit'
import { useFileManagerStore } from '../_store/useFileManagerStore'
import dayjs from 'dayjs'
import { TbPlus } from 'react-icons/tb'
import type { ReactNode } from 'react'

type FileDetailsProps = {
    onShare: (id: string) => void
}

const InfoRow = ({
    label,
    value,
}: {
    label: string
    value: string | ReactNode
}) => {
    return (
        <div className="flex items-center justify-between">
            <span>{label}</span>
            <span className="heading-text font-bold">{value}</span>
        </div>
    )
}

const FileDetails = ({ onShare }: FileDetailsProps) => {
    const { selectedFile, setSelectedFile, fileList } = useFileManagerStore()

    const file = useMemo(() => {
        return fileList.find((file) => selectedFile === file.id)
    }, [fileList, selectedFile])

    const handleDrawerClose = () => {
        setSelectedFile('')
    }

    return (
        <Drawer            title={null}
            closable={false}
            isOpen={Boolean(selectedFile)}
            showBackdrop={false}
            width={400}
            onClose={handleDrawerClose}
            onRequestClose={handleDrawerClose}
        >
            {file && (
                <div>                    <div className="flex justify-end">
                        <CloseButton onClick={handleDrawerClose} />
                    </div>

                    {/* File Preview Section */}
                    <div className="mt-6">
                        <FilePreview
                            file={file}
                            onDownload={() => {
                                // Create download link
                                const link = document.createElement('a')
                                link.href = file.srcUrl
                                link.download = file.name
                                link.target = '_blank'
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                            }}
                        />
                    </div>

                    <div className="mt-6 text-center">
                        <h4 className="truncate" title={file.name}>{file.name}</h4>
                    </div>
                    <div className="mt-8">
                        <h6>Info</h6>
                        <div className="mt-4 flex flex-col gap-4">
                            <InfoRow
                                label="Size"
                                value={fileSizeUnit(file.size)}
                            />
                            <InfoRow
                                label="Type"
                                value={<FileType type={file.fileType} />}
                            />                            <InfoRow
                                label="Created"
                                value={dayjs(file.uploadDate).format('MMM DD, YYYY')}
                            />
                            <InfoRow
                                label="Last modified"
                                value={dayjs(file.uploadDate).format('MMM DD, YYYY')}
                            />
                        </div>
                    </div>
                    <div className="mt-10">
                        <div className="flex justify-between items-center">
                            <h6>Shared with</h6>
                            <Button
                                type="button"
                                shape="circle"
                                icon={<TbPlus />}
                                size="xs"
                                onClick={() => onShare(file.id)}
                            />
                        </div>
                        <div className="mt-6 flex flex-col gap-4">
                            {file.permissions.map((user) => (
                                <div
                                    key={user.userName}
                                    className="flex items-center gap-2"
                                >
                                    <Avatar src={user.userImg} alt="" />
                                    <div>
                                        <div className="heading-text font-semibold">
                                            {user.userName}
                                        </div>
                                        <div>{user.role}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Drawer>
    )
}

export default FileDetails
