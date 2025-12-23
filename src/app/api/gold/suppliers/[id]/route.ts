/**
 * Single Supplier API Routes
 * GoldTrader Pro - Get, Update supplier
 */
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Supplier from '@/models/Supplier';
import Transaction from '@/models/Transaction';
import Advance from '@/models/Advance';

// GET /api/gold/suppliers/[id] - Get supplier with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const supplier = await Supplier.findById(id).lean();
    
    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    // Get recent transactions
    const recentTransactions = await Transaction.find({ supplierId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Get outstanding advances
    const advances = await Advance.find({
      supplierId: id,
      status: { $in: ['pending', 'partial'] },
    })
      .sort({ givenDate: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      data: {
        ...supplier,
        recentTransactions,
        advances,
      },
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch supplier' },
      { status: 500 }
    );
  }
}

// PUT /api/gold/suppliers/[id] - Update supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const body = await request.json();
    
    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully',
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

// DELETE /api/gold/suppliers/[id] - Soft delete supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supplier deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}
