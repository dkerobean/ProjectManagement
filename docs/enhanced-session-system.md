# Enhanced NextAuth Session with User Profile Data

## Overview

This implementation extends NextAuth sessions to include comprehensive user profile data, reducing API calls and improving performance while maintaining security best practices.

## Features

### ✅ **What's Included in Session:**
- **Basic user data**: id, name, email, role, authority
- **Profile information**: phone, address, country, timezone
- **Cached data**: Automatic refresh every 5 minutes
- **Avatar management**: Cache-busting for updated images
- **Preferences**: User settings and notifications

### 🚀 **Performance Benefits:**
- **Reduced API calls**: Profile data cached in session
- **Faster page loads**: No need to fetch user data on every page
- **Automatic sync**: Fresh data when needed, cached when possible
- **Client-side optimization**: Easy access via hooks

## Usage

### 1. **Using the `useUserProfile` Hook**

```tsx
import useUserProfile from '@/hooks/useUserProfile'

const MyComponent = () => {
    const {
        user,           // Enhanced user data from session
        profile,        // Detailed profile information
        isLoading,      // Loading state
        hasProfile,     // Boolean if profile data exists
        isAdmin,        // Quick role checks
        isMember,
        refreshProfile  // Manual refresh function
    } = useUserProfile()

    if (isLoading) return <div>Loading...</div>

    return (
        <div>
            <h1>Welcome {user?.name}</h1>
            {profile?.country && <p>Location: {profile.country}</p>}
            {isAdmin && <AdminPanel />}
        </div>
    )
}
```

### 2. **Using Utility Functions**

```tsx
import {
    getUserDisplayName,
    getUserAvatarUrl,
    getFormattedAddress,
    isProfileComplete
} from '@/utils/userProfile'

const UserCard = ({ user }) => {
    const displayName = getUserDisplayName(user)
    const avatarUrl = getUserAvatarUrl(user)
    const address = getFormattedAddress(user.profile)
    const isComplete = isProfileComplete(user.profile)

    return (
        <div>
            <img src={avatarUrl} alt={displayName} />
            <h3>{displayName}</h3>
            <p>{address}</p>
            {!isComplete && <Badge>Incomplete Profile</Badge>}
        </div>
    )
}
```

### 3. **Manual Profile Refresh**

```tsx
// When user updates their profile
const handleProfileUpdate = async () => {
    await updateUserProfile(data)

    // Refresh session data
    await refreshProfile()

    // Or trigger event for other components
    window.dispatchEvent(new Event('profileUpdated'))
}
```

## Session Data Structure

```typescript
interface Session {
    user: {
        id: string
        name: string
        email: string
        role: 'admin' | 'project_manager' | 'member' | 'viewer'
        authority: string[]
        timezone: string
        avatar_url?: string
        preferences?: UserPreferences
        profile?: UserProfile
        lastProfileSync?: string
    }
}

interface UserProfile {
    phone_number?: string
    dial_code?: string
    country?: string
    address?: string
    postcode?: string
    city?: string
    created_at?: string
    updated_at?: string
}
```

## Configuration

### Environment Variables Required:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXTAUTH_SECRET=your_nextauth_secret
```

### Database Setup:
The system uses automatic triggers to create user profiles:
- `on_auth_user_created` trigger
- `handle_new_user()` function
- RLS policies for secure access

## Best Practices

### ✅ **DO:**
- Use `useUserProfile()` hook for accessing user data
- Leverage cached session data when possible
- Use utility functions for common operations
- Refresh profile data after updates

### ❌ **DON'T:**
- Store sensitive data in session
- Make unnecessary API calls for user data
- Bypass the session system for user info
- Forget to handle loading states

## Security

- **Session data**: Stored in secure httpOnly cookies
- **Service role**: Used only server-side for database access
- **RLS policies**: Ensure users can only access their own data
- **Auto-refresh**: Keeps data fresh without compromising security

## Migration from Old System

### Before:
```tsx
// Old: Manual API calls
useEffect(() => {
    fetch('/api/user/profile')
        .then(res => res.json())
        .then(setUserData)
}, [])
```

### After:
```tsx
// New: Session-based data
const { user, profile } = useUserProfile()
// Data is already available!
```

## Examples

### Component with Admin Check:
```tsx
const AdminOnly = () => {
    const { isAdmin, isLoading } = useUserProfile()

    if (isLoading) return <Skeleton />
    if (!isAdmin) return <AccessDenied />

    return <AdminDashboard />
}
```

### Profile Completeness Check:
```tsx
const ProfileBanner = () => {
    const { profile } = useUserProfile()
    const isComplete = isProfileComplete(profile)

    if (!isComplete) {
        return (
            <Banner>
                Please complete your profile for full access
            </Banner>
        )
    }

    return null
}
```

This enhanced session system provides a robust, performant, and secure way to handle user data throughout your application while following NextAuth best practices.
