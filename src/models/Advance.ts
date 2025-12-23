/**
 * Advance Schema
 * GoldTrader Pro - Track cash advances given to miners
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettlement {
  transactionId: mongoose.Types.ObjectId;
  amount: number;
  weightGrams: number;
  date: Date;
  notes?: string;
}

export interface IAdvance extends Document {
  supplierId: mongoose.Types.ObjectId;
  supplierName: string; // Denormalized
  
  // Advance Details
  amount: number;
  currency: string;
  purpose?: string;
  
  // Status Tracking
  status: 'pending' | 'partial' | 'settled';
  remainingBalance: number;
  
  // Settlement History
  settlementHistory: ISettlement[];
  
  // Payment Details
  paymentMethod: 'cash' | 'momo' | 'bank_transfer';
  paymentReference?: string;
  
  // Dates
  givenDate: Date;
  expectedSettlementDate?: Date;
  settledDate?: Date;
  
  // Metadata
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlement>(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    weightGrams: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  },
  { _id: false }
);

const AdvanceSchema = new Schema<IAdvance>(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    
    // Advance Details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    purpose: String,
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'partial', 'settled'],
      default: 'pending',
    },
    remainingBalance: {
      type: Number,
      required: true,
    },
    
    // Settlement History
    settlementHistory: [SettlementSchema],
    
    // Payment
    paymentMethod: {
      type: String,
      enum: ['cash', 'momo', 'bank_transfer'],
      default: 'cash',
    },
    paymentReference: String,
    
    // Dates
    givenDate: {
      type: Date,
      default: Date.now,
    },
    expectedSettlementDate: Date,
    settledDate: Date,
    
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

// Indexes
AdvanceSchema.index({ supplierId: 1 });
AdvanceSchema.index({ status: 1 });
AdvanceSchema.index({ givenDate: -1 });
AdvanceSchema.index({ remainingBalance: 1 });

// Pre-save to set remainingBalance initially
AdvanceSchema.pre('save', function (next) {
  if (this.isNew) {
    this.remainingBalance = this.amount;
  }
  
  // Update status based on remaining balance
  if (this.remainingBalance <= 0) {
    this.status = 'settled';
    this.settledDate = new Date();
  } else if (this.remainingBalance < this.amount) {
    this.status = 'partial';
  }
  
  next();
});

// Method to settle with gold
AdvanceSchema.methods.settleWithGold = function (
  transactionId: mongoose.Types.ObjectId,
  goldValue: number,
  weightGrams: number,
  notes?: string
) {
  const settlement: ISettlement = {
    transactionId,
    amount: goldValue,
    weightGrams,
    date: new Date(),
    notes,
  };
  
  this.settlementHistory.push(settlement);
  this.remainingBalance = Math.max(0, this.remainingBalance - goldValue);
  
  return this.save();
};

// Avoid model recompilation
const Advance: Model<IAdvance> =
  mongoose.models.Advance ||
  mongoose.model<IAdvance>('Advance', AdvanceSchema);

export default Advance;
