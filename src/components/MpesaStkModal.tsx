import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Copy,
  Zap,
  Clock,
  Sparkles,
  Edit2
} from 'lucide-react';

interface MpesaStkModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  accountReference?: string;
  onSuccess: (mpesaCode: string, autoFinalize?: boolean) => void;
}

type StkStep = 'PHONE_PROMPT' | 'SUCCESS' | 'ERROR';

type ErrorReason =
  | 'CANCELLED'
  | 'WRONG_PIN'
  | 'INSUFFICIENT_FUNDS'
  | 'TIMEOUT'
  | 'PHONE_UNREACHABLE';

const ERROR_DETAILS: Record<ErrorReason, { title: string; code: string; message: string }> = {
  CANCELLED: {
    title: 'Transaction Cancelled by User',
    code: '1032 (Request Cancelled)',
    message: 'The customer cancelled or pressed cancel on their phone screen.',
  },
  WRONG_PIN: {
    title: 'Authentication Failed',
    code: '2001 (Invalid PIN)',
    message: 'The customer entered an incorrect 4-digit M-PESA PIN.',
  },
  INSUFFICIENT_FUNDS: {
    title: 'Insufficient Balance',
    code: '1 (Insufficient Funds)',
    message: 'The customer M-PESA balance is lower than the payable amount.',
  },
  TIMEOUT: {
    title: 'Request Timed Out',
    code: '1037 (DS_TIMEOUT)',
    message: 'The STK push prompt expired without response from the customer phone.',
  },
  PHONE_UNREACHABLE: {
    title: 'Phone Unreachable / Offline',
    code: '1036 (Subscriber Offline)',
    message: 'The customer phone is switched off or outside network coverage.',
  },
};

// Authentic Audio chime synthesizers
const playSuccessChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Harmonic Safaricom success arpeggio: C5 -> E5 -> G5 -> C6
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  } catch (e) {
    // quiet audio fallback
  }
};

const playErrorBuzz = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(140, now + 0.12);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (e) {
    // quiet audio fallback
  }
};

export const MpesaStkModal: React.FC<MpesaStkModalProps> = ({
  isOpen,
  onClose,
  amount,
  customerName = 'Walk-In Customer',
  customerPhone = '0712345678',
  accountReference = 'NAISIAE-POS',
  onSuccess,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(customerPhone || '0712345678');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [step, setStep] = useState<StkStep>('PHONE_PROMPT');
  const [pinDigits, setPinDigits] = useState<string>('');
  const [selectedError, setSelectedError] = useState<ErrorReason>('CANCELLED');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [autoApproved, setAutoApproved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(customerPhone || '0712345678');
      setIsEditingPhone(false);
      setStep('PHONE_PROMPT');
      setPinDigits('');
      setGeneratedCode('');
      setCopiedCode(false);
      setAutoApproved(false);
    }
  }, [isOpen, customerPhone]);

  if (!isOpen) return null;

  // Format phone number for Safaricom display format (+254 7XX XXX XXX)
  const formatSafaricomPhone = (raw: string) => {
    let clean = raw.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '254' + clean.slice(1);
    if (clean.startsWith('7') || clean.startsWith('1')) clean = '254' + clean;
    if (!clean) return '+254 712 345 678';
    return `+${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  };

  const triggerSuccess = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'TK';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCode(code);
    setStep('SUCCESS');
    playSuccessChime();
  };

  const triggerError = (reason: ErrorReason = 'CANCELLED') => {
    setSelectedError(reason);
    setStep('ERROR');
    playErrorBuzz();
  };

  const handleKeypadPress = (val: string) => {
    if (pinDigits.length < 4) {
      const next = pinDigits + val;
      setPinDigits(next);
      if (next.length === 4) {
        setTimeout(() => {
          triggerSuccess();
        }, 250);
      }
    }
  };

  const handleKeypadBackspace = () => {
    setPinDigits((prev) => prev.slice(0, -1));
  };

  const handleCompleteSale = () => {
    onSuccess(generatedCode, true);
    onClose();
  };

  const handleApplyCodeOnly = () => {
    onSuccess(generatedCode, false);
    onClose();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const nowFormatted = new Date().toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      {/* High-fidelity CSS Animations for SVG circle & tick drawing and error shake */}
      <style>{`
        @keyframes stk-circle-draw {
          0% { stroke-dashoffset: 280; transform: scale(0.85); opacity: 0; }
          60% { opacity: 1; transform: scale(1.04); }
          100% { stroke-dashoffset: 0; transform: scale(1); opacity: 1; }
        }
        @keyframes stk-tick-draw {
          0% { stroke-dashoffset: 80; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes stk-pulse-ring {
          0% { transform: scale(0.9); opacity: 0.8; }
          70% { transform: scale(1.35); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes stk-error-shake {
          0%, 100% { transform: translateX(0); }
          15%, 45%, 75% { transform: translateX(-8px) rotate(-1deg); }
          30%, 60%, 90% { transform: translateX(8px) rotate(1deg); }
        }
        @keyframes stk-cross-draw {
          0% { stroke-dashoffset: 60; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        .anim-circle-success {
          stroke-dasharray: 280;
          stroke-dashoffset: 280;
          animation: stk-circle-draw 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-tick-success {
          stroke-dasharray: 80;
          stroke-dashoffset: 80;
          animation: stk-tick-draw 0.45s 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-pulse-ring {
          animation: stk-pulse-ring 1.8s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        }
        .anim-error-shake {
          animation: stk-error-shake 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        .anim-cross-draw {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: stk-cross-draw 0.4s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Safaricom M-Pesa Branded Header */}
        <div className="bg-[#00A859] px-5 py-3 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-[#00A859] flex items-center justify-center font-black text-sm shadow-xs">
              M
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-sm tracking-tight">M-PESA Express</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-black/20 text-white">
                  STK Push
                </span>
              </div>
              <p className="text-[10px] text-white/90 font-medium">
                Till 4082211 • NAISIAE TEXTILES LTD
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Ribbon & Recipient Info */}
        <div className="bg-slate-50 border-b border-slate-200/90 px-5 py-2.5 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
              Payable Amount
            </span>
            <div className="font-black text-xl text-[#030A91] tracking-tight">
              KES {amount.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
              Account Ref
            </span>
            <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
              {accountReference}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* ==================================================== */}
          {/* LIVE PHONE STK PROMPT (NO COMPLICATED PRE-STEPS)     */}
          {/* ==================================================== */}
          {step === 'PHONE_PROMPT' && (
            <div className="space-y-3.5">
              {/* Phone target indicator bar */}
              <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
                <div className="flex items-center space-x-2 truncate">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="text-[11px] text-slate-600 font-medium">STK Prompt on:</span>
                  {isEditingPhone ? (
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="px-2 py-0.5 bg-white border border-emerald-300 rounded font-mono font-bold text-xs w-32"
                      placeholder="0712345678"
                    />
                  ) : (
                    <strong className="font-mono font-bold text-slate-900">
                      {formatSafaricomPhone(phoneNumber)}
                    </strong>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingPhone(!isEditingPhone)}
                  className="text-[10px] font-bold text-[#00A859] hover:underline flex items-center ml-2 shrink-0"
                >
                  <Edit2 className="w-3 h-3 mr-0.5" />
                  <span>{isEditingPhone ? 'Done' : 'Change'}</span>
                </button>
              </div>

              {/* Realistic Safaricom STK Push Phone Dialog */}
              <div className="bg-slate-900 p-4 rounded-3xl shadow-xl text-white border-4 border-slate-800 space-y-3 relative overflow-hidden">
                <div className="w-14 h-1 rounded-full bg-slate-700 mx-auto -mt-1 mb-2" />

                {/* SIM Toolkit Modal inside phone screen */}
                <div className="bg-white text-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-200 space-y-3 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-100">
                    <div className="w-5 h-5 rounded-md bg-[#00A859] text-white flex items-center justify-center font-black text-[10px]">
                      M
                    </div>
                    <span className="font-black text-xs text-[#00A859]">SIM Toolkit • M-PESA</span>
                  </div>

                  <p className="text-xs font-semibold leading-relaxed text-slate-800">
                    Do you want to pay <strong className="text-slate-950 font-black">KES {amount.toLocaleString()}</strong> to{' '}
                    <strong className="text-[#030A91]">NAISIAE TEXTILES LTD</strong> for Account{' '}
                    <strong>{accountReference}</strong>?
                  </p>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Enter 4-Digit M-PESA PIN:
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {pinDigits.length}/4
                      </span>
                    </div>
                    <div className="flex items-center justify-center space-x-3 py-2.5 bg-slate-100 rounded-xl border border-slate-200">
                      {[0, 1, 2, 3].map((idx) => (
                        <div
                          key={idx}
                          className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                            pinDigits.length > idx
                              ? 'bg-slate-900 scale-125'
                              : 'border-2 border-slate-300 bg-white'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Immediate Action Buttons inside phone dialog */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => triggerError('CANCELLED')}
                      className="py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={triggerSuccess}
                      className="py-2 rounded-xl bg-[#00A859] hover:bg-emerald-700 text-white text-xs font-black transition-colors shadow-sm flex items-center justify-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Send PIN</span>
                    </button>
                  </div>
                </div>

                {/* Numeric Keypad Simulation */}
                <div className="grid grid-cols-3 gap-1.5 pt-1 text-slate-200">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      className="py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 font-bold text-sm transition-colors text-center"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setPinDigits('1234');
                      setTimeout(triggerSuccess, 200);
                    }}
                    className="py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-[10px] font-bold text-amber-400 transition-colors flex items-center justify-center"
                    title="Fill 4 digits instantly"
                  >
                    1234
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 font-bold text-sm transition-colors text-center"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    className="py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors flex items-center justify-center"
                  >
                    ⌫
                  </button>
                </div>
              </div>

              {/* 1-CLICK QUICK APPROVE BUTTON (EASY & UNCOMPLICATED!) */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={triggerSuccess}
                  className="w-full py-3 px-4 rounded-xl bg-[#00A859] hover:bg-emerald-700 active:scale-98 text-white font-black text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#FACB00]" />
                  <span>⚡ 1-Click Approve (STK Success Tick)</span>
                </button>

                {/* Simulate Error / Failures Bar */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Test Failures:
                  </span>
                  <div className="flex space-x-1.5">
                    <button
                      type="button"
                      onClick={() => triggerError('CANCELLED')}
                      className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-200 transition-colors"
                    >
                      User Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerError('WRONG_PIN')}
                      className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-200 transition-colors"
                    >
                      Wrong PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerError('INSUFFICIENT_FUNDS')}
                      className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] border border-amber-200 transition-colors"
                    >
                      Low Balance
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* ANIMATED SUCCESS TICK & CONFIRMATION                 */}
          {/* ==================================================== */}
          {step === 'SUCCESS' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Animated Success Tick Display */}
              <div className="flex flex-col items-center justify-center pt-2">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  {/* Subtle Expanding Green Ring */}
                  <div className="absolute inset-0 rounded-full bg-emerald-400/25 anim-pulse-ring" />
                  {/* Glowing backdrop */}
                  <div className="absolute w-20 h-20 rounded-full bg-emerald-50" />

                  {/* SVG Animated Tick */}
                  <svg className="w-20 h-20 text-[#00A859] relative z-10" viewBox="0 0 100 100">
                    <circle
                      className="anim-circle-success"
                      cx="50"
                      cy="50"
                      r="43"
                      fill="none"
                      stroke="#00A859"
                      strokeWidth="6"
                    />
                    <path
                      className="anim-tick-success"
                      fill="none"
                      stroke="#00A859"
                      strokeWidth="6.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M28 51 L43 66 L73 34"
                    />
                  </svg>
                </div>

                <div className="text-center mt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00A859] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Payment Received
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    KES {amount.toLocaleString()} Confirmed
                  </h3>
                  <p className="text-xs text-slate-500">
                    Safaricom M-PESA STK authorization successful
                  </p>
                </div>
              </div>

              {/* Authentic Safaricom SMS Confirmation Slip */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white font-mono text-[11px] leading-relaxed shadow-md border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-emerald-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  <span className="flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#00A859]" />
                    M-PESA Notification
                  </span>
                  <span>{nowFormatted}</span>
                </div>

                <p className="text-slate-200">
                  <strong className="text-[#FACB00]">{generatedCode}</strong> Confirmed. Ksh{amount.toLocaleString()}.00 sent to{' '}
                  <strong>NAISIAE TEXTILES LTD</strong> (Till 4082211) on {nowFormatted}. Transaction cost, Ksh0.00.
                </p>

                <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Ref Code:</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-[#FACB00] text-xs">{generatedCode}</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-1 hover:text-[#FACB00] transition-colors"
                      title="Copy M-PESA Code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct 1-Click Action: Finish Sale & View Receipt */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={handleCompleteSale}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#00A859] hover:bg-emerald-700 active:scale-98 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <span>✓ Complete Sale & Open Receipt</span>
                  <ArrowRight className="w-4 h-4 text-[#FACB00]" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleApplyCodeOnly}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    Apply Code Only
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('PHONE_PROMPT');
                      setPinDigits('');
                    }}
                    className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#030A91] text-xs font-bold transition-colors"
                  >
                    Test Another Prompt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* ANIMATED ERROR PROMPT (SHAKE & CROSS)                */}
          {/* ==================================================== */}
          {step === 'ERROR' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Animated Error Cross Display with Shake Vibration */}
              <div className="flex flex-col items-center justify-center pt-2">
                <div className="relative w-24 h-24 flex items-center justify-center anim-error-shake">
                  {/* Glowing Rose backdrop */}
                  <div className="absolute w-20 h-20 rounded-full bg-rose-50" />

                  {/* SVG Animated Error Cross */}
                  <svg className="w-20 h-20 text-rose-600 relative z-10" viewBox="0 0 100 100">
                    <circle
                      className="anim-circle-success"
                      style={{ stroke: '#E11D48' }}
                      cx="50"
                      cy="50"
                      r="43"
                      fill="none"
                      stroke="#E11D48"
                      strokeWidth="6"
                    />
                    <path
                      className="anim-cross-draw"
                      fill="none"
                      stroke="#E11D48"
                      strokeWidth="6.5"
                      strokeLinecap="round"
                      d="M34 34 L66 66"
                    />
                    <path
                      className="anim-cross-draw"
                      fill="none"
                      stroke="#E11D48"
                      strokeWidth="6.5"
                      strokeLinecap="round"
                      d="M66 34 L34 66"
                    />
                  </svg>
                </div>

                <div className="text-center mt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    Payment Failed
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {ERROR_DETAILS[selectedError].title}
                  </h3>
                  <p className="text-xs text-rose-600 font-mono font-bold mt-0.5">
                    {ERROR_DETAILS[selectedError].code}
                  </p>
                </div>
              </div>

              {/* Error Explanation Card */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center space-x-1.5 font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Safaricom M-PESA Response</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {ERROR_DETAILS[selectedError].message}
                </p>
              </div>

              {/* Error Scenario Selector for testing */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Select Alternative Error Scenario to Test:
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  {(['CANCELLED', 'WRONG_PIN', 'INSUFFICIENT_FUNDS', 'TIMEOUT', 'PHONE_UNREACHABLE'] as ErrorReason[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => triggerError(r)}
                      className={`px-2.5 py-1.5 rounded-xl font-bold text-left transition-colors truncate ${
                        selectedError === r
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {r.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Retry & Fallback Actions */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('PHONE_PROMPT');
                    setPinDigits('');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#00A859] hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry STK Push Prompt</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={triggerSuccess}
                    className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#030A91] text-xs font-bold border border-blue-200 transition-colors"
                  >
                    Simulate Success
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    Close Dialog
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
