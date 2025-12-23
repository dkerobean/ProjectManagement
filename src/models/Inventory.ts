/**
 * Inventory Schema
 * GoldTrader Pro - Vault/Location-based inventory tracking
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMovement {
  fromLocation: string;
  toLocation: string;
  weightGrams: number;
  date: Date;
  notes?: string;
  movedBy?: mongoose.Types.ObjectId;
}

export interface IInventory extends Document {
  // Identification
  batchId: string;
  goldType: string;
  purity: string;
  purityPercentage: number;
  
  // Quantity
  weightGrams: number;
  
  // Location (Vault Status)
  location: 'in_safe' | 'at_refinery' | 'in_transit' | 'exported';
  
  // Valuation
  avgCostPerGram: number;
  totalCost: number;
  currentValuePerGram?: number; // Updated with spot price
  currentTotalValue?: number;
  
  // Source
  sourceTransactionId?: mongoose.Types.ObjectId;
  supplierId?: mongoose.Types.ObjectId;
  
  // Movement History
  movementHistory: IMovement[];
  
  // Metadata
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MovementSchema = new Schema<IMovement>(
  {
    fromLocation: {
      type: String,
      required: true,
    },
    toLocation: {
      type: String,
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
    movedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

const InventorySchema = new Schema<IInventory>(
  {
    // Identification
    batchId: {
      type: String,
      required: true,
      unique: true,
    },
    goldType: {
      type: String,
      default: 'raw',
    },
    purity: {
      type: String,
      required: true,
    },
    purityPercentage: {
      type: Number,
      required: true,
    },
    
    // Quantity
    weightGrams: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Location
    location: {
      type: String,
      enum: ['in_safe', 'at_refinery', 'in_transit', 'exported'],
      default: 'in_safe',
    },
    
    // Valuation
    avgCostPerGram: {
      type: Number,
      required: true,
    },
    totalCost: {
      type: Number,
      required: true,
    },
    currentValuePerGram: Number,
    currentTotalValue: Number,
    
    // Source
    sourceTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    
    // Movement History
    movementHistory: [MovementSchema],
    
    // Metadata
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
InventorySchema.index({ location: 1 });
InventorySchema.index({ goldType: 1 });
InventorySchema.index({ purity: 1 });
InventorySchema.index({ batchId: 1 });

// Pre-save to generate batch ID
InventorySchema.pre('save', function (next) {
  if (this.isNew && !this.batchId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.batchId = `BATCH-${timestamp}-${random}`;
  }
  
  // Calculate total cost
  this.totalCost = this.weightGrams * this.avgCostPerGram;
  
  next();
});

// Method to move inventory
InventorySchema.methods.moveTo = function (
  newLocation: string,
  movedBy?: mongoose.Types.ObjectId,
  notes?: string
) {
  const movement: IMovement = {
    fromLocation: this.location,
    toLocation: newLocation,
    weightGrams: this.weightGrams,
    date: new Date(),
    notes,
    movedBy,
  };
  
  this.movementHistory.push(movement);
  this.location = newLocation;
  
  return this.save();
};

// Static method to get inventory summary by location
InventorySchema.statics.getSummaryByLocation = async function () {
  return this.aggregate([
    { $match: { weightGrams: { $gt: 0 } } },
    {
      $group: {
        _id: '$location',
        totalWeight: { $sum: '$weightGrams' },
        totalCost: { $sum: '$totalCost' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Avoid model recompilation
const Inventory: Model<IInventory> =
  mongoose.models.Inventory ||
  mongoose.model<IInventory>('Inventory', InventorySchema);

export default Inventory;
