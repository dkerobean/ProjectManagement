/**
 * Utility functions for managing user profile data in session
 */

/**
 * Check if profile data needs to be refreshed based on timestamp
 * @param lastSync - ISO timestamp of last profile sync
 * @param maxAgeMinutes - Maximum age in minutes before refresh is needed (default: 5 minutes)
 * @returns boolean indicating if refresh is needed
 */
export const shouldRefreshProfile = (
    lastSync?: string,
    maxAgeMinutes: number = 5
): boolean => {
    if (!lastSync) return true

    const now = new Date().getTime()
    const syncTime = new Date(lastSync).getTime()
    const maxAge = maxAgeMinutes * 60 * 1000 // Convert to milliseconds

    return (now - syncTime) > maxAge
}

/**
 * Get user display name from session data
 * @param user - User object from session
 * @returns formatted display name
 */
export const getUserDisplayName = (user?: {
    name?: string | null
    email?: string | null
    profile?: {
        phone_number?: string
    } | null
}): string => {
    if (user?.name) return user.name
    if (user?.email) return user.email.split('@')[0]
    return 'User'
}

/**
 * Get user avatar URL with fallback
 * @param user - User object from session
 * @returns avatar URL or fallback
 */
export const getUserAvatarUrl = (user?: {
    avatar_url?: string | null
    name?: string | null
    email?: string | null
}): string | null => {
    if (user?.avatar_url) return user.avatar_url

    // Could implement initials-based avatar generation here
    // For now, return null to use component's default handling
    return null
}

/**
 * Get full user address from profile
 * @param profile - User profile data
 * @returns formatted address string
 */
export const getFormattedAddress = (profile?: {
    address?: string
    city?: string
    postcode?: string
    country?: string
} | null): string => {
    if (!profile) return ''

    const parts = [
        profile.address,
        profile.city,
        profile.postcode,
        profile.country
    ].filter(Boolean)

    return parts.join(', ')
}

/**
 * Check if user profile is complete
 * @param profile - User profile data
 * @returns boolean indicating completeness
 */
export const isProfileComplete = (profile?: {
    phone_number?: string
    country?: string
    address?: string
} | null): boolean => {
    if (!profile) return false

    // Define required fields for a "complete" profile
    const requiredFields = ['phone_number', 'country']
    return requiredFields.every(field => profile[field as keyof typeof profile])
}

const userProfileUtils = {
    shouldRefreshProfile,
    getUserDisplayName,
    getUserAvatarUrl,
    getFormattedAddress,
    isProfileComplete,
}

export default userProfileUtils
