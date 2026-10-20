import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { appExperience } from '../../utils/haptics';
import { useLocalization } from '../../context/LocalizationContext';

interface MobileCartFloatingBarProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  isVisible: boolean;
}

export function MobileCartFloatingBar({
  cartCount,
  cartTotal,
  onOpenCart,
  isVisible
}: MobileCartFloatingBarProps) {
  const { formatPrice } = useLocalization();

  return (
    <AnimatePresence>
      {isVisible && cartCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="lg:hidden fixed bottom-20 inset-x-3 z-[90] max-w-md mx-auto"
        >
          <button
            type="button"
            onClick={() => {
              appExperience.triggerFeedback('tap');
              onOpenCart();
            }}
            className="w-full bg-gradient-to-r from-[#08047D] to-[#140da8] text-white p-3.5 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FA9411] text-white flex items-center justify-center font-black text-xs shadow-md shrink-0">
                <ShoppingBag size={18} />
              </div>
              <div className="text-left">
                <div className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>{cartCount} {cartCount === 1 ? 'item' : 'items'} in ticket</span>
                </div>
                <div className="text-sm font-black text-amber-300">
                  {formatPrice(cartTotal)}
                </div>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-white text-[#08047D] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md">
              <span>View Ticket</span>
              <ArrowRight size={14} />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
