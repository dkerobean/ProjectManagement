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
    <div className="min-h-screen bg-neutral-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black text-white pb-28">
      {/* Offline Status Indicator - Floating below header */}
      <div className="fixed top-[72px] left-0 right-0 z-40 px-4 pointer-events-none">
        <OfflineStatus />
      </div>

      {/* Modern Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-lg">🏆</span>
          </div>
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-500">
            GoldTrader Pro
          </span>
        </div>
        <button
          onClick={fetchDashboard}
           className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition active:scale-95"
        >
          <span className="text-xl animate-pulse-slow">🔄</span>
        </button>
      </header>

      {/* Main Content - Added top padding for fixed header */}
      <main className="max-w-lg mx-auto px-4 pt-20 space-y-6">
        
        {/* === SPOT PRICE HERO === */}
        <GlassCard variant="gold" className="relative overflow-hidden p-6">
          {/* Subtle chart background effect */}
          <div className="absolute inset-x-0 bottom-0 h-24 opacity-20 pointer-events-none">
            <svg viewBox="0 0 100 20" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,10 Q25,15 50,5 T100,8 L100,20 L0,20 Z" fill="url(#goldGradient)" />
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-amber-200/60 text-xs font-bold tracking-wider">LIVE SPOT PRICE</span>
              </div>
              <span className="text-xs text-amber-200/40 font-mono">
                {data?.spotPrice?.timestamp
                  ? new Date(data.spotPrice.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'MANUAL'}
              </span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white tracking-tight drop-shadow-sm">
                  {data?.spotPrice
                    ? formatCurrency(data.spotPrice.perOz)
                    : '$2,620'}
                </span>
                <span className="text-amber-400 font-medium">/oz</span>
              </div>
              <div className="text-sm text-amber-200/60 font-medium mt-1">
                {data?.spotPrice
                  ? formatCurrency(data.spotPrice.perGram)
                  : '$84.24'}{' '}
                per gram
              </div>
            </div>
          </div>
        </GlassCard>

        {/* === QUICK ACTIONS GRID === */}
        <div className="grid grid-cols-2 gap-3">
          {/* Vault Card */}
          <GlassCard variant="dark" className="p-4 flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
            <div>
              <span className="text-gray-400 text-xs font-bold tracking-wider">VAULT VALUE</span>
              <div className="text-2xl font-bold text-white mt-1">
                {formatCurrency(data?.inventoryValue?.marketValue || data?.inventoryValue?.value || 0)}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-auto">
              <span className="text-sm text-green-400 font-medium bg-green-400/10 px-2 py-0.5 rounded">
                +{formatWeight(data?.inventoryValue?.weight || 0)}
              </span>
              <span className="text-xs text-gray-500">in stock</span>
            </div>
          </GlassCard>

          {/* Advances Card */}
          <GlassCard variant="dark" className="p-4 flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
            <div>
              <span className="text-gray-400 text-xs font-bold tracking-wider">OUTSTANDING</span>
              <div className="text-2xl font-bold text-white mt-1">
                {formatCurrency(data?.outstandingAdvances?.totalOutstanding || 0)}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-auto">
              <span className="text-sm text-red-400 font-medium bg-red-400/10 px-2 py-0.5 rounded">
                {data?.outstandingAdvances?.count || 0}
              </span>
              <span className="text-xs text-gray-500">pending deals</span>
            </div>
          </GlassCard>
        </div>

        {/* === ACTION BUTTONS === */}
        <div className="grid grid-cols-3 gap-3">
          <GradientButton 
            variantType="success" 
            glow 
            className="h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5"
            onClick={() => setShowBuyModal(true)}
          >
            <span className="text-xl">⬇️</span>
            <span className="text-xs font-bold">BUY</span>
          </GradientButton>

          <GradientButton 
            variantType="danger" 
            glow 
            className="h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5"
            onClick={() => setShowSellModal(true)}
          >
            <span className="text-xl">⬆️</span>
            <span className="text-xs font-bold">SELL</span>
          </GradientButton>

          <GradientButton 
            variantType="gold" 
            glow 
            className="h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5"
            onClick={() => setShowAdvanceModal(true)}
          >
            <span className="text-xl">💰</span>
            <span className="text-xs font-bold">ADVANCE</span>
          </GradientButton>
        </div>

        {/* === TODAY'S PERFORMANCE === */}
        <GlassCard className="p-5">
          <h2 className="text-gray-400 text-xs font-bold tracking-wider mb-4 flex items-center gap-2">
            <span>📅</span> TODAY'S ACTIVITY
          </h2>
          <div className="grid grid-cols-3 divide-x divide-gray-800">
            <div className="px-2 text-center">
              <div className="text-green-400 font-bold text-lg">{formatWeight(data?.today?.bought?.weight || 0)}</div>
              <div className="text-[10px] uppercase text-gray-500 font-bold mt-1">Bought</div>
            </div>
            <div className="px-2 text-center">
              <div className="text-red-400 font-bold text-lg">{formatWeight(data?.today?.sold?.weight || 0)}</div>
              <div className="text-[10px] uppercase text-gray-500 font-bold mt-1">Sold</div>
            </div>
            <div className="px-2 text-center">
              <div className={`font-bold text-lg ${(data?.today?.sold?.amount || 0) - (data?.today?.bought?.amount || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency((data?.today?.sold?.amount || 0) - (data?.today?.bought?.amount || 0))}
              </div>
              <div className="text-[10px] uppercase text-gray-500 font-bold mt-1">Net P&L</div>
            </div>
          </div>
        </GlassCard>

        {/* === RECENT TRANSACTIONS === */}
        <div className="pb-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-gray-400 text-xs font-bold tracking-wider">RECENT TRANSACTIONS</h2>
            <a href="/gold/trade" className="text-amber-500 text-xs font-bold hover:underline">View All</a>
          </div>
          
          <div className="space-y-3">
            {data?.recentTransactions?.length === 0 ? (
              <GlassCard className="p-8 text-center text-gray-500">
                <span className="text-2xl mb-2 block">📝</span>
                No transactions today
              </GlassCard>
            ) : (
              data?.recentTransactions?.slice(0, 5).map((tx, idx) => (
                <GlassCard key={tx._id} className="p-3 flex items-center justify-between group active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      tx.type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.type === 'buy' ? '⬇️' : '⬆️'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{tx.supplierName}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="bg-gray-800 px-1.5 rounded text-[10px] text-gray-400">{tx.purity}</span>
                        <span>{tx.weightGrams}g</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${tx.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(tx.totalAmount)}
                    </div>
                    <div className="text-[10px] text-gray-600 font-mono">
                      {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Shared Bottom Navigation */}
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
  );
}

