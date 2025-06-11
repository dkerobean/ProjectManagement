'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar'
import { FormItem, Form } from '@/components/ui/Form'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import SupabaseAuthService from '@/services/SupabaseAuthService'
import SupabaseStorageService from '@/services/SupabaseStorageService'
import Upload from '@/components/ui/Upload'
import Card from '@/components/ui/Card'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { getRoleDisplayName, type UserRole } from '@/utils/roleBasedAccess'
import { HiOutlineCloudUpload, HiOutlineTrash } from 'react-icons/hi'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'

interface UserProfileManagementProps extends CommonProps {
    showRoleSelection?: boolean
    allowRoleChange?: boolean
}

type UserProfileFormSchema = {
    name: string
    email: string
    timezone: string
    role?: UserRole
    avatar_url?: string
    preferences?: {
        notifications?: {
            email?: boolean
            push?: boolean
            desktop?: boolean
        }
        theme?: 'light' | 'dark' | 'system'
        language?: string
    }
}

const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
    { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
    { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
    { value: 'Europe/London', label: 'British Time (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET/CEST)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
]

const roleOptions = [
    { value: 'viewer', label: 'Viewer' },
    { value: 'member', label: 'Member' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'admin', label: 'Administrator' },
]

const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
]

const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
]

const validationSchema: ZodType<UserProfileFormSchema> = z.object({
    name: z
        .string({ required_error: 'Name is required' })
        .min(2, 'Name must be at least 2 characters'),
    email: z
        .string({ required_error: 'Email is required' })
        .email('Please enter a valid email address'),
    timezone: z.string({ required_error: 'Please select your timezone' }),
    role: z.enum(['viewer', 'member', 'project_manager', 'admin']).optional(),
    avatar_url: z.string().optional(),
    preferences: z.object({
        notifications: z.object({
            email: z.boolean().optional(),
            push: z.boolean().optional(),
            desktop: z.boolean().optional(),
        }).optional(),
        theme: z.enum(['light', 'dark', 'system']).optional(),
        language: z.string().optional(),
    }).optional(),
})

const UserProfileManagement = (props: UserProfileManagementProps) => {
    const { className, showRoleSelection = false, allowRoleChange = false } = props
    const { data: session, update } = useSession()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

    const {
        handleSubmit,
        formState: { errors, isDirty },
        control,
        reset,
        watch,
    } = useForm<UserProfileFormSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            preferences: {
                notifications: {
                    email: true,
                    push: true,
                    desktop: false,
                },
                theme: 'system',
                language: 'en',
            },
        },
    })

    // Load user profile data
    useEffect(() => {
        const loadUserProfile = async () => {
            if (session?.user?.id) {
                try {
                    const { profile, error } = await SupabaseAuthService.getUserProfile(
                        session.user.id
                    )

                    if (error) {
                        console.error('Error loading user profile:', error)
                        toast.push(
                            <Notification type="danger" title="Error">
                                Failed to load profile data
                            </Notification>,
                            { placement: 'top-end' }
                        )
                    } else if (profile) {
                        reset({
                            name: profile.name || '',
                            email: profile.email || '',
                            timezone: profile.timezone || 'UTC',
                            role: profile.role as UserRole,
                            avatar_url: profile.avatar_url || '',
                            preferences: {
                                notifications: {
                                    email: profile.preferences?.notifications?.email ?? true,
                                    push: profile.preferences?.notifications?.push ?? true,
                                    desktop: profile.preferences?.notifications?.desktop ?? false,
                                },
                                theme: profile.preferences?.theme || 'system',
                                language: profile.preferences?.language || 'en',
                            },
                        })
                    }
                } catch (error) {
                    console.error('Error loading user profile:', error)
                } finally {
                    setIsLoading(false)
                }
            }
        }

        loadUserProfile()
    }, [session, reset])

    const handleAvatarUpload = async (files: File[]) => {
        if (!session?.user?.id || files.length === 0) return

        setIsUploadingAvatar(true)

        try {
            const file = files[0]
            const { url, error } = await SupabaseStorageService.uploadAvatar(file, session.user.id)

            if (error) {
                toast.push(
                    <Notification type="danger" title="Upload Failed">
                        Failed to upload avatar. Please try again.
                    </Notification>,
                    { placement: 'top-end' }
                )
                return
            }

            if (url) {
                // Update the form value
                reset({
                    ...watch(),
                    avatar_url: url
                })

                // Also update the profile in database immediately
                const { error: updateError } = await SupabaseAuthService.updateUserProfile(
                    session.user.id,
                    { avatar_url: url }
                )

                if (!updateError) {
                    // Force a complete session refresh by triggering the JWT callback
                    // This ensures both the token and session get updated with the new avatar_url
                    await update({
                        avatar_url: url,
                        image: url,
                        triggerUpdate: true // Force JWT callback to run
                    })

                    // Additional session refresh to ensure changes are propagated
                    setTimeout(async () => {
                        await update()
                    }, 100)

                    toast.push(
                        <Notification type="success" title="Avatar Uploaded">
                            Profile picture has been updated successfully.
                        </Notification>,
                        { placement: 'top-end' }
                    )
                }
            }
        } catch (error) {
            console.error('Avatar upload error:', error)
            toast.push(
                <Notification type="danger" title="Upload Error">
                    An unexpected error occurred during upload.
                </Notification>,
                { placement: 'top-end' }
            )
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const handleAvatarRemove = async () => {
        if (!session?.user?.id) return

        const currentAvatarUrl = watch('avatar_url')
        if (!currentAvatarUrl) return

        try {
            // Remove from storage if it's a Supabase storage URL
            if (currentAvatarUrl.includes('supabase')) {
                await SupabaseStorageService.deleteAvatar(currentAvatarUrl)
            }

            // Update form
            reset({
                ...watch(),
                avatar_url: ''
            })

            // Update database
            const { error } = await SupabaseAuthService.updateUserProfile(
                session.user.id,
                { avatar_url: null }
            )

            if (!error) {
                // Update session
                await update({
                    ...session,
                    user: {
                        ...session.user,
                        avatar_url: null,
                        image: null
                    }
                })

                toast.push(
                    <Notification type="success" title="Avatar Removed">
                        Profile picture has been removed successfully.
                    </Notification>,
                    { placement: 'top-end' }
                )
            }
        } catch (error) {
            console.error('Avatar removal error:', error)
            toast.push(
                <Notification type="danger" title="Removal Error">
                    Failed to remove avatar. Please try again.
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const beforeAvatarUpload = (files: FileList | null) => {
        let valid: string | boolean = true

        const allowedFileType = ['image/jpeg', 'image/png', 'image/webp']
        const maxFileSize = 5 * 1024 * 1024 // 5MB

        if (files) {
            for (const file of files) {
                if (!allowedFileType.includes(file.type)) {
                    valid = 'Please upload a JPEG, PNG, or WebP image file!'
                }

                if (file.size >= maxFileSize) {
                    valid = 'Image size must be less than 5MB!'
                }
            }
        }

        return valid
    }

    const handleUpdateProfile = async (values: UserProfileFormSchema) => {
        if (!session?.user?.id) return

        setIsSubmitting(true)

        try {
            const { error } = await SupabaseAuthService.updateUserProfile(
                session.user.id,
                {
                    name: values.name,
                    timezone: values.timezone,
                    avatar_url: values.avatar_url,
                    preferences: values.preferences,
                    ...(allowRoleChange && values.role && { role: values.role }),
                }
            )

            if (error) {
                const errorMessage = error && typeof error === 'object' && 'message' in error 
                    ? (error as { message: string }).message 
                    : 'Failed to update profile'
                
                toast.push(
                    <Notification type="danger" title="Update Failed">
                        {errorMessage}
                    </Notification>,
                    { placement: 'top-end' }
                )
            } else {
                // Update the session with new data
                await update({
                    ...session,
                    user: {
                        ...session.user,
                        name: values.name,
                        role: values.role || session.user.role,
                        timezone: values.timezone,
                        avatar_url: values.avatar_url,
                        preferences: values.preferences,
                    },
                })

                toast.push(
                    <Notification type="success" title="Profile Updated">
                        Your profile has been successfully updated.
                    </Notification>,
                    { placement: 'top-end' }
                )
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.push(
                <Notification type="danger" title="Update Error">
                    An unexpected error occurred. Please try again.
                </Notification>,
                { placement: 'top-end' }
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const watchedAvatarUrl = watch('avatar_url')

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={className}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Profile Information</h3>
                    <p className="text-gray-600">Update your personal information and preferences.</p>
                </div>

                <Form onSubmit={handleSubmit(handleUpdateProfile)}>
                    {/* Avatar Section */}
                    <Card className="mb-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex flex-col items-center">
                                <Avatar
                                    size={80}
                                    src={watchedAvatarUrl || session?.user?.image || ''}
                                    alt={session?.user?.name || 'User Avatar'}
                                    className="border-4 border-white shadow-lg"
                                />
                                <div className="mt-4 flex gap-2">
                                    <Upload
                                        className="cursor-pointer"
                                        showList={false}
                                        uploadLimit={1}
                                        accept="image/jpeg,image/png,image/webp"
                                        beforeUpload={beforeAvatarUpload}
                                        onChange={handleAvatarUpload}
                                        disabled={isUploadingAvatar}
                                    >
                                        <Button
                                            variant="solid"
                                            size="sm"
                                            icon={<HiOutlineCloudUpload />}
                                            loading={isUploadingAvatar}
                                            disabled={isUploadingAvatar}
                                        >
                                            {isUploadingAvatar ? 'Uploading...' : 'Upload'}
                                        </Button>
                                    </Upload>
                                    {watchedAvatarUrl && (
                                        <Button
                                            variant="plain"
                                            size="sm"
                                            icon={<HiOutlineTrash />}
                                            onClick={handleAvatarRemove}
                                            disabled={isUploadingAvatar}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-2">Profile Picture</h4>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                    Upload a high-quality image for your profile. Supported formats: JPEG, PNG, WebP (max 5MB)
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                    Current role: {session?.user?.role && getRoleDisplayName(session.user.role as UserRole)}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Personal Information */}
                    <Card className="mb-6">
                        <h4 className="font-semibold text-lg mb-4">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormItem
                                label="Full Name"
                                invalid={Boolean(errors.name)}
                                errorMessage={errors.name?.message}
                            >
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            placeholder="Enter your full name"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Email Address"
                                invalid={Boolean(errors.email)}
                                errorMessage={errors.email?.message}
                            >
                                <Controller
                                    name="email"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="email"
                                            placeholder="Enter your email"
                                            disabled
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Timezone"
                                invalid={Boolean(errors.timezone)}
                                errorMessage={errors.timezone?.message}
                            >
                                <Controller
                                    name="timezone"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            placeholder="Select your timezone"
                                            options={timezoneOptions}
                                            value={timezoneOptions.find(option => option.value === field.value)}
                                            onChange={(option) => field.onChange(option?.value)}
                                        />
                                    )}
                                />
                            </FormItem>

                            {showRoleSelection && allowRoleChange && (
                                <FormItem
                                    label="Role"
                                    invalid={Boolean(errors.role)}
                                    errorMessage={errors.role?.message}
                                >
                                    <Controller
                                        name="role"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                placeholder="Select role"
                                                options={roleOptions}
                                                value={roleOptions.find(option => option.value === field.value)}
                                                onChange={(option) => field.onChange(option?.value)}
                                            />
                                        )}
                                    />
                                </FormItem>
                            )}
                        </div>
                    </Card>

                    {/* Preferences */}
                    <Card className="mb-6">
                        <h4 className="font-semibold text-lg mb-4">Preferences</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <FormItem label="Theme Preference">
                                <Controller
                                    name="preferences.theme"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            placeholder="Select theme"
                                            options={themeOptions}
                                            value={themeOptions.find(option => option.value === field.value)}
                                            onChange={(option) => field.onChange(option?.value)}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem label="Language">
                                <Controller
                                    name="preferences.language"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            placeholder="Select language"
                                            options={languageOptions}
                                            value={languageOptions.find(option => option.value === field.value)}
                                            onChange={(option) => field.onChange(option?.value)}
                                        />
                                    )}
                                />
                            </FormItem>
                        </div>

                        {/* Notification Preferences */}
                        <div>
                            <h5 className="font-medium text-md mb-4">Notification Settings</h5>
                            <div className="space-y-4">
                                <Controller
                                    name="preferences.notifications.email"
                                    control={control}
                                    render={({ field: { value, onChange } }) => (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div>
                                                <label className="font-medium text-sm">Email Notifications</label>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    Receive email updates for important events
                                                </p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={onChange}
                                                className="form-checkbox h-5 w-5 text-blue-600"
                                            />
                                        </div>
                                    )}
                                />
                                <Controller
                                    name="preferences.notifications.push"
                                    control={control}
                                    render={({ field: { value, onChange } }) => (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div>
                                                <label className="font-medium text-sm">Push Notifications</label>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    Get real-time browser notifications
                                                </p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={onChange}
                                                className="form-checkbox h-5 w-5 text-blue-600"
                                            />
                                        </div>
                                    )}
                                />
                                <Controller
                                    name="preferences.notifications.desktop"
                                    control={control}
                                    render={({ field: { value, onChange } }) => (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div>
                                                <label className="font-medium text-sm">Desktop Notifications</label>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    Show system notifications on your desktop
                                                </p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={onChange}
                                                className="form-checkbox h-5 w-5 text-blue-600"
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            variant="solid"
                            loading={isSubmitting}
                            disabled={!isDirty}
                        >
                            {isSubmitting ? 'Updating...' : 'Update Profile'}
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    )
}

export default UserProfileManagement
