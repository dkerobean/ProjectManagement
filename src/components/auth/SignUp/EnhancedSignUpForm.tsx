'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { FormItem, Form } from '@/components/ui/Form'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import SupabaseAuthService from '@/services/SupabaseAuthService'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'

type EnhancedSignUpFormSchema = {
    name: string
    email: string
    password: string
    confirmPassword: string
    timezone: string
    role?: string
}

export type OnEnhancedSignUpPayload = {
    values: EnhancedSignUpFormSchema
    setSubmitting: (isSubmitting: boolean) => void
    setMessage: (message: string) => void
}

export type OnEnhancedSignUp = (payload: OnEnhancedSignUpPayload) => void

interface EnhancedSignUpFormProps extends CommonProps {
    setMessage: (message: string) => void
    onSignUp?: OnEnhancedSignUp
    showRoleSelection?: boolean
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
    { value: 'member', label: 'Member' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'admin', label: 'Admin' },
]

const validationSchema: ZodType<EnhancedSignUpFormSchema> = z
    .object({
        email: z
            .string({ required_error: 'Please enter your email' })
            .email('Please enter a valid email address'),
        name: z
            .string({ required_error: 'Please enter your name' })
            .min(2, 'Name must be at least 2 characters'),
        password: z
            .string({ required_error: 'Password Required' })
            .min(8, 'Password must be at least 8 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
                'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            ),
        confirmPassword: z.string({
            required_error: 'Confirm Password Required',
        }),
        timezone: z.string({ required_error: 'Please select your timezone' }),
        role: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

const EnhancedSignUpForm = (props: EnhancedSignUpFormProps) => {
    const { onSignUp, className, setMessage, showRoleSelection = false } = props
    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<EnhancedSignUpFormSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            timezone: 'UTC',
            role: 'member',
        },
    })

    const handleSignUp = async (values: EnhancedSignUpFormSchema) => {
        setSubmitting(true)
        setMessage('')

        try {
            const { data, error } = await SupabaseAuthService.signUp(
                values.email,
                values.password,
                {
                    name: values.name,
                    timezone: values.timezone,
                    role: values.role || 'member',
                }
            )

            if (error) {
                setMessage(error.message)
            } else {
                setMessage(
                    'Registration successful! Please check your email to verify your account.'
                )
                toast.push(
                    <Notification type="success" title="Registration Successful">
                        Please check your email to verify your account before signing in.
                    </Notification>,
                    { placement: 'top-end' }
                )
            }
        } catch (error) {
            const errorMessage = 'An unexpected error occurred. Please try again.'
            setMessage(errorMessage)
            console.error('Registration error:', error)
        } finally {
            setSubmitting(false)
        }

        // Call custom onSignUp if provided
        if (onSignUp) {
            onSignUp({ values, setSubmitting, setMessage })
        }
    }

    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(handleSignUp)}>
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
                                autoComplete="name"
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
                                placeholder="Enter your email address"
                                autoComplete="email"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Password"
                    invalid={Boolean(errors.password)}
                    errorMessage={errors.password?.message}
                >
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="new-password"
                                placeholder="Create a strong password"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Confirm Password"
                    invalid={Boolean(errors.confirmPassword)}
                    errorMessage={errors.confirmPassword?.message}
                >
                    <Controller
                        name="confirmPassword"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="new-password"
                                placeholder="Confirm your password"
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

                {showRoleSelection && (
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
                                    placeholder="Select your role"
                                    options={roleOptions}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                )}

                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                    className="mt-6"
                >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
            </Form>
        </div>
    )
}

export default EnhancedSignUpForm
