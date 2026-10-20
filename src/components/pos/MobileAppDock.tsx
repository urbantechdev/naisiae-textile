import React from 'react';
import { 
  ShoppingBag, 
  Search, 
  Layers, 
  Menu, 
  PauseCircle, 
  Barcode, 
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { motion } from 'motion/react';
import { appExperience } from '../../utils/haptics';
import { useLocalization } from '../../context/LocalizationContext';

interface MobileAppDockProps {
  activeView: 'catalog' | 'cart';
  onSwitchView: (view: 'catalog' | 'cart') => void;
  cartCount: number;
  cartTotal: number;
  heldCount: number;
  onOpenAppDrawer: () => void;
  onOpenHeldOrders: () => void;
  onTriggerScan: () => void;
}

export function MobileAppDock({
  activeView,
  onSwitchView,
  cartCount,
  cartTotal,
  heldCount,
  onOpenAppDrawer,
  onOpenHeldOrders,
  onTriggerScan
}: MobileAppDockProps) {
  const { formatPrice } = useLocalization();

  return (
    <nav 
      aria-label="Mobile App Dock"
      className="lg:hidden fixed bottom-0 inset-x-0 z-[95] bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(8,4,125,0.08)] pb-safe"
    >
      <div className="h-16 px-3 flex items-center justify-around max-w-md mx-auto">
        {/* 1. Catalog / Register */}
        <button
          type="button"
          onClick={() => {
            appExperience.triggerFeedback('tap');
            onSwitchView('catalog');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all relative ${
            activeView === 'catalog' ? 'text-[#08047D]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {activeView === 'catalog' && (
            <motion.div
              layoutId="activeDockIndicator"
              className="absolute -top-1 w-10 h-1 bg-[#FA9411] rounded-full shadow-[0_0_8px_#FA9411]"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <div className={`p-1 rounded-xl transition-all ${activeView === 'catalog' ? 'bg-[#08047D]/10' : ''}`}>
            <Layers size={20} className={activeView === 'catalog' ? 'stroke-[2.5]' : ''} />
          </div>
          <span className="text-[10px] font-black tracking-tight mt-0.5">Catalog</span>
        </button>

        {/* 2. Barcode Scan Trigger */}
        <button
          type="button"
          onClick={() => {
            appExperience.triggerFeedback('pop');
            onTriggerScan();
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-all active:scale-95"
        >
          <div className="p-1 rounded-xl text-slate-600">
            <Barcode size={20} />
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">Scan</span>
        </button>

        {/* 3. Center Cart / Ticket Button with Floating Accent */}
        <button
          type="button"
          onClick={() => {
            appExperience.triggerFeedback('tap');
            onSwitchView('cart');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all relative ${
            activeView === 'cart' ? 'text-[#08047D]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {activeView === 'cart' && (
            <motion.div
              layoutId="activeDockIndicator"
              className="absolute -top-1 w-10 h-1 bg-[#FA9411] rounded-full shadow-[0_0_8px_#FA9411]"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <div className="relative">
            <div className={`p-1.5 rounded-xl transition-all ${
              activeView === 'cart' 
                ? 'bg-[#08047D] text-white shadow-md' 
                : cartCount > 0 
                  ? 'bg-[#08047D]/10 text-[#08047D]' 
                  : 'text-slate-500'
            }`}>
              <ShoppingBag size={20} className={activeView === 'cart' ? 'stroke-[2.5]' : ''} />
            </div>

            {/* Badge Counter */}
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.5 rounded-full bg-[#FA9411] text-white text-[9px] font-black shadow-md border-2 border-white animate-bounce">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black tracking-tight mt-0.5">
            {cartCount > 0 ? formatPrice(cartTotal) : 'Ticket'}
          </span>
        </button>

        {/* 4. Held / Parked Tickets */}
        <button
          type="button"
          onClick={() => {
            appExperience.triggerFeedback('tap');
            onOpenHeldOrders();
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-600 transition-all relative"
        >
          <div className="relative p-1">
            <PauseCircle size={20} className={heldCount > 0 ? "text-amber-500" : "text-slate-500"} />
            {heldCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                {heldCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">Held</span>
        </button>

        {/* 5. More App Drawer */}
        <button
          type="button"
          onClick={() => {
            appExperience.triggerFeedback('tap');
            onOpenAppDrawer();
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-all"
        >
          <div className="p-1 rounded-xl text-slate-600">
            <Menu size={20} />
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">More</span>
        </button>
      </div>
    </nav>
  );
}
