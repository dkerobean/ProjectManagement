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
    <div className="min-h-screen bg-neutral-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black text-white pb-28">
      {/* Modern Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-500">
          History
        </h1>
        <div className="flex gap-2">
          <GradientButton
            variantType="success"
            size="sm"
            className="rounded-lg text-xs font-bold px-3 shadow-none"
            onClick={() => setShowBuyModal(true)}
          >
            ⬇️ Buy
          </GradientButton>
          <GradientButton
            variantType="danger"
            size="sm"
            className="rounded-lg text-xs font-bold px-3 shadow-none"
            onClick={() => setShowSellModal(true)}
          >
            ⬆️ Sell
          </GradientButton>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-20 space-y-4">
        {/* Filter Tabs */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-1 rounded-2xl flex gap-1 border border-white/5 sticky top-20 z-40">
          {(['all', 'buy', 'sell'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                filter === f
                  ? f === 'buy'
                    ? 'bg-green-500/10 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                    : f === 'sell'
                    ? 'bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                    : 'bg-amber-500/10 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                  : 'text-gray-500 hover:text-gray-300'
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
             <TransactionSkeleton />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2 opacity-50">📝</div>
            <div className="text-gray-500">No transactions found</div>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5) }}
              >
                <GlassCard 
                  className={`p-4 border-l-4 ${
                    tx.type === 'buy' ? 'border-l-green-500' : 'border-l-red-500'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                        tx.type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {tx.type === 'buy' ? '⬇️' : '⬆️'}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{tx.supplierName}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {tx.receiptNumber}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold tracking-tight ${
                        tx.type === 'buy' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(tx.totalAmount)}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                        {formatDate(tx.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                      <div className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">Weight</div>
                      <div className="font-bold text-gray-200">{tx.weightGrams}g</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                      <div className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">Purity</div>
                      <div className="font-bold text-gray-200">{tx.purity}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                      <div className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">Price/g</div>
                      <div className="font-bold text-amber-500">{formatCurrency(tx.buyingPricePerGram)}</div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                        getPaymentBadge(tx.paymentMethod).color
                      } bg-opacity-20 text-white/90`}>
                        {getPaymentBadge(tx.paymentMethod).icon} {tx.paymentMethod.replace('_', ' ')}
                      </span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <span>📍</span> {tx.location.replace('_', ' ')}
                      </span>
                    </div>
                    {tx.notes && (
                      <span className="text-gray-500 truncate max-w-24 italic text-[10px]">
                        "{tx.notes}"
                      </span>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 text-sm font-bold transition border border-white/5"
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

      {/* Modern Glass Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
        <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 mx-auto max-w-lg">
          <div className="flex justify-around items-center p-2">
            {[
              { label: 'Home', icon: '🏠', href: '/gold' },
              { label: 'Trade', icon: '📋', href: '/gold/trade', active: true },
              { label: 'Vault', icon: '🏦', href: '/gold/vault' },
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
