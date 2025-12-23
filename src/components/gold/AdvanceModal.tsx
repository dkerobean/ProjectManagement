'use client';

/**
 * Advance Modal - Give cash advance to miner
 * GoldTrader Pro - Debt tracker
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import GlassCard from '@/components/gold/GlassCard';
import GradientButton from '@/components/gold/GradientButton';

interface Supplier {
  _id: string;
  name: string;
  phone?: string;
  outstandingBalance: number;
}

interface AdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: '💵 Cash' },
  { value: 'momo', label: '📱 MoMo' },
  { value: 'bank_transfer', label: '🏦 Bank' },
];

export default function AdvanceModal({
  isOpen,
  onClose,
  onSuccess,
}: AdvanceModalProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  const [supplierId, setSupplierId] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const searchSuppliers = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuppliers([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/gold/suppliers?search=${encodeURIComponent(query)}&limit=5`
      );
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.data);
      }
    } catch {
      console.error('Failed to search suppliers');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchSuppliers(supplierSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [supplierSearch, searchSuppliers]);

  const selectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierId(supplier._id);
    setSupplierSearch(supplier.name);
    setShowSupplierDropdown(false);
  };

  const handleSubmit = async () => {
    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/gold/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          amount: parseFloat(amount),
          currency,
          paymentMethod,
          purpose,
          notes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
          // Reset form
          setAmount('');
          setSupplierSearch('');
          setSelectedSupplier(null);
          setSupplierId('');
          setPurpose('');
          setNotes('');
          setSuccess(false);
        }, 1500);
      } else {
        setError(data.error || 'Failed to create advance');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amt);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto"
      >
        <div className="min-h-screen py-4 px-4 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg"
          >
            <GlassCard 
              variant="dark" 
              className="overflow-hidden border-0 shadow-2xl relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 to-yellow-400"></div>

              {/* Header */}
              <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  💰 Give Advance
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5">
                {error && (
                  <div className="bg-red-500/20 text-red-200 px-4 py-3 rounded-xl text-sm border border-red-500/20 flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                {success ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-6xl mx-auto mb-4 border border-green-500/20 animate-pulse">
                      ✅
                    </div>
                    <h3 className="text-2xl font-bold text-green-400 mb-2">
                      Advance Created!
                    </h3>
                    <p className="text-gray-400">
                      You gave <span className="text-white font-bold">{formatCurrency(parseFloat(amount))}</span> to <span className="text-white font-bold">{selectedSupplier?.name}</span>
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Supplier Search */}
                    <div className="relative z-20">
                      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
                        Give advance to
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={supplierSearch}
                          onChange={(e) => {
                            setSupplierSearch(e.target.value);
                            setShowSupplierDropdown(true);
                            if (!e.target.value) {
                              setSelectedSupplier(null);
                              setSupplierId('');
                            }
                          }}
                          onFocus={() => setShowSupplierDropdown(true)}
                          placeholder="Search miner/supplier..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 outline-none transition-colors"
                        />
                        {selectedSupplier && (
                          <div className="absolute right-3 top-3 text-green-400">
                             ✓
                          </div>
                        )}
                      </div>
                      
                      {showSupplierDropdown && suppliers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-gray-800 rounded-xl mt-2 border border-white/10 shadow-xl overflow-hidden z-30">
                          {suppliers.map((s) => (
                            <button
                              key={s._id}
                              onClick={() => selectSupplier(s)}
                              className="w-full text-left px-4 py-3 hover:bg-white/5 flex justify-between items-center border-b border-white/5 last:border-0 transition-colors"
                            >
                              <span className="font-medium text-white">{s.name}</span>
                              {s.outstandingBalance > 0 && (
                                <span className="text-amber-400 text-xs bg-amber-400/10 px-2 py-0.5 rounded">
                                  Owes ${s.outstandingBalance.toLocaleString()}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {selectedSupplier && selectedSupplier.outstandingBalance > 0 && (
                        <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-400 flex items-center gap-2">
                          <span>⚠️</span> This supplier already owes you <span className="font-bold underline">{formatCurrency(selectedSupplier.outstandingBalance)}</span>
                        </div>
                      )}
                    </div>

                    {/* Amount + Currency */}
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
                          Amount
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-3xl font-bold text-center text-white focus:border-amber-500/50 outline-none transition-colors"
                          inputMode="decimal"
                        />
                      </div>
                      <div className="w-28">
                        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
                          Currency
                        </label>
                        <div className="bg-black/40 border border-white/10 rounded-xl px-2 py-4 h-[68px] flex items-center justify-center">
                           <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="bg-transparent text-white font-bold text-lg outline-none cursor-pointer w-full text-center"
                          >
                            <option value="USD" className="bg-gray-900">USD</option>
                            <option value="GHS" className="bg-gray-900">GHS</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map((pm) => (
                          <button
                            key={pm.value}
                            onClick={() => setPaymentMethod(pm.value)}
                            className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border ${
                              paymentMethod === pm.value
                                ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {pm.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Purpose */}
                    <div>
                      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
                        Purpose
                      </label>
                      <input
                        type="text"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="e.g., Mining equipment..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 outline-none transition-colors"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Additional details..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 outline-none resize-none transition-colors"
                      />
                    </div>

                    {/* Summary */}
                    {amount && parseFloat(amount) > 0 && selectedSupplier && (
                      <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-4 text-center">
                        <div className="text-xs text-amber-200/70 uppercase tracking-widest mb-1">Confirm Advance</div>
                        <div className="text-3xl font-bold text-amber-400 mb-1">
                          {formatCurrency(parseFloat(amount))}
                        </div>
                        <div className="text-sm text-gray-400">
                           will be given to <span className="text-white font-bold">{selectedSupplier.name}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-amber-500/10 text-xs text-gray-500 font-mono">
                          New Balance: {formatCurrency(selectedSupplier.outstandingBalance + parseFloat(amount))}
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                      <GradientButton
                        onClick={handleSubmit}
                        disabled={loading || !supplierId || !amount || parseFloat(amount) <= 0}
                        variantType="gold"
                        className="w-full py-4 text-lg rounded-xl shadow-lg"
                      >
                        {loading ? 'Processing...' : 'Confirm Advance'}
                      </GradientButton>
                    </div>
                  </>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
