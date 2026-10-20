import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Check, 
  X, 
  Send, 
  ShieldCheck, 
  Lock, 
  Wifi, 
  Battery, 
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { appExperience } from '../../utils/haptics';
import { useLocalization } from '../../context/LocalizationContext';

export interface AnimateStkPushModalProps {
  isOpen: boolean;
  phoneNumber: string;
  amount: number;
  ticketNumber?: string;
  onSuccess: (transactionCode: string) => void;
  onCancel: () => void;
}

export function AnimateStkPushModal({
  isOpen,
  phoneNumber,
  amount,
  ticketNumber = `TK-${Date.now().toString().slice(-4)}`,
  onSuccess,
  onCancel
}: AnimateStkPushModalProps) {
  const { formatPrice } = useLocalization();
  const [stage, setStage] = useState<'sending' | 'prompted' | 'verifying' | 'success' | 'failed'>('sending');
  const [countdown, setCountdown] = useState<number>(15);
  const [enteredPinDots, setEnteredPinDots] = useState<number>(0);
  const [transactionCode, setTransactionCode] = useState<string>('');

  // Reset & start sequence when modal opens
  useEffect(() => {
    if (!isOpen) {
      setStage('sending');
      setCountdown(15);
      setEnteredPinDots(0);
      setTransactionCode('');
      return;
    }

    appExperience.triggerFeedback('tap');
    setStage('sending');
    setCountdown(15);
    setEnteredPinDots(0);

    // Generate random realistic Safaricom transaction reference
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'RK';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTransactionCode(code);

    // Step 1: Sending -> Prompted (1.2s)
    const timer1 = setTimeout(() => {
      setStage('prompted');
      appExperience.playSound('tap');

      // Animate simulated PIN entry dots
      const dot1 = setTimeout(() => setEnteredPinDots(1), 800);
      const dot2 = setTimeout(() => setEnteredPinDots(2), 1500);
      const dot3 = setTimeout(() => setEnteredPinDots(3), 2200);
      const dot4 = setTimeout(() => setEnteredPinDots(4), 2900);

      return () => {
        clearTimeout(dot1);
        clearTimeout(dot2);
        clearTimeout(dot3);
        clearTimeout(dot4);
      };
    }, 1200);

    return () => {
      clearTimeout(timer1);
    };
  }, [isOpen]);

  // Countdown timer while waiting for PIN
  useEffect(() => {
    if (!isOpen || stage !== 'prompted') return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto approve on timeout or finish
          handleApprove();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, stage]);

  const handleApprove = () => {
    if (stage === 'success') return;
    setStage('verifying');
    appExperience.triggerFeedback('tap');

    setTimeout(() => {
      setStage('success');
      appExperience.triggerFeedback('success');
      appExperience.playSound('success');

      setTimeout(() => {
        onSuccess(transactionCode);
      }, 1600);
    }, 1000);
  };

  const handleReject = () => {
    setStage('failed');
    appExperience.triggerFeedback('pop');
    appExperience.playSound('pop');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          onClick={stage === 'success' ? () => onSuccess(transactionCode) : onCancel}
        />

        {/* Centered Modal Container */}
        <motion.div
          initial={{ scale: 0.82, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-[#070b14] border border-emerald-500/30 rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,150,57,0.25)] overflow-hidden text-white my-auto z-10"
        >
          {/* Top Decorative Glow */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#009639] to-emerald-400" />
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all z-20 cursor-pointer"
          >
            <X size={16} />
          </button>

          {/* Phone Simulated Status Bar */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-white/5">
            <span className="font-bold flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Safaricom 5G
            </span>
            <div className="flex items-center gap-3">
              <Wifi size={13} className="text-slate-300" />
              <div className="flex items-center gap-1">
                <span className="text-[10px]">98%</span>
                <Battery size={13} className="text-emerald-400 fill-emerald-400" />
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-7 space-y-6">

            {/* STAGE 1: SENDING HANDSHAKE */}
            {stage === 'sending' && (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-5">
                <div className="relative">
                  {/* Radiating wave rings */}
                  <motion.div 
                    animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                    className="absolute -inset-4 rounded-full border-2 border-emerald-400/60"
                  />
                  <motion.div 
                    animate={{ scale: [1, 2.3], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.4, ease: 'easeOut' }}
                    className="absolute -inset-6 rounded-full border-2 border-emerald-400/30"
                  />
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#009639] to-emerald-700 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 relative z-10">
                    <Smartphone size={36} className="animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest inline-block">
                    Pushing SIM Toolkit Prompt
                  </span>
                  <h3 className="text-xl font-black text-white">Contacting M-Pesa Gateway</h3>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    Triggering encrypted payment prompt to{' '}
                    <span className="text-emerald-300 font-bold font-mono">{phoneNumber || 'Customer Phone'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-[#009639] animate-pulse" />
                  <span>Uhuru Market Till: 714920</span>
                </div>
              </div>
            )}

            {/* STAGE 2: PROMPTED ON USER PHONE (WAITING FOR PIN) */}
            {(stage === 'prompted' || stage === 'verifying') && (
              <div className="space-y-5">
                {/* Simulated Phone Screen Prompt Box */}
                <div className="bg-slate-950 rounded-2xl border-2 border-emerald-500/40 p-5 shadow-2xl relative overflow-hidden">
                  {/* Safaricom Header Strip */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#009639] flex items-center justify-center text-white font-black text-[10px]">
                        M
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                        SIM Toolkit Prompt
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold animate-pulse">
                      ⏱ {countdown}s
                    </span>
                  </div>

                  {/* Transaction Details */}
                  <div className="space-y-2 text-center py-2">
                    <p className="text-[11px] font-medium text-slate-300 leading-snug">
                      Do you want to pay <span className="font-black text-white">{formatPrice(amount)}</span> to{' '}
                      <span className="font-black text-emerald-300">NAISIAE TEXTILES LTD</span>?
                    </p>
                    <div className="text-[10px] font-mono text-slate-400">
                      Till / Store: <strong className="text-white">714920</strong> · Ref: <strong className="text-white">{ticketNumber}</strong>
                    </div>

                    {/* PIN Entry Display */}
                    <div className="pt-3 pb-1">
                      <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 mb-2">
                        Enter M-PESA PIN
                      </p>
                      <div className="flex justify-center gap-2.5">
                        {[0, 1, 2, 3].map(i => (
                          <div 
                            key={i}
                            className={`w-9 h-10 rounded-xl border-2 flex items-center justify-center font-black text-lg transition-all ${
                              i < enteredPinDots 
                                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]' 
                                : 'bg-white/5 border-white/15 text-transparent'
                            }`}
                          >
                            {i < enteredPinDots ? '●' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {stage === 'verifying' && (
                    <div className="mt-3 pt-3 border-t border-white/10 text-center flex items-center justify-center gap-2 text-xs font-bold text-amber-300 animate-pulse">
                      <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing transaction with Safaricom...</span>
                    </div>
                  )}
                </div>

                {/* Cashier / Customer Control Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={stage === 'verifying'}
                    className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#009639] to-emerald-600 hover:from-[#007a2f] hover:to-emerald-500 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Lock size={15} />
                    <span>Approve & Verify PIN (Customer OK)</span>
                    <ArrowRight size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={stage === 'verifying'}
                    className="w-full py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/5 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Simulate Customer Cancel / Reject
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3: SUCCESS CONFIRMATION */}
            {stage === 'success' && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-4 flex flex-col items-center justify-center text-center space-y-4"
              >
                {/* Animated Tick with Expanding Ring */}
                <div className="relative">
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [1, 1.4, 1.2], opacity: [0.8, 0.3, 0] }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="absolute -inset-4 rounded-full bg-emerald-500/40"
                  />
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-[#009639] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/50 relative z-10"
                  >
                    <Check size={40} className="stroke-[3.5]" />
                  </motion.div>
                </div>

                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest inline-block border border-emerald-500/30">
                    Payment Verified ✓
                  </span>
                  <h3 className="text-2xl font-black text-white">M-Pesa Express Confirmed</h3>
                  <p className="text-xs text-slate-300 font-semibold">
                    Amount received: <strong className="text-emerald-400 font-bold">{formatPrice(amount)}</strong>
                  </p>
                </div>

                {/* Receipt Code Box */}
                <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    M-Pesa Transaction Reference Code
                  </p>
                  <p className="font-mono text-lg font-black text-emerald-400 tracking-wider">
                    {transactionCode}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Receipt SMS generated and queued for printing
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSuccess(transactionCode)}
                  className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-[#08047D] font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                >
                  Continue to Order Ticket
                </button>
              </motion.div>
            )}

            {/* STAGE 4: FAILED / REJECTED */}
            {stage === 'failed' && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-4 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-xl shadow-red-500/20">
                  <X size={38} className="stroke-[3]" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">STK Push Cancelled</h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Customer cancelled the PIN prompt or timeout reached. No funds were deducted.
                  </p>
                </div>

                <div className="flex gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStage('sending');
                      setCountdown(15);
                      setEnteredPinDots(0);
                      setTimeout(() => setStage('prompted'), 1000);
                    }}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Try Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}

          </div>

          {/* Footer Branding */}
          <div className="px-6 py-3.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" />
              Safaricom Daraja API Verified
            </span>
            <span className="font-mono text-slate-500">Till #714920</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
