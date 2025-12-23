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

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, tx) => {
    const date = new Date(tx.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key = date.toLocaleDateString();
    if (date.toDateString() === today.toDateString()) {
      key = 'TODAY';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'YESTERDAY';
    } else {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="min-h-screen bg-neutral p-safe-top pb-safe-bottom bg-background-dark text-gray-100 font-sans flex justify-center items-start selection:bg-primary selection:text-white">
      <div className="w-full max-w-md bg-background-dark min-h-screen relative overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-5 pt-12 pb-4 flex justify-between items-center z-10 sticky top-0 bg-background-dark/90 backdrop-blur-md">
          <h1 className="text-3xl font-bold text-primary tracking-tight">History</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowBuyModal(true)}
              className="px-4 py-2 rounded-lg bg-[#064E3B] hover:brightness-110 text-accent-green text-xs font-bold border border-accent-green/20 transition-all active:scale-95 flex items-center gap-1"
            >
              <span>⬇</span> BUY
            </button>
            <button 
              onClick={() => setShowSellModal(true)}
              className="px-4 py-2 rounded-lg bg-[#450A0A] hover:brightness-110 text-accent-red text-xs font-bold border border-accent-red/20 transition-all active:scale-95 flex items-center gap-1"
            >
              <span>⬆</span> SELL
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 overflow-y-auto space-y-4 pt-2">
          {/* Filter Tabs */}
          <div className="bg-[#1C1C1E] p-1 rounded-2xl flex gap-1 border border-white/5 sticky top-0 z-20 shadow-lg">
             {(['all', 'buy', 'sell'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                  filter === f
                    ? 'bg-white/5 text-primary shadow-inner border border-white/5'
                    : 'text-gray-500 hover:text-gray-300 bg-transparent border border-transparent'
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
             <div className="space-y-6">
               {Object.entries(groupedTransactions).map(([dateLabel, txs]) => (
                  <div key={dateLabel}>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 pl-2">{dateLabel}</h3>
                      <div className="space-y-3">
                        {txs.map((tx) => (
                          <div 
                              key={tx._id}
                              className="bg-[#1C1C1E] rounded-3xl p-4 border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all"
                          >
                              <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                                      tx.type === 'buy' 
                                      ? 'bg-green-900/20 border-green-900/50 text-accent-green' 
                                      : 'bg-red-900/20 border-red-900/50 text-accent-red' 
                                  }`}>
                                      <span className="text-xl font-bold">{tx.type === 'buy' ? '↓' : '↑'}</span>
                                  </div>
                                  <div>
                                      <div className="flex items-center gap-2">
                                          <h4 className="font-bold text-base text-gray-200">
                                              {tx.type === 'buy' ? 'Buy Gold' : 'Sell Gold'}
                                          </h4>
                                          {/* Simulate Pending Status if needed, for now logic is hidden but UI ready */}
                                          {false && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">PENDING</span>}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5 font-medium">
                                          {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • 24K Gold
                                      </div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className={`text-base font-bold ${tx.type === 'buy' ? 'text-white' : 'text-white'}`}>
                                      {tx.type === 'buy' ? '+' : '-'}{tx.weightGrams} g
                                  </div>
                                  <div className={`${tx.type === 'buy' ? 'text-accent-green' : 'text-gray-500'} text-xs font-medium`}>
                                      {tx.type === 'buy' ? 'Completed' : formatCurrency(tx.totalAmount)}
                                  </div>
                              </div>
                          </div>
                        ))}
                      </div>
                  </div>
               ))}

               {hasMore && (
                  <button 
                    onClick={loadMore}
                    className="w-full py-3 rounded-xl bg-[#1C1C1E] hover:bg-white/5 text-xs font-bold text-gray-400 border border-white/5 transition-colors"
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
