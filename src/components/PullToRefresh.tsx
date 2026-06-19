import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { appExperience } from '../utils/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 85; // Distance in pixels required to trigger refresh
  const MAX_PULL = 130;       // Max visual pull distance

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only initiate pull-to-refresh if we are scrolled to the very top
      if (window.scrollY === 0 && !isRefreshing) {
        startY.current = e.touches[0].pageY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      currentY.current = e.touches[0].pageY;
      const diff = currentY.current - startY.current;

      // Only handle downward pulls
      if (diff > 0) {
        // Apply resistance curve
        const pull = Math.min(MAX_PULL, diff * 0.45);
        setPullDistance(pull);

        // Buzz lightly when hitting the threshold the first time
        if (pull >= PULL_THRESHOLD && pullDistance < PULL_THRESHOLD) {
          appExperience.triggerHaptic('light');
        }

        // Prevent browser elastic scrolling behaviour
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      setIsPulling(false);

      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(PULL_THRESHOLD);
        
        // Tactile signal that refresh is committed
        appExperience.triggerFeedback('pop');

        try {
          await onRefresh();
          // Success haptic tune
          appExperience.triggerFeedback('success');
        } catch (err) {
          console.error(err);
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        // Snap back to 0
        setPullDistance(0);
      }
    };

    const setupListeners = () => {
      const container = contentRef.current;
      if (!container) return;

      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    };

    setupListeners();

    return () => {
      const container = contentRef.current;
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [pullDistance, isPulling, isRefreshing, onRefresh]);

  const rotation = (pullDistance / PULL_THRESHOLD) * 360;
  const progressPercent = Math.min(100, (pullDistance / PULL_THRESHOLD) * 100);

  return (
    <div ref={contentRef} className="relative overflow-visible min-h-screen">
      {/* App pull-refresh track indicator */}
      <div 
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-50 transition-all duration-75"
        style={{
          top: `${pullDistance - 45}px`,
          opacity: pullDistance > 15 ? 1 : 0
        }}
      >
        <div className="bg-[#0E121C] border border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.5)] p-2.5 rounded-full flex items-center justify-center w-11 h-11">
          {isRefreshing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              className="text-[#C8961A]"
            >
              <RefreshCw size={18} />
            </motion.div>
          ) : (
            <div 
              style={{ transform: `rotate(${rotation}deg)` }}
              className={`transition-colors ${progressPercent >= 100 ? 'text-[#C8102E]' : 'text-[#C8961A]'}`}
            >
              <RefreshCw size={18} style={{ opacity: Math.max(0.3, progressPercent / 100) }} />
            </div>
          )}
        </div>
      </div>

      {/* Slide down the page content as pull occurs */}
      <div 
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.55}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 300ms cubic-bezier(0.23, 1, 0.32, 1)'
        }}
        className="w-full"
      >
        {children}
      </div>
    </div>
  );
}
