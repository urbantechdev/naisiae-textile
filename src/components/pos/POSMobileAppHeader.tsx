import React, { useRef } from 'react';
import { 
  Search, 
  Barcode, 
  Plus, 
  PauseCircle, 
  X, 
  User, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { appExperience } from '../../utils/haptics';
import { useLocalization } from '../../context/LocalizationContext';
import { useFullscreen } from '../../context/FullscreenContext';
import { POSCustomerInfo } from './POSCustomerModal';

interface POSMobileAppHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSimulateBarcodeScan: () => void;
  onOpenCustomItem: () => void;
  onOpenHeldOrders: () => void;
  heldCount: number;
  customer: POSCustomerInfo;
  onOpenCustomerModal: () => void;
  totalProductsCount: number;
}

export function POSMobileAppHeader({
  searchQuery,
  onSearchChange,
  onSimulateBarcodeScan,
  onOpenCustomItem,
  onOpenHeldOrders,
  heldCount,
  customer,
  onOpenCustomerModal,
  totalProductsCount
}: POSMobileAppHeaderProps) {
  const { currentCountry, changeCountry } = useLocalization();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="lg:hidden fixed top-0 inset-x-0 z-[80] bg-[#08047D] text-white shadow-lg pt-safe border-b border-[#FA9411]/25">
      {/* 1. App Top Status Row */}
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        {/* Brand Monogram + Station Status */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white text-[#08047D] font-black flex items-center justify-center text-xs shadow-md border border-white/30 shrink-0">
            NT
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs tracking-tight text-white">Naisiae POS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-blue-200 font-medium truncate max-w-[130px]">
              Uhuru Mkt Stall 4B
            </div>
          </div>
        </div>

        {/* Right controls: Active customer pill + Fullscreen */}
        <div className="flex items-center gap-1.5">
          {/* Customer Pill Button */}
          <button
            type="button"
            onClick={() => {
              appExperience.triggerFeedback('tap');
              onOpenCustomerModal();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-[11px] font-bold text-white transition-all active:scale-95"
            title="Assign Customer"
          >
            <User size={12} className="text-[#FA9411]" />
            <span className="max-w-[85px] truncate">{customer.name.split(' ')[0]}</span>
          </button>

          {/* Fullscreen Kiosk Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              appExperience.triggerFeedback('tap');
              toggleFullscreen();
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all active:scale-95"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen POS Mode"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* 2. Fast Search & Barcode Scan Bar */}
      <div className="px-3 pb-2.5 pt-1 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search uniform, SKU, size..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-8 py-2 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 font-semibold text-xs border-0 focus:ring-2 focus:ring-[#FA9411] transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Barcode Scan Button */}
        <button
          type="button"
          onClick={() => {
            appExperience.triggerFeedback('pop');
            onSimulateBarcodeScan();
          }}
          className="p-2 rounded-xl bg-[#FA9411] hover:bg-[#E08208] text-white flex items-center justify-center shadow-md active:scale-90 transition-all shrink-0"
          title="Scan barcode"
        >
          <Barcode size={18} />
        </button>

        {/* Custom Line Item Button */}
        <button
          type="button"
          onClick={() => {
            appExperience.triggerFeedback('tap');
            onOpenCustomItem();
          }}
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center border border-white/20 active:scale-90 transition-all shrink-0"
          title="Add Custom Item"
        >
          <Plus size={18} className="text-[#FA9411]" />
        </button>

        {/* Held Orders Quick Count if > 0 */}
        {heldCount > 0 && (
          <button
            type="button"
            onClick={() => {
              appExperience.triggerFeedback('tap');
              onOpenHeldOrders();
            }}
            className="p-2 rounded-xl bg-amber-500 text-white flex items-center justify-center active:scale-90 transition-all shrink-0 animate-pulse"
            title="Held Tickets"
          >
            <PauseCircle size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
