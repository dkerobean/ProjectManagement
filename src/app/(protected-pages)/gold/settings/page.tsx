'use client';

/**
 * Settings Page
 * GoldTrader Pro - Business configuration and preferences
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Settings {
  _id: string;
  businessName: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  defaultCurrency: string;
  defaultUnit: string;
  defaultMarginPercentage: number;
  commodityType: string;
  priceApiSource: string;
  priceApiKey?: string;
  manualSpotPrice?: number;
  priceRefreshIntervalMinutes: number;
  purityPresets: Array<{ name: string; percentage: number }>;
  notifications: {
    priceAlerts: boolean;
    priceAlertThresholdPercent: number;
    dailySummary: boolean;
  };
}

const CURRENCIES = [
  { value: 'USD', label: '🇺🇸 USD - US Dollar' },
  { value: 'GHS', label: '🇬🇭 GHS - Ghana Cedi' },
  { value: 'EUR', label: '🇪🇺 EUR - Euro' },
  { value: 'GBP', label: '🇬🇧 GBP - British Pound' },
];

const UNITS = [
  { value: 'grams', label: 'Grams (g)' },
  { value: 'ounces', label: 'Troy Ounces (oz)' },
  { value: 'kilograms', label: 'Kilograms (kg)' },
];

const COMMODITIES = [
  { value: 'gold', label: '🥇 Gold', icon: '🏆' },
  { value: 'oil', label: '🛢️ Oil', icon: '🛢️' },
  { value: 'gas', label: '⛽ Gas', icon: '⛽' },
];

const PRICE_SOURCES = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'metals_api', label: 'Metals-API' },
  { value: 'goldprice_org', label: 'GoldPrice.org' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [defaultUnit, setDefaultUnit] = useState('grams');
  const [defaultMargin, setDefaultMargin] = useState('5');
  const [commodityType, setCommodityType] = useState('gold');
  const [priceSource, setPriceSource] = useState('manual');
  const [priceApiKey, setPriceApiKey] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState('2');

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/gold/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        // Populate form
        setBusinessName(data.data.businessName || '');
        setBusinessPhone(data.data.businessPhone || '');
        setDefaultCurrency(data.data.defaultCurrency || 'USD');
        setDefaultUnit(data.data.defaultUnit || 'grams');
        setDefaultMargin(String(data.data.defaultMarginPercentage || 5));
        setCommodityType(data.data.commodityType || 'gold');
        setPriceSource(data.data.priceApiSource || 'manual');
        setPriceApiKey(data.data.priceApiKey || '');
        setManualPrice(String(data.data.manualSpotPrice || ''));
        setPriceAlerts(data.data.notifications?.priceAlerts ?? true);
        setAlertThreshold(String(data.data.notifications?.priceAlertThresholdPercent || 2));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/gold/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          businessPhone,
          defaultCurrency,
          defaultUnit,
          defaultMarginPercentage: parseFloat(defaultMargin) || 5,
          commodityType,
          priceApiSource: priceSource,
          priceApiKey: priceApiKey || undefined,
          manualSpotPrice: parseFloat(manualPrice) || undefined,
          notifications: {
            priceAlerts,
            priceAlertThresholdPercent: parseFloat(alertThreshold) || 2,
            dailySummary: true,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Update manual price immediately
  const handleUpdatePrice = async () => {
    if (!manualPrice) return;

    try {
      await fetch('/api/gold/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricePerOz: parseFloat(manualPrice),
          currency: defaultCurrency,
        }),
      });
    } catch (error) {
      console.error('Failed to update price:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-yellow-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-600 to-yellow-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-bold">⚙️ Settings</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              saved
                ? 'bg-green-600'
                : 'bg-yellow-700 hover:bg-yellow-600'
            }`}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 space-y-4 py-4">
        {/* Business Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-4"
        >
          <h2 className="text-gray-400 text-sm mb-3">🏢 BUSINESS PROFILE</h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs block mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-500 outline-none"
                placeholder="GoldTrader Pro"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs block mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-500 outline-none"
                placeholder="+233 XX XXX XXXX"
              />
            </div>
          </div>
        </motion.div>

        {/* Trading Defaults */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-4"
        >
          <h2 className="text-gray-400 text-sm mb-3">💰 TRADING DEFAULTS</h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs block mb-1">
                Default Currency
              </label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-500 outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-xs block mb-1">
                Default Unit
              </label>
              <select
                value={defaultUnit}
                onChange={(e) => setDefaultUnit(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-500 outline-none"
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-xs block mb-1">
                Default Margin/Discount (%)
              </label>
              <input
                type="number"
                value={defaultMargin}
                onChange={(e) => setDefaultMargin(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-500 outline-none"
                placeholder="5"
              />
            </div>
          </div>
        </motion.div>

        {/* Commodity Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gray-800 rounded-xl p-4"
        >
          <h2 className="text-gray-400 text-sm mb-3">📦 COMMODITY</h2>
          
          <div className="grid grid-cols-3 gap-2">
            {COMMODITIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCommodityType(c.value)}
                className={`p-3 rounded-lg text-center transition ${
                  commodityType === c.value
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-900 hover:bg-gray-700'
                }`}
              >
                <div className="text-2xl mb-1">{c.icon}</div>
                <div className="text-xs">{c.value.charAt(0).toUpperCase() + c.value.slice(1)}</div>
              </button>
            ))}
          </div>
          
          {commodityType !== 'gold' && (
            <div className="mt-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg px-3 py-2 text-sm text-yellow-400">
              ⚠️ Oil/Gas mode changes units to Liters/Barrels and uses different price sources.
            </div>
          )}
        </motion.div>

        {/* Price Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-4"
        >
          <h2 className="text-gray-400 text-sm mb-3">📈 SPOT PRICE</h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs block mb-1">
                Price Source
              </label>
              <select
                value={priceSource}
                onChange={(e) => setPriceSource(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-500 outline-none"
              >
                {PRICE_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {priceSource !== 'manual' && (
              <div>
                <label className="text-gray-400 text-xs block mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={priceApiKey}
                  onChange={(e) => setPriceApiKey(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-500 outline-none"
                  placeholder="Enter API key"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Get your API key from {priceSource === 'metals_api' ? 'metals-api.com' : 'goldprice.org'}
                </div>
              </div>
            )}

            {priceSource === 'manual' && (
              <div>
                <label className="text-gray-400 text-xs block mb-1">
                  Current Spot Price (per oz)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-500 outline-none"
                    placeholder="2620"
                  />
                  <button
                    onClick={handleUpdatePrice}
                    className="bg-yellow-600 hover:bg-yellow-700 px-4 rounded-lg transition"
                  >
                    Update
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gray-800 rounded-xl p-4"
        >
          <h2 className="text-gray-400 text-sm mb-3">🔔 NOTIFICATIONS</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Price Alerts</span>
              <button
                onClick={() => setPriceAlerts(!priceAlerts)}
                className={`w-12 h-6 rounded-full transition ${
                  priceAlerts ? 'bg-yellow-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition transform ${
                    priceAlerts ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {priceAlerts && (
              <div>
                <label className="text-gray-400 text-xs block mb-1">
                  Alert when price changes by (%)
                </label>
                <input
                  type="number"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-500 outline-none"
                  placeholder="2"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-xl p-4 text-center text-gray-500 text-sm"
        >
          <div className="text-2xl mb-2">🏆</div>
          <div className="font-bold text-white">GoldTrader Pro</div>
          <div>Version 1.0.0</div>
          <div className="mt-2">Built for gold trading professionals</div>
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-2 py-2 z-20">
        <div className="max-w-lg mx-auto flex justify-around items-center">
          <a href="/gold" className="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-400 px-4 py-2 transition">
            <span className="text-xl">🏠</span>
            <span className="text-xs">Home</span>
          </a>
          <a href="/gold/trade" className="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-400 px-4 py-2 transition">
            <span className="text-xl">💰</span>
            <span className="text-xs">Trade</span>
          </a>
          <a href="/gold/vault" className="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-400 px-4 py-2 transition">
            <span className="text-xl">🏦</span>
            <span className="text-xs">Vault</span>
          </a>
          <a href="/gold/suppliers" className="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-400 px-4 py-2 transition">
            <span className="text-xl">👥</span>
            <span className="text-xs">People</span>
          </a>
          <a href="/gold/settings" className="flex flex-col items-center gap-1 text-yellow-400 px-4 py-2">
            <span className="text-xl">⚙️</span>
            <span className="text-xs">Settings</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
