import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Minimize2, Monitor, X, Sparkles, Check, Settings2 } from 'lucide-react';
import { useFullscreen } from '../../context/FullscreenContext';
import { appExperience } from '../../utils/haptics';

export function POSFullscreenBanner() {
  const { 
    isFullscreen, 
    isAutoFullscreenEnabled, 
    enterFullscreen, 
    exitFullscreen, 
    setAutoFullscreenEnabled 
  } = useFullscreen();

  const [isDismissed, setIsDismissed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Auto-hide banner after entering fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const timer = setTimeout(() => setIsDismissed(true), 3500);
      return () => clearTimeout(timer);
    } else {
      setIsDismissed(false);
    }
  }, [isFullscreen]);

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full bg-[#08047D] text-white border-b border-[#FA9411]/40 py-1.5 px-3 sm:px-4 text-xs shadow-md relative z-40"
        >
          <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-2">
            {/* Left: Status Message */}
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isFullscreen ? 'bg-emerald-400' : 'bg-[#FA9411]'
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isFullscreen ? 'bg-emerald-500' : 'bg-[#FA9411]'
                }`} />
              </span>

              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-wide text-amber-300 uppercase text-[10px] sm:text-xs">
                  {isFullscreen ? 'Kiosk Mode Active' : 'POS Terminal Mode'}
                </span>
                <span className="text-white/60 hidden sm:inline">·</span>
                <span className="text-white/90 text-[11px] sm:text-xs hidden md:inline">
                  {isFullscreen 
                    ? 'Screen maximized for cashiers. Press Esc or F11 to restore window.' 
                    : isAutoFullscreenEnabled 
                      ? 'Auto-fullscreen armed — clicking anywhere expands to full terminal.' 
                      : 'Kiosk mode is available. Maximize for high-speed counter checkout.'}
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Settings Toggle for Auto Fullscreen */}
              <button
                type="button"
                onClick={() => {
                  appExperience.triggerFeedback('tap');
                  setShowSettings(!showSettings);
                }}
                title="Kiosk Fullscreen Settings"
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-all text-[11px] flex items-center gap-1"
              >
                <Settings2 size={13} />
                <span className="hidden sm:inline">Auto: {isAutoFullscreenEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {/* Main Fullscreen Toggle Button */}
              {isFullscreen ? (
                <button
                  type="button"
                  onClick={() => {
                    appExperience.triggerFeedback('tap');
                    exitFullscreen();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all active:scale-95 border border-white/20"
                >
                  <Minimize2 size={12} />
                  <span>Exit Fullscreen</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    appExperience.triggerFeedback('success');
                    enterFullscreen();
                  }}
                  className="px-3 py-1 rounded-lg bg-[#FA9411] hover:bg-[#E08208] text-white font-black text-[11px] flex items-center gap-1.5 shadow-sm transition-all active:scale-95 hover:scale-105"
                >
                  <Maximize2 size={12} />
                  <span>Expand Fullscreen</span>
                </button>
              )}

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => {
                  appExperience.triggerFeedback('tap');
                  setIsDismissed(true);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all ml-1"
                aria-label="Dismiss banner"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Quick Settings Dropdown */}
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 pt-2 border-t border-white/15 max-w-[1720px] mx-auto flex items-center justify-between text-[11px] text-white/90"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Auto-fullscreen on use:</span>
                <span className="text-white/70">
                  {isAutoFullscreenEnabled 
                    ? 'Platform expands to full screen as soon as you touch or click.' 
                    : 'Manual fullscreen only.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutoFullscreenEnabled(!isAutoFullscreenEnabled)}
                className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] transition-all ${
                  isAutoFullscreenEnabled 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {isAutoFullscreenEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
