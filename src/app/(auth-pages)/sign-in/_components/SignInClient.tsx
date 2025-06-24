'use client'

import SignIn from '@/components/auth/SignIn'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import appConfig from '@/configs/app.config'
import { useEffect } from 'react'
import type {
    OnSignInPayload,
    OnOauthSignInPayload,
} from '@/components/auth/SignIn'

interface SignInClientProps {
    handleOauthSignIn: (signInMethod: string, callbackUrl?: string) => Promise<void>
}

const SignInClient = ({ handleOauthSignIn }: SignInClientProps) => {
    const searchParams = useSearchParams()
    const { data: session, status } = useSession()
    const callbackUrl = searchParams.get(REDIRECT_URL_KEY) || appConfig.authenticatedEntryPath

    // Monitor session changes and redirect when authenticated
    useEffect(() => {
        console.log('🔍 Session Status Change:', { 
            status, 
            hasSession: !!session, 
            hasUser: !!session?.user,
            userEmail: session?.user?.email,
            callbackUrl 
        })
        
        if (status === 'authenticated' && session?.user) {
            console.log('✅ Session authenticated, redirecting to:', callbackUrl)
            toast.push(
                <Notification type="success" title="Welcome Back!">
                    You have been successfully signed in.
                </Notification>,
                { placement: 'top-end' }
            )
            
            setTimeout(() => {
                window.location.href = callbackUrl
            }, 500)
        }
    }, [status, session, callbackUrl])

    const handleSignIn = async ({
        values,
        setSubmitting,
        setMessage,
    }: OnSignInPayload) => {
        setSubmitting(true)
        setMessage('')

        try {
            console.log('🔄 Attempting sign-in with redirect to:', callbackUrl)
            
            // Use NextAuth with built-in redirect - this should work now with the fixed auth config
            await signIn('credentials', {
                email: values.email,
                password: values.password,
                callbackUrl: callbackUrl,
                redirect: true, // Let NextAuth handle everything
            })
            
            // If we reach this point, something went wrong (should have redirected)
            console.log('⚠️ Sign-in completed but no redirect occurred')
            setSubmitting(false)
            
        } catch (error) {
            console.error('❌ Sign in error:', error)
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
            console.log('🔄 OAuth sign-in initiated for:', type, 'with callback:', callbackUrl)
            if (type === 'google') {
                await handleOauthSignIn('google', callbackUrl)
            }
            if (type === 'github') {
                await handleOauthSignIn('github', callbackUrl)
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
