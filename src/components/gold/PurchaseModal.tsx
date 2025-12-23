'use client';

/**
 * Purchase Modal - Smart Buying Calculator
 * GoldTrader Pro - Buy gold with auto LBMA price and margin calculation
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Receipt from '@/components/gold/Receipt';
import GlassCard from '@/components/gold/GlassCard';
import GradientButton from '@/components/gold/GradientButton';
import { getCachedPrice, addPendingTransaction } from '@/lib/offline-storage';

interface Supplier {
  _id: string;
  name: string;
  phone?: string;
  outstandingBalance: number;
  trustLevel: string;
}

interface Advance {
  _id: string;
  amount: number;
  remainingBalance: number;
  currency: string;
}

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  type: 'buy' | 'sell';
}

const PURITY_OPTIONS = [
  { name: '24K', percentage: 0.999 },
  { name: '22K', percentage: 0.916 },
  { name: '18K', percentage: 0.75 },
  { name: '14K', percentage: 0.585 },
  { name: 'Raw', percentage: 0.85 },
  { name: 'Custom', percentage: 0 },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: '💵 Cash' },
  { value: 'momo', label: '📱 MoMo' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer' },
];

export default function PurchaseModal({
  isOpen,
  onClose,
  onSuccess,
  type,
}: PurchaseModalProps) {
  // Form state
  const [weight, setWeight] = useState('');
  const [purity, setPurity] = useState('24K');
  const [customPurity, setCustomPurity] = useState('');
  const [discountPercent, setDiscountPercent] = useState('5');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  // Supplier state
  const [supplierId, setSupplierId] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Advance deduction
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [useAdvance, setUseAdvance] = useState(false);
  const [selectedAdvanceId, setSelectedAdvanceId] = useState('');

  // Price state
  const [spotPrice, setSpotPrice] = useState<{
    perOz: number;
    perGram: number;
  } | null>(null);
  const [manualPrice, setManualPrice] = useState('');
  const [useManualPrice, setUseManualPrice] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'details' | 'confirm' | 'receipt'>('details');
  const [receiptData, setReceiptData] = useState<any>(null);

  // Fetch spot price with offline fallback
  useEffect(() => {
    if (isOpen) {
      fetch('/api/gold/price')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSpotPrice({
              perOz: data.data.pricePerOz,
              perGram: data.data.pricePerGram,
            });
          }
        })
        .catch(() => {
          // Try to use cached price for offline mode
          const cached = getCachedPrice();
          if (cached) {
            setSpotPrice({
              perOz: cached.pricePerOz,
              perGram: cached.pricePerGram,
            });
          }
        });
    }
  }, [isOpen]);

  // Search suppliers
  const searchSuppliers = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuppliers([]);
      return;
    }
    try {
      const res = await fetch(`/api/gold/suppliers?search=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.data);
      }
    } catch {
      console.error('Failed to search suppliers');
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchSuppliers(supplierSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [supplierSearch, searchSuppliers]);

  // Fetch advances for selected supplier
  useEffect(() => {
    if (selectedSupplier && type === 'buy') {
      fetch(`/api/gold/advances?supplierId=${selectedSupplier._id}&status=pending`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAdvances(data.data.filter((a: Advance) => a.remainingBalance > 0));
          }
        })
        .catch(() => setAdvances([]));
    } else {
      setAdvances([]);
    }
  }, [selectedSupplier, type]);

  // Calculate values
  const getPurityPercentage = () => {
    if (purity === 'Custom') {
      return parseFloat(customPurity) / 100 || 0;
    }
    return PURITY_OPTIONS.find((p) => p.name === purity)?.percentage || 0.999;
  };

  const getEffectiveSpotPrice = () => {
    if (useManualPrice && manualPrice) {
      const pricePerOz = parseFloat(manualPrice);
      return {
        perOz: pricePerOz,
        perGram: pricePerOz / 31.1035,
      };
    }
    return spotPrice;
  };

  const calculateTotal = () => {
    const weightGrams = parseFloat(weight) || 0;
    const discount = parseFloat(discountPercent) || 0;
    const price = getEffectiveSpotPrice();
    const purityPct = getPurityPercentage();

    if (!price) return { pricePerGram: 0, total: 0, discount: 0 };

    const basePrice = price.perGram;
    const discountedPrice = type === 'buy' 
      ? basePrice * (1 - discount / 100) 
      : basePrice * (1 + discount / 100);
    const total = weightGrams * discountedPrice * purityPct;

    return {
      pricePerGram: discountedPrice,
      total,
      discount: type === 'buy' ? -discount : discount,
    };
  };

  const getAdvanceDeduction = () => {
    if (!useAdvance || !selectedAdvanceId) return 0;
    const advance = advances.find((a) => a._id === selectedAdvanceId);
    if (!advance) return 0;
    const { total } = calculateTotal();
    return Math.min(advance.remainingBalance, total);
  };

  const selectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierId(supplier._id);
    setSupplierSearch(supplier.name);
    setShowSupplierDropdown(false);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }
    if (!weight || parseFloat(weight) <= 0) {
      setError('Please enter weight');
      return;
    }

    setLoading(true);
    setError('');

    const price = getEffectiveSpotPrice();
    const { total } = calculateTotal();

    try {
      const res = await fetch('/api/gold/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          supplierId,
          goldType: 'raw',
          purity,
          purityPercentage: getPurityPercentage(),
          weightGrams: parseFloat(weight),
          spotPricePerOz: price?.perOz,
          discountPercentage: parseFloat(discountPercent) || 0,
          paymentMethod: useAdvance ? 'advance_deduction' : paymentMethod,
          advanceId: useAdvance ? selectedAdvanceId : undefined,
          location: 'in_safe',
          notes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Prepare receipt data
        const transaction = data.data;
        setReceiptData({
          receiptNumber: transaction.receiptNumber || `GT-${Date.now()}`,
          type,
          supplierName: selectedSupplier?.name || 'Unknown',
          date: new Date(),
          weightGrams: parseFloat(weight),
          purity,
          purityPercentage: getPurityPercentage(),
          spotPricePerOz: price?.perOz || 0,
          spotPricePerGram: price?.perGram || 0,
          discountPercentage: parseFloat(discountPercent) || 0,
          buyingPricePerGram: pricePerGram,
          totalAmount: total,
          currency: 'USD',
          paymentMethod: useAdvance ? 'advance_deduction' : paymentMethod,
          advanceDeducted: advanceDeduction,
          amountPaid: finalAmount,
        });
        setStep('receipt');
        onSuccess?.();
      } else {
        setError(data.error || 'Transaction failed');
      }
    } catch {
      // Offline mode: save transaction locally
      addPendingTransaction({
        type,
        supplierId,
        supplierName: selectedSupplier?.name || 'Unknown',
        goldType: 'raw',
        purity,
        purityPercentage: getPurityPercentage(),
        weightGrams: parseFloat(weight),
        spotPricePerOz: price?.perOz || 0,
        discountPercentage: parseFloat(discountPercent) || 0,
        paymentMethod: useAdvance ? 'advance_deduction' : paymentMethod,
        advanceId: useAdvance ? selectedAdvanceId : undefined,
        notes: notes ? `[Offline] ${notes}` : '[Recorded offline]',
      });
      // Show offline receipt
      setReceiptData({
        receiptNumber: `OFFLINE-${Date.now()}`,
        type,
        supplierName: selectedSupplier?.name || 'Unknown',
        date: new Date(),
        weightGrams: parseFloat(weight),
        purity,
        purityPercentage: getPurityPercentage(),
        spotPricePerOz: price?.perOz || 0,
        spotPricePerGram: price?.perGram || 0,
        discountPercentage: parseFloat(discountPercent) || 0,
        buyingPricePerGram: pricePerGram,
        totalAmount: total,
        currency: 'USD',
        paymentMethod: useAdvance ? 'advance_deduction' : paymentMethod,
        advanceDeducted: advanceDeduction,
        amountPaid: finalAmount,
      });
      setStep('receipt');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const { pricePerGram, total } = calculateTotal();
  const advanceDeduction = getAdvanceDeduction();
  const finalAmount = total - advanceDeduction;

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
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${type === 'buy' ? 'from-green-500 to-emerald-300' : 'from-red-500 to-rose-300'}`}></div>
              
              {/* Header */}
              <div
                className="px-6 py-5 flex items-center justify-between border-b border-white/5"
              >
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  {type === 'buy' ? '⬇️ Buy Gold' : '⬆️ Sell Gold'}
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

                {step === 'details' && (
                  <>
                    {/* Supplier Search */}
                    <div className="relative z-20">
                      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
                        {type === 'buy' ? 'Buying from' : 'Selling to'}
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
                          placeholder="Search supplier..."
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
                    </div>

                    {/* Weight Input */}
                    <div>
                      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
                        Weight (grams)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-4xl font-bold text-center text-white focus:border-amber-500/50 outline-none transition-colors placeholder:text-gray-700"
                          inputMode="decimal"
                        />
                        <span className="absolute right-4 bottom-4 text-gray-500 font-bold">g</span>
                      </div>
                    </div>

                    {/* Purity Selection */}
                    <div>
                      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
                        Purity
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {PURITY_OPTIONS.slice(0, 4).map((p) => (
                          <button
                            key={p.name}
                            onClick={() => setPurity(p.name)}
                            className={`py-2 px-1 rounded-lg text-sm font-bold transition-all ${
                              purity === p.name
                                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calculation Card */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                       <div className="flex justify-between items-center">
                         <span className="text-gray-400 text-sm">Spot Price</span>
                         <div className="text-right">
                            <div className="text-white font-bold">{spotPrice ? formatCurrency(spotPrice.perOz) : '...'} <span className="text-xs text-gray-500 font-normal">/oz</span></div>
                         </div>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-gray-400">Purity {purity}</span>
                         <span className="text-gray-300">{(getPurityPercentage() * 100).toFixed(1)}%</span>
                       </div>
                       <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                         <span className="text-gray-400 text-sm font-bold">Total</span>
                         <span className="text-2xl font-bold text-amber-400">{formatCurrency(finalAmount)}</span>
                       </div>
                    </div>

                    {/* Action Button */}
                    <GradientButton
                      onClick={() => setStep('confirm')}
                      disabled={!supplierId || !weight || parseFloat(weight) <= 0}
                      variantType={type === 'buy' ? 'success' : 'danger'}
                      className="w-full py-4 text-lg rounded-xl shadow-lg"
                    >
                      Review {type === 'buy' ? 'Buy' : 'Sell'} Order
                    </GradientButton>
                  </>
                )}

                {step === 'confirm' && (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-4xl mx-auto border border-white/10">
                      {type === 'buy' ? '⬇️' : '⬆️'}
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Confirm {type === 'buy' ? 'Purchase' : 'Sale'}</h3>
                      <p className="text-gray-400">
                        {type === 'buy' ? 'Buying' : 'Selling'} <span className="text-white font-bold">{weight}g</span> of <span className="text-amber-400 font-bold">{purity}</span> gold
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        {type === 'buy' ? 'From' : 'To'} <span className="text-white">{selectedSupplier?.name}</span>
                      </p>
                    </div>

                    <div className="bg-black/40 rounded-2xl p-6 border border-white/10">
                      <div className="text-sm text-gray-400 uppercase tracking-widest mb-1">Total Amount</div>
                      <div className="text-4xl font-bold text-white">{formatCurrency(finalAmount)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setStep('details')}
                        className="py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-colors"
                      >
                        Back
                      </button>
                      <GradientButton
                        onClick={handleSubmit}
                        disabled={loading}
                        variantType={type === 'buy' ? 'success' : 'danger'}
                        className="py-3.5 rounded-xl text-lg w-full"
                      >
                        {loading ? 'Processing...' : 'Confirm'}
                      </GradientButton>
                    </div>
                  </div>
                )}

                {step === 'receipt' && receiptData && (
                  <Receipt
                    data={receiptData}
                    onClose={() => {
                      setWeight('');
                      setPurity('24K');
                      setDiscountPercent('5');
                      setSupplierSearch('');
                      setSelectedSupplier(null);
                      setSupplierId('');
                      setStep('details');
                      setReceiptData(null);
                      onClose();
                    }}
                  />
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
