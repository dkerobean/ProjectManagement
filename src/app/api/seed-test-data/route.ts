
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Supplier from '@/models/Supplier';
import Inventory from '@/models/Inventory';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectToDatabase();

    const email = 'test@email.com';
    let user = await User.findOne({ email });

    if (!user) {
      // Create test user if not exists
      const hashedPassword = 'password123'; // In real app use bcrypt, but for seed we assume it works or just set direct
      // Note: The model pre-save hook handles hashing if we save a new document properly.
      user = await User.create({
        email,
        password: 'password123', // Will be hashed by pre-save
        name: 'Test Trader',
        role: 'member',
        isActive: true,
      });
    }

    const userId = user._id;

    // 1. Create Suppliers (3-5)
    // Clear existing for this user if we tracked them, but for now just add if not exist
    const supplierData = [
      { name: 'Golden Star Mines', type: 'miner', trustLevel: 'vip', phone: '+233 55 555 5555', location: 'Tarkwa', email: 'mines@goldenstar.com' },
      { name: 'Royal Refinery', type: 'refinery', trustLevel: 'regular', phone: '+233 24 444 4444', location: 'Accra', email: 'contact@royalrefinery.com' },
      { name: 'Fast Traders Ltd', type: 'trader', trustLevel: 'new', phone: '+233 20 000 0000', location: 'Kumasi', email: 'trade@fast.com' },
      { name: 'Ashanti Gold Group', type: 'miner', trustLevel: 'vip', phone: '+233 59 999 9999', location: 'Obuasi' },
    ];

    const suppliers = [];
    for (const s of supplierData) {
      // Check if exists
      let supplier = await Supplier.findOne({ name: s.name });
      if (!supplier) {
        supplier = await Supplier.create({
            ...s,
            createdBy: userId,
            outstandingBalance: Math.floor(Math.random() * 10000) - 5000, 
        });
      }
      suppliers.push(supplier);
    }

    // 2. Create Inventory (3-5)
    const inventoryData = [
       { goldType: 'Bar', purity: '24K', purityPercentage: 0.999, weightGrams: 1000, avgCostPerGram: 75, location: 'in_safe' },
       { goldType: 'Dust', purity: '22K', purityPercentage: 0.916, weightGrams: 500, avgCostPerGram: 68, location: 'in_safe' },
       { goldType: 'Scrap', purity: '18K', purityPercentage: 0.750, weightGrams: 250, avgCostPerGram: 55, location: 'at_refinery' },
    ];

    for (const item of inventoryData) {
        // Create unique batch
        await Inventory.create({
            ...item,
            totalCost: item.weightGrams * item.avgCostPerGram,
            batchId: `BATCH-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        });
    }

    // 3. Create Transactions (3-5 Buys, 3-5 Sells)
    // Mixed dates: Today, Yesterday, Older
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);

    const transactionData = [
        // Today
        { type: 'buy', supplier: suppliers[0], weight: 10.0, price: 75, date: today, amount: 7500 },
        { type: 'sell', supplier: suppliers[1], weight: 2.5, price: 82, date: today, amount: 2050 },
        
        // Yesterday
        { type: 'buy', supplier: suppliers[2], weight: 15.0, price: 74, date: yesterday, amount: 11100 },
        { type: 'sell', supplier: suppliers[1], weight: 5.0, price: 81, date: yesterday, amount: 4050 },
        { type: 'buy', supplier: suppliers[3], weight: 100.0, price: 73, date: yesterday, amount: 73000 },
        
        // Last Week
        { type: 'buy', supplier: suppliers[0], weight: 50.0, price: 72, date: lastWeek, amount: 36000 },
        { type: 'sell', supplier: suppliers[2], weight: 20.0, price: 80, date: lastWeek, amount: 16000 },
    ];

    for (const tx of transactionData) {
        await Transaction.create({
            type: tx.type,
            supplierId: tx.supplier._id,
            supplierName: tx.supplier.name,
            goldType: 'raw',
            purity: '24K',
            purityPercentage: 0.999,
            weightGrams: tx.weight,
            spotPricePerOz: 2350,
            spotPricePerGram: 75.5,
            buyingPricePerGram: tx.price,
            totalAmount: tx.amount,
            createdBy: userId,
            createdAt: tx.date,
            receiptNumber: `${tx.type.toUpperCase()}-${tx.date.getTime()}-${Math.floor(Math.random()*1000)}`,
            paymentStatus: 'completed',
        });
    }

    return NextResponse.json({ 
        success: true, 
        message: `Seeded data for user ${email}`,
        data: {
            user: user._id,
            suppliers: suppliers.length,
            inventory: inventoryData.length,
            transactions: transactionData.length
        }
    });

  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ success: false, error: 'Failed to seed data' }, { status: 500 });
  }
}
