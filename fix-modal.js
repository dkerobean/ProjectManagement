// This script fixes the corrupted ProjectDeleteModal.tsx file
const fs = require('fs');
const path = require('path');

const fixedContent = `'use client'

import { useState } from 'react'
import { useProjectsStore } from '../_store/projectsStore'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { TbTrash, TbAlertTriangle } from 'react-icons/tb'

const ProjectDeleteModal = () => {
    const {
        isDeleteModalOpen,
        selectedProject,
        toggleDeleteModal,
        deleteProject
    } = useProjectsStore()

    const [isLoading, setIsLoading] = useState(false)

    const handleDelete = async () => {
        if (!selectedProject) return

        setIsLoading(true)

        try {
            const response = await fetch(\`/api/projects/\${selectedProject.id}\`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to delete project')
            }

            deleteProject(selectedProject.id)

            toast.push(
                <Notification type="success" title="Success">
                    Project deleted successfully
                </Notification>
            )

            toggleDeleteModal()
        } catch (error) {
            console.error('Error deleting project:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    {error instanceof Error ? error.message : 'An unexpected error occurred'}
                </Notification>
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog
            isOpen={isDeleteModalOpen}
            onClose={toggleDeleteModal}
        >
            <div className="max-w-md w-full text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                    <TbAlertTriangle className="w-8 h-8 text-red-600" />
                </div>

                <h5 className="mb-2 text-lg font-semibold text-gray-900">
                    Delete Project
                </h5>

                <p className="text-gray-600 mb-6">
                    Are you sure you want to delete &quot;<strong>{selectedProject?.name}</strong>&quot;?
                    This action cannot be undone and will permanently remove the project and all its associated data.
                </p>

                <div className="flex items-center justify-center gap-3">
                    <Button
                        variant="plain"
                        onClick={toggleDeleteModal}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        icon={<TbTrash />}
                        onClick={handleDelete}
                        loading={isLoading}
                        customColorClass={(state) => 'border-error ring-1 ring-error text-error hover:border-error hover:ring-error hover:text-error bg-error hover:bg-error text-white'}
                    >
                        Delete Project
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default ProjectDeleteModal`;

const targetPath = path.join(__dirname, 'src', 'app', '(protected-pages)', 'concepts', 'projects', '_components', 'ProjectDeleteModal.tsx');

try {
  fs.writeFileSync(targetPath, fixedContent);
  console.log('✅ Successfully fixed ProjectDeleteModal.tsx');
} catch (error) {
  console.error('❌ Error fixing file:', error);
}
