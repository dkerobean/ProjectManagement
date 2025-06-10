'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import SupabaseAuthService from '@/services/SupabaseAuthService'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'

export type OnResetPasswordPayload = {
    values: ResetPasswordFormSchema
    setSubmitting: (isSubmitting: boolean) => void
    setMessage: (message: string) => void
}

export type OnResetPassword = (payload: OnResetPasswordPayload) => void

interface EnhancedResetPasswordFormProps extends CommonProps {
    setMessage: (message: string) => void
    onResetPassword?: OnResetPassword
}

type ResetPasswordFormSchema = {
    password: string
    confirmPassword: string
}

const validationSchema: ZodType<ResetPasswordFormSchema> = z
    .object({
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
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

const EnhancedResetPasswordForm = (props: EnhancedResetPasswordFormProps) => {
    const [isSubmitting, setSubmitting] = useState<boolean>(false)
    const [isValidToken, setIsValidToken] = useState<boolean>(true)
    const [passwordReset, setPasswordReset] = useState<boolean>(false)

    const router = useRouter()
    const searchParams = useSearchParams()

    const { className, setMessage, onResetPassword } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<ResetPasswordFormSchema>({
        resolver: zodResolver(validationSchema),
    })

    useEffect(() => {
        // Check if we have the necessary URL parameters for password reset
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')

        if (type !== 'recovery' || !accessToken || !refreshToken) {
            setIsValidToken(false)
            setMessage('Invalid or expired password reset link.')
        }
    }, [searchParams, setMessage])

    const handleResetPassword = async (values: ResetPasswordFormSchema) => {
        setSubmitting(true)
        setMessage('')

        try {
            const { data, error } = await SupabaseAuthService.updatePassword(
                values.password
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
                setPasswordReset(true)
                setMessage('Password has been successfully reset!')
                toast.push(
                    <Notification type="success" title="Password Reset Successful">
                        Your password has been updated. You can now sign in with your new password.
                    </Notification>,
                    { placement: 'top-end' }
                )

                // Redirect to sign in page after a short delay
                setTimeout(() => {
                    router.push('/auth/sign-in-simple')
                }, 2000)
            }
        } catch (error) {
            const errorMessage = 'An unexpected error occurred. Please try again.'
            setMessage(errorMessage)
            console.error('Reset password error:', error)
        } finally {
            setSubmitting(false)
        }

        // Call custom onResetPassword if provided
        if (onResetPassword) {
            onResetPassword({ values, setSubmitting, setMessage })
        }
    }

    const handleBackToSignIn = () => {
        router.push('/auth/sign-in-simple')
    }

    if (!isValidToken) {
        return (
            <div className={className}>
                <div className="text-center">
                    <div className="text-red-600 mb-4">
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
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Invalid Reset Link</h3>
                    <p className="text-gray-600 mb-6">
                        This password reset link is invalid or has expired.
                        Please request a new password reset email.
                    </p>
                    <Button
                        block
                        variant="solid"
                        onClick={handleBackToSignIn}
                    >
                        Back to Sign In
                    </Button>
                </div>
            </div>
        )
    }

    if (passwordReset) {
        return (
            <div className={className}>
                <div className="text-center">
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Password Reset Successful!</h3>
                    <p className="text-gray-600 mb-6">
                        Your password has been successfully updated.
                        You will be redirected to the sign in page shortly.
                    </p>
                    <Button
                        block
                        variant="solid"
                        onClick={handleBackToSignIn}
                    >
                        Continue to Sign In
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className={className}>
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Reset Your Password</h3>
                <p className="text-gray-600">
                    Please enter your new password below.
                </p>
            </div>

            <Form onSubmit={handleSubmit(handleResetPassword)}>
                <FormItem
                    label="New Password"
                    invalid={Boolean(errors.password)}
                    errorMessage={errors.password?.message}
                >
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <PasswordInput
                                placeholder="Enter your new password"
                                autoComplete="new-password"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Confirm New Password"
                    invalid={Boolean(errors.confirmPassword)}
                    errorMessage={errors.confirmPassword?.message}
                >
                    <Controller
                        name="confirmPassword"
                        control={control}
                        render={({ field }) => (
                            <PasswordInput
                                placeholder="Confirm your new password"
                                autoComplete="new-password"
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
                        {isSubmitting ? 'Updating Password...' : 'Update Password'}
                    </Button>

                    <Button
                        block
                        variant="plain"
                        onClick={handleBackToSignIn}
                    >
                        Back to Sign In
                    </Button>
                </div>
            </Form>
        </div>
    )
}

export default EnhancedResetPasswordForm
