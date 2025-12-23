/**
 * Enhanced Price API with Smart Caching
 * GoldTrader Pro - Optimized for 1000 API requests/month
 * 
 * Caching Strategy:
 * - Cache for 1 hour (24 req/day = 720/month, safe margin)
 * - Manual refresh available for urgent updates
 * - Multiple fallback sources: GoldAPI → FreeCurrencyAPI → ExchangeRate.host
 */
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PriceHistory from '@/models/PriceHistory';
import Settings from '@/models/Settings';

// Convert troy ounces to grams
const OZ_TO_GRAMS = 31.1035;

// Cache duration: 1 hour (24 req/day = 720/month, well within 1000 limit)
const CACHE_DURATION_MS = 1 * 60 * 60 * 1000; // 1 hour

// Try to fetch from Metals-API
async function fetchFromMetalsAPI(apiKey: string): Promise<{ price: number; source: string } | null> {
  try {
    const response = await fetch(
      `https://metals-api.com/api/latest?access_key=${apiKey}&base=USD&symbols=XAU`,
      { next: { revalidate: 28800 } } // Cache for 8 hours
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.rates?.XAU) {
        // Metals-API returns 1/price, so we invert it
        const pricePerOz = 1 / data.rates.XAU;
        return { price: pricePerOz, source: 'metals_api' };
      }
    }
  } catch (error) {
    console.log('Metals-API fetch failed:', error);
  }
  return null;
}

// Try to fetch from GoldAPI.io (with API key)
async function fetchFromGoldAPI(): Promise<{ price: number; source: string } | null> {
  const apiKey = process.env.GOLD_API_KEY;
  
  if (!apiKey) {
    console.log('GOLD_API_KEY not configured');
    return null;
  }
  
  try {
    const response = await fetch(
      'https://www.goldapi.io/api/XAU/USD',
      {
        headers: {
          'x-access-token': apiKey,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 28800 } // Cache for 8 hours
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.price) {
        console.log('✅ Got live price from GoldAPI.io:', data.price);
        return { price: data.price, source: 'goldapi' };
      }
    } else {
      console.log('GoldAPI response error:', response.status);
    }
  } catch (error) {
    console.log('GoldAPI fetch failed:', error);
  }
  return null;
}

// Try FreeCurrencyAPI as backup (5000 req/month - much higher limit!)
async function fetchFromFreeCurrencyAPI(): Promise<{ price: number; source: string } | null> {
  const apiKey = process.env.FREE_CURRENCY_API_KEY;
  
  if (!apiKey) {
    console.log('FREE_CURRENCY_API_KEY not configured');
    return null;
  }
  
  try {
    // FreeCurrencyAPI uses XAU as gold symbol
    const response = await fetch(
      `https://api.freecurrencyapi.com/v1/latest?apikey=${apiKey}&base_currency=XAU&currencies=USD`,
      { next: { revalidate: 28800 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.data?.USD) {
        // XAU base means USD value is price of 1 oz gold
        const pricePerOz = data.data.USD;
        console.log('✅ Got price from FreeCurrencyAPI:', pricePerOz);
        return { price: pricePerOz, source: 'freecurrencyapi' };
      }
    } else {
      console.log('FreeCurrencyAPI response error:', response.status);
    }
  } catch (error) {
    console.log('FreeCurrencyAPI fetch failed:', error);
  }
  return null;
}

// Try exchange rates API as final fallback (FREE - no API key needed)
async function fetchFromExchangeRates(): Promise<{ price: number; source: string } | null> {
  try {
    const response = await fetch(
      'https://api.exchangerate.host/latest?base=XAU&symbols=USD',
      { next: { revalidate: 28800 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.rates?.USD) {
        return { price: data.rates.USD, source: 'exchangerate_host' };
      }
    }
  } catch (error) {
    console.log('Exchange rates fetch failed:', error);
  }
  return null;
}

// GET /api/gold/price - Get current gold price
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check if force refresh is requested
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
    
    // Get settings for price source preference
    const settings = await Settings.findOne();
    const priceSource = settings?.priceApiSource || 'manual';
    const apiKey = settings?.priceApiKey;
    
    // Get latest price from history
    const latestPrice = await PriceHistory.findOne({ commodity: 'gold' })
      .sort({ timestamp: -1 })
      .lean();
    
    // Calculate cache age
    const cacheAge = latestPrice 
      ? Date.now() - new Date(latestPrice.timestamp).getTime()
      : Infinity;
    
    // Use cached price if within 8 hours (unless force refresh)
    if (latestPrice && cacheAge < CACHE_DURATION_MS && !forceRefresh) {
      const hoursOld = Math.round(cacheAge / (60 * 60 * 1000) * 10) / 10;
      
      return NextResponse.json({
        success: true,
        data: {
          pricePerOz: latestPrice.pricePerOz,
          pricePerGram: latestPrice.pricePerGram,
          currency: latestPrice.currency,
          source: latestPrice.source,
          timestamp: latestPrice.timestamp,
          isLive: latestPrice.source !== 'manual',
          cacheInfo: {
            age: `${hoursOld} hours`,
            nextRefresh: new Date(new Date(latestPrice.timestamp).getTime() + CACHE_DURATION_MS),
          },
        },
      });
    }
    
    let livePrice: { price: number; source: string } | null = null;
    
    // Try to fetch live price based on settings
    if (priceSource === 'metals_api' && apiKey) {
      livePrice = await fetchFromMetalsAPI(apiKey);
    } else if (priceSource === 'goldprice_org' || priceSource === 'goldapi') {
      livePrice = await fetchFromGoldAPI();
    }
    
    // Fallback chain if preferred source fails
    if (!livePrice) {
      // Try GoldAPI first (100 req/month)
      livePrice = await fetchFromGoldAPI();
      
      // Then try FreeCurrencyAPI (5000 req/month - higher limit!)
      if (!livePrice) {
        livePrice = await fetchFromFreeCurrencyAPI();
      }
      
      // Final fallback: free exchange rates (no API key needed)
      if (!livePrice) {
        livePrice = await fetchFromExchangeRates();
      }
    }
    
    // Final fallback to manual price or last known price
    if (!livePrice) {
      const fallbackPrice = latestPrice?.pricePerOz || settings?.manualSpotPrice || 2620;
      livePrice = { price: fallbackPrice, source: 'cached' };
    }
    
    const pricePerGram = livePrice.price / OZ_TO_GRAMS;
    
    // Save to history
    const priceRecord = new PriceHistory({
      commodity: 'gold',
      pricePerOz: livePrice.price,
      pricePerGram,
      currency: 'USD',
      source: livePrice.source,
    });
    await priceRecord.save();
    
    return NextResponse.json({
      success: true,
      data: {
        pricePerOz: livePrice.price,
        pricePerGram,
        currency: 'USD',
        source: livePrice.source,
        timestamp: new Date(),
        isLive: !['manual', 'cached', 'fallback'].includes(livePrice.source),
        cacheInfo: {
          age: '0 hours (fresh)',
          nextRefresh: new Date(Date.now() + CACHE_DURATION_MS),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching price:', error);
    
    // Return fallback price even on error
    return NextResponse.json({
      success: true,
      data: {
        pricePerOz: 2620,
        pricePerGram: 2620 / OZ_TO_GRAMS,
        currency: 'USD',
        source: 'fallback',
        timestamp: new Date(),
        isLive: false,
      },
    });
  }
}

// POST /api/gold/price - Set manual price (doesn't use API quota)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { pricePerOz, currency = 'USD' } = body;
    
    if (!pricePerOz) {
      return NextResponse.json(
        { success: false, error: 'Price per ounce is required' },
        { status: 400 }
      );
    }
    
    const pricePerGram = pricePerOz / OZ_TO_GRAMS;
    
    // Save to history
    const priceRecord = new PriceHistory({
      commodity: 'gold',
      pricePerOz,
      pricePerGram,
      currency,
      source: 'manual',
    });
    await priceRecord.save();
    
    // Update settings with manual price
    await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          manualSpotPrice: pricePerOz,
          lastPriceUpdate: new Date(),
        },
      },
      { upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      data: {
        pricePerOz,
        pricePerGram,
        currency,
        source: 'manual',
        timestamp: new Date(),
      },
      message: 'Price updated successfully (no API call used)',
    });
  } catch (error) {
    console.error('Error setting price:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set price' },
      { status: 500 }
    );
  }
}
