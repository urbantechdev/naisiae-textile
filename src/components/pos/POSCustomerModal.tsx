import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Building, Check, Sparkles } from 'lucide-react';

export interface POSCustomerInfo {
  name: string;
  phone: string;
  institution?: string;
  type: 'walk-in' | 'school' | 'corporate' | 'wholesale';
}

interface POSCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: POSCustomerInfo;
  onSaveCustomer: (customer: POSCustomerInfo) => void;
}

const COMMON_TYPES = [
  { id: 'walk-in', label: 'Walk-in Retail' },
  { id: 'school', label: 'School Admin / Rep' },
  { id: 'corporate', label: 'Corporate Client' },
  { id: 'wholesale', label: 'Wholesale Buyer' },
];

export function POSCustomerModal({
  isOpen,
  onClose,
  customer,
  onSaveCustomer
}: POSCustomerModalProps) {
  const [name, setName] = useState(customer.name || 'Walk-in Customer');
  const [phone, setPhone] = useState(customer.phone || '');
  const [institution, setInstitution] = useState(customer.institution || '');
  const [type, setType] = useState<POSCustomerInfo['type']>(customer.type || 'walk-in');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCustomer({
      name: name.trim() || 'Walk-in Customer',
      phone: phone.trim(),
      institution: institution.trim() || undefined,
      type
    });
    onClose();
  };

  const handleQuickWalkIn = () => {
    setName('Walk-in Customer');
    setPhone('');
    setInstitution('');
    setType('walk-in');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[280] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#04023D]/70 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col border border-slate-200"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#08047D] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FA9411] text-white flex items-center justify-center shadow-md">
                <User size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Customer & Account Info</h3>
                <p className="text-[10px] text-white/70">Assign customer for receipt & M-Pesa push</p>
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
            {/* Quick Customer Type */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Client Profile Type
                </label>
                <button
                  type="button"
                  onClick={handleQuickWalkIn}
                  className="text-[10px] font-bold text-[#08047D] hover:underline"
                >
                  Reset to Walk-in
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {COMMON_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      type === t.id
                        ? 'border-[#08047D] bg-[#08047D]/5 text-[#08047D] font-bold ring-1 ring-[#08047D]'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">
                Customer Name / Contact Person *
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Mary Wanjiku"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#08047D] text-xs font-semibold text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">
                Phone Number (For M-Pesa & SMS Receipt)
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  placeholder="e.g. 0712 345 678 or +254..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#08047D] text-xs font-semibold text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>

            {/* School / Company */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">
                School or Institution Name (Optional)
              </label>
              <div className="relative">
                <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Nairobi Primary School / Serena Hotel"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#08047D] text-xs font-semibold text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#08047D] hover:bg-[#050259] text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Check size={15} />
                <span>Save Customer</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
