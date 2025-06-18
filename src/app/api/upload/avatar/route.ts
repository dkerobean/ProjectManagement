import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
    try {
        console.log('🔄 Avatar upload API endpoint called')

        // Check authentication
        const session = await auth()
        if (!session?.user?.id) {
            console.error('❌ Unauthorized: No session')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('✅ User authenticated:', session.user.id)

        // Get the form data
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            console.error('❌ No file provided')
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        console.log('📁 File received:', {
            name: file.name,
            size: file.size,
            type: file.type
        })

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            console.error('❌ Invalid file type:', file.type)
            return NextResponse.json({
                error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
            }, { status: 400 })
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            console.error('❌ File too large:', file.size)
            return NextResponse.json({
                error: 'File size too large. Maximum size is 5MB.'
            }, { status: 400 })
        }

        // Create Supabase client
        const supabase = await createSupabaseServerClient()

        // Create unique filename
        const fileExt = file.name.split('.').pop() || 'jpg'
        const fileName = `${session.user.id}/avatar_${Date.now()}.${fileExt}`

        console.log('☁️ Uploading to Supabase Storage:', fileName)

        // Convert File to ArrayBuffer for Supabase
        const fileBuffer = await file.arrayBuffer()

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, fileBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type
            })

        if (uploadError) {
            console.error('❌ Supabase upload error:', uploadError)
            return NextResponse.json({
                error: `Upload failed: ${uploadError.message}`
            }, { status: 500 })
        }

        console.log('✅ File uploaded successfully:', data)

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)

        console.log('🔗 Public URL generated:', publicUrl)

        return NextResponse.json({
            success: true,
            url: publicUrl
        })

    } catch (error) {
        console.error('💥 Avatar upload API error:', error)
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 })
    }
}
