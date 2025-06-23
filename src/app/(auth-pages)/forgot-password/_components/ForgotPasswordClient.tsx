'use client'

import { apiForgotPassword } from '@/services/AuthService'
import ForgotPassword from '@/components/auth/ForgotPassword'
import ZenoSplit from '@/components/layouts/AuthLayout/ZenoSplit'
import { toast } from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import type { OnForgotPasswordSubmitPayload } from '@/components/auth/ForgotPassword'

const ForgotPasswordClient = () => {
    const handleForgotPasswordSubmit = async ({
        values,
        setSubmitting,
        setMessage,
        setEmailSent,
    }: OnForgotPasswordSubmitPayload) => {
        try {
            setSubmitting(true)
            await apiForgotPassword(values)
            toast.push(
                <Notification title="Email sent!" type="success">
                    We have sent you an email to reset your password
                </Notification>,
            )
            setEmailSent(true)
        } catch (error) {
            setMessage(error as string)
        } finally {
            setSubmitting(false)
        }
    }    return (
        <ZenoSplit>
            <ForgotPassword onForgotPasswordSubmit={handleForgotPasswordSubmit} />
        </ZenoSplit>
    )
}

export default ForgotPasswordClient
