'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import { Form, FormItem } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import { HiOutlineOfficeBuilding, HiOutlineSave, HiOutlinePhotograph } from 'react-icons/hi'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const companySettingsSchema = z.object({
    company_name: z.string().min(1, 'Company name is required'),
    company_address: z.string().optional(),
    phone_number: z.string().optional(),
    contact_email: z.string().email('Valid email is required').optional().or(z.literal('')),
    logo_url: z.string().optional(),
})

type CompanySettingsForm = z.infer<typeof companySettingsSchema>

interface UserProfile {
    id: string
    user_id: string
    company_name?: string
    company_address?: string
    phone_number?: string
    contact_email?: string
    logo_url?: string
    created_at: string
    updated_at: string
}

const CompanySettings = () => {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [logoPreview, setLogoPreview] = useState<string>('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<CompanySettingsForm>({
        resolver: zodResolver(companySettingsSchema),
        defaultValues: {
            company_name: '',
            company_address: '',
            phone_number: '',
            contact_email: '',
            logo_url: '',
        },
    })

    // Load existing profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setIsLoading(true)
                const response = await fetch('/api/invoicing/company-profile')

                if (response.ok) {
                    const data = await response.json()
                    if (data.success && data.data) {
                        const profileData = data.data
                        setProfile(profileData)
                        setLogoPreview(profileData.logo_url || '')
                        reset({
                            company_name: profileData.company_name || '',
                            company_address: profileData.company_address || '',
                            phone_number: profileData.phone_number || '',
                            contact_email: profileData.contact_email || '',
                            logo_url: profileData.logo_url || '',
                        })
                    }
                } else if (response.status !== 404) {
                    throw new Error('Failed to fetch profile')
                }
            } catch (error) {
                console.error('Error fetching profile:', error)
                toast.push(
                    <Notification type="danger">
                        Failed to load company profile
                    </Notification>,
                    { placement: 'top-center' }
                )
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfile()
    }, [reset])

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // For now, we'll use a data URL for preview
            // In production, you would upload to Supabase Storage
            const reader = new FileReader()
            reader.onload = (e) => {
                const result = e.target?.result as string
                setLogoPreview(result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleLogoClick = () => {
        fileInputRef.current?.click()
    }

    const onSubmit = async (data: CompanySettingsForm) => {
        setIsSaving(true)
        try {
            // Include the logo preview if it's a data URL (uploaded file)
            const formData = {
                ...data,
                logo_url: logoPreview || data.logo_url,
            }

            const response = await fetch('/api/invoicing/company-profile', {
                method: profile ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                throw new Error('Failed to save company profile')
            }

            const result = await response.json()
            if (result.success) {
                setProfile(result.data)
                toast.push(
                    <Notification type="success">
                        Company settings saved successfully!
                    </Notification>,
                    { placement: 'top-center' }
                )
            } else {
                throw new Error(result.error || 'Failed to save company profile')
            }
        } catch (error) {
            console.error('Error saving profile:', error)
            toast.push(
                <Notification type="danger">
                    Failed to save company settings. Please try again.
                </Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <Container>
                <div className="max-w-2xl mx-auto">
                    <AdaptiveCard>
                        <div className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div className="space-y-4">
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            </div>
                        </div>
                    </AdaptiveCard>
                </div>
            </Container>
        )
    }

    return (
        <Container>
            <div className="max-w-2xl mx-auto">
                <AdaptiveCard>
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <HiOutlineOfficeBuilding className="text-2xl text-blue-600" />
                            <h2 className="text-xl font-bold">Company Settings</h2>
                        </div>
                        <p className="text-gray-600">
                            Manage your company profile and logo for invoices
                        </p>
                    </div>

                    <Form onSubmit={handleSubmit(onSubmit)}>
                        {/* Logo Upload Section */}
                        <div className="mb-6 text-center">
                            <div className="mb-4">
                                <div className="relative inline-block">
                                    <Avatar
                                        size={100}
                                        src={logoPreview || '/img/avatars/thumb-1.jpg'}
                                        className="cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200"
                                        onClick={handleLogoClick}
                                        shape="square"
                                    />
                                    <Button
                                        size="xs"
                                        variant="solid"
                                        className="absolute bottom-0 right-0 rounded-full p-2"
                                        onClick={handleLogoClick}
                                        type="button"
                                    >
                                        <HiOutlinePhotograph />
                                    </Button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                            </div>
                            <p className="text-sm text-gray-500">
                                Click to upload your company logo
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <FormItem
                                label="Company Name"
                                invalid={Boolean(errors.company_name)}
                                errorMessage={errors.company_name?.message}
                                className="md:col-span-2"
                            >
                                <Controller
                                    name="company_name"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            placeholder="Enter your company name"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Contact Email"
                                invalid={Boolean(errors.contact_email)}
                                errorMessage={errors.contact_email?.message}
                            >
                                <Controller
                                    name="contact_email"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="email"
                                            placeholder="company@example.com"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Phone Number"
                                invalid={Boolean(errors.phone_number)}
                                errorMessage={errors.phone_number?.message}
                            >
                                <Controller
                                    name="phone_number"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="tel"
                                            placeholder="+1 (555) 123-4567"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Company Address"
                                invalid={Boolean(errors.company_address)}
                                errorMessage={errors.company_address?.message}
                                className="md:col-span-2"
                            >
                                <Controller
                                    name="company_address"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            placeholder="Enter your company address"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                type="submit"
                                loading={isSaving}
                                icon={<HiOutlineSave />}
                                variant="solid"
                            >
                                Save Settings
                            </Button>
                        </div>
                    </Form>
                </AdaptiveCard>
            </div>
        </Container>
    )
}

export default CompanySettings
