import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/utils/auth'

export async function GET(request: NextRequest) {
    try {
        // Check authentication using the app's auth system
        const userId = await getCurrentUserId()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const entityType = searchParams.get('entity_type')
        const entityId = searchParams.get('entity_id')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        // For now, return mock data since we're fixing the auth issue first
        // We can integrate with the database once auth is working
        const mockFiles = [
            {
                id: '1',
                name: 'sample-document.pdf',
                fileType: 'application/pdf',
                srcUrl: '/uploads/sample-document.pdf',
                size: 2048576, // 2MB
                uploadDate: Date.now() - 86400000, // 1 day ago
                recent: true,
                author: {
                    name: 'Current User',
                    email: 'user@example.com',
                    img: ''
                },
                activities: [],
                permissions: []
            },
            {
                id: '2',
                name: 'project-image.png',
                fileType: 'image/png',
                srcUrl: '/uploads/project-image.png',
                size: 512000, // 512KB
                uploadDate: Date.now() - 172800000, // 2 days ago
                recent: true,
                author: {
                    name: 'Current User',
                    email: 'user@example.com',
                    img: ''
                },
                activities: [],
                permissions: []
            }
        ]

        // Filter mock data if needed
        let filteredFiles = mockFiles
        if (entityType || entityId) {
            // Apply filtering logic here if needed
            filteredFiles = mockFiles.filter(() => true) // placeholder
        }

        return NextResponse.json({
            list: filteredFiles,
            directory: [],
            pagination: {
                page,
                limit,
                total: filteredFiles.length,
                totalPages: Math.ceil(filteredFiles.length / limit)
            }
        })

    } catch (error) {
        console.error('List files error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
