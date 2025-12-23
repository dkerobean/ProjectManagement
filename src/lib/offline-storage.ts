/**
 * Offline Storage Utility
 * GoldTrader Pro - Local storage for offline transactions
 */

const STORAGE_KEYS = {
  PENDING_TRANSACTIONS: 'goldtrader_pending_transactions',
  CACHED_PRICE: 'goldtrader_cached_price',
  CACHED_SUPPLIERS: 'goldtrader_cached_suppliers',
  LAST_SYNC: 'goldtrader_last_sync',
  OFFLINE_MODE: 'goldtrader_offline_mode',
};

// Pending transaction for offline mode
export interface PendingTransaction {
  id: string;
  type: 'buy' | 'sell';
  supplierId: string;
  supplierName: string;
  goldType: string;
  purity: string;
  purityPercentage: number;
  weightGrams: number;
  spotPricePerOz: number;
  discountPercentage: number;
  paymentMethod: string;
  advanceId?: string;
  notes?: string;
  createdAt: string;
  synced: boolean;
}

// Cached price
export interface CachedPrice {
  pricePerOz: number;
  pricePerGram: number;
  currency: string;
  source: string;
  timestamp: string;
}

// Cached supplier
export interface CachedSupplier {
  _id: string;
  name: string;
  phone?: string;
  outstandingBalance: number;
}

/**
 * Check if we're running in a browser
 */
const isBrowser = () => typeof window !== 'undefined';

/**
 * Get pending transactions
 */
export function getPendingTransactions(): PendingTransaction[] {
  if (!isBrowser()) return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PENDING_TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Add a pending transaction
 */
export function addPendingTransaction(transaction: Omit<PendingTransaction, 'id' | 'synced' | 'createdAt'>): PendingTransaction {
  const pending = getPendingTransactions();
  const newTransaction: PendingTransaction = {
    ...transaction,
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    synced: false,
  };
  pending.push(newTransaction);
  localStorage.setItem(STORAGE_KEYS.PENDING_TRANSACTIONS, JSON.stringify(pending));
  return newTransaction;
}

/**
 * Mark a transaction as synced
 */
export function markTransactionSynced(id: string): void {
  const pending = getPendingTransactions();
  const updated = pending.map((t) => (t.id === id ? { ...t, synced: true } : t));
  localStorage.setItem(STORAGE_KEYS.PENDING_TRANSACTIONS, JSON.stringify(updated));
}

/**
 * Get unsynced transactions
 */
export function getUnsyncedTransactions(): PendingTransaction[] {
  return getPendingTransactions().filter((t) => !t.synced);
}

/**
 * Clear synced transactions
 */
export function clearSyncedTransactions(): void {
  const pending = getPendingTransactions().filter((t) => !t.synced);
  localStorage.setItem(STORAGE_KEYS.PENDING_TRANSACTIONS, JSON.stringify(pending));
}

/**
 * Cache the current gold price
 */
export function cachePrice(price: CachedPrice): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.CACHED_PRICE, JSON.stringify(price));
}

/**
 * Get cached price
 */
export function getCachedPrice(): CachedPrice | null {
  if (!isBrowser()) return null;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CACHED_PRICE);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Cache suppliers for offline access
 */
export function cacheSuppliers(suppliers: CachedSupplier[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.CACHED_SUPPLIERS, JSON.stringify(suppliers));
}

/**
 * Get cached suppliers
 */
export function getCachedSuppliers(): CachedSupplier[] {
  if (!isBrowser()) return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CACHED_SUPPLIERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Update last sync timestamp
 */
export function updateLastSync(): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
}

/**
 * Get last sync timestamp
 */
export function getLastSync(): Date | null {
  if (!isBrowser()) return null;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return data ? new Date(data) : null;
  } catch {
    return null;
  }
}

/**
 * Check if offline mode is enabled
 */
export function isOfflineMode(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(STORAGE_KEYS.OFFLINE_MODE) === 'true';
}

/**
 * Set offline mode
 */
export function setOfflineMode(offline: boolean): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, String(offline));
}

/**
 * Sync pending transactions to server
 */
export async function syncPendingTransactions(): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  const unsynced = getUnsyncedTransactions();
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const tx of unsynced) {
    try {
      const res = await fetch('/api/gold/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: tx.type,
          supplierId: tx.supplierId,
          goldType: tx.goldType,
          purity: tx.purity,
          purityPercentage: tx.purityPercentage,
          weightGrams: tx.weightGrams,
          spotPricePerOz: tx.spotPricePerOz,
          discountPercentage: tx.discountPercentage,
          paymentMethod: tx.paymentMethod,
          advanceId: tx.advanceId,
          notes: tx.notes ? `[Offline] ${tx.notes}` : '[Recorded offline]',
        }),
      });

      if (res.ok) {
        markTransactionSynced(tx.id);
        synced++;
      } else {
        failed++;
        errors.push(`Failed to sync ${tx.id}`);
      }
    } catch (err) {
      failed++;
      errors.push(`Error syncing ${tx.id}: ${err}`);
    }
  }

  if (synced > 0) {
    updateLastSync();
    clearSyncedTransactions();
  }

  return { synced, failed, errors };
}
