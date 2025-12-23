/**
 * Supplier Schema
 * GoldTrader Pro - Miner/Seller CRM focused on balances
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  
  // Classification
  type: 'miner' | 'trader' | 'refinery' | 'buyer' | 'other';
  trustLevel: 'new' | 'regular' | 'vip';
  isActive: boolean;
  
  // Financial Summary (auto-calculated)
  totalTransactions: number;
  totalWeightGrams: number;
  totalAmountTraded: number;
  outstandingBalance: number; // Positive = they owe us, Negative = we owe them
  
  // Bank Details (for payments)
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  
  // Mobile Money (MoMo)
  momoDetails?: {
    provider?: string; // MTN, Vodafone, AirtelTigo
    number?: string;
    registeredName?: string;
  };
  
  // Metadata
  notes?: string;
  tags?: string[];
  lastTransactionDate?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    location: String,
    
    // Classification
    type: {
      type: String,
      enum: ['miner', 'trader', 'refinery', 'buyer', 'other'],
      default: 'miner',
    },
    trustLevel: {
      type: String,
      enum: ['new', 'regular', 'vip'],
      default: 'new',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Financial Summary
    totalTransactions: {
      type: Number,
      default: 0,
    },
    totalWeightGrams: {
      type: Number,
      default: 0,
    },
    totalAmountTraded: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
    },
    
    // Bank Details
    bankDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
    },
    
    // Mobile Money
    momoDetails: {
      provider: {
        type: String,
        enum: ['MTN', 'Vodafone', 'AirtelTigo'],
      },
      number: String,
      registeredName: String,
    },
    
    // Metadata
    notes: String,
    tags: [String],
    lastTransactionDate: Date,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SupplierSchema.index({ name: 'text' });
SupplierSchema.index({ phone: 1 }, { sparse: true });
SupplierSchema.index({ type: 1 });
SupplierSchema.index({ trustLevel: 1 });
SupplierSchema.index({ outstandingBalance: 1 });
SupplierSchema.index({ isActive: 1 });

// Virtual to check if supplier has outstanding balance
SupplierSchema.virtual('hasBalance').get(function () {
  return this.outstandingBalance !== 0;
});

// Virtual to check balance direction
SupplierSchema.virtual('balanceType').get(function () {
  if (this.outstandingBalance > 0) return 'owes_gold'; // We gave them money, they owe gold
  if (this.outstandingBalance < 0) return 'owes_money'; // We owe them money
  return 'settled';
});

// Avoid model recompilation
const Supplier: Model<ISupplier> =
  mongoose.models.Supplier ||
  mongoose.model<ISupplier>('Supplier', SupplierSchema);

export default Supplier;
