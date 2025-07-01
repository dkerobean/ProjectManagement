import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { unlink } from 'fs/promises'
import path from 'path'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gafpwitcdoiviixlxnuz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjQxNTksImV4cCI6MjA2NTA0MDE1OX0.RNdmc2PkTYA6oQ-4HRPoRp-z-iinT8v5d6pWx9YRPhk'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For now, we'll simulate user authentication
// In a real app, you'd get this from your auth system
const getCurrentUserId = () => {
    // This is a mock user ID - in reality you'd get this from your auth system
    return 'a8fa04b3-d73c-4048-980a-e94db5ebf70c'
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = getCurrentUserId()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const fileId = params.id
        const body = await request.json()
        const { original_name } = body

        if (!original_name || typeof original_name !== 'string' || original_name.trim() === '') {
            return NextResponse.json({ error: 'Original name is required and must be a non-empty string' }, { status: 400 })
        }

        // Validate filename (basic validation)
        const trimmedName = original_name.trim()
        if (trimmedName.length > 255) {
            return NextResponse.json({ error: 'Filename too long (max 255 characters)' }, { status: 400 })
        }

        // Check if file exists and belongs to user
        const { data: existingFile, error: fetchError } = await supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .eq('user_id', userId)
            .single()

        if (fetchError || !existingFile) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // Update file record in database
        const { data: updatedFile, error: updateError } = await supabase
            .from('files')
            .update({ original_name: trimmedName })
            .eq('id', fileId)
            .eq('user_id', userId)
            .select('*')
            .single()

        if (updateError) {
            console.error('Database update error:', updateError)
            return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 })
        }

        // Transform to match expected format
        const transformedFile = {
            id: updatedFile.id,
            name: updatedFile.original_name,
            fileType: updatedFile.type,
            srcUrl: updatedFile.url,
            size: updatedFile.size,
            uploadDate: new Date(updatedFile.uploaded_at).getTime(),
            recent: new Date(updatedFile.uploaded_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000),
            author: {
                name: 'Current User',
                email: '',
                img: ''
            },
            activities: [],
            permissions: []
        }

        return NextResponse.json({
            success: true,
            message: 'File renamed successfully',
            file: transformedFile
        })

    } catch (error) {
        console.error('Rename file error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = getCurrentUserId()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const fileId = params.id

        // Get file info first
        const { data: file, error: fetchError } = await supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .eq('user_id', userId)
            .single()

        if (fetchError || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // Delete file from filesystem
        try {
            const filePath = path.join(process.cwd(), 'public', file.url)
            await unlink(filePath)
        } catch (fsError) {
            console.error('Failed to delete file from filesystem:', fsError)
            // Continue with database deletion even if file deletion fails
        }

        // Delete file record from database
        const { error: deleteError } = await supabase
            .from('files')
            .delete()
            .eq('id', fileId)
            .eq('user_id', userId)

        if (deleteError) {
            console.error('Database delete error:', deleteError)
            return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully'
        })

    } catch (error) {
        console.error('Delete file error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
