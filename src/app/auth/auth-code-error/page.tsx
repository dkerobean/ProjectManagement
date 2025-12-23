'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button } from '@/components/ui'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function AuthCodeError() {
    const router = useRouter()

    useEffect(() => {
        // Log error for debugging
        console.error('❌ Auth code error page accessed')
    }, [])

    const handleRetry = () => {
        router.push('/sign-in')
    }

    const handleSupport = () => {
        window.location.href = 'mailto:support@yourcompany.com?subject=Authentication Error'
    }

    const cardHeader = (
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
                Authentication Error
            </h3>
            <p className="text-gray-600 mt-2">
                We encountered an error while verifying your account. This could be due to an expired or invalid verification link.
            </p>
        </div>
    )

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <Card header={{ content: cardHeader }} className="text-center">
                    <div className="space-y-4 text-left">
                        <div className="text-sm text-gray-600">
                            <p className="mb-2 font-semibold">Common causes:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>The verification link has expired</li>
                                <li>The verification link has already been used</li>
                                <li>The verification link is invalid or corrupted</li>
                            </ul>
                        </div>
                        
                        <div className="flex flex-col space-y-2 mt-4">
                            <Button 
                                onClick={handleRetry}
                                block
                                icon={<RefreshCw className="h-4 w-4" />}
                            >
                                Try Again
                            </Button>
                            
                            <Button 
                                variant="plain"
                                onClick={handleSupport}
                                block
                            >
                                Contact Support
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}