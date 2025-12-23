'use client';

/**
 * Trade Page - Transaction History
 * GoldTrader Pro - View and manage all transactions
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import PurchaseModal from '@/components/gold/PurchaseModal';
import GlassCard from '@/components/gold/GlassCard';
import GradientButton from '@/components/gold/GradientButton';
import { TransactionSkeleton } from '@/components/gold/Skeleton';
import GoldBottomNav from '@/components/gold/GoldBottomNav';

interface Transaction {
  _id: string;
  type: 'buy' | 'sell';
  supplierName: string;
  supplierId: string;
  goldType: string;
  purity: string;
  weightGrams: number;
  spotPricePerGram: number;
  buyingPricePerGram: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  location: string;
  receiptNumber: string;
  notes?: string;
  createdAt: string;
}

type Filter = 'all' | 'buy' | 'sell';

export default function TradePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = useCallback(async (pageNum = 1, append = false) => {
    try {
      let url = `/api/gold/transactions?page=${pageNum}&limit=20`;
      if (filter !== 'all') {
        url += `&type=${filter}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        if (append) {
          setTransactions((prev) => [...prev, ...data.data]);
        } else {
          setTransactions(data.data);
        }
        setHasMore(data.pagination.page < data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setPage(1);
    setLoading(true);
    fetchTransactions(1, false);
  }, [filter, fetchTransactions]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage, true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentBadge = (method: string) => {
    const badges: Record<string, { icon: string; color: string }> = {
      cash: { icon: '💵', color: 'bg-green-600' },
      momo: { icon: '📱', color: 'bg-yellow-600' },
      bank_transfer: { icon: '🏦', color: 'bg-blue-600' },
      advance_deduction: { icon: '➖', color: 'bg-purple-600' },
    };
    return badges[method] || { icon: '💰', color: 'bg-gray-600' };
  };

  return (
    <div className="min-h-screen bg-neutral p-safe-top pb-safe-bottom bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-sans flex justify-center items-start selection:bg-primary selection:text-white">
      <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-5 pt-12 pb-4 flex justify-between items-center bg-white dark:bg-[#1C1C1E] z-10 sticky top-0 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-primary tracking-tight">History</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowBuyModal(true)}
              className="px-4 py-2 rounded-xl bg-accent-green hover:bg-emerald-600 text-white text-xs font-bold shadow-glow-green transition-all active:scale-95"
            >
              ⬇ Buy
            </button>
            <button 
              onClick={() => setShowSellModal(true)}
              className="px-4 py-2 rounded-xl bg-accent-red hover:bg-red-600 text-white text-xs font-bold shadow-glow-red transition-all active:scale-95"
            >
              ⬆ Sell
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 overflow-y-auto space-y-4 pt-2">
          {/* Filter Tabs */}
          <div className="bg-surface-card p-1 rounded-2xl flex gap-1 border border-white/5 sticky top-0 z-20 shadow-sm mb-4">
             {(['all', 'buy', 'sell'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                  filter === f
                    ? f === 'buy'
                      ? 'bg-accent-green/10 text-accent-green shadow-sm'
                      : f === 'sell'
                      ? 'bg-accent-red/10 text-accent-red shadow-sm'
                      : 'bg-primary/10 text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-300 bg-transparent'
                }`}
              >
                {f === 'all' && 'All Trades'}
                {f === 'buy' && 'Buys'}
                {f === 'sell' && 'Sells'}
              </button>
            ))}
          </div>

          {/* Transaction List */}
          {loading ? (
             <div className="space-y-3">
               <TransactionSkeleton />
               <TransactionSkeleton />
               <TransactionSkeleton />
             </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-20 opacity-50">
               <span className="text-4xl block mb-2">📄</span>
               <span className="text-sm font-medium">No transactions found</span>
            </div>
          ) : (
             <div className="space-y-4">
               {/* Group by date if possible, but for now flat list to match structure */}
               <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-gray-800 via-gray-700 to-gray-800"></div>
                  
                  {transactions.map((tx, index) => (
                    <motion.div 
                      key={tx._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative pl-14 mb-6 group"
                    >
                       {/* Timeline Dot */}
                       <div className={`absolute left-[20px] top-6 w-3 h-3 rounded-full border-2 border-[#1C1C1E] z-10 ${tx.type === 'buy' ? 'bg-accent-green box-shadow-[0_0_0_4px_rgba(16,185,129,0.2)]' : 'bg-accent-red box-shadow-[0_0_0_4px_rgba(239,68,68,0.2)]'}`}></div>
                       
                       {/* Card */}
                       <div className="bg-surface-card border border-white/5 rounded-2xl p-4 shadow-sm hover:border-primary/20 transition-all">
                          <div className="flex justify-between items-start mb-3">
                             <div>
                                <h3 className="text-sm font-bold text-gray-200">{tx.supplierName}</h3>
                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{tx.receiptNumber}</p>
                             </div>
                             <div className="text-right">
                                <span className={`text-sm font-bold block ${tx.type === 'buy' ? 'text-accent-green' : 'text-accent-red'}`}>
                                   {tx.type === 'buy' ? '-' : '+'}{formatCurrency(tx.totalAmount)}
                                </span>
                                <span className="text-[10px] text-gray-600">{new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                             <span className="bg-surface-dark px-2 py-1 rounded text-[10px] font-bold text-gray-300 border border-white/5">
                               {tx.weightGrams}g
                             </span>
                             <span className="bg-surface-dark px-2 py-1 rounded text-[10px] font-bold text-gray-400 border border-white/5">
                               {tx.purity}
                             </span>
                             <span className="bg-primary/5 px-2 py-1 rounded text-[10px] font-bold text-primary border border-primary/10">
                               {formatCurrency(tx.buyingPricePerGram)}/g
                             </span>
                          </div>
                          
                          <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                             <div className="flex items-center gap-1.5">
                                <span className="text-xs grayscale opacity-70">
                                   {getPaymentBadge(tx.paymentMethod).icon}
                                </span>
                                <span className="text-[10px] font-medium text-gray-500 uppercase">
                                   {tx.paymentMethod.replace(/_/g, ' ')}
                                </span>
                             </div>
                             <span className="text-[10px] text-gray-600 flex items-center gap-1">
                                <span>📍</span> {tx.location.replace(/_/g, ' ')}
                             </span>
                          </div>
                       </div>
                    </motion.div>
                  ))}
               </div>
               
               {hasMore && (
                  <button 
                    onClick={loadMore}
                    className="w-full py-3 rounded-xl bg-surface-card hover:bg-white/5 text-xs font-bold text-gray-400 border border-white/5 transition-colors"
                  >
                    Load More History
                  </button>
               )}
             </div>
          )}
        </main>

        {/* Modals */}
        <PurchaseModal
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          onSuccess={() => {
            setShowBuyModal(false);
            setPage(1);
            fetchTransactions(1, false);
          }}
          type="buy"
        />
        <PurchaseModal
          isOpen={showSellModal}
          onClose={() => setShowSellModal(false)}
          onSuccess={() => {
             setShowSellModal(false);
             setPage(1);
             fetchTransactions(1, false);
          }}
          type="sell"
        />

        {/* Shared Bottom Navigation */}
        <GoldBottomNav />
      </div>
    </div>
  );
}
