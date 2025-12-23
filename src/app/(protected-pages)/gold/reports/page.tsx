'use client';

/**
 * Reports Page
 * GoldTrader Pro - Daily/Weekly P&L and summaries
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, Package, Wallet } from 'lucide-react';
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
    <div className="min-h-screen bg-neutral p-safe-top pb-safe-bottom bg-background-dark text-gray-100 font-sans flex justify-center items-start selection:bg-primary selection:text-white">
      <div className="w-full max-w-md bg-background-dark min-h-screen relative overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-5 pt-12 pb-4 flex justify-between items-center z-10 sticky top-0 bg-background-dark/90 backdrop-blur-md">
          <h1 className="text-3xl font-bold text-primary tracking-tight">Reports</h1>
          <button
            onClick={handleGeneratePDF}
            disabled={generating || loading}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-yellow-400 text-black text-xs font-bold shadow-glow flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {generating ? (
                <span>⏳ Exporting...</span>
            ) : (
                <>
                    <FileText className="w-4 h-4" /> Export PDF
                </>
            )}
          </button>
        </header>

        <main className="flex-1 px-4 pb-28 overflow-y-auto space-y-4 pt-2">
          {/* Period Selector */}
          <div className="bg-[#1C1C1E] p-1 rounded-2xl flex gap-1 border border-white/5 shadow-lg">
            {(['today', 'week', 'month'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 relative ${
                  period === p
                    ? 'bg-primary text-black shadow-glow'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {p === 'today' && 'Today'}
                {p === 'week' && 'This Week'}
                {p === 'month' && 'This Month'}
              </button>
            ))}
          </div>

          <div className="flex justify-center">
             <div className="px-4 py-1.5 bg-[#1C1C1E] rounded-full text-[11px] font-bold text-gray-400 border border-white/5 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> {formatDate(data?.period?.start || '')} — {formatDate(data?.period?.end || '')}
             </div>
          </div>

          {loading ? (
             <ReportSkeleton />
          ) : !data ? (
             <div className="text-center py-20 opacity-50">
               <span className="text-4xl block mb-2">📊</span>
               <span className="text-sm font-medium">No report data available</span>
            </div>
          ) : (
            <div ref={reportRef} className="space-y-4">
              {/* P&L Summary Card */}
              <div className="relative w-full rounded-3xl bg-[#151517] border border-white/5 p-8 overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center group">
                <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] opacity-25 pointer-events-none ${data.summary.profitLoss >= 0 ? 'from-green-500/50' : 'from-red-500/50'} to-transparent`}></div>
                
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 relative z-10">Net Profit / Loss</h2>
                <div className="relative z-10 mb-2">
                  <span className={`text-5xl font-bold tracking-tight drop-shadow-md ${data.summary.profitLoss >= 0 ? 'text-accent-green' : 'text-accent-red'}`} style={{ textShadow: data.summary.profitLoss >= 0 ? '0 0 30px rgba(16, 185, 129, 0.4)' : '0 0 30px rgba(239, 68, 68, 0.4)' }}>
                    {data.summary.profitLoss >= 0 ? '+' : ''}{formatCurrency(data.summary.profitLoss)}
                  </span>
                </div>
                <div className="relative z-10 text-[11px] text-gray-600 font-medium">
                  Across {data.summary.totalTransactions} transactions
                </div>
              </div>

              {/* Volume Grid */}
              <div className="grid grid-cols-2 gap-3">
                 {/* Buy Volume */}
                 <div className="rounded-3xl bg-[#1C1C1E] border border-white/5 p-5 relative overflow-hidden">
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-accent-green rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <h3 className="text-[10px] font-bold text-accent-green uppercase tracking-wider mb-2 pl-3">Buy Volume</h3>
                    <div className="pl-3">
                       <div className="text-2xl font-bold text-white mb-0.5">{formatWeight(data.summary.buy.totalWeight)}</div>
                       <div className="text-sm text-accent-green font-bold mb-4">{formatCurrency(data.summary.buy.totalAmount)}</div>
                       <div className="pt-2 border-t border-white/5 text-[10px] text-gray-500">
                          Avg: <span className="text-gray-400">{formatCurrency(data.summary.buy.avgPricePerGram)}/g</span>
                       </div>
                    </div>
                 </div>

                 {/* Sell Volume */}
                 <div className="rounded-3xl bg-[#1C1C1E] border border-white/5 p-5 relative overflow-hidden">
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-accent-red rounded-r-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                    <h3 className="text-[10px] font-bold text-accent-red uppercase tracking-wider mb-2 pl-3">Sell Volume</h3>
                    <div className="pl-3">
                       <div className="text-2xl font-bold text-white mb-0.5">{formatWeight(data.summary.sell.totalWeight)}</div>
                       <div className="text-sm text-accent-red font-bold mb-4">{formatCurrency(data.summary.sell.totalAmount)}</div>
                       <div className="pt-2 border-t border-white/5 text-[10px] text-gray-500">
                          Avg: <span className="text-gray-400">{formatCurrency(data.summary.sell.avgPricePerGram)}/g</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Net Inventory & Advances */}
              <div className="rounded-3xl bg-[#1C1C1E] border border-white/5 p-6">
                 {/* Net Inventory */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500">
                        <Package className="w-5 h-5" />
                     </div>
                     <span className="text-sm font-bold text-gray-300">Net Inventory Flow</span>
                  </div>
                  <span className={`text-xl font-mono font-bold ${data.summary.netWeight >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                     {data.summary.netWeight >= 0 ? '+' : ''}{formatWeight(data.summary.netWeight)}
                  </span>
                </div>

                {/* Advances */}
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-400">Pre-payments (Advances)</span>
                   </div>
                   <div className="text-right">
                      <div className="text-lg font-bold text-primary">{formatCurrency(data.advances.totalGiven)}</div>
                      <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">{data.advances.count} ISSUED</div>
                   </div>
                </div>
              </div>

              {/* Daily Breakdown */}
              {data.dailyBreakdown.length > 0 && (
                <div className="space-y-3 pt-2">
                   {data.dailyBreakdown.slice(0, 7).map((day) => (
                      <div key={day.date} className="rounded-2xl bg-[#1C1C1E] border border-white/5 p-4 flex items-center justify-between">
                         <div>
                            <div className="text-sm font-bold text-white mb-1">{formatDate(day.date)}</div>
                            <div className="text-[10px] flex gap-2 font-medium">
                               <span className="text-accent-green">Buy: {formatWeight(day.buy.weight)}</span>
                               <span className="text-gray-700">|</span>
                               <span className="text-accent-red">Sell: {formatWeight(day.sell.weight)}</span>
                            </div>
                         </div>
                         <div className="text-right">
                            <span className={`block font-bold text-sm ${day.pnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                               {day.pnl >= 0 ? '+' : ''}{formatCurrency(day.pnl)}
                            </span>
                         </div>
                      </div>
                   ))}
                </div>
              )}
            </div>
          )}
        </main>

        <GoldBottomNav />
      </div>
    </div>
  );
}
