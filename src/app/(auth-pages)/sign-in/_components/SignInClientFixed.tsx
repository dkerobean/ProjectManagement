'use client'

import SignIn from '@/components/auth/SignIn'
import handleOauthSignIn from '@/server/actions/auth/handleOauthSignIn'
import SupabaseAuthService from '@/services/SupabaseAuthService'
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

const SignInClient = () => {
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
            // Try Supabase authentication first
            const { error: supabaseError } = await SupabaseAuthService.signIn(
                values.email,
                values.password
            )

            if (supabaseError) {
                const errorMessage = (supabaseError as any)?.message || 'Authentication failed'
                setMessage(errorMessage)
                setSubmitting(false)
                return
            }

            // If Supabase auth succeeds, also create NextAuth session
            const nextAuthResult = await signIn('credentials', {
                email: values.email,
                password: values.password,
                redirect: false,
            })

            if (nextAuthResult?.error) {
                setMessage('Authentication failed. Please try again.')
                setSubmitting(false)
                return
            }

            // Success - redirect to callback URL
            toast.push(
                <Notification type="success" title="Welcome Back!">
                    You have been successfully signed in.
                </Notification>,
                { placement: 'top-end' }
            )

            router.push(callbackUrl)
        } catch (error) {
            console.error('Sign in error:', error)
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
