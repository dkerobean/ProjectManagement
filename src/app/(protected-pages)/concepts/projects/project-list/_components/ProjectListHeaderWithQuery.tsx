'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Link from 'next/link'
import NewProjectForm from './NewProjectForm'

const ProjectListHeader = () => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const searchParams = useSearchParams()

    useEffect(() => {
        // Auto-open create dialog if action=create in URL
        if (searchParams.get('action') === 'create') {
            setDialogOpen(true)
        }
    }, [searchParams])

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3>All Projects</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage and organize all your projects
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/concepts/projects/dashboard">
                        <Button variant="default" size="sm">
                            Dashboard
                        </Button>
                    </Link>
                    <Button variant="solid" onClick={() => setDialogOpen(true)}>
                        Create Project
                    </Button>
                </div>
            </div>
            <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)}>
                <h4>Add new project</h4>
                <div className="mt-4">
                    <NewProjectForm onClose={() => setDialogOpen(false)} />
                </div>
            </Dialog>
        </>
    )
}

export default ProjectListHeader
