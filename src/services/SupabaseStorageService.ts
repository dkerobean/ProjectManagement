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
            // Create a unique filename
            const fileExt = file.name.split('.').pop() || 'jpg'
            const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`

            // Check if avatars bucket exists, create if not
            const { data: buckets } = await this.supabase.storage.listBuckets()
            const avatarBucket = buckets?.find((bucket: { name: string }) => bucket.name === 'avatars')
            
            if (!avatarBucket) {
                const { error: bucketError } = await this.supabase.storage.createBucket('avatars', {
                    public: true,
                    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
                    fileSizeLimit: 5 * 1024 * 1024 // 5MB limit
                })
                
                if (bucketError) {
                    console.error('Error creating avatars bucket:', bucketError)
                }
            }

            // Upload the file
            const { error } = await this.supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) {
                console.error('Upload error:', error)
                return { url: null, error }
            }

            // Get the public URL
            const { data: { publicUrl } } = this.supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            return { url: publicUrl, error: null }
        } catch (error) {
            console.error('Avatar upload error:', error)
            return { url: null, error }
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
            const fileExt = file.name.split('.').pop() || 'txt'
            const fileName = `${userId}/${folder}/${file.name.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`

            // Check if profile-files bucket exists, create if not
            const { data: buckets } = await this.supabase.storage.listBuckets()
            const profileBucket = buckets?.find((bucket: { name: string }) => bucket.name === 'profile-files')
            
            if (!profileBucket) {
                const { error: bucketError } = await this.supabase.storage.createBucket('profile-files', {
                    public: false, // Private bucket for profile files
                    fileSizeLimit: 10 * 1024 * 1024 // 10MB limit
                })
                
                if (bucketError) {
                    console.error('Error creating profile-files bucket:', bucketError)
                }
            }

            const { error } = await this.supabase.storage
                .from('profile-files')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) {
                console.error('Upload error:', error)
                return { url: null, path: null, error }
            }

            // For private files, return the path instead of public URL
            return { url: null, path: fileName, error: null }
        } catch (error) {
            console.error('File upload error:', error)
            return { url: null, path: null, error }
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
