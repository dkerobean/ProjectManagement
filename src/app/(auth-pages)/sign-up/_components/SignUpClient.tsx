'use client'

import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import SignUp from '@/components/auth/SignUp'
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

            // Call the NextAuth-compatible sign-up API route
            const response = await fetch('/api/auth/sign-up', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: values.email,
                    password: values.password,
                    name: values.userName,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                const errorMessage = result.error?.message || result.message || 'Registration failed'
                setMessage(errorMessage)
                console.error('Sign up error:', result)
                return
            }

            // Show success message
            toast.push(
                <Notification title="Account Created!" type="success">
                    Your account has been created successfully. You can now sign in.
                </Notification>,
                { placement: 'top-end' }
            )            // Redirect to sign-in page
            router.push(appConfig.unAuthenticatedEntryPath)
        } catch (error) {
            console.error('Sign up error:', error)
            setMessage('An unexpected error occurred. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return <SignUp onSignUp={handleSignUp} />
}

export default SignUpClient
