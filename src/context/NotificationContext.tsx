import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';

export interface ToastNotification {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';
  title: string;
  message: string;
  duration?: number;
}

export interface PromptModalData {
  id: string;
  type: 'SUCCESS' | 'ERROR';
  title: string;
  message: string;
  duration?: number;
  onDismiss?: () => void;
}

interface NotificationContextType {
  notifications: ToastNotification[];
  notify: (notification: Omit<ToastNotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  showPromptModal: (prompt: Omit<PromptModalData, 'id'>) => void;
  closePromptModal: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Authentic Web Audio synthesizer chimes
const playSuccessChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Harmonic arpeggio: C5 -> E5 -> G5 -> C6
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.065);

      gain.gain.setValueAtTime(0.14, now + idx * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.3);

      osc.start(now + idx * 0.065);
      osc.stop(now + idx * 0.065 + 0.3);
    });
  } catch (e) {
    // quiet fallback
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
    osc.frequency.setValueAtTime(140, now + 0.1);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.start(now);
    osc.stop(now + 0.42);
  } catch (e) {
    // quiet fallback
  }
};

// ====================================================
// ANIMATED SUCCESS TICK COMPONENT
// ====================================================
export const AnimatedSuccessTick: React.FC<{ size?: number; className?: string }> = ({
  size = 46,
  className = '',
}) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Expanding Ripple Ring */}
      <div className="absolute inset-0 rounded-full bg-emerald-400/25 anim-notif-pulse-ring pointer-events-none" />

      {/* SVG Tick with drawing animation */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 52 52"
        className="relative z-10 text-emerald-600 drop-shadow-sm"
      >
        <circle
          className="anim-notif-circle-success"
          cx="26"
          cy="26"
          r="23"
          fill="none"
          stroke="#059669"
          strokeWidth="3.5"
        />
        <path
          className="anim-notif-tick-success"
          fill="none"
          stroke="#059669"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 27 L22 35 L38 18"
        />
      </svg>
    </div>
  );
};

// ====================================================
// ANIMATED ERROR CROSS / ICON COMPONENT
// ====================================================
export const AnimatedErrorCross: React.FC<{ size?: number; className?: string }> = ({
  size = 46,
  className = '',
}) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 anim-notif-error-shake ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Glowing backdrop */}
      <div className="absolute inset-0 rounded-full bg-rose-400/20 anim-notif-pulse-ring pointer-events-none" />

      {/* SVG Cross with drawing animation and shake */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 52 52"
        className="relative z-10 text-rose-600 drop-shadow-sm"
      >
        <circle
          className="anim-notif-circle-error"
          cx="26"
          cy="26"
          r="23"
          fill="none"
          stroke="#E11D48"
          strokeWidth="3.5"
        />
        <path
          className="anim-notif-cross-1"
          fill="none"
          stroke="#E11D48"
          strokeWidth="4"
          strokeLinecap="round"
          d="M17 17 L35 35"
        />
        <path
          className="anim-notif-cross-2"
          fill="none"
          stroke="#E11D48"
          strokeWidth="4"
          strokeLinecap="round"
          d="M35 17 L17 35"
        />
      </svg>
    </div>
  );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [promptModal, setPromptModal] = useState<PromptModalData | null>(null);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const closePromptModal = useCallback(() => {
    if (promptModal?.onDismiss) {
      promptModal.onDismiss();
    }
    setPromptModal(null);
  }, [promptModal]);

  const showPromptModal = useCallback(
    ({ type, title, message, duration = 2200, onDismiss }: Omit<PromptModalData, 'id'>) => {
      const id = `prompt-${Date.now()}`;
      setPromptModal({ id, type, title, message, duration, onDismiss });

      if (type === 'SUCCESS') {
        playSuccessChime();
      } else {
        playErrorBuzz();
      }

      if (duration > 0) {
        setTimeout(() => {
          setPromptModal((curr) => (curr?.id === id ? null : curr));
        }, duration);
      }
    },
    []
  );

  const notify = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastNotification, 'id'>) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newNotif: ToastNotification = { id, type, title, message, duration };

      // Trigger prominent animated prompt for SUCCESS and ERROR across the whole platform
      if (type === 'SUCCESS' || type === 'ERROR') {
        showPromptModal({
          type,
          title,
          message,
          duration: 2200,
        });
      } else if (type === 'WARNING') {
        playErrorBuzz();
      }

      setNotifications((prev) => [newNotif, ...prev.slice(0, 3)]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification, showPromptModal]
  );

  // Keyboard shortcut (Escape) to instantly dismiss prompt modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && promptModal) {
        closePromptModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [promptModal, closePromptModal]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        notify,
        removeNotification,
        showPromptModal,
        closePromptModal,
      }}
    >
      {/* Global CSS keyframes for animated tick, cross, ripple, and error shake */}
      <style>{`
        @keyframes notif-circle-draw {
          0% { stroke-dashoffset: 155; transform: scale(0.85); opacity: 0; }
          60% { opacity: 1; transform: scale(1.04); }
          100% { stroke-dashoffset: 0; transform: scale(1); opacity: 1; }
        }
        @keyframes notif-tick-draw {
          0% { stroke-dashoffset: 45; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes notif-cross-draw-1 {
          0% { stroke-dashoffset: 35; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes notif-cross-draw-2 {
          0% { stroke-dashoffset: 35; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes notif-pulse-ring {
          0% { transform: scale(0.9); opacity: 0.8; }
          70% { transform: scale(1.35); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes notif-error-shake {
          0%, 100% { transform: translateX(0); }
          15%, 45%, 75% { transform: translateX(-6px) rotate(-1deg); }
          30%, 60%, 90% { transform: translateX(6px) rotate(1deg); }
        }
        @keyframes notif-progress-deplete {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        .anim-notif-circle-success {
          stroke-dasharray: 155;
          stroke-dashoffset: 155;
          animation: notif-circle-draw 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-notif-circle-error {
          stroke-dasharray: 155;
          stroke-dashoffset: 155;
          animation: notif-circle-draw 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-notif-tick-success {
          stroke-dasharray: 45;
          stroke-dashoffset: 45;
          animation: notif-tick-draw 0.4s 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-notif-cross-1 {
          stroke-dasharray: 35;
          stroke-dashoffset: 35;
          animation: notif-cross-draw-1 0.3s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-notif-cross-2 {
          stroke-dasharray: 35;
          stroke-dashoffset: 35;
          animation: notif-cross-draw-2 0.3s 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-notif-pulse-ring {
          animation: notif-pulse-ring 1.8s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        }
        .anim-notif-error-shake {
          animation: notif-error-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>

      {children}

      {/* ==================================================== */}
      {/* TOAST NOTIFICATION PROMPT CONTAINER (TOP RIGHT/CENTER)*/}
      {/* ==================================================== */}
      <div className="fixed top-5 right-4 sm:right-6 z-[9999] flex flex-col gap-3 max-w-md w-[calc(100%-2rem)] sm:w-[420px] pointer-events-none select-none">
        {notifications.map((n) => {
          const isSuccess = n.type === 'SUCCESS';
          const isError = n.type === 'ERROR';
          const isWarning = n.type === 'WARNING';

          return (
            <div
              key={n.id}
              className={`pointer-events-auto relative w-full rounded-2xl shadow-2xl border backdrop-blur-xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
                isSuccess
                  ? 'bg-white/95 border-emerald-300 text-slate-900 shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                  : isError
                  ? 'bg-white/95 border-rose-300 text-slate-900 shadow-rose-500/10 ring-1 ring-rose-500/20'
                  : isWarning
                  ? 'bg-white/95 border-amber-300 text-slate-900 shadow-amber-500/10 ring-1 ring-amber-500/20'
                  : 'bg-white/95 border-blue-300 text-slate-900 shadow-blue-500/10 ring-1 ring-blue-500/20'
              }`}
            >
              {/* Top Accent Ribbon */}
              <div
                className={`h-1.5 w-full ${
                  isSuccess
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : isError
                    ? 'bg-gradient-to-r from-rose-500 to-red-400'
                    : isWarning
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-400'
                }`}
              />

              <div className="p-4 flex items-start space-x-3.5">
                {/* ANIMATED ICON PROMPT */}
                {isSuccess && <AnimatedSuccessTick size={42} />}
                {isError && <AnimatedErrorCross size={42} />}
                {isWarning && (
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                  </div>
                )}
                {!isSuccess && !isError && !isWarning && (
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                    <Info className="w-5 h-5 animate-pulse" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isSuccess
                          ? 'bg-emerald-100 text-emerald-800'
                          : isError
                          ? 'bg-rose-100 text-rose-800'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {n.type}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 tracking-tight truncate">
                      {n.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                    {n.message}
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => removeNotification(n.id)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Depleting progress bar */}
              {n.duration && n.duration > 0 && (
                <div className="h-0.5 bg-slate-100 w-full overflow-hidden">
                  <div
                    className={`h-full ${
                      isSuccess
                        ? 'bg-emerald-500'
                        : isError
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                    style={{
                      animation: `notif-progress-deplete ${n.duration}ms linear forwards`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ==================================================== */}
      {/* OPTIONAL CENTER-SCREEN PROMPT HUD / MODAL            */}
      {/* ==================================================== */}
      {promptModal && (
        <div
          onClick={closePromptModal}
          className="fixed inset-0 z-[10000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-150 space-y-3.5 relative overflow-hidden cursor-default"
          >
            {/* Top Accent Ribbon */}
            <div
              className={`absolute top-0 inset-x-0 h-1.5 ${
                promptModal.type === 'SUCCESS'
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500'
                  : 'bg-gradient-to-r from-rose-500 via-red-400 to-rose-500'
              }`}
            />

            <div className="flex justify-center pt-2">
              {promptModal.type === 'SUCCESS' ? (
                <AnimatedSuccessTick size={74} />
              ) : (
                <AnimatedErrorCross size={74} />
              )}
            </div>

            <div>
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                  promptModal.type === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {promptModal.type === 'SUCCESS' ? 'Action Completed' : 'Operation Failed'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-2">
                {promptModal.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                {promptModal.message}
              </p>
            </div>

            {/* Depleting timer bar */}
            {promptModal.duration && promptModal.duration > 0 && (
              <div className="h-1 bg-slate-100 w-full rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    promptModal.type === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{
                    animation: `notif-progress-deplete ${promptModal.duration}ms linear forwards`,
                  }}
                />
              </div>
            )}

            <button
              onClick={closePromptModal}
              className={`w-full py-2.5 px-4 rounded-xl text-white font-black text-xs shadow-md transition-all active:scale-98 ${
                promptModal.type === 'SUCCESS'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
