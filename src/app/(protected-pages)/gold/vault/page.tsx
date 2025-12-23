'use client';

/**
 * Vault Management Page
 * GoldTrader Pro - Location-based inventory tracking
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/gold/GlassCard';
import GradientButton from '@/components/gold/GradientButton';

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
    <div className="min-h-screen bg-neutral-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black text-white pb-28">
      {/* Modern Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-500">
          Vault
        </h1>
        <button
          onClick={() => setSelectedLocation(null)}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
            selectedLocation 
              ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' 
              : 'text-gray-500 cursor-default'
          }`}
          disabled={!selectedLocation}
        >
          {selectedLocation ? 'Show All' : 'All Views'}
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-20 space-y-4">
        {/* Grand Total */}
        {summary && (
          <GlassCard variant="gold" className="relative text-center py-8 overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-300"></div>
            <div className="relative z-10">
              <h2 className="text-amber-200/60 text-xs font-bold tracking-widest mb-2 uppercase">Total Asset Value</h2>
              <div className="text-4xl font-bold text-white tracking-tight drop-shadow-lg mb-1">
                {formatCurrency(summary.grandTotal.totalCost)}
              </div>
              <div className="text-sm font-medium text-amber-500 bg-amber-500/10 inline-block px-3 py-1 rounded-full border border-amber-500/20">
                {formatWeight(summary.grandTotal.totalWeight)} Total Weight
              </div>
            </div>
          </GlassCard>
        )}

        {/* Location Cards */}
        <div className="grid grid-cols-2 gap-3">
          {LOCATIONS.map((loc, index) => {
            const locData = summary?.byLocation[loc.key];
            const isSelected = selectedLocation === loc.key;
            
            return (
              <motion.button
                key={loc.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedLocation(isSelected ? null : loc.key)}
                className={`relative rounded-2xl p-4 text-left transition-all duration-300 overflow-hidden border group ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-500/20 to-gray-900 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <div className={`text-3xl mb-3 grayscale group-hover:grayscale-0 transition-all duration-300 ${isSelected ? 'grayscale-0 scale-110' : ''}`}>
                  {loc.icon}
                </div>
                <h3 className={`font-bold text-sm ${isSelected ? 'text-amber-400' : 'text-gray-300'}`}>
                  {loc.label}
                </h3>
                <div className="text-lg font-bold text-white mt-1">
                  {formatWeight(locData?.totalWeight || 0)}
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  {formatCurrency(locData?.totalCost || 0)}
                </div>
                
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Inventory List */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-gray-400 text-xs font-bold tracking-wider uppercase">
              {selectedLocation ? `${getLocationInfo(selectedLocation).label} Inventory` : 'Recent Items'}
            </h2>
            <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded-full">
              {inventory.length} items
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin text-4xl mb-2"></div>
              <div className="text-gray-500 text-sm">Loading vault...</div>
            </div>
          ) : inventory.length === 0 ? (
            <GlassCard className="p-8 text-center text-gray-500">
              <span className="text-4xl mb-2 block opacity-50">🕸️</span>
              Vault is empty
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {inventory.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <GlassCard className="p-4 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl border border-white/5">
                          {getLocationInfo(item.location).icon}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {item.weightGrams}g <span className="text-amber-500/80">{item.purity}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono tracking-wide">
                            #{item.batchId}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {formatCurrency(item.totalCost)}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          @{formatCurrency(item.avgCostPerGram)}/g
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                      <span className="text-gray-600">
                        Added: {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => setMoveModal({ item, isOpen: true })}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors text-xs font-bold border border-white/5 flex items-center gap-1"
                      >
                       <span>Truck</span> Move
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Move Modal */}
      {moveModal?.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-3xl p-6 w-full max-w-sm border border-white/10 shadow-2xl"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🚚</span> Move Inventory
            </h2>

            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5">
              <div className="flex justify-between items-start mb-2">
                 <div>
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Item</div>
                    <div className="font-bold text-lg text-white">
                      {moveModal.item.weightGrams}g <span className="text-amber-500">{moveModal.item.purity}</span>
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
                          ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/50'
                          : 'bg-white/5 border-transparent hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl mb-1 block grayscale-0">{loc.icon}</span>
                      <div className={`text-xs font-bold ${moveTo === loc.key ? 'text-amber-400' : 'text-gray-400'}`}>
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
              <GradientButton
                onClick={handleMove}
                disabled={moveLoading}
                variantType="gold"
                className="py-3.5 rounded-xl text-sm w-full"
              >
                {moveLoading ? 'Moving...' : 'Confirm Move'}
              </GradientButton>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modern Glass Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
        <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 mx-auto max-w-lg">
          <div className="flex justify-around items-center p-2">
            {[
              { label: 'Home', icon: '🏠', href: '/gold' },
              { label: 'Trade', icon: '📋', href: '/gold/trade' },
              { label: 'Vault', icon: '🏦', href: '/gold/vault', active: true },
              { label: 'People', icon: '👥', href: '/gold/suppliers' },
              { label: 'Reports', icon: '📊', href: '/gold/reports' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-16
                  ${item.active 
                    ? 'text-amber-400 bg-white/5 shadow-[0_0_10px_rgba(251,191,36,0.1)] -translate-y-2' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
