'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import SupabaseAuthService from '@/services/SupabaseAuthService'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import classNames from '@/utils/classNames'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'
import type { ReactNode } from 'react'

export type OnEnhancedSignInPayload = {
    values: EnhancedSignInFormSchema
    setSubmitting: (isSubmitting: boolean) => void
    setMessage: (message: string) => void
}

export type OnEnhancedSignIn = (payload: OnEnhancedSignInPayload) => void

interface EnhancedSignInFormProps extends CommonProps {
    passwordHint?: string | ReactNode
    setMessage: (message: string) => void
    onSignIn?: OnEnhancedSignIn
    callbackUrl?: string
    useSupabaseAuth?: boolean
}

type EnhancedSignInFormSchema = {
    email: string
    password: string
    rememberMe?: boolean
}

const validationSchema: ZodType<EnhancedSignInFormSchema> = z.object({
    email: z
        .string({ required_error: 'Please enter your email' })
        .email('Please enter a valid email address'),
    password: z
        .string({ required_error: 'Please enter your password' })
        .min(1, { message: 'Please enter your password' }),
    rememberMe: z.boolean().optional(),
})

const EnhancedSignInForm = (props: EnhancedSignInFormProps) => {
    const [isSubmitting, setSubmitting] = useState<boolean>(false)
    const router = useRouter()

    const {
        className,
        setMessage,
        onSignIn,
        passwordHint,
        callbackUrl = '/dashboards/project',
        useSupabaseAuth = true
    } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<EnhancedSignInFormSchema>({
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
        resolver: zodResolver(validationSchema),
    })

    const handleSignIn = async (values: EnhancedSignInFormSchema) => {
        setSubmitting(true)
        setMessage('')

        try {
            if (useSupabaseAuth) {
                // Use Supabase Auth directly
                const { data, error } = await SupabaseAuthService.signIn(
                    values.email,
                    values.password
                )

                if (error) {
                    setMessage(error.message)
                    toast.push(
                        <Notification type="danger" title="Login Failed">
                            {error.message}
                        </Notification>,
                        { placement: 'top-end' }
                    )
                } else {
                    // Also sign in with NextAuth for session management
                    await signIn('credentials', {
                        email: values.email,
                        password: values.password,
                        redirect: false,
                    })

                    toast.push(
                        <Notification type="success" title="Login Successful">
                            Welcome back!
                        </Notification>,
                        { placement: 'top-end' }
                    )

                    router.push(callbackUrl)
                }
            } else {
                // Use NextAuth only
                const result = await signIn('credentials', {
                    email: values.email,
                    password: values.password,
                    redirect: false,
                })

                if (result?.error) {
                    setMessage('Invalid credentials. Please try again.')
                    toast.push(
                        <Notification type="danger" title="Login Failed">
                            Invalid credentials. Please try again.
                        </Notification>,
                        { placement: 'top-end' }
                    )
                } else {
                    toast.push(
                        <Notification type="success" title="Login Successful">
                            Welcome back!
                        </Notification>,
                        { placement: 'top-end' }
                    )

                    router.push(callbackUrl)
                }
            }
        } catch (error) {
            const errorMessage = 'An unexpected error occurred. Please try again.'
            setMessage(errorMessage)
            console.error('Login error:', error)

            toast.push(
                <Notification type="danger" title="Login Error">
                    {errorMessage}
                </Notification>,
                { placement: 'top-end' }
            )
        } finally {
            setSubmitting(false)
        }

        // Call custom onSignIn if provided
        if (onSignIn) {
            onSignIn({ values, setSubmitting, setMessage })
        }
    }

    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(handleSignIn)}>
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
                    className={classNames(
                        passwordHint ? 'mb-0' : '',
                        errors.password?.message ? 'mb-8' : '',
                    )}
                >
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <PasswordInput
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {passwordHint}

                <div className="flex items-center justify-between mb-6">
                    <Controller
                        name="rememberMe"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={onChange}
                                    className="mr-2"
                                />
                                <span className="text-sm">Remember me</span>
                            </label>
                        )}
                    />
                </div>

                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                    className="mb-4"
                >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
            </Form>
        </div>
    )
}

export default EnhancedSignInForm
