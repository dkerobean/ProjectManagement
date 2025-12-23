'use client';

/**
 * Suppliers List Page
 * GoldTrader Pro - Miner/Seller CRM focused on balances
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/gold/GlassCard';
import GradientButton from '@/components/gold/GradientButton';
import { SupplierSkeleton } from '@/components/gold/Skeleton';
import GoldBottomNav from '@/components/gold/GoldBottomNav';

interface Supplier {
  _id: string;
  name: string;
  phone?: string;
  location?: string;
  type: string;
  trustLevel: string;
  isActive: boolean;
  totalTransactions: number;
  totalWeightGrams: number;
  outstandingBalance: number;
  lastTransactionDate?: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'hasBalance' | 'vip'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New supplier form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newType, setNewType] = useState('miner');
  const [addLoading, setAddLoading] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      let url = '/api/gold/suppliers?limit=100';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (filter === 'hasBalance') url += '&hasBalance=true';
      if (filter === 'vip') url += '&trustLevel=vip';

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    const timer = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(timer);
  }, [fetchSuppliers]);

  const handleAddSupplier = async () => {
    if (!newName.trim()) return;

    setAddLoading(true);
    try {
      const res = await fetch('/api/gold/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          phone: newPhone || undefined,
          type: newType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewName('');
        setNewPhone('');
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Failed to add supplier:', error);
    } finally {
      setAddLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTrustBadge = (level: string) => {
    const badges: Record<string, { color: string; label: string; bg: string }> = {
      new: { color: 'text-gray-400', bg: 'bg-gray-400/10', label: 'New' },
      regular: { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Regular' },
      vip: { color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'VIP' },
    };
    return badges[level] || badges.new;
  };

  const getTypeBadge = (type: string) => {
    const types: Record<string, string> = {
      miner: '⛏️',
      trader: '💼',
      refinery: '🏭',
      buyer: '🛒',
      other: '📦',
    };
    return types[type] || '📦';
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 pt-12 pb-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
            People
          </h1>
          <GradientButton
            onClick={() => setShowAddModal(true)}
            variantType="gold"
            className="px-4 py-2 text-sm"
          >
            + Add New
          </GradientButton>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 space-y-5 py-6 relative z-10">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pl-12 focus:border-amber-500/50 outline-none transition-all placeholder:text-gray-600"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
            🔍
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {(['all', 'hasBalance', 'vip'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                filter === f
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent hover:border-white/5'
              }`}
            >
              {f === 'all' && 'All'}
              {f === 'hasBalance' && '💰 Has Balance'}
              {f === 'vip' && '⭐ VIP'}
            </button>
          ))}
        </div>

        {/* Supplier List */}
        {loading ? (
          <div className="space-y-4">
             <SupplierSkeleton />
             <SupplierSkeleton />
             <SupplierSkeleton />
             <SupplierSkeleton />
          </div>
        ) : suppliers.length === 0 ? (
          <GlassCard className="text-center py-12 px-6">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-white/90 mb-2">No contacts found</h3>
            <p className="text-gray-500 mb-6">Start building your network by adding suppliers and buyers.</p>
            <GradientButton onClick={() => setShowAddModal(true)} className="mx-auto">
              Add First Contact
            </GradientButton>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {suppliers.map((supplier, index) => {
               const badge = getTrustBadge(supplier.trustLevel);
               return (
              <GlassCard
                key={supplier._id}
                className="p-0 overflow-hidden group active:scale-[0.98] transition-all duration-200"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-2xl shadow-lg">
                        {getTypeBadge(supplier.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors">{supplier.name}</h3>
                        <p className="text-gray-500 text-sm">
                          {supplier.phone || 'No phone'}
                        </p>
                      </div>
                    </div>
                    {supplier.outstandingBalance !== 0 && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Balance</div>
                        <div
                          className={`font-bold font-mono ${
                            supplier.outstandingBalance > 0
                              ? 'text-amber-400'
                              : 'text-green-400'
                          }`}
                        >
                          {supplier.outstandingBalance > 0
                            ? `-${formatCurrency(Math.abs(supplier.outstandingBalance))}`
                            : `+${formatCurrency(Math.abs(supplier.outstandingBalance))}`}
                        </div>
                      </div>
                    )}
                  </div>
  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${badge.bg} ${badge.color} border border-white/5`}>
                      {badge.label}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-white/5 text-gray-400 border border-white/5">
                      {supplier.type}
                    </span>
                    {supplier.location && (
                       <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-white/5 text-gray-400 border border-white/5">
                        📍 {supplier.location}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div>
                       <div className="text-xs text-gray-500 mb-1">Total Volume</div>
                       <div className="text-white font-medium">{supplier.totalWeightGrams.toLocaleString()}g</div>
                    </div>
                    <div className="text-right">
                       <div className="text-xs text-gray-500 mb-1">Last Trade</div>
                       <div className="text-white font-medium">
                         {supplier.lastTransactionDate 
                           ? new Date(supplier.lastTransactionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
                           : 'Never'}
                       </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )})}
          </div>
        )}
      </main>

      {/* Add Supplier Modal */}
      <AnimatePresence>
      {showAddModal && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <GlassCard className="border-0 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-300"></div>
                
                <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    ➕ Add Contact
                  </h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. John Doe Mining"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+233..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 outline-none transition-colors"
                    />
                  </div>

                  <div>
                     <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
                      Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => setNewType('miner')}
                         className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${newType === 'miner' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-white/5 border-transparent text-gray-400 hover:border-white/10'}`}
                       >
                         <span className="text-2xl">⛏️</span>
                         <span className="text-xs font-bold">Miner</span>
                       </button>
                       <button 
                         onClick={() => setNewType('trader')}
                         className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${newType === 'trader' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-white/5 border-transparent text-gray-400 hover:border-white/10'}`}
                       >
                         <span className="text-2xl">💼</span>
                         <span className="text-xs font-bold">Trader</span>
                       </button>
                        <button 
                         onClick={() => setNewType('buyer')}
                         className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${newType === 'buyer' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-white/5 border-transparent text-gray-400 hover:border-white/10'}`}
                       >
                         <span className="text-2xl">🛒</span>
                         <span className="text-xs font-bold">Buyer</span>
                       </button>
                       <button 
                         onClick={() => setNewType('refinery')}
                         className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${newType === 'refinery' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-white/5 border-transparent text-gray-400 hover:border-white/10'}`}
                       >
                         <span className="text-2xl">🏭</span>
                         <span className="text-xs font-bold">Refinery</span>
                       </button>
                    </div>
                  </div>

                  <GradientButton
                    onClick={handleAddSupplier}
                    disabled={!newName.trim() || addLoading}
                    variantType="gold"
                    className="w-full py-4 text-lg rounded-xl shadow-lg mt-4"
                  >
                    {addLoading ? 'Creating...' : 'Create Contact'}
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Shared Bottom Navigation */}
      <GoldBottomNav />
    </div>
  );
}
