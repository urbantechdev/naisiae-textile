import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScrollSection {
  id: string;
  label: string;
}

interface ProductScrollNavigatorProps {
  sections?: ScrollSection[];
}

export function ProductScrollNavigator({ sections = [] }: ProductScrollNavigatorProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }

      if (window.scrollY > 150) {
        setVisible(true);
      } else {
        setVisible(false);
      }

      if (sections.length > 0) {
        let currentActive = '';
        for (const section of sections) {
          const el = document.getElementById(section.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.3) {
              currentActive = section.id;
              break;
            }
          }
        }
        if (currentActive) {
          setActiveSection(currentActive);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToNext = () => {
    if (sections.length === 0) {
      window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' });
      return;
    }

    let targetEl: HTMLElement | null = null;
    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top > 20) {
          targetEl = el;
          break;
        }
      }
    }

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  const scrollToPrev = () => {
    if (sections.length === 0) {
      window.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'smooth' });
      return;
    }

    let targetEl: HTMLElement | null = null;
    const reversedSections = [...sections].reverse();
    for (const section of reversedSections) {
      const el = document.getElementById(section.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < -20) {
          targetEl = el;
          break;
        }
      }
    }

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSectionClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="product-scroll-navigator-widget"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="fixed right-4 md:right-8 bottom-24 z-50 flex flex-col items-center gap-3 bg-[#0E121C]/95 backdrop-blur-md border border-[#C8961A]/30 p-2 md:p-3 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
        >
          {/* Circular Scroll Progress */}
          <div className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center" id="scroll-progress-indicator">
            <svg className="absolute w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="38%"
                className="stroke-white/10"
                strokeWidth="1.5"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r="38%"
                className="stroke-[#C8961A]"
                strokeWidth="2.5"
                fill="transparent"
                strokeDasharray="100"
                strokeDashoffset={100 - scrollProgress}
              />
            </svg>
            <Compass size={14} className="text-[#C8961A] animate-pulse" />
          </div>

          {/* Up & Down Scroll Action Controls */}
          <div className="flex flex-col gap-1 w-full border-t border-b border-white/10 py-1.5" id="scroll-action-controls">
            <button
              onClick={scrollToPrev}
              id="scroll-action-up"
              title="Scroll Up"
              className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-[#C8961A] hover:bg-[#C8961A]/10 active:scale-90 transition-all cursor-pointer"
            >
              <ChevronUp size={18} />
            </button>
            <button
              onClick={scrollToNext}
              id="scroll-action-down"
              title="Scroll Down"
              className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-[#C8961A] hover:bg-[#C8961A]/10 active:scale-90 transition-all cursor-pointer"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Section markers (only displays on desktop for cleaner UI) */}
          {sections.length > 0 && (
            <div className="hidden md:flex flex-col gap-2 px-1 py-1" id="scroll-section-dots">
              {sections.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    id={`scroll-to-${sec.id}`}
                    onClick={() => handleSectionClick(sec.id)}
                    title={sec.label}
                    className="group relative flex items-center justify-center w-6 h-6 cursor-pointer"
                  >
                    {/* Hover text label */}
                    <span className="absolute right-9 bg-[#0E121C] border border-[#C8961A]/30 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl pointer-events-none whitespace-nowrap">
                      {sec.label}
                    </span>

                    {/* Target bubble */}
                    <span
                      className={`rounded-full transition-all duration-300 ${
                        isActive
                          ? 'w-2.5 h-2.5 bg-[#C8961A]'
                          : 'w-1.5 h-1.5 bg-white/20 group-hover:bg-[#C8961A] group-hover:scale-125'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
