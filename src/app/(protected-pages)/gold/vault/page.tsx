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

  return (
    <div className="min-h-screen bg-neutral p-safe-top pb-safe-bottom bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-sans flex justify-center items-start selection:bg-primary selection:text-white">
      <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-5 pt-12 pb-2 flex justify-between items-center bg-white dark:bg-[#1C1C1E] z-10 sticky top-0 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-primary tracking-tight">Vault</h1>
          <button 
            onClick={() => setSelectedLocation(null)}
            className={`text-sm font-medium hover:text-primary-dark transition-colors ${(selectedLocation === null) ? 'text-primary' : 'text-gray-500'}`}
          >
            {selectedLocation ? 'Show All' : 'All Views'}
          </button>
        </header>

        <main className="flex-1 px-4 pb-28 overflow-y-auto space-y-5 pt-2">
          {/* Total Asset Value Card */}
          {summary && (
            <div className="relative w-full rounded-3xl bg-surface-darker border border-primary/20 p-8 overflow-hidden shadow-glow-subtle flex flex-col items-center justify-center text-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
              <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
              <h2 className="text-xs font-bold text-primary/80 uppercase tracking-[0.2em] mb-3 relative z-10">Total Asset Value</h2>
              <div className="relative z-10 mb-5">
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl font-bold text-white tracking-tight"
                >
                  {formatCurrency(summary.grandTotal.totalCost)}
                </motion.span>
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-dark border border-white/5 shadow-inner-light">
                  <span className="text-primary text-sm font-bold">⚖</span>
                  <span className="text-sm font-medium text-gray-200">{formatWeight(summary.grandTotal.totalWeight)} <span className="text-gray-500">Total Weight</span></span>
                </div>
              </div>
            </div>
          )}

          {/* Location Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            {LOCATIONS.map((loc, index) => {
              const locData = summary?.byLocation[loc.key];
              const isSelected = selectedLocation === loc.key;
              
              // Colors based on map
              const colors: Record<string, string> = {
                in_safe: 'accent-purple',
                at_refinery: 'accent-orange',
                in_transit: 'accent-cyan',
                exported: 'accent-blue'
              };
              const colorClass = colors[loc.key] || 'primary';
              
              // Helper to get tailwind class dynamically
              const getBgColor = (c: string) => {
                if(c === 'accent-purple') return 'bg-purple-500';
                if(c === 'accent-orange') return 'bg-orange-500';
                if(c === 'accent-cyan') return 'bg-cyan-500';
                return 'bg-blue-500';
              };
              
              const getText = (c: string) => {
                if(c === 'accent-purple') return 'text-purple-500';
                if(c === 'accent-orange') return 'text-orange-500';
                if(c === 'accent-cyan') return 'text-cyan-500';
                return 'text-blue-500';
              }
              
              const getBorder = (c: string) => {
                if(c === 'accent-purple') return 'border-purple-500';
                if(c === 'accent-orange') return 'border-orange-500';
                if(c === 'accent-cyan') return 'border-cyan-500';
                return 'border-blue-500';
              }

              return (
                <div 
                  key={loc.key}
                  onClick={() => setSelectedLocation(isSelected ? null : loc.key)}
                  className={`relative group rounded-2xl bg-surface-card border cursor-pointer overflow-hidden shadow-sm transition-all duration-300 ${isSelected ? 'border-primary/50 ring-1 ring-primary/20' : 'border-white/5 hover:border-white/20'}`}
                >
                  <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full -mr-4 -mt-4 transition-all opacity-5 ${getBgColor(colorClass)}`}></div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-opacity-10 flex items-center justify-center border bg-white/5 border-white/10 ${getText(colorClass)}`}>
                        <span className="text-xl">{loc.icon}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded uppercase">
                        {loc.key === 'in_safe' ? 'SAFE' : loc.key === 'at_refinery' ? 'REF' : loc.key === 'in_transit' ? 'SHIP' : 'EXP'}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-300 mb-0.5">{loc.label}</h3>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-xl font-bold text-white">{formatWeight(locData?.totalWeight || 0).split(' ')[0]}</span>
                      <span className="text-xs text-gray-500 font-medium">g</span>
                    </div>
                    {/* Progress bar simulation */}
                    <div className="w-full bg-gray-800 rounded-full h-1 mt-2 overflow-hidden">
                      <div className={`h-1 rounded-full ${getBgColor(colorClass)}`} style={{ width: locData?.totalWeight ? '60%' : '5%' }}></div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 font-mono">{formatCurrency(locData?.totalCost || 0)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Items / Empty State */}
          <div className="pt-2">
             <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {selectedLocation ? getLocationInfo(selectedLocation).label : 'Recent Items'}
              </h3>
              <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-surface-card border border-white/5 text-gray-500">
                {inventory.length} items
              </span>
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-500">Loading vault data...</div>
            ) : inventory.length === 0 ? (
              <div className="rounded-2xl bg-surface-card/50 border border-white/5 border-dashed p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-surface-darker flex items-center justify-center mb-4 shadow-inner">
                  <span className="text-3xl text-gray-700">🕸️</span> 
                </div>
                <h4 className="text-gray-400 font-medium mb-1">Vault is empty</h4>
                <p className="text-xs text-gray-600 max-w-[200px] mb-4">Start trading to fill up your vault with assets.</p>
                <button className="text-xs font-semibold text-primary hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                   + Add First Item
                </button>
              </div>
            ) : (
               <div className="space-y-3">
                 {inventory.map(item => (
                   <div key={item._id} className="rounded-2xl bg-surface-card border border-white/5 p-4 flex items-center justify-between group hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-surface-darker flex items-center justify-center text-lg border border-white/5">
                           {getLocationInfo(item.location).icon}
                         </div>
                         <div>
                           <div className="text-sm font-bold text-gray-200">{item.weightGrams}g <span className="text-primary text-xs ml-1 bg-primary/10 px-1 rounded">{item.purity}</span></div>
                           <div className="text-[10px] text-gray-500 font-mono">#{item.batchId}</div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-sm font-bold text-white">{formatCurrency(item.totalCost)}</div>
                         <button 
                           onClick={() => setMoveModal({item, isOpen: true})}
                           className="text-[10px] text-primary hover:text-primary-dark mt-1 flex items-center gap-1 justify-end"
                         >
                           Move Item ➜
                         </button>
                      </div>
                   </div>
                 ))}
               </div>
            )}
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
