/**
 * Inventory API Routes
 * GoldTrader Pro - Vault management
 */
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Inventory from '@/models/Inventory';

// GET /api/gold/inventory - Get inventory summary by location
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const goldType = searchParams.get('goldType');
    
    // Build query
    const query: Record<string, unknown> = { weightGrams: { $gt: 0 } };
    if (location) query.location = location;
    if (goldType) query.goldType = goldType;
    
    // Get detailed inventory
    const inventory = await Inventory.find(query)
      .sort({ location: 1, createdAt: -1 })
      .lean();
    
    // Get summary by location
    const summary = await Inventory.aggregate([
      { $match: { weightGrams: { $gt: 0 } } },
      {
        $group: {
          _id: '$location',
          totalWeight: { $sum: '$weightGrams' },
          totalCost: { $sum: '$totalCost' },
          avgCostPerGram: { $avg: '$avgCostPerGram' },
          batchCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    
    // Calculate grand totals
    const grandTotal = summary.reduce(
      (acc, loc) => ({
        totalWeight: acc.totalWeight + loc.totalWeight,
        totalCost: acc.totalCost + loc.totalCost,
      }),
      { totalWeight: 0, totalCost: 0 }
    );
    
    // Format summary as object keyed by location
    const locationSummary = summary.reduce(
      (acc, loc) => {
        acc[loc._id] = {
          totalWeight: loc.totalWeight,
          totalCost: loc.totalCost,
          avgCostPerGram: loc.avgCostPerGram,
          batchCount: loc.batchCount,
        };
        return acc;
      },
      {} as Record<string, unknown>
    );
    
    return NextResponse.json({
      success: true,
      data: inventory,
      summary: {
        byLocation: locationSummary,
        grandTotal,
      },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST /api/gold/inventory - Create inventory entry manually
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const {
      goldType,
      purity,
      purityPercentage,
      weightGrams,
      location = 'in_safe',
      avgCostPerGram,
      notes,
    } = body;
    
    if (!weightGrams || !avgCostPerGram) {
      return NextResponse.json(
        { success: false, error: 'Weight and cost are required' },
        { status: 400 }
      );
    }
    
    const inventory = new Inventory({
      goldType: goldType || 'raw',
      purity: purity || '24K',
      purityPercentage: purityPercentage || 0.999,
      weightGrams,
      location,
      avgCostPerGram,
      notes,
    });
    
    await inventory.save();
    
    return NextResponse.json({
      success: true,
      data: inventory,
      message: `${weightGrams}g added to ${location}`,
    });
  } catch (error) {
    console.error('Error creating inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create inventory' },
      { status: 500 }
    );
  }
}
