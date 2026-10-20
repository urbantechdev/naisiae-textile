import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Trash2, Clock, User, ShoppingBag, PauseCircle } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';

export interface HeldOrder {
  id: string;
  ticketNumber: string;
  heldAt: string;
  customerName: string;
  items: any[];
  subtotal: number;
  total: number;
  note?: string;
}

interface POSHeldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldOrders: HeldOrder[];
  onRecallOrder: (order: HeldOrder) => void;
  onDiscardOrder: (orderId: string) => void;
}

export function POSHeldOrdersModal({
  isOpen,
  onClose,
  heldOrders,
  onRecallOrder,
  onDiscardOrder,
}: POSHeldOrdersModalProps) {
  const { formatPrice } = useLocalization();

  if (!isOpen) return null;

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

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] border border-slate-200"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#08047D] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md">
                <PauseCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Parked / Held Orders</h3>
                <p className="text-[10px] text-white/70">
                  {heldOrders.length} {heldOrders.length === 1 ? 'sale' : 'sales'} currently on hold
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
            {heldOrders.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <PauseCircle size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No Parked Orders</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  When a customer steps away, use "Hold Sale" on the checkout cart to park their order and serve another customer.
                </p>
              </div>
            ) : (
              heldOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-[#08047D]/30 transition-all flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">Ticket #{order.ticketNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold flex items-center gap-1">
                          <Clock size={10} />
                          {order.heldAt}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-1">
                        <User size={12} className="text-slate-400" />
                        <span>{order.customerName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-[#08047D]">{formatPrice(order.total)}</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {order.items.reduce((sum, item) => sum + (item.quantity || 1), 0)} items
                      </div>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="bg-slate-50 rounded-lg p-2 text-[11px] text-slate-600 space-y-0.5 line-clamp-2">
                    {order.items.map((item, idx) => (
                      <span key={idx} className="mr-2">
                        {item.quantity}× {item.name}
                        {idx < order.items.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onDiscardOrder(order.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1 py-1 px-2 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                      <span>Discard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRecallOrder(order)}
                      className="bg-[#08047D] hover:bg-[#050259] text-white text-xs font-bold py-1.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Play size={13} className="fill-current" />
                      <span>Resume Sale</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
