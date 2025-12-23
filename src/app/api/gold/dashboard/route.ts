/**
 * Dashboard API Routes
 * GoldTrader Pro - "3-Second Rule" dashboard data
 */
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Advance from '@/models/Advance';
import Inventory from '@/models/Inventory';
import PriceHistory from '@/models/PriceHistory';

// GET /api/gold/dashboard - Get all dashboard data in one call
export async function GET() {
  try {
    await connectToDatabase();
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    // Run all queries in parallel for speed
    const [
      todayTransactions,
      recentTransactions,
      outstandingAdvances,
      inventorySummary,
      latestPrice,
    ] = await Promise.all([
      // Today's transactions summary
      Transaction.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        {
          $group: {
            _id: '$type',
            totalWeight: { $sum: '$weightGrams' },
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      
      // Recent 10 transactions
      Transaction.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('type supplierName weightGrams totalAmount purity location createdAt receiptNumber')
        .lean(),
      
      // Outstanding advances
      Advance.aggregate([
        { $match: { status: { $in: ['pending', 'partial'] } } },
        {
          $group: {
            _id: null,
            totalOutstanding: { $sum: '$remainingBalance' },
            count: { $sum: 1 },
          },
        },
      ]),
      
      // Inventory by location
      Inventory.aggregate([
        { $match: { weightGrams: { $gt: 0 } } },
        {
          $group: {
            _id: '$location',
            totalWeight: { $sum: '$weightGrams' },
            totalCost: { $sum: '$totalCost' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      
      // Latest gold price
      PriceHistory.findOne({ commodity: 'gold' })
        .sort({ timestamp: -1 })
        .lean(),
    ]);
    
    // Format today's summary
    const todaySummary = {
      bought: { weight: 0, amount: 0, count: 0 },
      sold: { weight: 0, amount: 0, count: 0 },
    };
    
    todayTransactions.forEach((t) => {
      if (t._id === 'buy') {
        todaySummary.bought = {
          weight: t.totalWeight,
          amount: t.totalAmount,
          count: t.count,
        };
      } else if (t._id === 'sell') {
        todaySummary.sold = {
          weight: t.totalWeight,
          amount: t.totalAmount,
          count: t.count,
        };
      }
    });
    
    // Calculate profit/loss
    todaySummary.sold.amount - todaySummary.bought.amount;
    
    // Format inventory
    const vault = {
      in_safe: { weight: 0, value: 0 },
      at_refinery: { weight: 0, value: 0 },
      in_transit: { weight: 0, value: 0 },
      exported: { weight: 0, value: 0 },
      total: { weight: 0, value: 0 },
    };
    
    inventorySummary.forEach((loc) => {
      const location = loc._id as keyof typeof vault;
      if (vault[location]) {
        vault[location] = {
          weight: loc.totalWeight,
          value: loc.totalCost,
        };
        vault.total.weight += loc.totalWeight;
        vault.total.value += loc.totalCost;
      }
    });
    
    // Update current value with spot price
    if (latestPrice) {
      const currentTotalValue = vault.total.weight * (latestPrice.pricePerGram || latestPrice.pricePerOz / 31.1035);
      vault.total.marketValue = currentTotalValue;
    }
    
    return NextResponse.json({
      success: true,
      data: {
        // 3-Second Rule items
        spotPrice: latestPrice
          ? {
              perOz: latestPrice.pricePerOz,
              perGram: latestPrice.pricePerGram,
              currency: latestPrice.currency,
              timestamp: latestPrice.timestamp,
            }
          : null,
        
        inventoryValue: vault.total,
        
        outstandingAdvances: outstandingAdvances[0] || {
          totalOutstanding: 0,
          count: 0,
        },
        
        // Additional data
        today: todaySummary,
        vault,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
