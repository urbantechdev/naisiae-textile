import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { appExperience } from '../utils/haptics';

export function MobileInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed or already running standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      return;
    }

    const dismissed = localStorage.getItem('naisiae_pwa_install_dismissed_v2');
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 1000 * 60 * 60 * 24 * 3) {
      // Dismissed within last 3 days
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show subtle banner after a brief 3s engagement delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isAppleDevice && !isStandalone) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    appExperience.triggerFeedback('tap');
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      setShowIOSGuide(true);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    appExperience.triggerFeedback('pop');
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('naisiae_pwa_install_dismissed_v2', Date.now().toString());
  };

  return (
    <>
      {/* Floating Pill Banner on Mobile */}
      <AnimatePresence>
        {showPrompt && !showIOSGuide && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="lg:hidden fixed bottom-20 left-3 right-3 z-[110] max-w-md mx-auto"
          >
            <div className="bg-[#08047D] text-white p-3.5 rounded-2xl shadow-2xl border border-[#FA9411]/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FA9411] text-white flex items-center justify-center font-black text-xs shadow-md shrink-0">
                  <Smartphone size={20} />
                </div>
                <div>
                  <div className="font-black text-xs flex items-center gap-1.5">
                    <span>Install Naisiae Mobile App</span>
                  </div>
                  <div className="text-[10.5px] text-blue-200 leading-tight mt-0.5">
                    1-Tap Home Screen · Fast Offline POS
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 rounded-xl bg-[#FA9411] hover:bg-[#E08208] text-white font-black text-xs uppercase tracking-wider shadow-sm active:scale-95 transition-transform"
                >
                  Install
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Instructions Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSGuide(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#08047D] text-white flex items-center justify-center">
                    <Smartphone size={16} />
                  </div>
                  <h3 className="font-black text-sm text-[#08047D]">Add to iPhone Home Screen</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full bg-slate-100 text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-[#08047D] text-white flex items-center justify-center text-xs font-black shrink-0">1</span>
                  <div>
                    Tap the <strong>Share</strong> button at the bottom of Safari:
                    <div className="inline-flex items-center gap-1 ml-1 text-[#08047D] font-bold">
                      <Share size={14} />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-[#08047D] text-white flex items-center justify-center text-xs font-black shrink-0">2</span>
                  <div>
                    Scroll down and select <strong>'Add to Home Screen'</strong>:
                    <div className="inline-flex items-center gap-1 ml-1 text-[#08047D] font-bold">
                      <PlusSquare size={14} />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-[#08047D] text-white flex items-center justify-center text-xs font-black shrink-0">3</span>
                  <div>
                    Tap <strong>'Add'</strong> in the top-right corner to launch Naisiae POS full-screen!
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-3 rounded-xl bg-[#08047D] text-white font-bold text-xs uppercase tracking-wider"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
