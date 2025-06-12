import { createSupabaseClient } from '@/lib/supabase'

interface UploadResult {
    url: string | null
    error: unknown
}

interface DeleteResult {
    success: boolean
    error: unknown
}

interface FileUploadResult {
    url: string | null
    path: string | null
    error: unknown
}

interface SignedUrlResult {
    url: string | null
    error: unknown
}

interface FileListResult {
    files: unknown[]
    error: unknown
}

class SupabaseStorageService {
    private supabase: ReturnType<typeof createSupabaseClient>

    constructor() {
        this.supabase = createSupabaseClient()
    }

    /**
     * Upload avatar image to Supabase Storage
     * @param file - The image file to upload
     * @param userId - The user ID for file naming
     * @returns Promise with the public URL or error
     */
    async uploadAvatar(file: File, userId: string): Promise<UploadResult> {
        try {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
            if (!allowedTypes.includes(file.type)) {
                return {
                    url: null,
                    error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
                }
            }

            // Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024
            if (file.size > maxSize) {
                return {
                    url: null,
                    error: 'File size too large. Maximum size is 5MB.'
                }
            }

            // Create a unique filename
            const fileExt = file.name.split('.').pop() || 'jpg'
            const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`

            console.log('🔄 Uploading avatar:', { fileName, fileSize: file.size, fileType: file.type })

            // Upload the file to the avatars bucket
            const { error: uploadError } = await this.supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true // Allow overwrite
                })

            if (uploadError) {
                console.error('❌ Avatar upload error:', uploadError)
                return {
                    url: null,
                    error: `Upload failed: ${uploadError.message}`
                }
            }

            console.log('✅ Avatar uploaded successfully:', fileName)

            // Get the public URL
            const { data: { publicUrl } } = this.supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            console.log('🔗 Avatar public URL:', publicUrl)

            return { url: publicUrl, error: null }
        } catch (error) {
            console.error('💥 Avatar upload error:', error)
            return {
                url: null,
                error: error instanceof Error ? error.message : 'Unknown upload error'
            }
        }
    }

    /**
     * Delete an avatar from storage
     * @param avatarUrl - The full URL of the avatar to delete
     * @returns Promise with success/error status
     */
    async deleteAvatar(avatarUrl: string): Promise<DeleteResult> {
        try {
            // Extract the file path from the URL
            const url = new URL(avatarUrl)
            const pathParts = url.pathname.split('/')
            const bucketIndex = pathParts.findIndex(part => part === 'avatars')

            if (bucketIndex === -1) {
                throw new Error('Invalid avatar URL')
            }

            const filePath = pathParts.slice(bucketIndex + 1).join('/')

            const { error } = await this.supabase.storage
                .from('avatars')
                .remove([filePath])

            if (error) {
                console.error('Delete error:', error)
                return { success: false, error }
            }

            return { success: true, error: null }
        } catch (error) {
            console.error('Avatar delete error:', error)
            return { success: false, error }
        }
    }

    /**
     * Upload general profile files (documents, etc.)
     * @param file - The file to upload
     * @param userId - The user ID for file organization
     * @param folder - Optional folder name (default: 'general')
     * @returns Promise with the file path or error
     */
    async uploadProfileFile(file: File, userId: string, folder: string = 'general'): Promise<FileUploadResult> {
        try {
            // Validate file size (10MB max)
            const maxSize = 10 * 1024 * 1024
            if (file.size > maxSize) {
                return {
                    url: null,
                    path: null,
                    error: 'File size too large. Maximum size is 10MB.'
                }
            }

            const fileExt = file.name.split('.').pop() || 'txt'
            const fileName = `${userId}/${folder}/${file.name.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`

            console.log('🔄 Uploading profile file:', { fileName, fileSize: file.size, folder })

            // Upload to the profile-files bucket (private)
            const { error: uploadError } = await this.supabase.storage
                .from('profile-files')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (uploadError) {
                console.error('❌ Profile file upload error:', uploadError)
                return {
                    url: null,
                    path: null,
                    error: `Upload failed: ${uploadError.message}`
                }
            }

            console.log('✅ Profile file uploaded successfully:', fileName)

            // For private files, return the path instead of public URL
            return { url: null, path: fileName, error: null }
        } catch (error) {
            console.error('💥 Profile file upload error:', error)
            return {
                url: null,
                path: null,
                error: error instanceof Error ? error.message : 'Unknown upload error'
            }
        }
    }

    /**
     * Get signed URL for private files
     * @param filePath - The path to the file in storage
     * @param expiresIn - Expiration time in seconds (default: 1 hour)
     * @returns Promise with signed URL or error
     */
    async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<SignedUrlResult> {
        try {
            const { data, error } = await this.supabase.storage
                .from('profile-files')
                .createSignedUrl(filePath, expiresIn)

            if (error) {
                console.error('Signed URL error:', error)
                return { url: null, error }
            }

            return { url: data?.signedUrl || null, error: null }
        } catch (error) {
            console.error('Get signed URL error:', error)
            return { url: null, error }
        }
    }

    /**
     * List user's profile files
     * @param userId - The user ID
     * @param folder - Optional folder to list (default: all)
     * @returns Promise with file list or error
     */
    async listUserFiles(userId: string, folder?: string): Promise<FileListResult> {
        try {
            const path = folder ? `${userId}/${folder}` : userId

            const { data, error } = await this.supabase.storage
                .from('profile-files')
                .list(path)

            if (error) {
                console.error('List files error:', error)
                return { files: [], error }
            }

            return { files: data || [], error: null }
        } catch (error) {
            console.error('List user files error:', error)
            return { files: [], error }
        }
    }
}

// Export as singleton
const supabaseStorageService = new SupabaseStorageService()
export default supabaseStorageService
