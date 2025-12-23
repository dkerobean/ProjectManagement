'use client'

import { useState, useEffect, useRef } from 'react'
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
import { apiGetClient, apiUpdateClient } from '@/services/ClientsService'
import type { ClientFormSchema, Client } from '../../../types'
import type { ZodType } from 'zod'

const validationSchema: ZodType<ClientFormSchema> = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postal_code: z.string().optional(),
    image_url: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
})

const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
]

type ClientEditProps = {
    clientId: string
}

const ClientEdit = ({ clientId }: ClientEditProps) => {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [client, setClient] = useState<Client | null>(null)
    const [previewAvatar, setPreviewAvatar] = useState('https://gafpwitcdoiviixlxnuz.supabase.co/storage/v1/object/public/client-images/default-client-avatar.png')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<ClientFormSchema>({
        resolver: zodResolver(validationSchema),
    })

    useEffect(() => {
        const fetchClient = async () => {
            try {
                setIsLoading(true)
                console.log('Fetching client with ID:', clientId)
                type ApiResponse = {
                    success: boolean;
                    data: Client;
                }
                const response = await apiGetClient<ApiResponse, { id: string }>({ id: clientId })
                console.log('API Response:', response)

                if (response && response.success && response.data) {
                    const clientData = response.data
                    console.log('Setting client data:', clientData)
                    setClient(clientData)

                    // Set preview avatar to client's image or default
                    const avatarUrl = clientData.image_url || 'https://gafpwitcdoiviixlxnuz.supabase.co/storage/v1/object/public/client-images/default-client-avatar.png'
                    setPreviewAvatar(avatarUrl)

                    reset({
                        name: clientData.name,
                        email: clientData.email,
                        phone: clientData.phone || '',
                        company: clientData.company || '',
                        address: clientData.address || '',
                        city: clientData.city || '',
                        state: clientData.state || '',
                        country: clientData.country || '',
                        postal_code: clientData.postal_code || '',
                        image_url: avatarUrl,
                        status: clientData.status || 'active',
                    })
                }
            } catch (error) {
                console.error('Error fetching client:', error)
                toast.push(
                    <Notification type="danger">
                        Failed to load client data
                    </Notification>,
                    { placement: 'top-center' }
                )
            } finally {
                setIsLoading(false)
            }
        }

        if (clientId) {
            fetchClient()
        }
    }, [clientId, reset])

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

    const onSubmit = async (values: ClientFormSchema) => {
        setIsSubmitting(true)
        try {
            await apiUpdateClient({
                id: clientId,
                ...values,
            })

            toast.push(
                <Notification type="success">
                    Client updated successfully!
                </Notification>,
                { placement: 'top-center' }
            )

            router.push('/concepts/clients/client-list')
        } catch (error) {
            console.error('Error updating client:', error)
            toast.push(
                <Notification type="danger">
                    Failed to update client. Please try again.
                </Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <Container>
                <div className="max-w-2xl mx-auto">
                    <AdaptiveCard>
                        <div className="animate-pulse">
                            <div className="mb-6 text-center">
                                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                                <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
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
                        <h4>Edit Client</h4>
                        <p className="text-gray-500">Update client information</p>
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
                                label="City"
                                invalid={Boolean(errors.city)}
                                errorMessage={errors.city?.message}
                            >
                                <Controller
                                    name="city"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            placeholder="Enter city"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="State"
                                invalid={Boolean(errors.state)}
                                errorMessage={errors.state?.message}
                            >
                                <Controller
                                    name="state"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            placeholder="Enter state"
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
                                label="Postal Code"
                                invalid={Boolean(errors.postal_code)}
                                errorMessage={errors.postal_code?.message}
                            >
                                <Controller
                                    name="postal_code"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            placeholder="Enter postal code"
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
                                Update Client
                            </Button>
                        </div>
                    </Form>
                </AdaptiveCard>
            </div>
        </Container>
    )
}

export default ClientEdit
