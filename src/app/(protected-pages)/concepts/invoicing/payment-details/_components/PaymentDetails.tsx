'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select, { Option } from '@/components/ui/Select'
import { Form, FormItem } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { HiOutlineCreditCard, HiOutlineOfficeBuilding, HiOutlineSave, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const paymentMethodSchema = z.object({
    type: z.enum(['bank', 'card', 'paypal', 'other']),
    accountName: z.string().min(1, 'Account name is required'),
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
    bankName: z.string().optional(),
    cardNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    notes: z.string().optional(),
})

type PaymentMethodForm = z.infer<typeof paymentMethodSchema>

interface PaymentMethod {
    id: string
    type: 'bank' | 'card' | 'paypal' | 'other'
    accountName: string
    accountNumber?: string
    routingNumber?: string
    bankName?: string
    cardNumber?: string
    expiryDate?: string
    notes?: string
    isDefault: boolean
    createdAt: string
}

const PaymentDetails = () => {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
        {
            id: '1',
            type: 'bank',
            accountName: 'Business Checking',
            accountNumber: '****1234',
            routingNumber: '123456789',
            bankName: 'First National Bank',
            isDefault: true,
            createdAt: '2025-01-15'
        }
    ])
    const [isLoading, setIsLoading] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)

    const {
        control,
        handleSubmit,
        watch,
        reset,
        formState: { errors }
    } = useForm<PaymentMethodForm>({
        resolver: zodResolver(paymentMethodSchema),
        defaultValues: {
            type: 'bank',
            accountName: '',
            accountNumber: '',
            routingNumber: '',
            bankName: '',
            cardNumber: '',
            expiryDate: '',
            notes: ''
        }
    })

    const watchedType = watch('type')

    const onSubmit = async (data: PaymentMethodForm) => {
        try {
            setIsLoading(true)
            
            const newPaymentMethod: PaymentMethod = {
                id: Date.now().toString(),
                ...data,
                isDefault: paymentMethods.length === 0,
                createdAt: new Date().toISOString()
            }
            
            setPaymentMethods([...paymentMethods, newPaymentMethod])
            reset()
            setShowAddForm(false)
            
            toast.push(
                <Notification title="Success" type="success">
                    Payment method added successfully!
                </Notification>
            )
        } catch (error) {
            console.error('Error adding payment method:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to add payment method. Please try again.
                </Notification>
            )
        } finally {
            setIsLoading(false)
        }
    }

    const removePaymentMethod = (id: string) => {
        if (paymentMethods.length > 1) {
            const updatedMethods = paymentMethods.filter(method => method.id !== id)
            setPaymentMethods(updatedMethods)
            
            toast.push(
                <Notification title="Success" type="success">
                    Payment method removed successfully!
                </Notification>
            )
        }
    }

    const setDefaultPaymentMethod = (id: string) => {
        const updatedMethods = paymentMethods.map(method => ({
            ...method,
            isDefault: method.id === id
        }))
        setPaymentMethods(updatedMethods)
        
        toast.push(
            <Notification title="Success" type="success">
                Default payment method updated!
            </Notification>
        )
    }

    const getPaymentIcon = (type: string) => {
        switch (type) {
            case 'bank':
                return <HiOutlineOfficeBuilding className="text-blue-500" />
            case 'card':
                return <HiOutlineCreditCard className="text-green-500" />
            default:
                return <HiOutlineCreditCard className="text-gray-500" />
        }
    }

    const getPaymentTypeLabel = (type: string) => {
        switch (type) {
            case 'bank':
                return 'Bank Account'
            case 'card':
                return 'Credit Card'
            case 'paypal':
                return 'PayPal'
            case 'other':
                return 'Other'
            default:
                return type
        }
    }

    return (
        <div className="h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Payment Details
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Manage your payment methods and banking information
                    </p>
                </div>
                <Button
                    variant="solid"
                    size="sm"
                    icon={<HiOutlinePlus />}
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    Add Payment Method
                </Button>
            </div>

            {/* Add Payment Method Form */}
            {showAddForm && (
                <Card className="p-6 mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Add New Payment Method
                    </h4>
                    
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormItem
                                label="Payment Type"
                                invalid={Boolean(errors.type)}
                                errorMessage={errors.type?.message}
                            >
                                <Controller
                                    name="type"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={{ label: getPaymentTypeLabel(field.value), value: field.value }}
                                            onChange={(option) => field.onChange(option?.value)}
                                        >
                                            <Option value="bank">Bank Account</Option>
                                            <Option value="card">Credit Card</Option>
                                            <Option value="paypal">PayPal</Option>
                                            <Option value="other">Other</Option>
                                        </Select>
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Account Name"
                                invalid={Boolean(errors.accountName)}
                                errorMessage={errors.accountName?.message}
                            >
                                <Controller
                                    name="accountName"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="Account or card name"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                        </div>

                        {/* Bank Account Fields */}
                        {watchedType === 'bank' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <FormItem
                                    label="Bank Name"
                                    invalid={Boolean(errors.bankName)}
                                    errorMessage={errors.bankName?.message}
                                >
                                    <Controller
                                        name="bankName"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="Bank name"
                                                {...field}
                                            />
                                        )}
                                    />
                                </FormItem>

                                <FormItem
                                    label="Account Number"
                                    invalid={Boolean(errors.accountNumber)}
                                    errorMessage={errors.accountNumber?.message}
                                >
                                    <Controller
                                        name="accountNumber"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="Account number"
                                                {...field}
                                            />
                                        )}
                                    />
                                </FormItem>

                                <FormItem
                                    label="Routing Number"
                                    invalid={Boolean(errors.routingNumber)}
                                    errorMessage={errors.routingNumber?.message}
                                >
                                    <Controller
                                        name="routingNumber"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="Routing number"
                                                {...field}
                                            />
                                        )}
                                    />
                                </FormItem>
                            </div>
                        )}

                        {/* Credit Card Fields */}
                        {watchedType === 'card' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <FormItem
                                    label="Card Number"
                                    invalid={Boolean(errors.cardNumber)}
                                    errorMessage={errors.cardNumber?.message}
                                >
                                    <Controller
                                        name="cardNumber"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="**** **** **** ****"
                                                {...field}
                                            />
                                        )}
                                    />
                                </FormItem>

                                <FormItem
                                    label="Expiry Date"
                                    invalid={Boolean(errors.expiryDate)}
                                    errorMessage={errors.expiryDate?.message}
                                >
                                    <Controller
                                        name="expiryDate"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="MM/YY"
                                                {...field}
                                            />
                                        )}
                                    />
                                </FormItem>
                            </div>
                        )}

                        <FormItem
                            label="Notes (Optional)"
                            invalid={Boolean(errors.notes)}
                            errorMessage={errors.notes?.message}
                        >
                            <Controller
                                name="notes"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        textArea
                                        placeholder="Additional notes or instructions..."
                                        rows={3}
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="plain"
                                onClick={() => setShowAddForm(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="solid"
                                type="submit"
                                icon={<HiOutlineSave />}
                                loading={isLoading}
                            >
                                Save Payment Method
                            </Button>
                        </div>
                    </Form>
                </Card>
            )}

            {/* Payment Methods List */}
            <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Saved Payment Methods
                </h4>
                
                {paymentMethods.length === 0 ? (
                    <Card className="p-8 text-center">
                        <HiOutlineCreditCard className="mx-auto text-4xl text-gray-400 mb-4" />
                        <p className="text-gray-500 mb-4">No payment methods added yet</p>
                        <Button
                            variant="solid"
                            icon={<HiOutlinePlus />}
                            onClick={() => setShowAddForm(true)}
                        >
                            Add Your First Payment Method
                        </Button>
                    </Card>
                ) : (
                    paymentMethods.map((method) => (
                        <Card key={method.id} className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                        {getPaymentIcon(method.type)}
                                    </div>
                                    
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                                                {method.accountName}
                                            </h5>
                                            {method.isDefault && (
                                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {getPaymentTypeLabel(method.type)}
                                            {method.accountNumber && ` • ****${method.accountNumber.slice(-4)}`}
                                            {method.bankName && ` • ${method.bankName}`}
                                        </p>
                                        {method.notes && (
                                            <p className="text-xs text-gray-500 mt-1">{method.notes}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {!method.isDefault && (
                                        <Button
                                            variant="plain"
                                            size="sm"
                                            onClick={() => setDefaultPaymentMethod(method.id)}
                                        >
                                            Set as Default
                                        </Button>
                                    )}
                                    {paymentMethods.length > 1 && (
                                        <Button
                                            variant="plain"
                                            size="sm"
                                            icon={<HiOutlineTrash />}
                                            onClick={() => removePaymentMethod(method.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

export default PaymentDetails
