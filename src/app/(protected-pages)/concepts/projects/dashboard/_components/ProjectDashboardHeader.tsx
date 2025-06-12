'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Segment from '@/components/ui/Segment'
import Link from 'next/link'
import NewProjectForm from '../../project-list/_components/NewProjectForm'

const ProjectDashboardHeader = () => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [viewMode, setViewMode] = useState('overview')

    return (
        <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3>Project Dashboard</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Monitor and manage all your projects from one place
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Segment
                        value={viewMode}
                        size="sm"
                        onChange={(val) => setViewMode(val as string)}
                    >
                        <Segment.Item value="overview">Overview</Segment.Item>
                        <Segment.Item value="detailed">Detailed</Segment.Item>
                    </Segment>
                    <Link href="/concepts/projects/project-list">
                        <Button variant="default" size="sm">
                            View All Projects
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

export default ProjectDashboardHeader
