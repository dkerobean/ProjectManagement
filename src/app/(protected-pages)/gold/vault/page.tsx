'use client';

/**
 * Vault Management Page
 * GoldTrader Pro - Location-based inventory tracking
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/gold/GlassCard';
import GradientButton from '@/components/gold/GradientButton';
import GoldBottomNav from '@/components/gold/GoldBottomNav';

interface InventoryItem {
  _id: string;
  batchId: string;
  goldType: string;
  purity: string;
  weightGrams: number;
  location: string;
  avgCostPerGram: number;
  totalCost: number;
  createdAt: string;
}

interface InventorySummary {
  byLocation: Record<
    string,
    {
      totalWeight: number;
      totalCost: number;
      batchCount: number;
    }
  >;
  grandTotal: {
    totalWeight: number;
    totalCost: number;
  };
}

type Location = 'in_safe' | 'at_refinery' | 'in_transit' | 'exported';

const LOCATIONS: { key: Location; icon: string; label: string; color: string }[] = [
  { key: 'in_safe', icon: '🏠', label: 'In Safe', color: 'from-green-900/50' },
  { key: 'at_refinery', icon: '🏭', label: 'At Refinery', color: 'from-blue-900/50' },
  { key: 'in_transit', icon: '🚚', label: 'In Transit', color: 'from-yellow-900/50' },
  { key: 'exported', icon: '✈️', label: 'Exported', color: 'from-purple-900/50' },
];

export default function VaultPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [moveModal, setMoveModal] = useState<{ item: InventoryItem; isOpen: boolean } | null>(null);
  const [moveTo, setMoveTo] = useState<Location>('in_safe');
  const [moveLoading, setMoveLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      let url = '/api/gold/inventory';
      if (selectedLocation) {
        url += `?location=${selectedLocation}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setInventory(data.data);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedLocation]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleMove = async () => {
    if (!moveModal?.item) return;

    setMoveLoading(true);
    try {
      const res = await fetch('/api/gold/inventory/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: moveModal.item.batchId,
          toLocation: moveTo,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMoveModal(null);
        fetchInventory();
      }
    } catch (error) {
      console.error('Failed to move inventory:', error);
    } finally {
      setMoveLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatWeight = (grams: number) => {
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(2)} kg`;
    }
    return `${grams.toFixed(1)} g`;
  };

  const getLocationInfo = (key: string) => {
    return LOCATIONS.find((l) => l.key === key) || LOCATIONS[0];
  };

  // Aggregate inventory by purity/type for the grid view
  const stockBreakdown = inventory.reduce((acc, item) => {
    const key = `${item.purity} Gold`;
    if (!acc[key]) {
      acc[key] = { weight: 0, cost: 0, count: 0, purity: item.purity };
    }
    acc[key].weight += item.weightGrams;
    acc[key].cost += item.totalCost;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { weight: number; cost: number; count: number; purity: string }>);

  return (
    <div className="min-h-screen bg-neutral p-safe-top pb-safe-bottom bg-background-dark text-gray-100 font-sans flex justify-center items-start selection:bg-primary selection:text-white">
      <div className="w-full max-w-md bg-background-dark min-h-screen relative overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-5 pt-12 pb-4 flex justify-between items-center z-10 sticky top-0 bg-background-dark/90 backdrop-blur-md">
          <h1 className="text-3xl font-bold text-primary tracking-tight">Vault</h1>
          <button 
            // Mock functionality for now
            onClick={() => {}}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-yellow-400 text-black text-xs font-bold shadow-glow flex items-center gap-2 transition-all active:scale-95"
          >
             <span>+</span> Add Stock
          </button>
        </header>

        <main className="flex-1 px-4 pb-28 overflow-y-auto space-y-5 pt-2">
           {/* Tabs */}
           <div className="bg-[#1C1C1E] p-1 rounded-2xl flex gap-1 border border-white/5 shadow-lg mb-2">
              <button className="flex-1 py-3 rounded-xl text-xs font-bold bg-primary text-black shadow-glow transition-all">
                Inventory
              </button>
              <button className="flex-1 py-3 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-300 bg-transparent transition-all">
                Audit Log
              </button>
           </div>

          {/* Total Value Card */}
          {summary && (
            <div className="relative w-full rounded-3xl bg-[#151517] border border-white/5 p-8 overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/20 via-transparent to-transparent opacity-40 pointer-events-none"></div>
              
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 relative z-10">Total Stock Value</h2>
              <div className="relative z-10 mb-2">
                <span className="text-5xl font-bold text-accent-green tracking-tight drop-shadow-md" style={{ textShadow: '0 0 30px rgba(16, 185, 129, 0.3)' }}>
                  {formatCurrency(summary.grandTotal.totalCost)}
                </span>
              </div>
              <div className="relative z-10 text-[11px] text-gray-600 font-medium">
                {formatWeight(summary.grandTotal.totalWeight)} in vault
              </div>
            </div>
          )}

          {/* Stock Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3">
             {Object.entries(stockBreakdown).map(([name, data]) => (
                <div key={name} className="rounded-3xl bg-[#1C1C1E] border border-white/5 p-5 relative overflow-hidden group hover:border-primary/20 transition-all">
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl border border-primary/10">
                         👑
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-full">{data.purity}</span>
                   </div>
                   <h3 className="text-sm font-bold text-gray-300 mb-1">{name}</h3>
                   <div className="text-xl font-bold text-white mb-0.5">{formatWeight(data.weight)}</div>
                   <div className="text-xs font-bold text-accent-green">{formatCurrency(data.cost)}</div>
                </div>
             ))}
             {/* If empty, show placeholders or "Add New Type" */}
             {Object.keys(stockBreakdown).length === 0 && (
                <>
                   <div className="col-span-2 text-center py-8 opacity-50 text-sm font-medium text-gray-500">
                      No stock breakdown available
                   </div>
                </>
             )}
          </div>

          {/* Recent Movements (Simulated from Inventory for now, ideally needs a separate API endpoint) */}
          <div className="rounded-3xl bg-[#1C1C1E] border border-white/5 p-5">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Movements</h3>
               <button className="text-[10px] font-bold text-primary hover:text-white transition-colors">View All</button>
             </div>
             
             <div className="space-y-4">
               {/* Mock Data for visual match as per screenshot, replace with real data when API ready */}
               <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 text-accent-green">
                        ↓
                     </div>
                     <div>
                        <div className="text-sm font-bold text-white">Stock Added</div>
                        <div className="text-[10px] text-gray-500">Today, 10:30 AM</div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-sm font-bold text-accent-green">+500g</div>
                     <div className="text-[10px] text-gray-500">24K Gold</div>
                  </div>
               </div>

                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-accent-red">
                        ↑
                     </div>
                     <div>
                        <div className="text-sm font-bold text-white">Stock Removed</div>
                        <div className="text-[10px] text-gray-500">Yesterday, 4:15 PM</div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-sm font-bold text-accent-red">-200g</div>
                     <div className="text-[10px] text-gray-500">To Refinery</div>
                  </div>
               </div>
             </div>
          </div>
        </main>

        {/* Move Modal */}
        {moveModal?.isOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1C1C1E] rounded-3xl p-6 w-full max-w-sm border border-gray-800 shadow-2xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <span>🚚</span> Move Inventory
              </h2>

              <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5">
                <div className="flex justify-between items-start mb-2">
                   <div>
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Item</div>
                      <div className="font-bold text-lg text-white">
                        {moveModal.item.weightGrams}g <span className="text-primary">{moveModal.item.purity}</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">ID</div>
                      <div className="font-mono text-xs text-gray-400">#{moveModal.item.batchId}</div>
                   </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400 bg-black/20 p-2 rounded-lg">
                  <span>From:</span>
                  <span className="font-bold text-white flex items-center gap-1">
                     {getLocationInfo(moveModal.item.location).icon} {getLocationInfo(moveModal.item.location).label}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-3">
                  Select Destination
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LOCATIONS.filter((l) => l.key !== moveModal.item.location).map(
                    (loc) => (
                      <button
                        key={loc.key}
                        onClick={() => setMoveTo(loc.key)}
                        className={`p-3 rounded-xl text-left transition-all duration-200 border ${
                          moveTo === loc.key
                            ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/50'
                            : 'bg-white/5 border-transparent hover:bg-white/10'
                        }`}
                      >
                        <span className="text-2xl mb-1 block grayscale-0">{loc.icon}</span>
                        <div className={`text-xs font-bold ${moveTo === loc.key ? 'text-primary' : 'text-gray-400'}`}>
                          {loc.label}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMoveModal(null)}
                  className="py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 font-bold text-sm text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMove}
                  disabled={moveLoading}
                  className="py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-black font-bold text-sm transition-colors w-full"
                >
                  {moveLoading ? 'Moving...' : 'Confirm Move'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shared Bottom Navigation */}
        <GoldBottomNav />
      </div>
    </div>
  );
}
