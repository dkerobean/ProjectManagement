'use client'

import { useFileManagerStore } from '../_store/useFileManagerStore'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

type FileManagerDeleteDialogProps = {
    onConfirm?: () => void
}

const FileManagerDeleteDialog = ({ onConfirm }: FileManagerDeleteDialogProps) => {
    const { deleteDialog, setDeleteDialog, deleteFile } = useFileManagerStore()

    const handleDeleteDialogClose = () => {
        setDeleteDialog({ id: '', open: false })
    }

    const handleDeleteConfirm = () => {
        if (onConfirm) {
            onConfirm()
        } else {
            // Fallback to store function if no custom onConfirm provided
            deleteFile(deleteDialog.id)
            setDeleteDialog({ id: '', open: false })
        }
    }

    return (
        <ConfirmDialog
            isOpen={deleteDialog.open}
            type="danger"
            title="Delete file"
            onClose={handleDeleteDialogClose}
            onRequestClose={handleDeleteDialogClose}
            onCancel={handleDeleteDialogClose}
            onConfirm={handleDeleteConfirm}
        >
            <p>
                Are you sure you want to delete file? This action can&apos;t be
                undo.{' '}
            </p>
        </ConfirmDialog>
    )
}

export default FileManagerDeleteDialog
