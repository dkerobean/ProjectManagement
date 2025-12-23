/**
 * Advances API Routes
 * GoldTrader Pro - Cash advance tracking
 */
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Advance from '@/models/Advance';
import Supplier from '@/models/Supplier';

// GET /api/gold/advances - List advances
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const status = searchParams.get('status'); // pending, partial, settled
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Build query
    const query: Record<string, unknown> = {};
    if (supplierId) query.supplierId = supplierId;
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    
    const [advances, total, summary] = await Promise.all([
      Advance.find(query)
        .sort({ givenDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Advance.countDocuments(query),
      // Get summary of outstanding advances
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
    ]);
    
    return NextResponse.json({
      success: true,
      data: advances,
      summary: summary[0] || { totalOutstanding: 0, count: 0 },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching advances:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch advances' },
      { status: 500 }
    );
  }
}

// POST /api/gold/advances - Create advance (give money to miner)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const {
      supplierId,
      amount,
      currency = 'USD',
      purpose,
      paymentMethod = 'cash',
      paymentReference,
      expectedSettlementDate,
      notes,
    } = body;
    
    if (!supplierId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Supplier and amount are required' },
        { status: 400 }
      );
    }
    
    // Get supplier
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    // Create advance
    const advance = new Advance({
      supplierId,
      supplierName: supplier.name,
      amount,
      remainingBalance: amount,
      currency,
      purpose,
      paymentMethod,
      paymentReference,
      expectedSettlementDate: expectedSettlementDate
        ? new Date(expectedSettlementDate)
        : undefined,
      notes,
    });
    
    await advance.save();
    
    // Update supplier outstanding balance
    supplier.outstandingBalance += amount;
    await supplier.save();
    
    return NextResponse.json({
      success: true,
      data: advance,
      message: `Advance of ${currency} ${amount.toLocaleString()} given to ${supplier.name}`,
    });
  } catch (error) {
    console.error('Error creating advance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create advance' },
      { status: 500 }
    );
  }
}
