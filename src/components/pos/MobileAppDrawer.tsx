import React from 'react';
import { 
  X, 
  Sparkles, 
  Ruler, 
  Scissors, 
  Building2, 
  ClipboardList, 
  Smartphone, 
  Star, 
  ShieldAlert, 
  LogOut, 
  MapPin, 
  Wifi, 
  Volume2, 
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { appExperience } from '../../utils/haptics';
import { useFullscreen } from '../../context/FullscreenContext';

interface MobileAppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSizingGuide: () => void;
  onTriggerInstallApp?: () => void;
  canInstall?: boolean;
}

export function MobileAppDrawer({
  isOpen,
  onClose,
  onOpenSizingGuide,
  onTriggerInstallApp,
  canInstall = false
}: MobileAppDrawerProps) {
  const navigate = useNavigate();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const handleAction = (cb: () => void) => {
    appExperience.triggerFeedback('tap');
    onClose();
    cb();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[150] flex flex-col justify-end">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Slide-Up Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 overflow-hidden max-h-[85vh] flex flex-col pb-safe-dock"
          >
            {/* Grab Drag Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-[#08047D] uppercase tracking-wide">
                    Naisiae App Hub
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase flex items-center gap-1 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online POS
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={11} className="text-[#FA9411]" />
                  Uhuru Market Stall 4B, Jogoo Road
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick App Actions List */}
            <div className="p-4 overflow-y-auto space-y-2">
              {/* Install PWA Prompt button if available */}
              {onTriggerInstallApp && (
                <button
                  type="button"
                  onClick={() => handleAction(onTriggerInstallApp)}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#08047D] to-[#140da8] text-white flex items-center justify-between text-left shadow-md border border-[#FA9411]/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FA9411] flex items-center justify-center text-white shadow-inner">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <div className="font-black text-xs">Install Naisiae Mobile App</div>
                      <div className="text-[10px] text-blue-200">1-Tap Home Screen Launcher & Offline POS</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-amber-300" />
                </button>
              )}

              {/* Sizing Guide */}
              <button
                type="button"
                onClick={() => handleAction(onOpenSizingGuide)}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#FA9411] flex items-center justify-center">
                    <Ruler size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800">Kenya Uniform Sizing Matrix</div>
                    <div className="text-[10px] text-slate-500">Official Primary, JSS & High School Specs</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              {/* Uniform Simulator */}
              <button
                type="button"
                onClick={() => handleAction(() => navigate('/uniform-simulator'))}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800">3D Uniform Color Simulator</div>
                    <div className="text-[10px] text-slate-500">Configure Sweaters, Blazers, Ties & Shirts</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              {/* Fabric Swatches */}
              <button
                type="button"
                onClick={() => handleAction(() => navigate('/textiles'))}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#08047D] flex items-center justify-center">
                    <Scissors size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800">Textiles & Fabric Swatches</div>
                    <div className="text-[10px] text-slate-500">Gabardine, Terylene, Cotton & Woolens</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              {/* Admin Orders Live Queue */}
              <button
                type="button"
                onClick={() => handleAction(() => navigate('/admin'))}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800">Admin Dashboard & Order Queue</div>
                    <div className="text-[10px] text-slate-500">Live POS tickets, sewing and production queue</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              {/* Wholesale Inquiries */}
              <button
                type="button"
                onClick={() => handleAction(() => navigate('/wholesale'))}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800">Wholesale & Institutional Bids</div>
                    <div className="text-[10px] text-slate-500">Contract rates for schools and hospitals</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              {/* Google Reviews */}
              <button
                type="button"
                onClick={() => handleAction(() => window.open('https://g.page/r/CZb3o2nm3vRgEBM/review', '_blank'))}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center">
                    <Star size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800">Google My Business Reviews</div>
                    <div className="text-[10px] text-slate-500">Uhuru Market Official Profile (5.0 ★)</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </div>

            {/* Bottom Station Details */}
            <div className="p-4 bg-slate-100/70 border-t border-slate-200 text-[10.5px] text-slate-500 flex items-center justify-between">
              <span>Terminal #01 · Cashier POS</span>
              <button
                type="button"
                onClick={() => {
                  appExperience.triggerFeedback('tap');
                  toggleFullscreen();
                }}
                className="font-bold text-[#08047D] hover:underline flex items-center gap-1"
              >
                {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                <span>{isFullscreen ? 'Exit Kiosk' : 'Kiosk Fullscreen'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
