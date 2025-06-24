'use client'

import SignIn from '@/components/auth/SignIn'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import appConfig from '@/configs/app.config'
import type {
    OnSignInPayload,
    OnOauthSignInPayload,
} from '@/components/auth/SignIn'

interface SignInClientProps {
    handleOauthSignIn: (signInMethod: string, callbackUrl?: string) => Promise<void>
}

const SignInClient = ({ handleOauthSignIn }: SignInClientProps) => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const callbackUrl = searchParams.get(REDIRECT_URL_KEY) || appConfig.authenticatedEntryPath

    const handleSignIn = async ({
        values,
        setSubmitting,
        setMessage,
    }: OnSignInPayload) => {
        setSubmitting(true)
        setMessage('')

        try {
            // Use NextAuth with credentials provider (which handles Supabase internally)
            const result = await signIn('credentials', {
                email: values.email,
                password: values.password,
                redirect: false,
            })

            if (result?.error) {
                // Show error toast
                toast.push(
                    <Notification type="danger" title="Sign In Failed">
                        Please check your email and password, and ensure your email is verified.
                    </Notification>,
                    { placement: 'top-end' }
                )
                setMessage('Authentication failed. Please check your credentials.')
                setSubmitting(false)
                return
            }

            // Success - show toast and redirect
            toast.push(
                <Notification type="success" title="Welcome Back!">
                    You have been successfully signed in.
                </Notification>,
                { placement: 'top-end' }
            )

            // Small delay to show the success toast before redirect
            setTimeout(() => {
                router.push(callbackUrl)
            }, 1000)

        } catch (error) {
            console.error('Sign in error:', error)
            toast.push(
                <Notification type="danger" title="Sign In Error">
                    An unexpected error occurred. Please try again.
                </Notification>,
                { placement: 'top-end' }
            )
            setMessage('An unexpected error occurred. Please try again.')
            setSubmitting(false)
        }
    }

    const handleOAuthSignIn = async ({ type }: OnOauthSignInPayload) => {
        try {
            if (type === 'google') {
                await handleOauthSignIn('google')
            }
            if (type === 'github') {
                await handleOauthSignIn('github')
            }
        } catch (error) {
            console.error('OAuth sign in error:', error)
            toast.push(
                <Notification type="danger" title="OAuth Sign In Failed">
                    Please try again or use email/password.
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    return <SignIn onSignIn={handleSignIn} onOauthSignIn={handleOAuthSignIn} />
}

export default SignInClient
