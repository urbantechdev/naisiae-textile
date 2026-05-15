import React, { useState, useEffect, useCallback, useRef } from 'react';
import { auth } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion'; // Reverted to standard 'framer-motion' matching your Navbar setup
import { Clock, AlertTriangle, LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TIMEOUT_DURATION = 120; // 2 minutes in seconds
const WARNING_THRESHOLD = 30; // 30 seconds before timeout

export function InactivityHandler({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_DURATION);
  const [showWarning, setShowWarning] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const showWarningRef = useRef(false);

  // Sync ref to avoid tearing down event listeners on state adjustments
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  const logout = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    try {
      await auth.signOut();
      setShowWarning(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setTimeLeft(TIMEOUT_DURATION);
    setShowWarning(false);

    // Set initial timeout to activate warning card
    timerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, (TIMEOUT_DURATION - WARNING_THRESHOLD) * 1000);
  }, []);

  // Structural Monitor Hook
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    let lastActivity = Date.now();
    let isAttached = false;

    const handleActivity = () => {
      const now = Date.now();
      // Throttle event checks to once per second
      if (now - lastActivity > 1000) { 
        if (!showWarningRef.current) {
          resetTimer();
        }
        lastActivity = now;
      }
    };

    const removeListeners = () => {
      if (isAttached) {
        events.forEach(event => window.removeEventListener(event, handleActivity));
        isAttached = false;
      }
    };

    const addListeners = () => {
      if (!isAttached) {
        events.forEach(event => window.addEventListener(event, handleActivity));
        isAttached = true;
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        resetTimer();
        addListeners();
      } else {
        removeListeners();
        if (timerRef.current) clearTimeout(timerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        setShowWarning(false);
      }
    });

    return () => {
      unsubscribe();
      removeListeners();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resetTimer]);

  // Dedicated Visual Countdown Processor
  useEffect(() => {
    if (showWarning) {
      setTimeLeft(WARNING_THRESHOLD);
      
      countdownRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showWarning, logout]);

  // Clean minute:second text parser mapping
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {children}
      
      <AnimatePresence>
        {showWarning && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop Layer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0A1628]/80 backdrop-blur-md"
              onClick={resetTimer} // Clicking backdrop safety feature saves progress
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 z-10"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
                  <Clock size={40} className="animate-pulse" />
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Inactivity Warning</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  You have been inactive for a while. For your security, you will be logged out automatically in:
                </p>
                
                {/* Dynamically Filtered Clock Array */}
                <div className="text-6xl font-black text-[#C8102E] mb-10 font-mono tracking-tighter tabular-nums">
                  {formatTime(timeLeft)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={resetTimer}
                    className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-900/20"
                  >
                    <RefreshCw size={16} />
                    Continue
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 px-10 py-4 flex items-center justify-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Protection Enabled</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
