'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import SupabaseAuthService from '@/services/SupabaseAuthService'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'

export type OnForgotPasswordPayload = {
    values: ForgotPasswordFormSchema
    setSubmitting: (isSubmitting: boolean) => void
    setMessage: (message: string) => void
}

export type OnForgotPassword = (payload: OnForgotPasswordPayload) => void

interface EnhancedForgotPasswordFormProps extends CommonProps {
    setMessage: (message: string) => void
    onForgotPassword?: OnForgotPassword
    onBackToSignIn?: () => void
}

type ForgotPasswordFormSchema = {
    email: string
}

const validationSchema: ZodType<ForgotPasswordFormSchema> = z.object({
    email: z
        .string({ required_error: 'Please enter your email' })
        .email('Please enter a valid email address'),
})

const EnhancedForgotPasswordForm = (props: EnhancedForgotPasswordFormProps) => {
    const [isSubmitting, setSubmitting] = useState<boolean>(false)
    const [emailSent, setEmailSent] = useState<boolean>(false)

    const { className, setMessage, onForgotPassword, onBackToSignIn } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
        getValues,
    } = useForm<ForgotPasswordFormSchema>({
        resolver: zodResolver(validationSchema),
    })

    const handleForgotPassword = async (values: ForgotPasswordFormSchema) => {
        setSubmitting(true)
        setMessage('')

        try {
            const { data, error } = await SupabaseAuthService.resetPassword(
                values.email
            )

            if (error) {
                setMessage(error.message)
                toast.push(
                    <Notification type="danger" title="Password Reset Failed">
                        {error.message}
                    </Notification>,
                    { placement: 'top-end' }
                )
            } else {
                setEmailSent(true)
                setMessage(
                    'Password reset email sent! Please check your inbox and follow the instructions.'
                )
                toast.push(
                    <Notification type="success" title="Email Sent">
                        Password reset instructions have been sent to your email.
                    </Notification>,
                    { placement: 'top-end' }
                )
            }
        } catch (error) {
            const errorMessage = 'An unexpected error occurred. Please try again.'
            setMessage(errorMessage)
            console.error('Forgot password error:', error)
        } finally {
            setSubmitting(false)
        }

        // Call custom onForgotPassword if provided
        if (onForgotPassword) {
            onForgotPassword({ values, setSubmitting, setMessage })
        }
    }

    const handleResendEmail = async () => {
        const email = getValues('email')
        if (email) {
            await handleForgotPassword({ email })
        }
    }

    if (emailSent) {
        return (
            <div className={className}>
                <div className="text-center mb-6">
                    <div className="text-green-600 mb-4">
                        <svg
                            className="w-16 h-16 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Email Sent!</h3>
                    <p className="text-gray-600 mb-6">
                        We&apos;ve sent password reset instructions to your email address.
                        Please check your inbox and follow the link to reset your password.
                    </p>
                </div>

                <div className="space-y-4">
                    <Button
                        block
                        variant="solid"
                        onClick={handleResendEmail}
                        loading={isSubmitting}
                    >
                        {isSubmitting ? 'Resending...' : 'Resend Email'}
                    </Button>

                    {onBackToSignIn && (
                        <Button
                            block
                            variant="plain"
                            onClick={onBackToSignIn}
                        >
                            Back to Sign In
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={className}>
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Forgot Password?</h3>
                <p className="text-gray-600">
                    Enter your email address and we&apos;ll send you instructions to reset your password.
                </p>
            </div>

            <Form onSubmit={handleSubmit(handleForgotPassword)}>
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

                <div className="space-y-4">
                    <Button
                        block
                        loading={isSubmitting}
                        variant="solid"
                        type="submit"
                    >
                        {isSubmitting ? 'Sending...' : 'Send Reset Email'}
                    </Button>

                    {onBackToSignIn && (
                        <Button
                            block
                            variant="plain"
                            onClick={onBackToSignIn}
                        >
                            Back to Sign In
                        </Button>
                    )}
                </div>
            </Form>
        </div>
    )
}

export default EnhancedForgotPasswordForm
