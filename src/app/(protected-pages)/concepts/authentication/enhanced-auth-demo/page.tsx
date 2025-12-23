'use client'

import { useState } from 'react'
import Container from '@/components/shared/Container'
import EnhancedSignUpForm from '@/components/auth/SignUp/EnhancedSignUpForm'
import EnhancedSignInForm from '@/components/auth/SignIn/EnhancedSignInForm'
import EnhancedForgotPasswordForm from '@/components/auth/ForgotPassword/EnhancedForgotPasswordForm'
import { RoleGuard } from '@/components/auth/RoleGuard'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

type AuthMode = 'signin' | 'signup' | 'forgot'

const EnhancedAuthDemo = () => {
    const [mode, setMode] = useState<AuthMode>('signin')
    const [message, setMessage] = useState('')

    const renderAuthForm = () => {
        switch (mode) {
            case 'signin':
                return (
                    <EnhancedSignInForm
                        setMessage={setMessage}
                        useSupabaseAuth={true}
                        passwordHint={
                            <div className="flex items-center justify-between mb-6">
                                <Button
                                    variant="plain"
                                    size="sm"
                                    onClick={() => setMode('forgot')}
                                >
                                    Forgot Password?
                                </Button>
                            </div>
                        }
                    />
                )
            case 'signup':
                return (
                    <EnhancedSignUpForm
                        setMessage={setMessage}
                        showRoleSelection={false}
                    />
                )
            case 'forgot':
                return (
                    <EnhancedForgotPasswordForm
                        setMessage={setMessage}
                        onBackToSignIn={() => setMode('signin')}
                    />
                )
            default:
                return null
        }
    }

    const getTitle = () => {
        switch (mode) {
            case 'signin':
                return 'Sign In to Your Account'
            case 'signup':
                return 'Create Your Account'
            case 'forgot':
                return 'Reset Your Password'
            default:
                return ''
        }
    }

    const getSubtitle = () => {
        switch (mode) {
            case 'signin':
                return 'Welcome back! Please sign in to continue.'
            case 'signup':
                return 'Join us today! Create your account to get started.'
            case 'forgot':
                return 'Enter your email to receive reset instructions.'
            default:
                return ''
        }
    }

    return (
        <Container>
            <div className="max-w-lg mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Enhanced Authentication Demo
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Supabase-powered authentication with role-based access control
                    </p>
                </div>

                <Card className="p-8">
                    <div className="mb-6 text-center">
                        <h2 className="text-xl font-semibold mb-2">{getTitle()}</h2>
                        <p className="text-gray-600 dark:text-gray-400">{getSubtitle()}</p>
                    </div>

                    {message && (
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">{message}</p>
                        </div>
                    )}

                    {renderAuthForm()}

                    {mode !== 'forgot' && (
                        <div className="mt-6 text-center">
                            <div className="text-sm">
                                {mode === 'signin' ? (
                                    <>
                                        Don&apos;t have an account?{' '}
                                        <Button
                                            variant="plain"
                                            size="sm"
                                            className="p-0 h-auto"
                                            onClick={() => setMode('signup')}
                                        >
                                            Sign up here
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{' '}
                                        <Button
                                            variant="plain"
                                            size="sm"
                                            className="p-0 h-auto"
                                            onClick={() => setMode('signin')}
                                        >
                                            Sign in here
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Role-based content demo */}
                <RoleGuard requiredRole="member">
                    <Card className="mt-8 p-6">
                        <h3 className="text-lg font-semibold mb-2">Member+ Content</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            This content is only visible to users with Member role or higher.
                        </p>
                    </Card>
                </RoleGuard>

                <RoleGuard requiredRole="project_manager">
                    <Card className="mt-4 p-6">
                        <h3 className="text-lg font-semibold mb-2">Project Manager+ Content</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            This content is only visible to Project Managers and Admins.
                        </p>
                    </Card>
                </RoleGuard>

                <RoleGuard requiredRole="admin">
                    <Card className="mt-4 p-6">
                        <h3 className="text-lg font-semibold mb-2">Admin Only Content</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            This content is only visible to Administrators.
                        </p>
                    </Card>
                </RoleGuard>
            </div>
        </Container>
    )
}

export default EnhancedAuthDemo
