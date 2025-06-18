'use client'

import { useState } from 'react'
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

const ClientCreate = () => {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

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
            city: '',
            state: '',
            country: '',
            postal_code: '',
            image_url: 'assets/img/profiles/avatar-01.jpg',
            status: 'active',
        },
        resolver: zodResolver(validationSchema),
    })

    const onSubmit = async (values: ClientFormSchema) => {
        setIsSubmitting(true)
        try {
            await apiCreateClient(values)

            toast.push(
                <Notification type="success">
                    Client created successfully!
                </Notification>,
                { placement: 'top-center' }
            )

            router.push('/concepts/clients/client-list')
        } catch (error) {
            console.error('Error creating client:', error)
            toast.push(
                <Notification type="danger">
                    Failed to create client. Please try again.
                </Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Container>
            <div className="max-w-2xl mx-auto">
                <AdaptiveCard>
                    <div className="mb-6 text-center">
                        <Avatar
                            size={80}
                            src="assets/img/profiles/avatar-01.jpg"
                            className="mx-auto mb-4"
                        />
                        <h4>Create New Client</h4>
                        <p className="text-gray-500">Add a new client to your system</p>
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
                                    render={({ field }) => (
                                        <Select
                                            options={statusOptions}
                                            placeholder="Select status"
                                            {...field}
                                        />
                                    )}
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
