import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { nanoid } from 'nanoid'
import { createClient } from '@supabase/supabase-js'

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

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

// Ensure upload directory exists
async function ensureUploadDir() {
    if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true })
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = getCurrentUserId()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        await ensureUploadDir()
        
        const formData = await request.formData()
        const files = formData.getAll('files') as File[]
        const entityType = formData.get('entity_type') as string || null
        const entityId = formData.get('entity_id') as string || null
        
        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 })
        }

        const uploadedFiles = []

        for (const file of files) {
            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: `File ${file.name} exceeds 500MB limit` },
                    { status: 400 }
                )
            }

            // Generate unique filename
            const fileExtension = path.extname(file.name)
            const uniqueId = nanoid()
            const fileName = `${uniqueId}${fileExtension}`
            const filePath = path.join(UPLOAD_DIR, fileName)
            
            // Save file to public/uploads
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            await writeFile(filePath, buffer)
            
            // Create URL for the file
            const fileUrl = `/uploads/${fileName}`
            
            // Save file metadata to Supabase
            const { data: fileRecord, error: dbError } = await supabase
                .from('files')
                .insert({
                    name: fileName,
                    original_name: file.name,
                    url: fileUrl,
                    size: file.size,
                    type: file.type || 'application/octet-stream',
                    entity_type: entityType,
                    entity_id: entityId,
                    user_id: userId
                })
                .select()
                .single()

            if (dbError) {
                console.error('Database error:', dbError)
                return NextResponse.json({ error: 'Failed to save file metadata' }, { status: 500 })
            }

            uploadedFiles.push({
                id: fileRecord.id,
                name: fileRecord.original_name,
                fileName: fileRecord.name,
                url: fileRecord.url,
                size: fileRecord.size,
                type: fileRecord.type,
                uploadedAt: fileRecord.uploaded_at
            })
        }

        return NextResponse.json({ 
            success: true, 
            files: uploadedFiles,
            message: `Successfully uploaded ${uploadedFiles.length} file(s)` 
        })
        
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
