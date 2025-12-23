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
import { RefreshCw, Calendar } from 'lucide-react';

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
    <div className="min-h-screen bg-neutral p-safe-top pb-safe-bottom bg-background-dark text-gray-100 font-sans flex justify-center items-start selection:bg-primary selection:text-white">
      <div className="w-full max-w-md bg-background-dark min-h-screen relative overflow-hidden flex flex-col">
        {/* Offline Status */}
        <div className="fixed top-20 left-0 right-0 z-40 px-4 pointer-events-none">
           <OfflineStatus />
        </div>



        {/* Header */}
        <header className="px-5 pt-12 pb-4 flex justify-between items-center z-10 sticky top-0 bg-background-dark/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-glow">
              <span className="text-xl text-black">🏆</span>
            </div>
            <h1 className="text-xl font-bold text-primary tracking-tight">GoldTrader Pro</h1>
          </div>
          <button 
            onClick={fetchDashboard}
            className="w-10 h-10 rounded-full bg-surface-dark border border-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors active:scale-95"
          >
             <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <main className="flex-1 px-4 pb-24 space-y-4">
          {/* Spot Price Card - Primary Focus */}
          <div className="relative w-full rounded-3xl bg-[#151517] border border-white/5 p-6 overflow-hidden shadow-2xl">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50 pointer-events-none"></div>
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                   <div>
                       <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Gold Spot Price</h2>
                       <div className="text-3xl font-bold text-primary" style={{ textShadow: '0 0 30px rgba(255, 215, 0, 0.3)' }}>
                          {data?.spotPrice ? formatCurrency(data.spotPrice.perOz) : '$--'}<span className="text-base font-medium text-gray-500">/oz</span>
                       </div>
                   </div>
                   <button 
                       onClick={fetchDashboard}
                       className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-primary hover:border-primary/30 transition-all"
                   >
                       <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                   </button>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-500">{formatCurrency(data?.spotPrice?.perGram || 0)}/g</span>
                    {data?.spotPrice?.timestamp && (
                        <span className="text-gray-600">Updated {new Date(data.spotPrice.timestamp).toLocaleTimeString()}</span>
                    )}
                </div>
             </div>
          </div>

          {/* Value Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
             {/* Inventory Value */}
             <div className="rounded-3xl bg-[#1C1C1E] border border-white/5 p-5">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Vault Value</div>
                <div className="text-2xl font-bold text-accent-green mb-1">{formatCurrency(data?.inventoryValue?.value || 0)}</div>
                <div className="text-xs text-gray-500">{formatWeight(data?.inventoryValue?.weight || 0)} in stock</div>
             </div>

             {/* Outstanding Advances */}
             <div className="rounded-3xl bg-[#1C1C1E] border border-white/5 p-5">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Advances Out</div>
                <div className="text-2xl font-bold text-accent-red mb-1">{formatCurrency(data?.outstandingAdvances?.totalOutstanding || 0)}</div>
                <div className="text-xs text-gray-500">{data?.outstandingAdvances?.count || 0} pending</div>
             </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
             <button 
                onClick={() => setShowBuyModal(true)}
                className="rounded-2xl bg-accent-green/10 border border-accent-green/20 p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
             >
                <span className="text-xl">⬇️</span>
                <span className="text-xs font-bold text-accent-green">BUY</span>
             </button>
             <button 
                onClick={() => setShowSellModal(true)}
                className="rounded-2xl bg-accent-red/10 border border-accent-red/20 p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
             >
                <span className="text-xl">⬆️</span>
                <span className="text-xs font-bold text-accent-red">SELL</span>
             </button>
             <button 
                onClick={() => setShowAdvanceModal(true)}
                className="rounded-2xl bg-primary/10 border border-primary/20 p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
             >
                <span className="text-xl">💰</span>
                <span className="text-xs font-bold text-primary">ADVANCE</span>
             </button>
          </div>

          {/* Today's Activity */}
          <div className="rounded-3xl bg-[#1C1C1E] border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-5 h-5 text-gray-500" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Today's Activity</h3>
            </div>
            <div className="flex justify-between items-center text-center">
              <div className="flex-1 border-r border-gray-800">
                <div className="text-2xl font-bold text-accent-green mb-1">{formatWeight(data?.today?.bought?.weight || 0)}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Bought</div>
              </div>
              <div className="flex-1 border-r border-gray-800">
                <div className="text-2xl font-bold text-accent-red mb-1">{formatWeight(data?.today?.sold?.weight || 0)}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sold</div>
              </div>
              <div className="flex-1">
                <div className={`text-2xl font-bold mb-1 ${(data?.today?.sold?.amount || 0) - (data?.today?.bought?.amount || 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  ${Math.abs((data?.today?.sold?.amount || 0) - (data?.today?.bought?.amount || 0)).toLocaleString()}
                </div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Net P&L</div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          {data?.recentTransactions && data.recentTransactions.length > 0 && (
             <div className="rounded-3xl bg-[#1C1C1E] border border-white/5 p-5">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Trades</h3>
                </div>
                <div className="space-y-3">
                   {data.recentTransactions.slice(0, 5).map((tx) => (
                      <div key={tx._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                         <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'buy' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                               {tx.type === 'buy' ? '↓' : '↑'}
                            </div>
                            <div>
                               <div className="text-sm font-bold text-gray-200">{tx.supplierName || 'Unknown'}</div>
                               <div className="text-[10px] text-gray-500">{formatWeight(tx.weightGrams)} • {tx.purity}</div>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className={`text-sm font-bold ${tx.type === 'buy' ? 'text-accent-red' : 'text-accent-green'}`}>
                               {tx.type === 'buy' ? '-' : '+'}{formatCurrency(tx.totalAmount)}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}
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

