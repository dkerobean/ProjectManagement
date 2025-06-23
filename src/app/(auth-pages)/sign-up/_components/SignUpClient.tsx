'use client'

import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import SignUp from '@/components/auth/SignUp'
import SupabaseAuthService from '@/services/SupabaseAuthService'
import { useRouter } from 'next/navigation'
import appConfig from '@/configs/app.config'
import type { OnSignUpPayload } from '@/components/auth/SignUp'

const SignUpClient = () => {
    const router = useRouter()

    const handleSignUp = async ({
        values,
        setSubmitting,
        setMessage,
    }: OnSignUpPayload) => {
        try {
            setSubmitting(true)
            setMessage('')

            // Use Supabase Auth for sign up
            const { error } = await SupabaseAuthService.signUp(
                values.email,
                values.password,
                {
                    name: values.userName,
                    timezone: 'UTC',
                    role: 'member',
                }
            )

            if (error) {
                const errorMessage = (error as { message?: string })?.message || 'Registration failed'
                setMessage(errorMessage)
                return
            }

            // Show success message
            toast.push(
                <Notification title="Account Created!" type="success">
                    Please check your email to verify your account before signing in.
                </Notification>,
                { placement: 'top-end' }
            )

            // Redirect to sign-in page
            router.push(appConfig.unAuthenticatedEntryPath)        } catch (error) {
            console.error('Sign up error:', error)
            setMessage('An unexpected error occurred. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return <SignUp onSignUp={handleSignUp} />
}

export default SignUpClient
