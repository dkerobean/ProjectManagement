'use client';

/**
 * Reports Page
 * GoldTrader Pro - Daily/Weekly P&L and summaries
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/gold/GlassCard';
import GradientButton from '@/components/gold/GradientButton';
import { ReportSkeleton } from '@/components/gold/Skeleton';
import GoldBottomNav from '@/components/gold/GoldBottomNav';

interface ReportData {
  period: {
    start: string;
    end: string;
    label: string;
  };
  summary: {
    buy: { count: number; totalWeight: number; totalAmount: number; avgPricePerGram: number };
    sell: { count: number; totalWeight: number; totalAmount: number; avgPricePerGram: number };
    profitLoss: number;
    netWeight: number;
    totalTransactions: number;
  };
  dailyBreakdown: Array<{
    date: string;
    buy: { weight: number; amount: number; count: number };
    sell: { weight: number; amount: number; count: number };
    pnl: number;
  }>;
  advances: { totalGiven: number; count: number };
  topSuppliers: Array<{
    _id: string;
    supplierName: string;
    totalWeight: number;
    totalAmount: number;
    count: number;
  }>;
  purityBreakdown: Array<{
    _id: string;
    totalWeight: number;
    count: number;
  }>;
}

type Period = 'today' | 'week' | 'month';

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('week');
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gold/reports?period=${period}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatWeight = (grams: number) => {
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(2)}kg`;
    }
    return `${grams.toFixed(1)}g`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      if (!reportRef.current) return;

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#000000',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `GoldTrader-Report-${period}-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 relative overflow-hidden font-sans">
       {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-900/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 pt-12 pb-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
            Reports
          </h1>
          <GradientButton
            onClick={handleGeneratePDF}
            disabled={generating || loading}
            variantType="gold"
            className="px-3 py-1.5 text-xs"
          >
            {generating ? 'Running...' : '📄 Export PDF'}
          </GradientButton>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 space-y-5 py-6 relative z-10">
        {/* Period Selector */}
        <div className="flex bg-white/5 p-1 rounded-xl">
          {(['today', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition relative ${
                period === p
                  ? 'text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {period === p && (
                <motion.div
                  layoutId="activePeriod"
                  className="absolute inset-0 bg-amber-500 rounded-lg shadow-lg shadow-amber-500/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">
                {p === 'today' && 'Today'}
                {p === 'week' && 'This Week'}
                {p === 'month' && 'This Month'}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
           <ReportSkeleton />
        ) : !data ? (
           <GlassCard className="text-center py-12 px-6">
            <h3 className="text-xl font-bold text-white/90 mb-2">No data available</h3>
             <p className="text-gray-500">Try selecting a different period.</p>
           </GlassCard>
        ) : (
          <div ref={reportRef} className="space-y-6">
            {/* Period Info */}
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-white/5 rounded-full text-xs text-gray-400 border border-white/5">
                {formatDate(data.period.start)} — {formatDate(data.period.end)}
              </span>
            </div>

            {/* P&L Summary */}
            <GlassCard 
              className={`text-center relative overflow-hidden ${
                data.summary.profitLoss >= 0
                  ? 'border-t-green-500/50'
                  : 'border-t-red-500/50'
              }`}
            >
               <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${data.summary.profitLoss >= 0 ? 'from-transparent via-green-500 to-transparent' : 'from-transparent via-red-500 to-transparent'}`}></div>
               <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-3xl opacity-20 ${data.summary.profitLoss >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>

              <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 relative z-10">
                Net Profit / Loss
              </h2>
              <div
                className={`text-5xl font-bold mb-2 relative z-10 drop-shadow-lg ${
                  data.summary.profitLoss >= 0
                    ? 'text-green-400'
                    : 'text-red-500'
                }`}
              >
                {data.summary.profitLoss >= 0 ? '+' : ''}
                {formatCurrency(data.summary.profitLoss)}
              </div>
              <div className="text-gray-500 text-sm relative z-10">
                Across {data.summary.totalTransactions} transactions
              </div>
            </GlassCard>

            {/* Buy/Sell Summary */}
            <div className="grid grid-cols-2 gap-3">
              {/* Bought */}
              <GlassCard className="p-5 border-l-2 border-l-green-500">
                <h3 className="text-green-500/70 text-xs font-bold uppercase tracking-wider mb-2">Buy Volume</h3>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatWeight(data.summary.buy.totalWeight)}
                </div>
                <div className="text-xs text-green-400 font-mono mb-3">
                  {formatCurrency(data.summary.buy.totalAmount)}
                </div>
                <div className="text-[10px] text-gray-500 border-t border-white/5 pt-2">
                  Avg: {formatCurrency(data.summary.buy.avgPricePerGram)}/g
                </div>
              </GlassCard>

              {/* Sold */}
              <GlassCard className="p-5 border-l-2 border-l-red-500">
                <h3 className="text-red-500/70 text-xs font-bold uppercase tracking-wider mb-2">Sell Volume</h3>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatWeight(data.summary.sell.totalWeight)}
                </div>
                <div className="text-xs text-red-400 font-mono mb-3">
                   {formatCurrency(data.summary.sell.totalAmount)}
                </div>
                <div className="text-[10px] text-gray-500 border-t border-white/5 pt-2">
                  Avg: {formatCurrency(data.summary.sell.avgPricePerGram)}/g
                </div>
              </GlassCard>
            </div>

            {/* Net Inventory Change */}
            <GlassCard className="p-5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 font-medium">📦 Net Inventory Flow</span>
                <span
                  className={`font-bold font-mono text-lg ${
                    data.summary.netWeight >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {data.summary.netWeight >= 0 ? '+' : ''}
                  {formatWeight(data.summary.netWeight)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/5">
                <span className="text-gray-400 text-sm">Pre-payments (Advances)</span>
                <div className="text-right">
                    <div className="text-amber-400 font-bold">{formatCurrency(data.advances.totalGiven)}</div>
                    <div className="text-[10px] text-gray-600">{data.advances.count} issued</div>
                </div>
              </div>
            </GlassCard>

            {/* Daily Breakdown */}
            {data.dailyBreakdown.length > 0 && (
              <div className="space-y-3">
                 <h2 className="text-gray-500 text-xs font-bold uppercase tracking-widest pl-2">Daily Performance</h2>
                 {data.dailyBreakdown.slice(0, 7).map((day) => (
                    <GlassCard key={day.date} className="p-4 flex items-center justify-between group active:scale-[0.98] transition-all">
                       <div>
                        <div className="font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">{formatDate(day.date)}</div>
                        <div className="text-xs flex gap-3">
                          <span className="text-green-500/70">Buy: {formatWeight(day.buy.weight)}</span>
                          <span className="text-gray-700">|</span>
                          <span className="text-red-500/70">Sell: {formatWeight(day.sell.weight)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] text-gray-500 mb-1">Profit/Loss</div>
                         <div
                        className={`font-bold font-mono ${
                          day.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {day.pnl >= 0 ? '+' : ''}
                        {formatCurrency(day.pnl)}
                      </div>
                      </div>
                    </GlassCard>
                 ))}
              </div>
            )}

            {/* Top Suppliers */}
            {data.topSuppliers.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-gray-500 text-xs font-bold uppercase tracking-widest pl-2">Top Partners</h2>
                <div className="grid grid-cols-1 gap-2">
                  {data.topSuppliers.map((supplier, i) => (
                    <GlassCard key={supplier._id} className="p-3 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black border-2 border-black ${
                             i === 0 ? 'bg-gradient-to-br from-yellow-300 to-amber-500' : 
                             i === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400' :
                             i === 2 ? 'bg-gradient-to-br from-orange-300 to-red-400' : 'bg-gray-800 text-gray-500 border-transparent'
                          }`}>
                            {i + 1}
                          </div>
                          <span className="font-medium text-white text-sm">{supplier.supplierName}</span>
                       </div>
                       <div className="text-right">
                          <div className="text-white font-bold text-sm">{formatWeight(supplier.totalWeight)}</div>
                          <div className="text-[10px] text-gray-500">{supplier.count} trades</div>
                       </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}

            {/* Purity Breakdown */}
            {data.purityBreakdown.length > 0 && (
               <GlassCard className="p-5">
                 <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Purity Distribution</h2>
                 <div className="space-y-4">
                  {data.purityBreakdown.map((p) => {
                    const totalWeight = data.purityBreakdown.reduce(
                      (acc, x) => acc + x.totalWeight,
                      0
                    );
                    const percentage = (p.totalWeight / totalWeight) * 100;
                    return (
                      <div key={p._id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                           <span className="font-bold text-amber-500">{p._id}</span>
                           <span className="text-gray-400">{percentage.toFixed(1)}% ({formatWeight(p.totalWeight)})</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${percentage}%` }}
                             transition={{ duration: 1, ease: 'easeOut' }}
                             className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full"
                           />
                        </div>
                      </div>
                    );
                  })}
                </div>
               </GlassCard>
            )}
          </div>
        )}
      </main>

      {/* Shared Bottom Navigation */}
      <GoldBottomNav />
    </div>
  );
}
