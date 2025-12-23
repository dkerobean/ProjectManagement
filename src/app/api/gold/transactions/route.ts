/**
 * Transactions API Routes
 * GoldTrader Pro - Create, Read, Update transactions
 */
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Supplier from '@/models/Supplier';
import Inventory from '@/models/Inventory';
import Advance from '@/models/Advance';

// GET /api/gold/transactions - List transactions with filters
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // buy | sell
    const supplierId = searchParams.get('supplierId');
    const location = searchParams.get('location');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Build query
    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (supplierId) query.supplierId = supplierId;
    if (location) query.location = location;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) (query.createdAt as Record<string, Date>).$gte = new Date(startDate);
      if (endDate) (query.createdAt as Record<string, Date>).$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query),
    ]);
    
    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST /api/gold/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const {
      type,
      supplierId,
      goldType,
      purity,
      purityPercentage,
      specificGravity,
      weightGrams,
      spotPricePerOz,
      discountPercentage = 0,
      paymentMethod,
      advanceId,
      location = 'in_safe',
      notes,
    } = body;
    
    // Validate required fields
    if (!type || !supplierId || !weightGrams || !spotPricePerOz) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get supplier details
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    // Calculate prices
    const spotPricePerGram = spotPricePerOz / 31.1035; // Troy ounces to grams
    const buyingPricePerGram = spotPricePerGram * (1 - discountPercentage / 100);
    const totalAmount = weightGrams * buyingPricePerGram * (purityPercentage || 0.999);
    
    // Handle advance deduction if applicable
    let advanceDeducted = 0;
    let amountPaid = totalAmount;
    
    if (advanceId && type === 'buy') {
      const advance = await Advance.findById(advanceId);
      if (advance && advance.remainingBalance > 0) {
        advanceDeducted = Math.min(advance.remainingBalance, totalAmount);
        amountPaid = totalAmount - advanceDeducted;
        
        // Update advance
        await advance.settleWithGold(
          null as unknown as typeof advance._id, // Will be set after transaction created
          advanceDeducted,
          weightGrams,
          `Settled with ${weightGrams}g gold from transaction`
        );
        
        // Update supplier balance
        supplier.outstandingBalance -= advanceDeducted;
      }
    }
    
    // Create transaction
    const transaction = new Transaction({
      type,
      supplierId,
      supplierName: supplier.name,
      goldType: goldType || 'raw',
      purity: purity || '24K',
      purityPercentage: purityPercentage || 0.999,
      specificGravity,
      weightGrams,
      spotPricePerOz,
      spotPricePerGram,
      discountPercentage,
      buyingPricePerGram,
      totalAmount,
      currency: 'USD',
      paymentMethod: advanceDeducted > 0 ? 'advance_deduction' : paymentMethod,
      paymentStatus: 'completed',
      amountPaid,
      advanceDeducted,
      advanceId,
      location,
      notes,
    });
    
    await transaction.save();
    
    // Update supplier stats
    supplier.totalTransactions += 1;
    supplier.totalWeightGrams += weightGrams;
    supplier.totalAmountTraded += totalAmount;
    supplier.lastTransactionDate = new Date();
    await supplier.save();
    
    // Create inventory entry for buy transactions
    if (type === 'buy') {
      const inventory = new Inventory({
        goldType: goldType || 'raw',
        purity: purity || '24K',
        purityPercentage: purityPercentage || 0.999,
        weightGrams,
        location,
        avgCostPerGram: buyingPricePerGram,
        sourceTransactionId: transaction._id,
        supplierId,
      });
      await inventory.save();
    }
    
    return NextResponse.json({
      success: true,
      data: transaction,
      message: `Transaction ${transaction.receiptNumber} created successfully`,
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
