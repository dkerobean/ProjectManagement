'use client';

/**
 * Supplier Detail Page
 * GoldTrader Pro - View supplier with transactions and advances
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import AdvanceModal from '@/components/gold/AdvanceModal';

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
  totalAmountTraded: number;
  outstandingBalance: number;
  lastTransactionDate?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  momoDetails?: {
    provider?: string;
    number?: string;
  };
  notes?: string;
  recentTransactions: Array<{
    _id: string;
    type: 'buy' | 'sell';
    weightGrams: number;
    totalAmount: number;
    purity: string;
    createdAt: string;
  }>;
  advances: Array<{
    _id: string;
    amount: number;
    remainingBalance: number;
    status: string;
    givenDate: string;
  }>;
}

export default function SupplierDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'advances'>('transactions');

  const fetchSupplier = useCallback(async () => {
    try {
      const res = await fetch(`/api/gold/suppliers/${id}`);
      const data = await res.json();
      if (data.success) {
        setSupplier(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch supplier:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchSupplier();
    }
  }, [id, fetchSupplier]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTrustBadge = (level: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      new: { color: 'bg-gray-600', label: 'New' },
      regular: { color: 'bg-blue-600', label: 'Regular' },
      vip: { color: 'bg-yellow-600', label: 'VIP' },
    };
    return badges[level] || badges.new;
  };

  const getTypeBadge = (type: string) => {
    const types: Record<string, string> = {
      miner: '⛏️ Miner',
      trader: '💼 Trader',
      refinery: '🏭 Refinery',
      buyer: '🛒 Buyer',
      other: '📦 Other',
    };
    return types[type] || '📦 Other';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-yellow-400">Loading...</div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold">Supplier not found</h2>
          <a href="/gold/suppliers" className="text-yellow-400 mt-4 inline-block">
            ← Back to Suppliers
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-600 to-yellow-800 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <a href="/gold/suppliers" className="text-yellow-200 text-sm mb-2 inline-block">
            ← Back
          </a>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{supplier.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm opacity-80">{getTypeBadge(supplier.type)}</span>
                <span
                  className={`${
                    getTrustBadge(supplier.trustLevel).color
                  } px-2 py-0.5 rounded text-xs`}
                >
                  {getTrustBadge(supplier.trustLevel).label}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowAdvanceModal(true)}
              className="bg-yellow-700 hover:bg-yellow-600 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              💰 Give Advance
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 space-y-4 py-4">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 text-center border ${
            supplier.outstandingBalance > 0
              ? 'bg-gradient-to-br from-yellow-900/50 to-gray-900 border-yellow-500/30'
              : supplier.outstandingBalance < 0
              ? 'bg-gradient-to-br from-green-900/50 to-gray-900 border-green-500/30'
              : 'bg-gray-800 border-gray-700'
          }`}
        >
          <h2 className="text-gray-400 text-sm mb-2">OUTSTANDING BALANCE</h2>
          <div
            className={`text-4xl font-bold ${
              supplier.outstandingBalance > 0
                ? 'text-yellow-400'
                : supplier.outstandingBalance < 0
                ? 'text-green-400'
                : 'text-gray-400'
            }`}
          >
            {supplier.outstandingBalance > 0
              ? `Owes ${formatCurrency(Math.abs(supplier.outstandingBalance))}`
              : supplier.outstandingBalance < 0
              ? `Owed ${formatCurrency(Math.abs(supplier.outstandingBalance))}`
              : 'Settled'}
          </div>
          {supplier.outstandingBalance > 0 && (
            <div className="text-sm text-yellow-500 mt-2">
              (This supplier has pending advances)
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-xl p-3 text-center"
          >
            <div className="text-2xl font-bold text-white">
              {supplier.totalTransactions}
            </div>
            <div className="text-xs text-gray-500">Trades</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-gray-800 rounded-xl p-3 text-center"
          >
            <div className="text-2xl font-bold text-white">
              {(supplier.totalWeightGrams / 1000).toFixed(1)}kg
            </div>
            <div className="text-xs text-gray-500">Total Weight</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-xl p-3 text-center"
          >
            <div className="text-xl font-bold text-white">
              {formatCurrency(supplier.totalAmountTraded)}
            </div>
            <div className="text-xs text-gray-500">Total Traded</div>
          </motion.div>
        </div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gray-800 rounded-xl p-4"
        >
          <h2 className="text-gray-400 text-sm mb-3">📇 CONTACT INFO</h2>
          <div className="space-y-2 text-sm">
            {supplier.phone && (
              <div className="flex justify-between">
                <span className="text-gray-400">Phone</span>
                <a href={`tel:${supplier.phone}`} className="text-yellow-400">
                  {supplier.phone}
                </a>
              </div>
            )}
            {supplier.location && (
              <div className="flex justify-between">
                <span className="text-gray-400">Location</span>
                <span>{supplier.location}</span>
              </div>
            )}
            {supplier.momoDetails?.number && (
              <div className="flex justify-between">
                <span className="text-gray-400">MoMo</span>
                <span>
                  {supplier.momoDetails.provider} - {supplier.momoDetails.number}
                </span>
              </div>
            )}
            {supplier.lastTransactionDate && (
              <div className="flex justify-between">
                <span className="text-gray-400">Last Trade</span>
                <span>{formatDate(supplier.lastTransactionDate)}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-2 rounded-xl font-medium transition ${
              activeTab === 'transactions'
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            📋 Transactions
          </button>
          <button
            onClick={() => setActiveTab('advances')}
            className={`flex-1 py-2 rounded-xl font-medium transition ${
              activeTab === 'advances'
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            💰 Advances ({supplier.advances?.length || 0})
          </button>
        </div>

        {/* Content based on tab */}
        {activeTab === 'transactions' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 rounded-xl p-4"
          >
            <h2 className="text-gray-400 text-sm mb-3">Recent Transactions</h2>
            {!supplier.recentTransactions?.length ? (
              <div className="text-center text-gray-500 py-4">
                No transactions yet
              </div>
            ) : (
              <div className="space-y-3">
                {supplier.recentTransactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          tx.type === 'buy' ? 'text-green-500' : 'text-red-500'
                        }
                      >
                        {tx.type === 'buy' ? '⬇️' : '⬆️'}
                      </span>
                      <div>
                        <div className="font-medium">
                          {tx.weightGrams}g {tx.purity}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(tx.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-bold ${
                        tx.type === 'buy' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {formatCurrency(tx.totalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 rounded-xl p-4"
          >
            <h2 className="text-gray-400 text-sm mb-3">Advances Given</h2>
            {!supplier.advances?.length ? (
              <div className="text-center text-gray-500 py-4">
                No advances given
              </div>
            ) : (
              <div className="space-y-3">
                {supplier.advances.map((adv) => (
                  <div
                    key={adv._id}
                    className={`p-3 rounded-lg border ${
                      adv.status === 'settled'
                        ? 'bg-green-900/20 border-green-500/30'
                        : 'bg-yellow-900/20 border-yellow-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {formatCurrency(adv.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(adv.givenDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-medium ${
                            adv.status === 'settled'
                              ? 'text-green-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          {adv.status === 'settled'
                            ? '✓ Settled'
                            : `${formatCurrency(adv.remainingBalance)} left`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Advance Modal */}
      <AdvanceModal
        isOpen={showAdvanceModal}
        onClose={() => setShowAdvanceModal(false)}
        onSuccess={() => {
          setShowAdvanceModal(false);
          fetchSupplier();
        }}
      />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-2 py-2 z-20">
        <div className="max-w-lg mx-auto flex justify-around items-center">
          <a href="/gold" className="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-400 px-4 py-2 transition">
            <span className="text-xl">🏠</span>
            <span className="text-xs">Home</span>
          </a>
          <a href="/gold/trade" className="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-400 px-4 py-2 transition">
            <span className="text-xl">💰</span>
            <span className="text-xs">Trade</span>
          </a>
          <a href="/gold/vault" className="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-400 px-4 py-2 transition">
            <span className="text-xl">🏦</span>
            <span className="text-xs">Vault</span>
          </a>
          <a href="/gold/suppliers" className="flex flex-col items-center gap-1 text-yellow-400 px-4 py-2">
            <span className="text-xl">👥</span>
            <span className="text-xs">People</span>
          </a>
          <a href="/gold/reports" className="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-400 px-4 py-2 transition">
            <span className="text-xl">📊</span>
            <span className="text-xs">Reports</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
