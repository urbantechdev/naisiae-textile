import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Scissors, Sparkles, Tag, DollarSign } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';

interface POSCustomItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
    customization?: string;
  }) => void;
}

const PRESET_CUSTOM_ITEMS = [
  { name: 'School Crest / Badge Embroidery', price: 250, category: 'Services' },
  { name: 'Trouser / Skirt Hemming Alteration', price: 150, category: 'Services' },
  { name: 'Custom Name Tape Stitching (x3)', price: 300, category: 'Services' },
  { name: 'Poly-Cotton Twill Fabric (Per Metre)', price: 450, category: 'Fabrics' },
  { name: 'School Tie / Scrunchie Add-on', price: 200, category: 'Accessories' },
  { name: 'Expedited Rush Production Surcharge', price: 500, category: 'Services' },
];

export function POSCustomItemModal({ isOpen, onClose, onAddItem }: POSCustomItemModalProps) {
  const { currentCountry, formatPrice } = useLocalization();
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Custom Service');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || Number(price) <= 0) return;

    onAddItem({
      id: `custom_${Date.now()}`,
      name: name.trim(),
      price: Number(price),
      quantity: Math.max(1, quantity),
      category,
      customization: note.trim() || undefined
    });

    setName('');
    setPrice('');
    setQuantity(1);
    setNote('');
    onClose();
  };

  const handleSelectPreset = (preset: typeof PRESET_CUSTOM_ITEMS[0]) => {
    setName(preset.name);
    setPrice(preset.price);
    setCategory(preset.category);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[280] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#04023D]/70 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          className="relative w-full h-[100dvh] sm:h-auto sm:max-w-lg bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col border-0 sm:border border-slate-200"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#08047D] to-[#04023D] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FA9411] text-white flex items-center justify-center shadow-md">
                <Scissors size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Quick Custom POS Line Item</h3>
                <p className="text-[10px] text-white/70">Add custom alterations, embroidery, or bespoke textile items</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {/* Quick Presets */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                Quick Service Presets
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_CUSTOM_ITEMS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(item)}
                    className="text-left p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#08047D]/5 hover:border-[#08047D]/30 transition-all text-[11px] group"
                  >
                    <div className="font-bold text-slate-800 line-clamp-1 group-hover:text-[#08047D]">{item.name}</div>
                    <div className="text-[10px] text-[#FA9411] font-semibold">{formatPrice(item.price)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Item Form */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">
                  Description / Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Custom Blazer Piping & Lining"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#08047D] text-xs font-semibold text-slate-900 bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">
                    Unit Price ({currentCountry.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 350"
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#08047D] text-xs font-bold text-slate-900 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#08047D] text-xs font-bold text-slate-900 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">
                  Line Note / Specification (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Yellow contrast thread on sleeves"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#08047D] text-xs text-slate-800 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Total Preview & Submit */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">Line Total:</span>
                <span className="text-base font-black text-[#08047D]">
                  {formatPrice((Number(price) || 0) * (quantity || 1))}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !price || Number(price) <= 0}
                  className="px-5 py-2.5 rounded-xl bg-[#08047D] hover:bg-[#050259] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Plus size={15} />
                  <span>Add to Ticket</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
