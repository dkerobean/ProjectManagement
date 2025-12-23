/**
 * Settings API Routes
 * GoldTrader Pro - Business settings and configuration
 */
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';

// GET /api/gold/settings - Get current settings
export async function GET() {
  try {
    await connectToDatabase();
    
    // Get or create settings
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create default settings
      settings = await Settings.create({
        businessName: 'GoldTrader Pro',
        defaultCurrency: 'USD',
        defaultUnit: 'grams',
        defaultMarginPercentage: 5,
        commodityType: 'gold',
        priceApiSource: 'manual',
        manualSpotPrice: 2620,
        priceRefreshIntervalMinutes: 15,
      });
    }
    
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/gold/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    // Update or create settings
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: body },
      { new: true, upsert: true, runValidators: true }
    );
    
    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
