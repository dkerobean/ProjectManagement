
import { connectToDatabase } from '../src/lib/mongodb';
import User from '../src/models/User';
import Supplier from '../src/models/Supplier';
import Inventory from '../src/models/Inventory';
import Transaction from '../src/models/Transaction';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function seed() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Connected!');

    const email = 'test@email.com';
    let user = await User.findOne({ email });

    if (!user) {
      console.log('Creating test user...');
      user = await User.create({
        email,
        password: 'password123', 
        name: 'Test Trader',
        role: 'member',
        isActive: true,
      });
    }

    const userId = user._id;

    // 1. Create Suppliers
    const supplierData = [
      { name: 'Golden Star Mines', type: 'miner', trustLevel: 'vip', phone: '+233 55 555 5555', location: 'Tarkwa', email: 'mines@goldenstar.com' },
      { name: 'Royal Refinery', type: 'refinery', trustLevel: 'regular', phone: '+233 24 444 4444', location: 'Accra', email: 'contact@royalrefinery.com' },
      { name: 'Fast Traders Ltd', type: 'trader', trustLevel: 'new', phone: '+233 20 000 0000', location: 'Kumasi', email: 'trade@fast.com' },
      { name: 'Ashanti Gold Group', type: 'miner', trustLevel: 'vip', phone: '+233 59 999 9999', location: 'Obuasi' },
    ];

    for (const s of supplierData) {
      let supplier = await Supplier.findOne({ name: s.name });
      if (!supplier) {
        supplier = await Supplier.create({
            ...s,
            createdBy: userId,
            outstandingBalance: Math.floor(Math.random() * 10000) - 5000, 
        });
        console.log(`Created supplier: ${s.name}`);
      }
    }
    
    // Get all suppliers
    const suppliers = await Supplier.find({ createdBy: userId });

    // 2. Create Inventory
    const inventoryData = [
       { goldType: 'Bar', purity: '24K', purityPercentage: 0.999, weightGrams: 1000, avgCostPerGram: 75, location: 'in_safe' },
       { goldType: 'Dust', purity: '22K', purityPercentage: 0.916, weightGrams: 500, avgCostPerGram: 68, location: 'in_safe' },
       { goldType: 'Scrap', purity: '18K', purityPercentage: 0.750, weightGrams: 250, avgCostPerGram: 55, location: 'at_refinery' },
    ];

    console.log('Creating inventory...');
    for (const item of inventoryData) {
        // Create unique batch if not exists (checked by batchId usually, looking for similar)
        // Just create new ones for now
        await Inventory.create({
            ...item,
            totalCost: item.weightGrams * item.avgCostPerGram,
            batchId: `BATCH-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        });
    }

    // 3. Create Transactions
    console.log('Creating transactions...');
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
        if (!tx.supplier) continue;

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

    console.log('Seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
