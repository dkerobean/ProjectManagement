'use client'

import { useMemo, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Button from '@/components/ui/Button'
import Upload from '@/components/ui/Upload'
import Input from '@/components/ui/Input'
import Select, { Option as DefaultOption } from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar'
import { Form, FormItem } from '@/components/ui/Form'
import Card from '@/components/ui/Card'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import NumericInput from '@/components/shared/NumericInput'
import { countryList } from '@/constants/countries.constant'
import { components } from 'react-select'
import type { ControlProps, OptionProps } from 'react-select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { HiOutlineUser, HiOutlineCloudUpload, HiOutlineTrash } from 'react-icons/hi'
import { getRoleDisplayName, type UserRole } from '@/utils/roleBasedAccess'
import supabaseStorageService from '@/services/SupabaseStorageService'
import type { ZodType } from 'zod'

type ProfileSchema = {
    name: string
    email: string
    dialCode?: string
    phoneNumber?: string
    avatar_url?: string
    country?: string
    address?: string
    postcode?: string
    city?: string
    timezone: string
    role?: UserRole
    // Additional fields to match database schema
    dial_code?: string
    phone_number?: string
}

type CountryOption = {
    label: string
    dialCode: string
    value: string
}

const { Control } = components

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

const validationSchema: ZodType<ProfileSchema> = z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    email: z
        .string()
        .min(1, { message: 'Email required' })
        .email({ message: 'Invalid email' }),
    dialCode: z.string().optional(),
    phoneNumber: z.string().optional(),
    country: z.string().optional(),
    address: z.string().optional(),
    postcode: z.string().optional(),
    city: z.string().optional(),
    timezone: z.string().min(1, { message: 'Please select your timezone' }),
    avatar_url: z.string().optional(),
    role: z.enum(['viewer', 'member', 'project_manager', 'admin']).optional(),
})

const CustomSelectOption = (
    props: OptionProps<CountryOption> & { variant: 'country' | 'phone' },
) => {
    return (
        <DefaultOption<CountryOption>
            {...props}
            customLabel={(data, label) => (
                <span className="flex items-center gap-2">
                    <Avatar
                        shape="circle"
                        size={20}
                        src={`/img/countries/${data.value}.png`}
                    />
                    {props.variant === 'country' && <span>{label}</span>}
                    {props.variant === 'phone' && <span>{data.dialCode}</span>}
                </span>
            )}
        />
    )
}

const CustomControl = ({ children, ...props }: ControlProps<CountryOption>) => {
    const selected = props.getValue()[0]
    return (
        <Control {...props}>
            {selected && (
                <Avatar
                    className="ltr:ml-4 rtl:mr-4"
                    shape="circle"
                    size={20}
                    src={`/img/countries/${selected.value}.png`}
                />
            )}
            {children}
        </Control>
    )
}

const SettingsProfile = () => {
    const { data: session, update: updateSession } = useSession()
    const [isLoading, setIsLoading] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

        const dialCodeList = useMemo(() => {
        const newCountryList: Array<CountryOption> = JSON.parse(
            JSON.stringify(countryList),
        )
        return newCountryList.map((country) => {
            country.label = country.dialCode
            return country
        })
    }, [])

    const beforeAvatarUpload = (files: FileList | null) => {
        let valid: string | boolean = true
        const allowedFileType = ['image/jpeg', 'image/png', 'image/webp']
        const maxFileSize = 5 * 1024 * 1024 // 5MB

        if (files) {
            const fileArray = Array.from(files)
            for (const file of fileArray) {
                if (!allowedFileType.includes(file.type)) {
                    valid = 'Please upload a .jpeg, .png, or .webp file!'
                }
                if (file.size > maxFileSize) {
                    valid = 'File size cannot exceed 5MB!'
                }
            }
        }

        return valid
    }

    const {
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        control,
        watch,
        setValue,
    } = useForm<ProfileSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            name: '',
            email: '',
            dialCode: '',
            phoneNumber: '',
            avatar_url: '',
            country: '',
            address: '',
            postcode: '',
            city: '',
            timezone: 'UTC',
        },
    })

    const watchedAvatarUrl = watch('avatar_url')

    useEffect(() => {
        const loadUserProfile = async () => {
            if (session?.user?.id) {
                try {
                    // Get full user profile from API route
                    const response = await fetch('/api/user/profile')

                    if (response.ok) {
                        const result = await response.json()
                        console.log('📥 Profile API response:', result)

                        const profile = result.data || result // Handle both { data: ... } and direct response

                        // Use database profile data to populate form
                        reset({
                            name: profile.name || '',
                            email: profile.email || '',
                            avatar_url: profile.avatar_url || '',
                            timezone: profile.timezone || 'UTC',
                            role: profile.role as UserRole,
                            // Removed non-existent fields
                            dialCode: '',
                            phoneNumber: '',
                            country: '',
                            address: '',
                            postcode: '',
                            city: '',
                        })
                        console.log('✅ Profile loaded from API successfully')
                    } else {
                        console.warn('❌ Failed to load profile from API, using session data')
                        const errorData = await response.json()
                        console.error('API Error:', errorData)
                        reset({
                            name: session.user.name || '',
                            email: session.user.email || '',
                            avatar_url: session.user.image || '',
                            timezone: 'UTC',
                            role: session.user.role as UserRole,
                            dialCode: '',
                            phoneNumber: '',
                            country: '',
                            address: '',
                            postcode: '',
                            city: '',
                        })
                    }
                } catch (error) {
                    console.error('Error loading user profile:', error)
                    // Fallback to session data
                    reset({
                        name: session.user.name || '',
                        email: session.user.email || '',
                        avatar_url: session.user.image || '',
                        timezone: 'UTC',
                        role: session.user.role as UserRole,
                        dialCode: '',
                        phoneNumber: '',
                        country: '',
                        address: '',
                        postcode: '',
                        city: '',
                    })
                }
            }
        }

        loadUserProfile()
    }, [session, reset])

    const handleAvatarUpload = async (files: File[]) => {
        if (!files.length || !session?.user?.id) return

        try {
            setIsUploadingAvatar(true)
            const file = files[0]

            // Upload to Supabase Storage
            const uploadResult = await supabaseStorageService.uploadAvatar(file, session.user.id)

            if (uploadResult.error) {
                const errorMessage = typeof uploadResult.error === 'string'
                    ? uploadResult.error
                    : uploadResult.error instanceof Error
                        ? uploadResult.error.message
                        : 'Unknown error occurred'

                toast.push(
                    <Notification title="Error" type="danger">
                        Failed to upload avatar: {errorMessage}
                    </Notification>
                )
                return
            }

            if (uploadResult.url) {
                setValue('avatar_url', uploadResult.url)

                // Trigger custom event to update header avatar
                console.log('🔔 Dispatching profileUpdated event after avatar upload')
                window.dispatchEvent(new CustomEvent('profileUpdated'))

                toast.push(
                    <Notification title="Success" type="success">
                        Avatar uploaded successfully!
                    </Notification>
                )
            }
        } catch (error) {
            console.error('Avatar upload error:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to upload avatar. Please try again.
                </Notification>
            )
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const handleAvatarRemove = async () => {
        try {
            setIsUploadingAvatar(true)
            const currentAvatarUrl = watch('avatar_url')

            // Delete from Supabase Storage if it's a Supabase URL
            if (currentAvatarUrl && currentAvatarUrl.includes('supabase')) {
                const deleteResult = await supabaseStorageService.deleteAvatar(currentAvatarUrl)
                if (deleteResult.error) {
                    console.warn('Failed to delete avatar from storage:', deleteResult.error)
                }
            }

            setValue('avatar_url', '')

            toast.push(
                <Notification title="Success" type="success">
                    Avatar removed successfully!
                </Notification>
            )
        } catch (error) {
            console.error('Avatar remove error:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to remove avatar. Please try again.
                </Notification>
            )
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const onSubmit = async (values: ProfileSchema) => {
        if (!session?.user?.id) {
            toast.push(
                <Notification title="Error" type="danger">
                    User session not found. Please log in again.
                </Notification>
            )
            return
        }

        try {
            setIsLoading(true)

            // Prepare the update data for the API
            const updateData = {
                name: values.name,
                email: values.email,
                avatar_url: values.avatar_url,
                timezone: values.timezone,
                // Only include fields that exist in the database
                // dial_code, phone_number, country, address, postcode, city removed
                // as they don't exist in the current database schema
            }

            // Update profile via API route
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update profile')
            }

            // Update the NextAuth session with the new data
            await updateSession({
                ...session,
                user: {
                    ...session.user,
                    name: values.name,
                    email: values.email,
                    image: values.avatar_url,
                },
            })

            // Trigger custom event to update header avatar
            console.log('🔔 Dispatching profileUpdated event after form submission')
            window.dispatchEvent(new CustomEvent('profileUpdated'))

            toast.push(
                <Notification title="Success" type="success">
                    Profile updated successfully!
                </Notification>
            )
        } catch (error) {
            console.error('Profile update error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
            toast.push(
                <Notification title="Error" type="danger">
                    {errorMessage}
                </Notification>
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <h4 className="mb-8">Personal Information</h4>
            <Form onSubmit={handleSubmit(onSubmit)}>                {/* Avatar Section */}                <Card className="mb-6">                    <div className="flex items-center gap-6">                        <div className="flex-shrink-0">                            <Controller                                name="avatar_url"                                control={control}                                render={({ field }) => (                                    <Avatar                                        size={90}                                        className="border-4 border-white bg-gray-100 text-gray-300 shadow-lg"                                        icon={<HiOutlineUser />}                                        src={field.value}                                    />                                )}                            />                        </div>                        <div className="flex-1">                            <h4 className="font-semibold text-lg mb-2">Profile Picture</h4>                            <p className="text-gray-600 dark:text-gray-400 mb-4">                                Upload a high-quality image for your profile. Supported formats: JPEG, PNG, WebP (max 5MB)                            </p>                            <div className="flex items-center gap-2">                                <Upload                                    className="cursor-pointer"                                    showList={false}                                    uploadLimit={1}                                    accept="image/jpeg,image/png,image/webp"                                    beforeUpload={beforeAvatarUpload}                                    onChange={handleAvatarUpload}                                    disabled={isUploadingAvatar}                                >                                    <Button                                        variant="solid"                                        size="sm"                                        icon={<HiOutlineCloudUpload />}                                        loading={isUploadingAvatar}                                        disabled={isUploadingAvatar}                                        type="button"                                    >                                        {isUploadingAvatar ? 'Uploading...' : 'Upload'}                                    </Button>                                </Upload>                                {watchedAvatarUrl && (                                    <Button                                        variant="plain"                                        size="sm"                                        icon={<HiOutlineTrash />}                                        onClick={handleAvatarRemove}                                        disabled={isUploadingAvatar}                                        type="button"                                    >                                        Remove                                    </Button>                                )}                            </div>                            {session?.user?.role && (                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">                                    Current role: {getRoleDisplayName(session.user.role as UserRole)}                                </p>                            )}                        </div>                    </div>                </Card>                {/* Personal Information */}                <Card className="mb-6">                    <h4 className="font-semibold text-lg mb-4">Basic Information</h4>                    <div className="grid md:grid-cols-2 gap-4">                        <FormItem                            label="Full Name"                            invalid={Boolean(errors.name)}                            errorMessage={errors.name?.message}                        >                            <Controller                                name="name"                                control={control}                                render={({ field }) => (                                    <Input                                        type="text"                                        autoComplete="off"                                        placeholder="Full Name"                                        {...field}                                    />                                )}                            />                        </FormItem>                        <FormItem                            label="Email"                            invalid={Boolean(errors.email)}                            errorMessage={errors.email?.message}                        >                            <Controller                                name="email"                                control={control}                                render={({ field }) => (                                    <Input                                        type="email"                                        autoComplete="off"                                        placeholder="Email"                                        {...field}                                    />                                )}                            />                        </FormItem>                    </div>                                        <FormItem                        label="Timezone"                        invalid={Boolean(errors.timezone)}                        errorMessage={errors.timezone?.message}                    >                        <Controller                            name="timezone"                            control={control}                            render={({ field }) => (                                <Select                                    placeholder="Select your timezone"                                    options={timezoneOptions}                                    value={timezoneOptions.find(option => option.value === field.value)}                                    onChange={(option) => field.onChange(option?.value)}                                />                            )}                        />                    </FormItem>                </Card>                {/* Optional Information */}                <Card className="mb-6">                    <h4 className="font-semibold text-lg mb-4">Additional Information (Optional)</h4>                    <div className="flex items-end gap-4 w-full mb-6">                        <FormItem                            invalid={                                Boolean(errors.phoneNumber) ||                                Boolean(errors.dialCode)                            }                        >                            <label className="form-label mb-2">Phone number</label>                            <Controller                                name="dialCode"                                control={control}                                render={({ field }) => (                                    <Select<CountryOption>                                        instanceId="dial-code"                                        options={dialCodeList}                                        value={dialCodeList.find(option => option.value === field.value)}                                        onChange={(option) => field.onChange(option?.value)}                                        className="w-[150px]"                                        components={{                                            Option: (props) => (                                                <CustomSelectOption                                                    variant="phone"                                                    {...(props as OptionProps<CountryOption>)}                                                />                                            ),                                            Control: CustomControl,                                        }}                                        placeholder=""                                    />                                )}                            />                        </FormItem>                        <FormItem                            invalid={Boolean(errors.phoneNumber)}                            errorMessage={errors.phoneNumber?.message}                        >                            <Controller                                name="phoneNumber"                                control={control}                                render={({ field }) => (                                    <NumericInput                                        placeholder="Phone Number"                                        className="w-[250px]"                                        {...field}                                    />                                )}                            />                        </FormItem>                    </div>                                        <FormItem                        label="Country"                        invalid={Boolean(errors.country)}                        errorMessage={errors.country?.message}                    >                        <Controller                            name="country"                            control={control}                            render={({ field }) => (                                <Select<CountryOption>                                    instanceId="country"                                    options={countryList}                                    value={countryList.find(option => option.value === field.value)}                                    onChange={(option) => field.onChange(option?.value)}                                    components={{                                        Option: (props) => (                                            <CustomSelectOption                                                variant="country"                                                {...(props as OptionProps<CountryOption>)}                                            />                                        ),                                        Control: CustomControl,                                    }}                                    placeholder="Select Country"                                />                            )}                        />                    </FormItem>                                        <div className="grid md:grid-cols-3 gap-4">                        <FormItem                            label="Address"                            invalid={Boolean(errors.address)}                            errorMessage={errors.address?.message}                        >                            <Controller                                name="address"                                control={control}                                render={({ field }) => (                                    <Input                                        type="text"                                        autoComplete="off"                                        placeholder="Address"                                        {...field}                                    />                                )}                            />                        </FormItem>                        <FormItem                            label="Postcode"                            invalid={Boolean(errors.postcode)}                            errorMessage={errors.postcode?.message}                        >                            <Controller                                name="postcode"                                control={control}                                render={({ field }) => (                                    <Input                                        type="text"                                        autoComplete="off"                                        placeholder="Postcode"                                        {...field}                                    />                                )}                            />                        </FormItem>                        <FormItem                            label="City"                            invalid={Boolean(errors.city)}                            errorMessage={errors.city?.message}                        >                            <Controller                                name="city"                                control={control}                                render={({ field }) => (                                    <Input                                        type="text"                                        autoComplete="off"                                        placeholder="City"                                        {...field}                                    />                                )}                            />                        </FormItem>                    </div>                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button
                        variant="solid"
                        type="submit"
                        loading={isSubmitting || isLoading}
                        disabled={isSubmitting || isLoading}
                    >
                        Save Changes
                    </Button>
                </div>
            </Form>
        </>
    )
}

export default SettingsProfile