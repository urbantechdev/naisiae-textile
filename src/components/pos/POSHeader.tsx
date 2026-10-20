import React, { useRef, useEffect } from 'react';
import { 
  Search, 
  Barcode, 
  Plus, 
  PauseCircle, 
  X,
  LayoutGrid,
  List,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { appExperience } from '../../utils/haptics';

interface POSHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCustomItem: () => void;
  onOpenHeldOrders: () => void;
  heldCount: number;
  onSimulateBarcodeScan: () => void;
  viewMode: 'grid' | 'list';
  onToggleViewMode: (mode: 'grid' | 'list') => void;
  totalProductsCount: number;
}

export function POSHeader({
  searchQuery,
  onSearchChange,
  onOpenCustomItem,
  onOpenHeldOrders,
  heldCount,
  onSimulateBarcodeScan,
  viewMode,
  onToggleViewMode,
  totalProductsCount
}: POSHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // POS Keyboard Shortcuts: '/' to focus search, 'b' or 'B' for barcode scan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea';

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        appExperience.triggerFeedback('tap');
      } else if ((e.key === 'b' || e.key === 'B') && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onSimulateBarcodeScan();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSimulateBarcodeScan]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-2.5 sm:p-3 shadow-xs mb-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
      {/* Search Input Bar */}
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search uniforms by name, SKU, category (e.g. Navy Blazer, Doctor Coat, Scrubs)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-20 py-2 sm:py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#08047D] focus:border-transparent text-xs font-semibold text-slate-900 bg-slate-50 placeholder:text-slate-400 transition-all"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              title="Clear search"
            >
              <X size={14} />
            </button>
          ) : (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-mono text-slate-400 font-bold">
              /
            </span>
          )}
        </div>
      </div>

      {/* Action Strip: Barcode, View Mode, Custom Item, Held Tickets */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
        {/* Barcode Scanner Button */}
        <button
          type="button"
          onClick={onSimulateBarcodeScan}
          className="px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
          title="Scan barcode or press 'B'"
        >
          <Barcode size={15} className="text-[#08047D]" />
          <span className="hidden sm:inline">Scan</span>
          <span className="hidden xl:inline text-[10px] font-mono text-slate-400 bg-slate-100 px-1 rounded">B</span>
        </button>

        {/* View Mode Toggle: Grid / List */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => { appExperience.triggerFeedback('tap'); onToggleViewMode('grid'); }}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid' 
                ? 'bg-white text-[#08047D] shadow-xs font-bold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Grid View"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            onClick={() => { appExperience.triggerFeedback('tap'); onToggleViewMode('list'); }}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'list' 
                ? 'bg-white text-[#08047D] shadow-xs font-bold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Dense List View"
          >
            <List size={15} />
          </button>
        </div>

        {/* Custom Item Quick Line Creator */}
        <button
          type="button"
          onClick={onOpenCustomItem}
          className="px-3 py-2 sm:py-2.5 rounded-xl bg-[#08047D] hover:bg-[#050259] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
          title="Add a custom one-off item or tailoring alteration"
        >
          <Plus size={14} className="text-[#FA9411]" />
          <span>+ Custom Item</span>
        </button>

        {/* Held Orders Quick Recall Button */}
        {heldCount > 0 && (
          <button
            type="button"
            onClick={onOpenHeldOrders}
            className="px-3 py-2 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all animate-pulse"
            title="View Held / Parked Tickets"
          >
            <PauseCircle size={14} />
            <span>Held ({heldCount})</span>
          </button>
        )}

        {/* Station Status Pill */}
        <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Terminal #01 · Cashier</span>
        </div>
      </div>
    </div>
  );
}
