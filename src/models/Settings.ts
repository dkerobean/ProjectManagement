/**
 * Settings Schema
 * GoldTrader Pro - Business settings and preferences
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  // Business Profile
  businessName: string;
  businessLogo?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  
  // Default Values
  defaultCurrency: string;
  defaultUnit: 'grams' | 'ounces' | 'kilograms';
  defaultMarginPercentage: number;
  
  // Commodity Settings
  commodityType: 'gold' | 'oil' | 'gas';
  
  // Price Settings
  priceApiSource: 'metals_api' | 'goldprice_org' | 'manual';
  priceApiKey?: string;
  manualSpotPrice?: number;
  lastPriceUpdate?: Date;
  priceRefreshIntervalMinutes: number;
  
  // Purity Presets
  purityPresets: {
    name: string;
    percentage: number;
  }[];
  
  // Location Presets (Vault locations)
  locationPresets: string[];
  
  // Notification Settings
  notifications: {
    priceAlerts: boolean;
    priceAlertThresholdPercent: number;
    dailySummary: boolean;
    whatsappNotifications: boolean;
    whatsappNumber?: string;
  };
  
  // WhatsApp Integration
  whatsapp?: {
    evolutionApiUrl?: string;
    evolutionApiKey?: string;
    instanceName?: string;
  };
  
  // Report Settings
  reports: {
    weeklyReportDay: number; // 0 = Sunday, 6 = Saturday
    includeProfitMargin: boolean;
    companyFooter?: string;
  };
  
  // Metadata
  lastModifiedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    // Business Profile
    businessName: {
      type: String,
      default: 'GoldTrader Pro',
    },
    businessLogo: String,
    businessPhone: String,
    businessEmail: String,
    businessAddress: String,
    
    // Default Values
    defaultCurrency: {
      type: String,
      default: 'USD',
    },
    defaultUnit: {
      type: String,
      enum: ['grams', 'ounces', 'kilograms'],
      default: 'grams',
    },
    defaultMarginPercentage: {
      type: Number,
      default: 5,
    },
    
    // Commodity
    commodityType: {
      type: String,
      enum: ['gold', 'oil', 'gas'],
      default: 'gold',
    },
    
    // Price Settings
    priceApiSource: {
      type: String,
      enum: ['metals_api', 'goldprice_org', 'manual'],
      default: 'manual',
    },
    priceApiKey: String,
    manualSpotPrice: Number,
    lastPriceUpdate: Date,
    priceRefreshIntervalMinutes: {
      type: Number,
      default: 15,
    },
    
    // Purity Presets
    purityPresets: {
      type: [
        {
          name: String,
          percentage: Number,
        },
      ],
      default: [
        { name: '24K', percentage: 0.999 },
        { name: '22K', percentage: 0.916 },
        { name: '18K', percentage: 0.75 },
        { name: '14K', percentage: 0.585 },
        { name: 'Raw', percentage: 0.85 },
      ],
    },
    
    // Location Presets
    locationPresets: {
      type: [String],
      default: ['in_safe', 'at_refinery', 'in_transit', 'exported'],
    },
    
    // Notifications
    notifications: {
      type: {
        priceAlerts: { type: Boolean, default: true },
        priceAlertThresholdPercent: { type: Number, default: 2 },
        dailySummary: { type: Boolean, default: true },
        whatsappNotifications: { type: Boolean, default: false },
        whatsappNumber: String,
      },
      default: {
        priceAlerts: true,
        priceAlertThresholdPercent: 2,
        dailySummary: true,
        whatsappNotifications: false,
      },
    },
    
    // WhatsApp Integration
    whatsapp: {
      evolutionApiUrl: String,
      evolutionApiKey: String,
      instanceName: String,
    },
    
    // Reports
    reports: {
      type: {
        weeklyReportDay: { type: Number, default: 0 },
        includeProfitMargin: { type: Boolean, default: true },
        companyFooter: String,
      },
      default: {
        weeklyReportDay: 0,
        includeProfitMargin: true,
      },
    },
    
    // Metadata
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
SettingsSchema.statics.getSettings = async function (): Promise<ISettings> {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Avoid model recompilation
const Settings: Model<ISettings> =
  mongoose.models.Settings ||
  mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
