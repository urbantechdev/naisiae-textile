import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Check, 
  X, 
  ShieldCheck, 
  Lock, 
  RotateCcw
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

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'RK';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTransactionCode(code);

    const timer1 = setTimeout(() => {
      setStage('prompted');
      appExperience.playSound('tap');

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

  useEffect(() => {
    if (!isOpen || stage !== 'prompted') return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
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
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          onClick={stage === 'success' ? () => onSuccess(transactionCode) : onCancel}
        />

        {/* Centered Modal Container - Clean Simple Light Theme */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full h-[100dvh] sm:h-auto sm:max-w-md bg-white sm:rounded-3xl border-0 sm:border border-slate-200 shadow-2xl overflow-hidden text-slate-800 z-10 flex flex-col justify-center"
        >
          {/* Top M-Pesa Brand Bar */}
          <div className="px-6 py-4 bg-[#009639] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white text-[#009639] flex items-center justify-center font-black text-sm">
                M
              </div>
              <div>
                <h3 className="font-black text-sm tracking-wide">M-Pesa Express</h3>
                <p className="text-[10px] text-emerald-100 font-medium">Safaricom Secure STK Push</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-7 space-y-6">

            {/* STAGE 1: SENDING HANDSHAKE */}
            {stage === 'sending' && (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#009639] flex items-center justify-center shadow-md animate-pulse">
                  <Smartphone size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Sending M-Pesa Prompt</h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Contacting phone <strong className="text-slate-800 font-mono">{phoneNumber || 'Customer Phone'}</strong>...
                  </p>
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  Till: 714920 · Uhuru Market
                </div>
              </div>
            )}

            {/* STAGE 2: PROMPTED ON USER PHONE (WAITING FOR PIN) */}
            {(stage === 'prompted' || stage === 'verifying') && (
              <div className="space-y-5">
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Payment Request
                    </span>
                    <span className="text-xs font-mono text-amber-600 font-bold">
                      ⏱ {countdown}s remaining
                    </span>
                  </div>

                  <div className="space-y-1 text-center py-1">
                    <p className="text-xs font-semibold text-slate-600">
                      Pay <span className="font-black text-slate-900">{formatPrice(amount)}</span> to{' '}
                      <span className="font-black text-[#009639]">NAISIAE TEXTILES</span>
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Ref: <strong className="text-slate-700">{ticketNumber}</strong>
                    </div>

                    {/* PIN Entry Display */}
                    <div className="pt-4 pb-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                        Enter M-Pesa PIN
                      </p>
                      <div className="flex justify-center gap-2">
                        {[0, 1, 2, 3].map(i => (
                          <div 
                            key={i}
                            className={`w-9 h-10 rounded-xl border flex items-center justify-center font-black text-lg transition-all ${
                              i < enteredPinDots 
                                ? 'bg-emerald-50 border-[#009639] text-[#009639]' 
                                : 'bg-white border-slate-200 text-transparent'
                            }`}
                          >
                            {i < enteredPinDots ? '●' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {stage === 'verifying' && (
                    <div className="pt-3 border-t border-slate-200 text-center flex items-center justify-center gap-2 text-xs font-bold text-amber-700">
                      <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing transaction...</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={stage === 'verifying'}
                    className="w-full py-3.5 px-5 rounded-2xl bg-[#009639] hover:bg-[#007a2f] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Lock size={15} />
                    <span>Approve & Verify PIN (Customer OK)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={stage === 'verifying'}
                    className="w-full py-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel / Reject
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
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#009639] flex items-center justify-center shadow-md">
                  <Check size={32} className="stroke-[3]" />
                </div>

                <div className="space-y-1">
                  <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider inline-block">
                    Payment Confirmed
                  </span>
                  <h3 className="text-xl font-black text-slate-900">M-Pesa Successful</h3>
                  <p className="text-xs text-slate-600 font-semibold">
                    Amount: <strong className="text-emerald-700 font-bold">{formatPrice(amount)}</strong>
                  </p>
                </div>

                <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-left">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    M-Pesa Reference Code
                  </p>
                  <p className="font-mono text-base font-black text-slate-900 tracking-wider">
                    {transactionCode}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSuccess(transactionCode)}
                  className="w-full py-3.5 rounded-2xl bg-[#08047D] hover:bg-[#050259] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
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
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <X size={32} className="stroke-[3]" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">STK Push Cancelled</h3>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Customer cancelled the PIN prompt or timeout reached.
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
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
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

          {/* Footer */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#009639]" />
              Secure M-Pesa Gateway
            </span>
            <span className="font-mono text-slate-400">Till #714920</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
