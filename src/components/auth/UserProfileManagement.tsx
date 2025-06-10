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
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { getRoleDisplayName, type UserRole } from '@/utils/roleBasedAccess'
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
    role: z.string().optional(),
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
    const [userProfile, setUserProfile] = useState<any>(null)

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
                        setUserProfile(profile)
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

    const handleUpdateProfile = async (values: UserProfileFormSchema) => {
        if (!session?.user?.id) return

        setIsSubmitting(true)

        try {
            const { data, error } = await SupabaseAuthService.updateUserProfile(
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
                toast.push(
                    <Notification type="danger" title="Update Failed">
                        {error.message}
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
                    <div className="flex items-center mb-6">
                        <Avatar
                            size="lg"
                            src={watchedAvatarUrl || session?.user?.image}
                            alt={session?.user?.name || 'User Avatar'}
                            className="mr-4"
                        />
                        <div>
                            <h4 className="font-medium">Profile Picture</h4>
                            <p className="text-sm text-gray-600">
                                {session?.user?.role && getRoleDisplayName(session.user.role as UserRole)}
                            </p>
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                                        {...field}
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
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                        )}

                        <FormItem
                            label="Avatar URL"
                            invalid={Boolean(errors.avatar_url)}
                            errorMessage={errors.avatar_url?.message}
                        >
                            <Controller
                                name="avatar_url"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="url"
                                        placeholder="Enter avatar URL"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                    </div>

                    {/* Preferences */}
                    <div className="border-t pt-6">
                        <h4 className="font-medium mb-4">Preferences</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <FormItem label="Theme">
                                <Controller
                                    name="preferences.theme"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            placeholder="Select theme"
                                            options={themeOptions}
                                            {...field}
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
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                        </div>

                        {/* Notification Preferences */}
                        <div className="mb-6">
                            <h5 className="font-medium mb-3">Notification Preferences</h5>
                            <div className="space-y-3">
                                <Controller
                                    name="preferences.notifications.email"
                                    control={control}
                                    render={({ field: { value, onChange } }) => (
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={onChange}
                                                className="mr-3"
                                            />
                                            <span>Email notifications</span>
                                        </label>
                                    )}
                                />
                                <Controller
                                    name="preferences.notifications.push"
                                    control={control}
                                    render={({ field: { value, onChange } }) => (
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={onChange}
                                                className="mr-3"
                                            />
                                            <span>Push notifications</span>
                                        </label>
                                    )}
                                />
                                <Controller
                                    name="preferences.notifications.desktop"
                                    control={control}
                                    render={({ field: { value, onChange } }) => (
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={onChange}
                                                className="mr-3"
                                            />
                                            <span>Desktop notifications</span>
                                        </label>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

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
