'use client';

import { useEffect } from 'react';
import useSafeSession from '@/hooks/useSafeSession';

/**
 * Background component that handles session refresh and recovery
 * Following Context7 best practices for session management
 */
export default function SessionRefresher() {
    const { updateSession, isAuthenticated } = useSafeSession();

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        // Refresh session every 5 minutes to prevent expiration
        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing session...');
            updateSession().catch((error) => {
                console.error('❌ Session refresh failed:', error);
            });
        }, 5 * 60 * 1000); // 5 minutes

        // Refresh session when tab becomes visible again
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isAuthenticated) {
                console.log('👁️ Tab focused, refreshing session...');
                updateSession().catch((error) => {
                    console.error('❌ Focus session refresh failed:', error);
                });
            }
        };

        // Refresh session when user comes back online
        const handleOnline = () => {
            if (isAuthenticated) {
                console.log('🌐 Back online, refreshing session...');
                updateSession().catch((error) => {
                    console.error('❌ Online session refresh failed:', error);
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);
        
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
        };
    }, [updateSession, isAuthenticated]);

    // Invisible component - only provides functionality
    return null;
}
