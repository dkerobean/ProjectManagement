'use client';

/**
 * GoldTrader Pro - Main Dashboard
 * Implements the "3-Second Rule": Spot Price, Inventory Value, Outstanding Advances
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import PurchaseModal from '@/components/gold/PurchaseModal';
import AdvanceModal from '@/components/gold/AdvanceModal';
import OfflineStatus from '@/components/gold/OfflineStatus';
import GlassCard from '@/components/gold/GlassCard';
import GradientButton from '@/components/gold/GradientButton';
import { cachePrice, cacheSuppliers } from '@/lib/offline-storage';
import { DashboardSkeleton } from '@/components/gold/Skeleton';
import GoldBottomNav from '@/components/gold/GoldBottomNav';

interface DashboardData {
  spotPrice: {
    perOz: number;
    perGram: number;
    currency: string;
    timestamp: string;
  } | null;
  inventoryValue: {
    weight: number;
    value: number;
    marketValue?: number;
  };
  outstandingAdvances: {
    totalOutstanding: number;
    count: number;
  };
  today: {
    bought: { weight: number; amount: number; count: number };
    sold: { weight: number; amount: number; count: number };
  };
  vault: Record<string, { weight: number; value: number }>;
  recentTransactions: Array<{
    _id: string;
    type: 'buy' | 'sell';
    supplierName: string;
    weightGrams: number;
    totalAmount: number;
    purity: string;
    location: string;
    createdAt: string;
    receiptNumber: string;
  }>;
}

export default function GoldDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/gold/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        // Cache critical data for offline mode
        if (json.data.spotPrice) {
          cachePrice({
            pricePerOz: json.data.spotPrice.perOz,
            pricePerGram: json.data.spotPrice.perGram,
            currency: json.data.spotPrice.currency,
            source: 'cache',
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        setError(json.error);
      }
    } catch {
      console.log('Network error, attempting to load from cache if implemented');
      // In a real app we would load cached dashboard data here
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatWeight = (grams: number) => {
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(2)} kg`;
    }
    return `${grams.toFixed(1)} g`;
  };

  const getLocationIcon = (location: string) => {
    const icons: Record<string, string> = {
      in_safe: '🏠',
      at_refinery: '🏭',
      in_transit: '🚚',
      exported: '✈️',
    };
    return icons[location] || '📦';
  };

  const getLocationLabel = (location: string) => {
    const labels: Record<string, string> = {
      in_safe: 'In Safe',
      at_refinery: 'At Refinery',
      in_transit: 'In Transit',
      exported: 'Exported',
    };
    return labels[location] || location;
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral p-safe-top pb-safe-bottom bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-sans flex justify-center items-start selection:bg-primary selection:text-white">
      <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        {/* Offline Status */}
        <div className="fixed top-20 left-0 right-0 z-40 px-4 pointer-events-none">
           <OfflineStatus />
        </div>

        {/* Header */}
        <header className="px-5 pt-12 pb-4 flex justify-between items-center bg-white dark:bg-[#1C1C1E] z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
              <span className="text-xl">🏆</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-primary tracking-tight">GoldTrader Pro</h1>
          </div>
          <button 
            onClick={fetchDashboard}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-surface-dark flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <span className={`text-xl ${loading ? 'animate-spin' : ''}`}>🔄</span>
          </button>
        </header>

        <main className="flex-1 px-4 pb-24 overflow-y-auto space-y-4">
          {/* Live Spot Price Card */}
          <div className="relative w-full rounded-2xl bg-surface-darker border border-gray-800 dark:border-gray-700 p-6 overflow-hidden shadow-lg group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.15),transparent_60%)] opacity-50 pointer-events-none"></div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Live Spot Price</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {data?.spotPrice?.timestamp 
                    ? new Date(data.spotPrice.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : '--:--'}
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-4xl font-bold text-white tracking-tight">
                  {data?.spotPrice ? formatCurrency(data.spotPrice.perOz) : '$0.00'}
                </span>
                <span className="text-sm text-primary font-medium">/oz</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {data?.spotPrice ? formatCurrency(data.spotPrice.perGram) : '$0.00'} per gram
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Vault Value */}
            <div className="relative rounded-2xl bg-surface-darker border border-gray-800 dark:border-gray-700 p-5 overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-accent-green/10 to-transparent rounded-bl-3xl"></div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Vault Value</h3>
              <div className="text-3xl font-bold text-white mb-2">
                 {formatCurrency(data?.inventoryValue?.marketValue || data?.inventoryValue?.value || 0)}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-accent-green/20 text-accent-green text-xs font-bold">
                  +{formatWeight(data?.inventoryValue?.weight || 0)}
                </span>
                <span className="text-xs text-gray-500">in stock</span>
              </div>
            </div>

            {/* Outstanding */}
            <div className="relative rounded-2xl bg-surface-darker border border-gray-800 dark:border-gray-700 p-5 overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-accent-red/10 to-transparent rounded-bl-3xl"></div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Outstanding</h3>
              <div className="text-3xl font-bold text-white mb-2">
                 {formatCurrency(data?.outstandingAdvances?.totalOutstanding || 0)}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center rounded bg-red-900/40 text-accent-red text-xs font-bold border border-red-900/50">
                  {data?.outstandingAdvances?.count || 0}
                </span>
                <span className="text-xs text-gray-500">pending deals</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => setShowBuyModal(true)}
              className="flex flex-col items-center justify-center py-4 rounded-xl bg-accent-green hover:bg-emerald-600 active:scale-95 transition-all shadow-glow-green group"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1 group-hover:bg-white/30 transition-colors">
                <span className="text-white font-bold text-xl">⬇</span>
              </div>
              <span className="text-sm font-bold text-white">BUY</span>
            </button>
            <button 
              onClick={() => setShowSellModal(true)}
              className="flex flex-col items-center justify-center py-4 rounded-xl bg-accent-red hover:bg-red-600 active:scale-95 transition-all shadow-glow-red group"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1 group-hover:bg-white/30 transition-colors">
                <span className="text-white font-bold text-xl">⬆</span>
              </div>
              <span className="text-sm font-bold text-white">SELL</span>
            </button>
            <button 
              onClick={() => setShowAdvanceModal(true)}
              className="flex flex-col items-center justify-center py-4 rounded-xl bg-gradient-to-b from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 active:scale-95 transition-all shadow-glow group border-t border-yellow-400/30"
            >
              <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center mb-1 group-hover:bg-black/20 transition-colors">
                <span className="text-white font-bold text-xl">$</span>
              </div>
              <span className="text-sm font-bold text-white shadow-sm">ADVANCE</span>
            </button>
          </div>

          {/* Today's Activity */}
          <div className="rounded-2xl bg-surface-darker border border-gray-800 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-gray-500 text-lg">📅</span>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Today's Activity</h3>
            </div>
            <div className="flex justify-between items-center text-center divide-x divide-gray-800">
              <div className="flex-1 px-2">
                <div className="text-xl font-bold text-accent-green mb-1">{formatWeight(data?.today?.bought?.weight || 0)}</div>
                <div className="text-[10px] font-medium text-gray-500 uppercase">Bought</div>
              </div>
              <div className="flex-1 px-2">
                <div className="text-xl font-bold text-accent-red mb-1">{formatWeight(data?.today?.sold?.weight || 0)}</div>
                <div className="text-[10px] font-medium text-gray-500 uppercase">Sold</div>
              </div>
              <div className="flex-1 px-2">
                <div className={`text-xl font-bold mb-1 ${(data?.today?.sold?.amount || 0) - (data?.today?.bought?.amount || 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {formatCurrency((data?.today?.sold?.amount || 0) - (data?.today?.bought?.amount || 0))}
                </div>
                <div className="text-[10px] font-medium text-gray-500 uppercase">Net P&L</div>
              </div>
            </div>
          </div>
        </main>

        <GoldBottomNav />

        {/* Modals */}
        <PurchaseModal
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          onSuccess={fetchDashboard}
          type="buy"
        />
        <PurchaseModal
          isOpen={showSellModal}
          onClose={() => setShowSellModal(false)}
          onSuccess={fetchDashboard}
          type="sell"
        />
        <AdvanceModal
          isOpen={showAdvanceModal}
          onClose={() => setShowAdvanceModal(false)}
          onSuccess={fetchDashboard}
        />
      </div>
    </div>
  );
}

