import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function GlobalToast() {
  const { toast, setToast } = useCart();

  if (!toast) return null;

  const typeConfig = {
    success: {
      bg: 'bg-slate-900/95 border-emerald-500/40 text-white shadow-emerald-500/10',
      iconBg: 'bg-emerald-500 text-white',
      icon: (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.05 }}
        >
          <Check size={20} className="stroke-[3]" />
        </motion.div>
      ),
      glow: 'shadow-[0_10px_35px_rgba(16,185,129,0.3)]',
      label: 'Success'
    },
    warning: {
      bg: 'bg-slate-900/95 border-amber-500/40 text-white shadow-amber-500/10',
      iconBg: 'bg-amber-500 text-white',
      icon: (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.05 }}
        >
          <AlertCircle size={20} className="stroke-[2.5]" />
        </motion.div>
      ),
      glow: 'shadow-[0_10px_35px_rgba(245,158,11,0.3)]',
      label: 'Notice'
    },
    error: {
      bg: 'bg-slate-900/95 border-red-500/40 text-white shadow-red-500/10',
      iconBg: 'bg-red-500 text-white',
      icon: (
        <motion.div
          initial={{ scale: 0, rotate: -180, scaleX: 0 }}
          animate={{ scale: 1, rotate: 0, scaleX: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.05 }}
        >
          <X size={20} className="stroke-[3]" />
        </motion.div>
      ),
      glow: 'shadow-[0_10px_35px_rgba(239,68,68,0.3)]',
      label: 'Error'
    },
    info: {
      bg: 'bg-slate-900/95 border-blue-500/40 text-white shadow-blue-500/10',
      iconBg: 'bg-blue-600 text-white',
      icon: (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.05 }}
        >
          <Info size={20} className="stroke-[2.5]" />
        </motion.div>
      ),
      glow: 'shadow-[0_10px_35px_rgba(37,99,235,0.3)]',
      label: 'Information'
    },
  };

  const currentType = typeConfig[toast.type] || typeConfig.info;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.9, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, x: '-50%', scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: 30, x: '-50%', scale: 0.9, filter: 'blur(8px)' }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        id="global-toast-notification"
        className={`fixed bottom-6 left-1/2 z-[300] flex items-center gap-3.5 px-5 py-3.5 rounded-2xl border backdrop-blur-xl max-w-md w-[90%] sm:w-auto ${currentType.bg} ${currentType.glow}`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${currentType.iconBg}`}>
          {currentType.icon}
        </div>
        
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold mb-0.5">
            {currentType.label}
          </p>
          <p className="text-xs sm:text-sm font-sans font-semibold tracking-tight text-white leading-snug">
            {toast.message}
          </p>
        </div>

        <button
          onClick={() => setToast(null)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss message"
        >
          <X size={15} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
