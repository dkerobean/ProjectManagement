
import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Save } from 'lucide-react';
import GradientButton from '@/components/gold/GradientButton';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PURITIES = ['24K', '22K', '18K', '14K', 'Scrap', 'Dust'];
const LOCATIONS = [
  { value: 'in_safe', label: 'In Safe' },
  { value: 'at_refinery', label: 'At Refinery' },
];

export default function AddStockModal({ isOpen, onClose, onSuccess }: AddStockModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    goldType: 'Bar',
    purity: '24K',
    weightGrams: '',
    avgCostPerGram: '',
    location: 'in_safe',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/gold/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            weightGrams: parseFloat(formData.weightGrams),
            avgCostPerGram: parseFloat(formData.avgCostPerGram),
            purityPercentage: getPurityPercentage(formData.purity)
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
            goldType: 'Bar',
            purity: '24K',
            weightGrams: '',
            avgCostPerGram: '',
            location: 'in_safe',
            notes: '',
        });
      } else {
        alert(data.error || 'Failed to add stock');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  const getPurityPercentage = (purity: string) => {
      const map: Record<string, number> = {
          '24K': 0.999, '22K': 0.916, '18K': 0.750, '14K': 0.585
      };
      return map[purity] || 0.999;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-[#1C1C1E] border border-white/10 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-xl font-bold text-white flex items-center gap-2">
                    <span>👑</span> Add New Stock
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                      <select
                        value={formData.goldType}
                        onChange={(e) => setFormData({...formData, goldType: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-medium appearance-none"
                      >
                        <option value="Bar">Bar</option>
                        <option value="Dust">Dust</option>
                        <option value="Scrap">Scrap</option>
                        <option value="Granules">Granules</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Purity</label>
                      <select
                        value={formData.purity}
                        onChange={(e) => setFormData({...formData, purity: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-medium appearance-none"
                      >
                        {PURITIES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight (g)</label>
                     <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.weightGrams}
                        onChange={(e) => setFormData({...formData, weightGrams: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-bold text-lg placeholder:text-gray-700"
                        placeholder="0.00"
                     />
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost per Gram (USD)</label>
                     <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.avgCostPerGram}
                        onChange={(e) => setFormData({...formData, avgCostPerGram: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-bold text-lg placeholder:text-gray-700"
                        placeholder="0.00"
                     />
                  </div>
                  
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initial Location</label>
                      <div className="grid grid-cols-2 gap-2">
                        {LOCATIONS.map(loc => (
                            <button
                                key={loc.value}
                                type="button"
                                onClick={() => setFormData({...formData, location: loc.value})}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    formData.location === loc.value 
                                    ? 'bg-primary/20 border-primary text-primary' 
                                    : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'
                                }`}
                            >
                                {loc.label}
                            </button>
                        ))}
                      </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes (Optional)</label>
                     <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm h-20 resize-none"
                        placeholder="Additional details..."
                     />
                  </div>

                  <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-yellow-400 text-black font-bold py-4 rounded-xl shadow-glow transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Adding...' : 'Save to Vault'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
