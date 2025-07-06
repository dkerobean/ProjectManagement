'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
        // You can customize this to your support system
        window.location.href = 'mailto:support@yourcompany.com?subject=Authentication Error'
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Authentication Error
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            We encountered an error while verifying your account. This could be due to an expired or invalid verification link.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-sm text-gray-600">
                                <p className="mb-2">Common causes:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li>The verification link has expired</li>
                                    <li>The verification link has already been used</li>
                                    <li>The verification link is invalid or corrupted</li>
                                </ul>
                            </div>
                            
                            <div className="flex flex-col space-y-2">
                                <Button 
                                    onClick={handleRetry}
                                    className="flex items-center justify-center"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Try Again
                                </Button>
                                
                                <Button 
                                    variant="outline"
                                    onClick={handleSupport}
                                    className="flex items-center justify-center"
                                >
                                    Contact Support
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}