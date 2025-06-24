'use client';

interface AuthErrorBoundaryProps {
    children: React.ReactNode;
}

interface AuthErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

import { Component } from 'react';

/**
 * Error boundary specifically for authentication and session errors
 * Handles NextAuth production errors and provides fallback UI
 */
export default class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
    constructor(props: AuthErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
        // Update state so the next render will show the fallback UI
        console.error('❌ Auth Error Boundary caught error:', error);
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log auth-specific errors
        if (error.message.includes('Cannot destructure property') ||
            error.message.includes('T(...) is not a function') ||
            error.message.includes('auth') ||
            error.message.includes('session')) {
            console.error('❌ Authentication error detected:', error);
            console.error('Error info:', errorInfo);
            
            // In production, refresh the page to recover from auth errors
            if (process.env.NODE_ENV === 'production') {
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full space-y-4 p-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Authentication Error
                            </h2>
                            <p className="text-gray-600 mb-4">
                                We encountered an issue with your session. Please try refreshing the page.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook version for functional components
 */
export function useAuthErrorHandler() {
    const handleError = (error: Error) => {
        if (error.message.includes('Cannot destructure property') ||
            error.message.includes('T(...) is not a function') ||
            error.message.includes('auth') ||
            error.message.includes('session')) {
            console.error('❌ Auth error caught by hook:', error);
            
            // In production, refresh the page to recover
            if (process.env.NODE_ENV === 'production') {
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        }
    };

    // Set up global error handler
    if (typeof window !== 'undefined') {
        window.addEventListener('error', (event) => {
            handleError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason instanceof Error) {
                handleError(event.reason);
            }
        });
    }

    return { handleError };
}
