'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { Form, FormItem } from '@/components/ui/Form'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiCreateClient } from '@/services/ClientsService'
import type { ClientFormSchema } from '../../types'
import type { ZodType } from 'zod'

const validationSchema: ZodType<ClientFormSchema> = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional(),
    country: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
})

const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
]

const ClientCreate = () => {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [previewAvatar, setPreviewAvatar] = useState('https://gafpwitcdoiviixlxnuz.supabase.co/storage/v1/object/public/client-images/default-client-avatar.png')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<ClientFormSchema>({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            company: '',
            address: '',
            country: '',
            status: 'active',
        },
        resolver: zodResolver(validationSchema),
    })

    const onSubmit = async (values: ClientFormSchema) => {
        setIsSubmitting(true)
        try {
            console.log('🚀 Starting client creation...')
            console.log('📋 Form values:', values)

            // Validate data before sending
            if (!values.name || !values.email) {
                throw new Error('Name and email are required')
            }

            console.log('✅ Validation passed, calling API...')
            // Remove image_url from values since we're not using it
            const { ...clientData } = values
            const result = await apiCreateClient(clientData)
            console.log('📡 API call completed:', result)

            toast.push(
                <Notification type="success">
                    Client created successfully!
                </Notification>,
                { placement: 'top-center' }
            )

            console.log('🎉 Success! Redirecting to client list...')
            router.push('/concepts/clients/client-list')
        } catch (error) {
            console.error('❌ Error creating client:', error)
            console.error('🔍 Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'No stack trace'
            })

            toast.push(
                <Notification type="danger">
                    Failed to create client. Please try again. {error instanceof Error ? error.message : ''}
                </Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // For now, we'll just use a preview URL
            // In a real application, you'd upload the file to a storage service
            const reader = new FileReader()
            reader.onload = (e) => {
                const result = e.target?.result as string
                setPreviewAvatar(result)
                // Update the form value with the preview URL
                // In production, this would be the uploaded file URL
            }
            reader.readAsDataURL(file)
        }
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <Container>
            <div className="max-w-2xl mx-auto">
                <AdaptiveCard>
                    <div className="mb-6 text-center">
                        <div className="relative inline-block">
                            <Avatar
                                size={80}
                                src={previewAvatar}
                                className="mx-auto mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={handleAvatarClick}
                            />
                            <Button
                                size="xs"
                                variant="solid"
                                className="absolute bottom-2 right-2 rounded-full p-2"
                                onClick={handleAvatarClick}
                            >
                                📷
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                        <h4>Create New Client</h4>
                        <p className="text-gray-500">Add a new client to your system</p>
                        <p className="text-xs text-gray-400 mt-1">Click on the avatar to upload an image</p>
                    </div>

                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem
                                label="Name"
                                invalid={Boolean(errors.name)}
                                errorMessage={errors.name?.message}
                            >
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            placeholder="Enter client name"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Email"
                                invalid={Boolean(errors.email)}
                                errorMessage={errors.email?.message}
                            >
                                <Controller
                                    name="email"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="email"
                                            placeholder="Enter email address"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Phone"
                                invalid={Boolean(errors.phone)}
                                errorMessage={errors.phone?.message}
                            >
                                <Controller
                                    name="phone"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="tel"
                                            placeholder="Enter phone number"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Company"
                                invalid={Boolean(errors.company)}
                                errorMessage={errors.company?.message}
                            >
                                <Controller
                                    name="company"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            placeholder="Enter company name"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Address"
                                className="md:col-span-2"
                                invalid={Boolean(errors.address)}
                                errorMessage={errors.address?.message}
                            >
                                <Controller
                                    name="address"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            placeholder="Enter street address"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Country"
                                invalid={Boolean(errors.country)}
                                errorMessage={errors.country?.message}
                            >
                                <Controller
                                    name="country"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            placeholder="Enter country"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Status"
                                invalid={Boolean(errors.status)}
                                errorMessage={errors.status?.message}
                            >
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => {
                                        // Convert the string value to the expected format for the Select component
                                        const selectValue = statusOptions.find(
                                            option => option.value === field.value
                                        )

                                        return (
                                            <Select
                                                options={statusOptions}
                                                placeholder="Select status"
                                                value={selectValue}
                                                onChange={(option) => field.onChange(option?.value)}
                                            />
                                        )
                                    }}
                                />
                            </FormItem>

                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                type="button"
                                onClick={() => router.push('/concepts/clients/client-list')}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="solid"
                                type="submit"
                                loading={isSubmitting}
                            >
                                Create Client
                            </Button>
                        </div>
                    </Form>
                </AdaptiveCard>
            </div>
        </Container>
    )
}

export default ClientCreate
