'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import Dialog from '@/components/ui/Dialog'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import { HiOutlineCreditCard, HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const paymentMethodSchema = z.object({
    method_name: z.string().min(1, 'Method name is required'),
    payment_instructions: z.string().min(1, 'Payment instructions are required'),
})

type PaymentMethodForm = z.infer<typeof paymentMethodSchema>

interface PaymentMethod {
    id: string
    user_id: string
    method_name: string
    payment_instructions: string
    created_at: string
    updated_at: string
}

const PaymentMethods = () => {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<PaymentMethodForm>({
        resolver: zodResolver(paymentMethodSchema),
        defaultValues: {
            method_name: '',
            payment_instructions: '',
        },
    })

    // Load payment methods
    const fetchPaymentMethods = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/invoicing/payment-methods')

            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setPaymentMethods(data.data || [])
                }
            } else {
                throw new Error('Failed to fetch payment methods')
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error)
            toast.push(
                <Notification type="danger">
                    Failed to load payment methods
                </Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPaymentMethods()
    }, [])

    const handleAdd = () => {
        setEditingMethod(null)
        reset({
            method_name: '',
            payment_instructions: '',
        })
        setIsDialogOpen(true)
    }

    const handleEdit = (method: PaymentMethod) => {
        setEditingMethod(method)
        reset({
            method_name: method.method_name,
            payment_instructions: method.payment_instructions,
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this payment method?')) {
            return
        }

        try {
            setDeletingId(id)
            const response = await fetch(`/api/invoicing/payment-methods/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setPaymentMethods(methods => methods.filter(m => m.id !== id))
                toast.push(
                    <Notification type="success">
                        Payment method deleted successfully
                    </Notification>,
                    { placement: 'top-center' }
                )
            } else {
                throw new Error('Failed to delete payment method')
            }
        } catch (error) {
            console.error('Error deleting payment method:', error)
            toast.push(
                <Notification type="danger">
                    Failed to delete payment method
                </Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setDeletingId(null)
        }
    }

    const onSubmit = async (data: PaymentMethodForm) => {
        setIsSubmitting(true)
        try {
            const url = editingMethod
                ? `/api/invoicing/payment-methods/${editingMethod.id}`
                : '/api/invoicing/payment-methods'

            const method = editingMethod ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                throw new Error('Failed to save payment method')
            }

            const result = await response.json()
            if (result.success) {
                if (editingMethod) {
                    setPaymentMethods(methods =>
                        methods.map(m => m.id === editingMethod.id ? result.data : m)
                    )
                } else {
                    setPaymentMethods(methods => [...methods, result.data])
                }

                setIsDialogOpen(false)
                toast.push(
                    <Notification type="success">
                        Payment method saved successfully!
                    </Notification>,
                    { placement: 'top-center' }
                )
            } else {
                throw new Error(result.error || 'Failed to save payment method')
            }
        } catch (error) {
            console.error('Error saving payment method:', error)
            toast.push(
                <Notification type="danger">
                    Failed to save payment method. Please try again.
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
                <div className="max-w-4xl mx-auto">
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
            <div className="max-w-4xl mx-auto">
                <AdaptiveCard>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <HiOutlineCreditCard className="text-2xl text-blue-600" />
                                <h2 className="text-xl font-bold">Payment Methods</h2>
                            </div>
                            <p className="text-gray-600">
                                Manage payment methods to include in your invoices
                            </p>
                        </div>
                        <Button
                            variant="solid"
                            icon={<HiOutlinePlus />}
                            onClick={handleAdd}
                        >
                            Add Payment Method
                        </Button>
                    </div>

                    {paymentMethods.length === 0 ? (
                        <div className="text-center py-12">
                            <HiOutlineCreditCard className="text-6xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">
                                No payment methods yet
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Add your first payment method to include payment instructions in your invoices
                            </p>
                            <Button
                                variant="solid"
                                icon={<HiOutlinePlus />}
                                onClick={handleAdd}
                            >
                                Add Payment Method
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {paymentMethods.map((method) => (
                                <Card key={method.id} className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold mb-2">
                                                {method.method_name}
                                            </h3>
                                            <div className="text-gray-600 whitespace-pre-wrap">
                                                {method.payment_instructions}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                icon={<HiOutlinePencil />}
                                                onClick={() => handleEdit(method)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                icon={<HiOutlineTrash />}
                                                loading={deletingId === method.id}
                                                onClick={() => handleDelete(method.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </AdaptiveCard>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onRequestClose={() => setIsDialogOpen(false)}
            >
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                    </h3>

                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-4 mb-6">
                            <FormItem
                                label="Method Name"
                                invalid={Boolean(errors.method_name)}
                                errorMessage={errors.method_name?.message}
                            >
                                <Controller
                                    name="method_name"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            placeholder="e.g., Primary Bank Account, PayPal Business"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Payment Instructions"
                                invalid={Boolean(errors.payment_instructions)}
                                errorMessage={errors.payment_instructions?.message}
                            >
                                <Controller
                                    name="payment_instructions"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[120px]"
                                            placeholder="e.g., Bank Name: ABC Bank&#10;Account Number: 1234567890&#10;Routing Number: 123456789&#10;Account Name: Your Company Name"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="plain"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="solid"
                                loading={isSubmitting}
                            >
                                {editingMethod ? 'Update' : 'Add'} Payment Method
                            </Button>
                        </div>
                    </Form>
                </div>
            </Dialog>
        </Container>
    )
}

export default PaymentMethods
