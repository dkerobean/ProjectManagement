/**
 * Inventory Move API
 * GoldTrader Pro - Move gold between locations
 */
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Inventory from '@/models/Inventory';

// POST /api/gold/inventory/move - Move inventory between locations
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { batchId, toLocation, notes } = body;
    
    if (!batchId || !toLocation) {
      return NextResponse.json(
        { success: false, error: 'Batch ID and destination are required' },
        { status: 400 }
      );
    }
    
    // Valid locations
    const validLocations = ['in_safe', 'at_refinery', 'in_transit', 'exported'];
    if (!validLocations.includes(toLocation)) {
      return NextResponse.json(
        { success: false, error: 'Invalid destination location' },
        { status: 400 }
      );
    }
    
    const inventory = await Inventory.findOne({ batchId });
    
    if (!inventory) {
      return NextResponse.json(
        { success: false, error: 'Inventory batch not found' },
        { status: 404 }
      );
    }
    
    const fromLocation = inventory.location;
    
    if (fromLocation === toLocation) {
      return NextResponse.json(
        { success: false, error: 'Already at this location' },
        { status: 400 }
      );
    }
    
    // Move the inventory
    await inventory.moveTo(toLocation, undefined, notes);
    
    return NextResponse.json({
      success: true,
      data: inventory,
      message: `Moved ${inventory.weightGrams}g from ${fromLocation} to ${toLocation}`,
    });
  } catch (error) {
    console.error('Error moving inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to move inventory' },
      { status: 500 }
    );
  }
}
