'use client'

export default function Error({ 
    error, 
    reset 
}: { 
    error: Error & { digest?: string }
    reset: () => void 
}) {
    console.error('Dashboard Error:', error)
    
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">
                    Dashboard Error
                </h2>
                <p className="text-gray-600 mb-4">
                    {error.message || 'Something went wrong loading the dashboard'}
                </p>
                <div className="space-x-4">
                    <button 
                        onClick={() => reset()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Try again
                    </button>
                    <button 
                        onClick={() => window.location.href = '/sign-in'}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Back to Sign In
                    </button>
                </div>
                {process.env.NODE_ENV === 'development' && (
                    <details className="mt-4 text-left">
                        <summary className="cursor-pointer text-sm text-gray-500">
                            Error Details (Dev Only)
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-w-md">
                            {error.stack}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    )
}
