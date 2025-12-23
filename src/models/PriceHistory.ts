/**
 * PriceHistory Schema
 * GoldTrader Pro - Track historical commodity prices
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPriceHistory extends Document {
  commodity: 'gold' | 'oil' | 'gas';
  pricePerOz: number; // Gold: per troy ounce
  pricePerGram: number;
  currency: string;
  source: 'metals_api' | 'goldprice_org' | 'goldapi' | 'freecurrencyapi' | 'exchangerate_host' | 'cached' | 'fallback' | 'manual' | 'lbma';
  timestamp: Date;
}

const PriceHistorySchema = new Schema<IPriceHistory>(
  {
    commodity: {
      type: String,
      enum: ['gold', 'oil', 'gas'],
      default: 'gold',
    },
    pricePerOz: {
      type: Number,
      required: true,
    },
    pricePerGram: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    source: {
      type: String,
      enum: ['metals_api', 'goldprice_org', 'goldapi', 'freecurrencyapi', 'exchangerate_host', 'cached', 'fallback', 'manual', 'lbma'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We use our own timestamp
  }
);

// Indexes
PriceHistorySchema.index({ commodity: 1, timestamp: -1 });
PriceHistorySchema.index({ timestamp: -1 });

// Static method to get latest price
PriceHistorySchema.statics.getLatestPrice = async function (
  commodity: string = 'gold'
): Promise<IPriceHistory | null> {
  return this.findOne({ commodity })
    .sort({ timestamp: -1 })
    .limit(1);
};

// Static method to get price at a specific date
PriceHistorySchema.statics.getPriceAtDate = async function (
  date: Date,
  commodity: string = 'gold'
): Promise<IPriceHistory | null> {
  return this.findOne({
    commodity,
    timestamp: { $lte: date },
  })
    .sort({ timestamp: -1 })
    .limit(1);
};

// Avoid model recompilation
const PriceHistory: Model<IPriceHistory> =
  mongoose.models.PriceHistory ||
  mongoose.model<IPriceHistory>('PriceHistory', PriceHistorySchema);

export default PriceHistory;
