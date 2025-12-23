/**
 * Reports API Routes
 * GoldTrader Pro - Daily/Weekly P&L and summaries
 */
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Advance from '@/models/Advance';

// GET /api/gold/reports - Get reports with date range
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month, custom
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Calculate date range
    let startDate: Date;
    let endDate: Date = new Date();
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        startDate = startDateParam ? new Date(startDateParam) : new Date();
        endDate = endDateParam ? new Date(endDateParam) : new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }

    // Get transactions in date range
    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary by type
    const summary = {
      buy: {
        count: 0,
        totalWeight: 0,
        totalAmount: 0,
        avgPricePerGram: 0,
      },
      sell: {
        count: 0,
        totalWeight: 0,
        totalAmount: 0,
        avgPricePerGram: 0,
      },
    };

    transactions.forEach((tx) => {
      const type = tx.type as 'buy' | 'sell';
      if (summary[type]) {
        summary[type].count += 1;
        summary[type].totalWeight += tx.weightGrams;
        summary[type].totalAmount += tx.totalAmount;
      }
    });

    // Calculate averages
    if (summary.buy.totalWeight > 0) {
      summary.buy.avgPricePerGram = summary.buy.totalAmount / summary.buy.totalWeight;
    }
    if (summary.sell.totalWeight > 0) {
      summary.sell.avgPricePerGram = summary.sell.totalAmount / summary.sell.totalWeight;
    }

    // Calculate P&L
    const profitLoss = summary.sell.totalAmount - summary.buy.totalAmount;
    const netWeight = summary.buy.totalWeight - summary.sell.totalWeight;

    // Get daily breakdown
    const dailyBreakdown = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type',
          },
          totalWeight: { $sum: '$weightGrams' },
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': -1 } },
    ]);

    // Format daily breakdown
    const dailyData: Record<
      string,
      {
        date: string;
        buy: { weight: number; amount: number; count: number };
        sell: { weight: number; amount: number; count: number };
        pnl: number;
      }
    > = {};

    dailyBreakdown.forEach((item) => {
      const date = item._id.date;
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          buy: { weight: 0, amount: 0, count: 0 },
          sell: { weight: 0, amount: 0, count: 0 },
          pnl: 0,
        };
      }
      const type = item._id.type as 'buy' | 'sell';
      dailyData[date][type] = {
        weight: item.totalWeight,
        amount: item.totalAmount,
        count: item.count,
      };
    });

    // Calculate P&L for each day
    Object.values(dailyData).forEach((day) => {
      day.pnl = day.sell.amount - day.buy.amount;
    });

    // Get advances summary for the period
    const advancesSummary = await Advance.aggregate([
      {
        $match: {
          givenDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalGiven: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get top suppliers by volume
    const topSuppliers = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$supplierId',
          supplierName: { $first: '$supplierName' },
          totalWeight: { $sum: '$weightGrams' },
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalWeight: -1 } },
      { $limit: 5 },
    ]);

    // Get purity breakdown
    const purityBreakdown = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          type: 'buy',
        },
      },
      {
        $group: {
          _id: '$purity',
          totalWeight: { $sum: '$weightGrams' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalWeight: -1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          label: period,
        },
        summary: {
          ...summary,
          profitLoss,
          netWeight,
          totalTransactions: summary.buy.count + summary.sell.count,
        },
        dailyBreakdown: Object.values(dailyData).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
        advances: advancesSummary[0] || { totalGiven: 0, count: 0 },
        topSuppliers,
        purityBreakdown,
        transactions: transactions.slice(0, 50), // Limit to 50 for performance
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
