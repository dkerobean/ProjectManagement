'use client';

/**
 * Loading Skeleton Components
 * GoldTrader Pro - Sleek loading placeholders
 */
import { motion } from 'framer-motion';

// Shimmer animation
const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear',
  },
};

export function SkeletonBox({
  width = '100%',
  height = '1rem',
  className = '',
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return (
    <motion.div
      className={`bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded ${className}`}
      style={{ width, height, backgroundSize: '400% 100%' }}
      animate={shimmer.animate}
      transition={shimmer.transition}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-900 text-white pb-24">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-yellow-600/50 to-yellow-800/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <SkeletonBox width={150} height={28} />
          <SkeletonBox width={32} height={32} className="rounded-full" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-4 py-4">
        {/* Spot Price Skeleton */}
        <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
          <SkeletonBox width={100} height={14} className="mb-2" />
          <SkeletonBox width={180} height={36} className="mb-1" />
          <SkeletonBox width={80} height={14} />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-xl p-4">
            <SkeletonBox width={80} height={12} className="mb-2" />
            <SkeletonBox width={100} height={24} className="mb-1" />
            <SkeletonBox width={50} height={12} />
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <SkeletonBox width={80} height={12} className="mb-2" />
            <SkeletonBox width={100} height={24} className="mb-1" />
            <SkeletonBox width={50} height={12} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <SkeletonBox key={i} height={80} className="rounded-xl" />
          ))}
        </div>

        {/* Today's Summary */}
        <div className="bg-gray-800 rounded-xl p-4">
          <SkeletonBox width={120} height={14} className="mb-3" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <SkeletonBox width="100%" height={24} className="mb-1" />
                <SkeletonBox width="60%" height={12} className="mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Vault Status */}
        <div className="bg-gray-800 rounded-xl p-4">
          <SkeletonBox width={100} height={14} className="mb-3" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
              <SkeletonBox width={100} height={16} />
              <SkeletonBox width={80} height={16} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <SkeletonBox width={32} height={32} className="rounded-full" />
          <div>
            <SkeletonBox width={100} height={16} className="mb-1" />
            <SkeletonBox width={80} height={12} />
          </div>
        </div>
        <div className="text-right">
          <SkeletonBox width={80} height={20} className="mb-1" />
          <SkeletonBox width={60} height={12} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <SkeletonBox key={i} height={40} className="rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function SupplierSkeleton() {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <SkeletonBox width={40} height={40} className="rounded-full" />
          <div>
            <SkeletonBox width={120} height={18} className="mb-1" />
            <SkeletonBox width={80} height={14} className="mb-2" />
            <SkeletonBox width={50} height={20} className="rounded-full" />
          </div>
        </div>
        <div className="text-right">
          <SkeletonBox width={90} height={20} className="mb-1" />
          <SkeletonBox width={60} height={12} />
        </div>
      </div>
    </div>
  );
}

export function ReportSkeleton() {
  return (
    <div className="space-y-4">
      {/* P&L Summary */}
      <div className="bg-gray-800 rounded-2xl p-6 text-center">
        <SkeletonBox width={150} height={14} className="mx-auto mb-2" />
        <SkeletonBox width={200} height={40} className="mx-auto mb-2" />
        <SkeletonBox width={100} height={14} className="mx-auto" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-4">
            <SkeletonBox width={60} height={12} className="mb-2" />
            <SkeletonBox width={80} height={28} className="mb-1" />
            <SkeletonBox width={100} height={14} />
          </div>
        ))}
      </div>

      {/* Daily Breakdown */}
      <div className="bg-gray-800 rounded-xl p-4">
        <SkeletonBox width={120} height={14} className="mb-3" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
            <div>
              <SkeletonBox width={80} height={16} className="mb-1" />
              <SkeletonBox width={120} height={12} />
            </div>
            <SkeletonBox width={70} height={18} />
          </div>
        ))}
      </div>
    </div>
  );
}
