/**
 * Suppliers API Routes
 * GoldTrader Pro - Miner/Seller CRM
 */
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Supplier from '@/models/Supplier';

// GET /api/gold/suppliers - List suppliers
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const trustLevel = searchParams.get('trustLevel');
    const hasBalance = searchParams.get('hasBalance');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Build query
    const query: Record<string, unknown> = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (type) query.type = type;
    if (trustLevel) query.trustLevel = trustLevel;
    if (hasBalance === 'true') {
      query.outstandingBalance = { $ne: 0 };
    }
    
    const skip = (page - 1) * limit;
    
    const [suppliers, total] = await Promise.all([
      Supplier.find(query)
        .sort({ outstandingBalance: -1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Supplier.countDocuments(query),
    ]);
    
    return NextResponse.json({
      success: true,
      data: suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

// POST /api/gold/suppliers - Create supplier
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const {
      name,
      phone,
      email,
      location,
      type = 'miner',
      trustLevel = 'new',
      bankDetails,
      momoDetails,
      notes,
    } = body;
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Supplier name is required' },
        { status: 400 }
      );
    }
    
    // Check for duplicate phone
    if (phone) {
      const existing = await Supplier.findOne({ phone });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Supplier with this phone already exists' },
          { status: 409 }
        );
      }
    }
    
    const supplier = new Supplier({
      name,
      phone,
      email,
      location,
      type,
      trustLevel,
      bankDetails,
      momoDetails,
      notes,
    });
    
    await supplier.save();
    
    return NextResponse.json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully',
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}
