'use client'

import SignIn from '@/components/auth/SignIn'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
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
    const router = useRouter()
    const { data: session, status } = useSession()

    // Debug the callbackUrl to see what's happening
    const configuredPath = '/dashboards/project' // Hardcode temporarily
    const searchParamUrl = searchParams.get(REDIRECT_URL_KEY)
    const callbackUrl = searchParamUrl || configuredPath

    console.log('🔍 SignInClient Debug:', {
        searchParamUrl,
        configuredPath,
        callbackUrl,
        searchParams: Object.fromEntries(searchParams.entries())
    })

    // Check for error in URL parameters (from NextAuth redirects)
    useEffect(() => {
        const error = searchParams.get('error')
        const code = searchParams.get('code')
        
        if (error) {
            console.log('🔍 Error detected in URL:', { error, code })
            
            // Handle errors from NextAuth redirects
            switch (error) {
                case 'CredentialsSignin':
                    toast.error('Invalid email or password. Please check your credentials and try again.', {
                        duration: 5000,
                    })
                    break
                case 'Configuration':
                    toast.error('Authentication service is temporarily unavailable. Please try again later.', {
                        duration: 5000,
                    })
                    break
                case 'AccessDenied':
                    toast.error('Access denied. Please contact support if you believe this is an error.', {
                        duration: 5000,
                    })
                    break
                case 'Verification':
                    toast.error('Please verify your email address before signing in.', {
                        duration: 5000,
                    })
                    break
                case 'OAuthSignin':
                case 'OAuthCallback':
                case 'OAuthCreateAccount':
                case 'EmailCreateAccount':
                case 'Callback':
                    toast.error('OAuth sign-in failed. Please try again or use email/password.', {
                        duration: 5000,
                    })
                    break
                default:
                    toast.error('Sign in failed. Please try again or contact support.', {
                        duration: 5000,
                    })
                    break
            }
            
            // Clean the URL by removing error parameters
            const cleanUrl = new URL(window.location.href)
            cleanUrl.searchParams.delete('error')
            cleanUrl.searchParams.delete('code')
            router.replace(cleanUrl.pathname + cleanUrl.search, { scroll: false })
        }
    }, [searchParams, router])

    // Monitor session changes for success notification and show loading until dashboard is ready
    useEffect(() => {
        console.log('🔍 Session Status Change:', {
            status,
            hasSession: !!session,
            hasUser: !!session?.user,
            userEmail: session?.user?.email,
            callbackUrl
        })

        if (status === 'authenticated' && session?.user) {
            console.log('✅ Session authenticated - showing success notification')
            toast.success('Welcome back! Redirecting to dashboard...', {
                duration: 3000,
            })
            // Redirect to dashboard after successful authentication
            setTimeout(() => {
                router.push(callbackUrl)
            }, 1000)
        }
    }, [status, session, callbackUrl, router])

    const handleSignIn = async ({
        values,
        setSubmitting,
        setMessage,
    }: OnSignInPayload) => {
        setSubmitting(true)
        setMessage('')

        try {
            console.log('🔄 Attempting sign-in for:', values.email)

            // Use NextAuth without redirect to handle errors properly
            const result = await signIn('credentials', {
                email: values.email,
                password: values.password,
                redirect: false, // Handle redirect manually to show proper error messages
            })

            console.log('🔍 Sign-in result:', result)

            if (result?.error) {
                // Handle specific error types
                switch (result.error) {
                    case 'CredentialsSignin':
                        toast.error('Invalid email or password. Please check your credentials and try again.', {
                            duration: 5000,
                        })
                        setMessage('Invalid email or password. Please try again.')
                        break
                    case 'Configuration':
                        toast.error('Authentication service is temporarily unavailable. Please try again later.', {
                            duration: 5000,
                        })
                        setMessage('Service temporarily unavailable. Please try again later.')
                        break
                    case 'AccessDenied':
                        toast.error('Access denied. Please contact support if you believe this is an error.', {
                            duration: 5000,
                        })
                        setMessage('Access denied. Please contact support.')
                        break
                    case 'Verification':
                        toast.error('Please verify your email address before signing in.', {
                            duration: 5000,
                        })
                        setMessage('Please verify your email address.')
                        break
                    default:
                        toast.error('Sign in failed. Please try again or contact support.', {
                            duration: 5000,
                        })
                        setMessage('Sign in failed. Please try again.')
                        break
                }
                setSubmitting(false)
                return
            }

            if (result?.ok) {
                console.log('✅ Sign-in successful, waiting for session update')
                toast.loading('Signing you in...', {
                    duration: 2000,
                })
                // Session update will be handled by useEffect above
                // Don't set submitting to false here - let the session effect handle it
            } else {
                console.warn('⚠️ Unexpected sign-in result:', result)
                toast.error('An unexpected error occurred. Please try again.', {
                    duration: 4000,
                })
                setMessage('An unexpected error occurred. Please try again.')
                setSubmitting(false)
            }

        } catch (error) {
            console.error('❌ Sign in error:', error)
            
            // Handle network errors and other exceptions
            if (error instanceof Error) {
                if (error.message.includes('fetch')) {
                    toast.error('Network error. Please check your connection and try again.', {
                        duration: 5000,
                    })
                    setMessage('Network error. Please check your connection.')
                } else {
                    toast.error('An unexpected error occurred. Please try again.', {
                        duration: 4000,
                    })
                    setMessage('An unexpected error occurred. Please try again.')
                }
            } else {
                toast.error('Something went wrong. Please try again.', {
                    duration: 4000,
                })
                setMessage('Something went wrong. Please try again.')
            }
            
            setSubmitting(false)
        }
    }

    const handleOAuthSignIn = async ({ type }: OnOauthSignInPayload) => {
        try {
            console.log('🔄 OAuth sign-in initiated for:', type, 'with callback:', callbackUrl)
            toast.loading(`Signing in with ${type === 'google' ? 'Google' : 'GitHub'}...`, {
                duration: 3000,
            })
            
            if (type === 'google') {
                await handleOauthSignIn('google', callbackUrl)
            }
            if (type === 'github') {
                await handleOauthSignIn('github', callbackUrl)
            }
        } catch (error) {
            console.error('OAuth sign in error:', error)
            toast.error(`${type === 'google' ? 'Google' : 'GitHub'} sign-in failed. Please try again or use email/password.`, {
                duration: 5000,
            })
        }
    }

    return <SignIn onSignIn={handleSignIn} onOauthSignIn={handleOAuthSignIn} />
}

export default SignInClient
