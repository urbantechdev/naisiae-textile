import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function GlobalToast() {
  const { toast, setToast } = useCart();

  if (!toast) return null;

  const typeConfig = {
    success: {
      bg: 'bg-[#08047D]/95 border-[#10B981]/30 text-white',
      icon: <CheckCircle2 size={18} className="text-[#10B981] shrink-0" />,
      radial: 'rgba(16, 185, 129, 0.15)',
    },
    warning: {
      bg: 'bg-[#08047D]/95 border-[#F59E0B]/30 text-white',
      icon: <AlertCircle size={18} className="text-[#F59E0B] shrink-0" />,
      radial: 'rgba(245, 158, 11, 0.15)',
    },
    error: {
      bg: 'bg-red-950/95 border-red-500/30 text-white',
      icon: <X size={18} className="text-red-500 shrink-0" />,
      radial: 'rgba(239, 68, 68, 0.15)',
    },
    info: {
      bg: 'bg-[#08047D]/95 border-[#FA9411]/30 text-white',
      icon: <Info size={18} className="text-[#FA9411] shrink-0" />,
      radial: 'rgba(250, 148, 17, 0.15)',
    },
  };

  const currentType = typeConfig[toast.type] || typeConfig.info;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(4px)' }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        id="global-toast-notification"
        className={`fixed bottom-6 right-6 z-[300] flex items-center gap-4 px-5 py-4 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border backdrop-blur-md max-w-sm sm:max-w-md ${currentType.bg}`}
        style={{
          boxShadow: `0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3)`,
          backgroundImage: `radial-gradient(circle at 12px 12px, ${currentType.radial} 0%, transparent 50%)`,
        }}
      >
        <div className="flex items-center gap-3 w-full">
          <div className="p-1 bg-white/5 rounded-lg">
            {currentType.icon}
          </div>
          
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold mb-0.5" style={{ fontSize: '0.65rem' }}>
              System Alert
            </p>
            <p className="text-sm font-sans font-medium tracking-tight text-white leading-tight">
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => setToast(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
