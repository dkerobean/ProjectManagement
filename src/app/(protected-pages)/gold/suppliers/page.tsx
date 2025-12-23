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
    <div className="min-h-screen bg-neutral p-safe-top pb-safe-bottom bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-sans flex justify-center items-start selection:bg-primary selection:text-white">
      <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-5 pt-12 pb-4 flex justify-between items-center bg-white dark:bg-[#1C1C1E] z-10 sticky top-0 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-primary tracking-tight">People</h1>
          <button 
             onClick={() => setShowAddModal(true)}
             className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:brightness-110 text-black text-xs font-bold shadow-glow transition-all active:scale-95 flex items-center gap-1"
          >
             <span>+ Add New</span>
          </button>
        </header>

        <main className="flex-1 px-4 pb-28 overflow-y-auto space-y-4 pt-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full bg-surface-card border border-white/5 rounded-2xl px-5 py-4 pl-12 text-sm text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-500 shadow-inner"
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
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                  filter === f
                    ? 'bg-primary text-black border-primary shadow-glow'
                    : 'bg-surface-card text-gray-400 border-white/5 hover:bg-white/5'
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
             </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-20 px-6">
              <span className="text-5xl block mb-4 grayscale opacity-50">👥</span>
              <h3 className="text-lg font-bold text-white mb-2">No contacts found</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">Start building your network by adding miners, traders, and buyers.</p>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="px-6 py-3 rounded-xl bg-surface-card border border-white/5 text-sm font-bold text-primary hover:bg-white/5 transition-colors"
              >
                Add First Contact
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {suppliers.map((supplier) => {
                 const badge = getTrustBadge(supplier.trustLevel);
                 return (
                <div
                  key={supplier._id}
                  className="rounded-2xl bg-surface-card border border-white/5 p-4 overflow-hidden group active:scale-[0.99] transition-all hover:border-primary/20"
                >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-surface-darker border border-white/5 flex items-center justify-center text-2xl shadow-inner">
                          {getTypeBadge(supplier.type)}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-gray-200 group-hover:text-primary transition-colors">{supplier.name}</h3>
                          <p className="text-gray-500 text-xs font-mono">
                            {supplier.phone || 'No phone'}
                          </p>
                        </div>
                      </div>
                      
                      {supplier.outstandingBalance !== 0 && (
                        <div className="text-right">
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Balance</div>
                          <div
                            className={`font-bold font-mono text-sm ${
                              supplier.outstandingBalance > 0
                                ? 'text-accent-red'
                                : 'text-accent-green'
                            }`}
                          >
                            {supplier.outstandingBalance > 0
                              ? `-${formatCurrency(Math.abs(supplier.outstandingBalance))}`
                              : `+${formatCurrency(Math.abs(supplier.outstandingBalance))}`}
                          </div>
                        </div>
                      )}
                    </div>
    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${badge.bg.replace('bg-', 'bg-opacity-20 ')} ${badge.color.replace('text-', 'border-')} ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-surface-dark text-gray-400 border border-white/5">
                        {supplier.type}
                      </span>
                      {supplier.location && (
                         <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-surface-dark text-gray-400 border border-white/5">
                          📍 {supplier.location}
                        </span>
                      )}
                    </div>
  
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                      <div>
                         <div className="text-[10px] text-gray-500 mb-0.5 uppercase">Volume</div>
                         <div className="text-white font-bold text-sm">{supplier.totalWeightGrams.toLocaleString()}g</div>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] text-gray-500 mb-0.5 uppercase">Last Trade</div>
                         <div className="text-white font-medium text-xs">
                           {supplier.lastTransactionDate 
                             ? new Date(supplier.lastTransactionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
                             : 'Never'}
                         </div>
                      </div>
                    </div>
                </div>
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
                className="w-full max-w-sm bg-[#1C1C1E] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden"
              >
                  <div className="relative h-2 bg-gradient-to-r from-primary to-primary-dark"></div>
                  
                  <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                      Add Contact
                    </h2>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-gray-400"
                    >
                      ✕
                    </button>
                  </div>
  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. John Doe Mining"
                        className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors text-sm"
                      />
                    </div>
  
                    <div>
                      <label className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="+233..."
                        className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors text-sm"
                      />
                    </div>
  
                    <div>
                       <label className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-2">
                        Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                         {['miner', 'trader', 'buyer', 'refinery'].map((type) => (
                           <button 
                             key={type}
                             onClick={() => setNewType(type)}
                             className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${newType === type ? 'bg-primary/10 border-primary/50 text-primary' : 'bg-surface-dark border-transparent text-gray-400 hover:bg-white/5'}`}
                           >
                             <span className="text-lg">{getTypeBadge(type)}</span>
                             <span className="text-xs font-bold capitalize">{type}</span>
                           </button>
                         ))}
                      </div>
                    </div>
  
                    <button
                      onClick={handleAddSupplier}
                      disabled={!newName.trim() || addLoading}
                      className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-black font-bold text-sm shadow-glow transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addLoading ? 'Creating...' : 'Create Contact'}
                    </button>
                  </div>
              </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
  
        {/* Shared Bottom Navigation */}
        <GoldBottomNav />
      </div>
    </div>
  );
}
