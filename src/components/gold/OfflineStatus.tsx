'use client';

/**
 * Offline Status Component
 * GoldTrader Pro - Shows offline indicator and sync status
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getUnsyncedTransactions,
  syncPendingTransactions,
  getLastSync,
} from '@/lib/offline-storage';

export default function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    show: boolean;
    synced: number;
    failed: number;
  } | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Check online status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check pending transactions
  useEffect(() => {
    const checkPending = () => {
      const unsynced = getUnsyncedTransactions();
      setPendingCount(unsynced.length);
      setLastSync(getLastSync());
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncing) {
      handleSync();
    }
  }, [isOnline, pendingCount]);

  const handleSync = useCallback(async () => {
    if (syncing || pendingCount === 0) return;

    setSyncing(true);
    try {
      const result = await syncPendingTransactions();
      setSyncResult({
        show: true,
        synced: result.synced,
        failed: result.failed,
      });
      setPendingCount(getUnsyncedTransactions().length);
      setLastSync(getLastSync());

      // Hide result after 3 seconds
      setTimeout(() => {
        setSyncResult((prev) => (prev ? { ...prev, show: false } : null));
      }, 3000);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }, [syncing, pendingCount]);

  // Don't show if everything is normal
  if (isOnline && pendingCount === 0 && !syncResult?.show) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-16 left-0 right-0 z-30 px-4"
      >
        <div className="max-w-lg mx-auto">
          {/* Offline Banner */}
          {!isOnline && (
            <div className="bg-yellow-600 text-black rounded-lg px-4 py-2 flex items-center justify-between shadow-lg mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">📴</span>
                <span className="font-medium">Offline Mode</span>
              </div>
              <span className="text-sm">Transactions will sync when online</span>
            </div>
          )}

          {/* Pending Transactions */}
          {pendingCount > 0 && (
            <div className="bg-orange-600 text-white rounded-lg px-4 py-2 flex items-center justify-between shadow-lg mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏳</span>
                <span className="font-medium">
                  {pendingCount} pending transaction{pendingCount > 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={handleSync}
                disabled={!isOnline || syncing}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          )}

          {/* Sync Result */}
          {syncResult?.show && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg ${
                syncResult.failed > 0
                  ? 'bg-red-600 text-white'
                  : 'bg-green-600 text-white'
              }`}
            >
              <span className="text-xl">
                {syncResult.failed > 0 ? '⚠️' : '✅'}
              </span>
              <span>
                Synced {syncResult.synced} transaction
                {syncResult.synced > 1 ? 's' : ''}
                {syncResult.failed > 0 && ` (${syncResult.failed} failed)`}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
