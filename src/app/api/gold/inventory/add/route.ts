
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Inventory from '@/models/Inventory';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const data = await req.json();

    const { goldType, purity, purityPercentage, weightGrams, avgCostPerGram, location, notes } = data;

    // Create new inventory item
    // In a real scenario, we might merge with existing batches of same type/purity if in same location
    // But keeping it separate (batch-based) allows for better tracking
    
    // We rely on the model prep-save hook to generate batchId

    const newItem = await Inventory.create({
        goldType,
        purity,
        purityPercentage,
        weightGrams,
        avgCostPerGram,
        location: location || 'in_safe',
        notes,
        // Movement history for creation
        movementHistory: [{
            fromLocation: 'external',
            toLocation: location || 'in_safe',
            weightGrams,
            date: new Date(),
            notes: 'Manual Stock Entry',
            // movedBy: session.user.id // Use if we had User ID in session easily accessible as ObjectId
        }]
    });

    return NextResponse.json({ success: true, data: newItem });
  } catch (error) {
    console.error('Add stock error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add stock' }, { status: 500 });
  }
}
