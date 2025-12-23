'use client';

/**
 * Digital Receipt Component
 * GoldTrader Pro - Generate shareable transaction receipts
 */
import { forwardRef, useCallback } from 'react';

interface ReceiptData {
  receiptNumber: string;
  type: 'buy' | 'sell';
  supplierName: string;
  date: Date;
  
  // Gold details
  weightGrams: number;
  purity: string;
  purityPercentage: number;
  
  // Pricing
  spotPricePerOz: number;
  spotPricePerGram: number;
  discountPercentage: number;
  buyingPricePerGram: number;
  totalAmount: number;
  currency: string;
  
  // Payment
  paymentMethod: string;
  advanceDeducted?: number;
  amountPaid: number;
  
  // Business
  businessName?: string;
  businessPhone?: string;
}

interface ReceiptProps {
  data: ReceiptData;
  onClose?: () => void;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ data, onClose }, ref) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveAsImage = useCallback(async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const receiptElement = document.getElementById('receipt-content');
      if (!receiptElement) return;

      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `${data.receiptNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to save receipt:', error);
    }
  }, [data.receiptNumber]);

  const handleShare = useCallback(async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const receiptElement = document.getElementById('receipt-content');
      if (!receiptElement) return;

      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `${data.receiptNumber}.png`, {
          type: 'image/png',
        });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Receipt ${data.receiptNumber}`,
            text: `Gold ${data.type === 'buy' ? 'Purchase' : 'Sale'} - ${data.weightGrams}g`,
            files: [file],
          });
        } else {
          // Fallback to download
          handleSaveAsImage();
        }
      });
    } catch (error) {
      console.error('Failed to share receipt:', error);
      handleSaveAsImage();
    }
  }, [data, handleSaveAsImage]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        {/* Receipt Content */}
        <div
          ref={ref}
          id="receipt-content"
          className="bg-white text-black rounded-lg overflow-hidden shadow-lg"
        >
          {/* Header */}
          <div
            className={`p-4 text-white text-center ${
              data.type === 'buy'
                ? 'bg-gradient-to-r from-green-600 to-green-800'
                : 'bg-gradient-to-r from-red-600 to-red-800'
            }`}
          >
            <div className="text-3xl mb-1">
              {data.type === 'buy' ? '⬇️' : '⬆️'}
            </div>
            <h1 className="text-xl font-bold">
              {data.type === 'buy' ? 'PURCHASE' : 'SALE'} RECEIPT
            </h1>
            <p className="text-sm opacity-80">{data.receiptNumber}</p>
          </div>

          {/* Business Info */}
          <div className="p-4 bg-gray-100 text-center text-sm">
            <div className="font-bold text-lg">
              {data.businessName || 'GoldTrader Pro'}
            </div>
            {data.businessPhone && <div>{data.businessPhone}</div>}
            <div className="text-gray-500 text-xs mt-1">
              {formatDate(data.date)}
            </div>
          </div>

          {/* Supplier */}
          <div className="p-4 border-b border-gray-200">
            <div className="text-gray-500 text-xs">
              {data.type === 'buy' ? 'Purchased from' : 'Sold to'}
            </div>
            <div className="font-bold text-lg">{data.supplierName}</div>
          </div>

          {/* Gold Details */}
          <div className="p-4 border-b border-gray-200">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-gray-500 py-1">Weight</td>
                  <td className="text-right font-medium">
                    {data.weightGrams} grams
                  </td>
                </tr>
                <tr>
                  <td className="text-gray-500 py-1">Purity</td>
                  <td className="text-right font-medium">
                    {data.purity} ({(data.purityPercentage * 100).toFixed(1)}%)
                  </td>
                </tr>
                <tr>
                  <td className="text-gray-500 py-1">Spot Price</td>
                  <td className="text-right font-medium">
                    {formatCurrency(data.spotPricePerOz)}/oz
                  </td>
                </tr>
                <tr>
                  <td className="text-gray-500 py-1">
                    {data.type === 'buy' ? 'Discount' : 'Markup'}
                  </td>
                  <td className="text-right font-medium">
                    {data.discountPercentage}%
                  </td>
                </tr>
                <tr>
                  <td className="text-gray-500 py-1">Price/gram</td>
                  <td className="text-right font-medium">
                    {formatCurrency(data.buyingPricePerGram)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment */}
          <div className="p-4 border-b border-gray-200">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-gray-500 py-1">Subtotal</td>
                  <td className="text-right font-medium">
                    {formatCurrency(data.totalAmount)}
                  </td>
                </tr>
                {data.advanceDeducted && data.advanceDeducted > 0 && (
                  <tr>
                    <td className="text-gray-500 py-1">Advance Deducted</td>
                    <td className="text-right font-medium text-orange-600">
                      -{formatCurrency(data.advanceDeducted)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="text-gray-500 py-1">Payment Method</td>
                  <td className="text-right font-medium capitalize">
                    {data.paymentMethod.replace('_', ' ')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div
            className={`p-4 text-center ${
              data.type === 'buy' ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <div className="text-gray-500 text-xs">AMOUNT PAID</div>
            <div
              className={`text-3xl font-bold ${
                data.type === 'buy' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(data.amountPaid)}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-100 text-center text-xs text-gray-500">
            Thank you for your business!
            <br />
            Generated by GoldTrader Pro
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={handleSaveAsImage}
            className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition"
          >
            💾 Save
          </button>
          <button
            onClick={handleShare}
            className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
          >
            📤 Share
          </button>
          <button
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-medium transition"
          >
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;
