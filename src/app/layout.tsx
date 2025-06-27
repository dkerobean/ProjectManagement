import { auth } from '@/auth'
import AuthProvider from '@/components/auth/AuthProvider'
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary'
import SessionRefresher from '@/components/auth/SessionRefresher'
import ThemeProvider from '@/components/template/Theme/ThemeProvider'
import pageMetaConfig from '@/configs/page-meta.config'
import { NextIntlClientProvider } from 'next-intl'
import NavigationProvider from '@/components/template/Navigation/NavigationProvider'
import { NavigationLoadingProvider } from '@/contexts/NavigationLoadingContext'
import { getNavigation } from '@/server/actions/navigation/getNavigation'
import { getTheme } from '@/server/actions/theme'
import { getLocale, getMessages } from 'next-intl/server'
import checkEnvironmentVariables from '@/utils/env-checker'
import { Toaster } from 'react-hot-toast'
import type { ReactNode } from 'react'
import '@/assets/styles/app.css'

export const metadata = {
    ...pageMetaConfig,
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: ReactNode
}>) {
    // Check environment variables in development/debugging
    if (process.env.NODE_ENV === 'development') {
        checkEnvironmentVariables()
    }

    const session = await auth()

    const locale = await getLocale()
    const messages = await getMessages()

    const navigationTree = await getNavigation()

    const theme = await getTheme()

    return (
        <AuthProvider session={session}>
            <html
                className={theme.mode === 'dark' ? 'dark' : 'light'}
                lang={locale}
                dir={theme.direction}
                suppressHydrationWarning
            >
                <body suppressHydrationWarning>
                    <AuthErrorBoundary>
                        <NextIntlClientProvider locale={locale} messages={messages}>
                            <ThemeProvider locale={locale} theme={theme}>
                                <NavigationProvider navigationTree={navigationTree}>
                                    <NavigationLoadingProvider>
                                        <SessionRefresher />
                                        {children}
                                        <Toaster
                                            position="top-right"
                                            toastOptions={{
                                                duration: 4000,
                                                style: {
                                                    background: 'var(--bg-color)',
                                                    color: 'var(--text-color)',
                                                    border: '1px solid var(--border-color)',
                                                },
                                                success: {
                                                    iconTheme: {
                                                        primary: '#10B981',
                                                        secondary: 'white',
                                                    },
                                                },
                                                error: {
                                                    iconTheme: {
                                                        primary: '#EF4444',
                                                        secondary: 'white',
                                                    },
                                                },
                                            }}
                                        />
                                    </NavigationLoadingProvider>
                                </NavigationProvider>
                            </ThemeProvider>
                        </NextIntlClientProvider>
                    </AuthErrorBoundary>
                </body>
            </html>
        </AuthProvider>
    )
}
