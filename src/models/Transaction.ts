/**
 * Transaction Schema
 * GoldTrader Pro - Records all buy/sell transactions
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  type: 'buy' | 'sell';
  supplierId: mongoose.Types.ObjectId;
  supplierName: string; // Denormalized for quick display
  
  // Gold Details
  goldType: string;
  purity: string; // '24K', '22K', '18K', 'raw', or custom
  purityPercentage: number; // 0.999, 0.916, 0.750
  specificGravity?: number;
  weightGrams: number;
  
  // Pricing
  spotPricePerOz: number;
  spotPricePerGram: number;
  discountPercentage: number;
  buyingPricePerGram: number;
  totalAmount: number;
  currency: string;
  
  // Payment
  paymentMethod: 'cash' | 'momo' | 'bank_transfer' | 'advance_deduction';
  paymentStatus: 'pending' | 'partial' | 'completed';
  amountPaid: number;
  advanceDeducted?: number;
  advanceId?: mongoose.Types.ObjectId;
  
  // Location & Status
  location: 'in_safe' | 'at_refinery' | 'in_transit' | 'exported';
  
  // Receipt
  receiptNumber: string;
  receiptSent: boolean;
  receiptSentTo?: string;
  
  // Metadata
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    
    // Gold Details
    goldType: {
      type: String,
      default: 'raw',
    },
    purity: {
      type: String,
      required: true,
      default: '24K',
    },
    purityPercentage: {
      type: Number,
      required: true,
      default: 0.999,
    },
    specificGravity: Number,
    weightGrams: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Pricing
    spotPricePerOz: {
      type: Number,
      required: true,
    },
    spotPricePerGram: {
      type: Number,
      required: true,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    buyingPricePerGram: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    
    // Payment
    paymentMethod: {
      type: String,
      enum: ['cash', 'momo', 'bank_transfer', 'advance_deduction'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'completed'],
      default: 'completed',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    advanceDeducted: Number,
    advanceId: {
      type: Schema.Types.ObjectId,
      ref: 'Advance',
    },
    
    // Location
    location: {
      type: String,
      enum: ['in_safe', 'at_refinery', 'in_transit', 'exported'],
      default: 'in_safe',
    },
    
    // Receipt
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    receiptSent: {
      type: Boolean,
      default: false,
    },
    receiptSentTo: String,
    
    // Metadata
    notes: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ supplierId: 1 });
TransactionSchema.index({ type: 1, createdAt: -1 });
TransactionSchema.index({ location: 1 });
TransactionSchema.index({ paymentStatus: 1 });

// Virtual for profit margin (sell transactions)
TransactionSchema.virtual('profitMargin').get(function () {
  if (this.type === 'sell') {
    return this.totalAmount * (this.discountPercentage / 100);
  }
  return 0;
});

// Pre-save hook to generate receipt number
TransactionSchema.pre('save', function (next) {
  if (!this.receiptNumber) {
    const date = new Date();
    const prefix = this.type === 'buy' ? 'BUY' : 'SELL';
    const timestamp = date.getTime().toString(36).toUpperCase();
    this.receiptNumber = `${prefix}-${timestamp}`;
  }
  next();
});

// Avoid model recompilation in development
const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
