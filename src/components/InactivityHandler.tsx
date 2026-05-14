import React, { useState, useEffect, useCallback, useRef } from 'react';
import { auth } from '../services/firebase';
import { motion, AnimatePresence } from 'motion/react';
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

  const logout = useCallback(async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [navigate]);

  const resetTimer = useCallback(() => {
    setTimeLeft(TIMEOUT_DURATION);
    setShowWarning(false);
    
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Initial timeout to show warning
    timerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, (TIMEOUT_DURATION - WARNING_THRESHOLD) * 1000);
  }, []);

  useEffect(() => {
    // Only monitor if logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        resetTimer();
        
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        let lastActivity = Date.now();
        const handleActivity = () => {
          const now = Date.now();
          if (now - lastActivity > 1000) { // Throttle to once per second
            if (!showWarning) resetTimer();
            lastActivity = now;
          }
        };

        events.forEach(event => window.addEventListener(event, handleActivity));
        
        return () => {
          events.forEach(event => window.removeEventListener(event, handleActivity));
          if (timerRef.current) clearTimeout(timerRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
        };
      }
    });

    return () => unsubscribe();
  }, [resetTimer, showWarning]);

  useEffect(() => {
    if (showWarning) {
      setTimeLeft(WARNING_THRESHOLD);
      
      countdownRef.current = setInterval(() => {
        setTimeLeft(prev => {
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

  return (
    <>
      {children}
      
      <AnimatePresence>
        {showWarning && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0A1628]/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500 animate-pulse">
                  <Clock size={40} />
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Inactivity Warning</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  You have been inactive for a while. For your security, you will be logged out automatically in:
                </p>
                
                <div className="text-6xl font-black text-[#C8102E] mb-10 font-mono tracking-tighter">
                  00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
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
