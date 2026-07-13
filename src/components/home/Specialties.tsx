import React from 'react';
import { motion } from 'motion/react';
import { Package, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { appExperience } from '../../utils/haptics';

interface SpecialtiesProps {
  categories: any[];
  setActiveTab: (tab: string) => void;
}

export function Specialties({ categories, setActiveTab }: SpecialtiesProps) {
  return (
    <section id="specialties" className="pt-8 pb-4 sm:py-24 bg-white border-b border-slate-100">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-end mb-4 sm:mb-12">
          <div>
            <div className="flex items-center gap-3 text-[#C8102E] text-[10px] font-black tracking-[4px] uppercase mb-2 sm:mb-4">
              <div className="w-8 h-[2px] bg-[#C8102E]"></div> Our Specialties
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-[#0A1628] leading-none">
              Featured Categories
            </h2>
          </div>
          <Link to="/products" className="hidden sm:flex text-sm font-bold text-[#0A1628] hover:text-[#C8102E] transition-colors items-center gap-2">
            Explore Catalog <ChevronRight size={14} />
          </Link>
        </div>
        
        {/* Mobile View: Circular App-style Category Bubbles with Horizontal Scroll */}
        <div className="flex sm:hidden overflow-x-auto pb-4 gap-5 scroll-smooth snap-x snap-mandatory -mx-4 px-4 hide-scrollbar">
          {categories.length > 0 ? (
            categories.map((cat, idx) => {
              // Map elegant fallback symbols/emojis
              const getEmoji = (title: string) => {
                const t = title.toLowerCase();
                if (t.includes('school')) return '🏫';
                if (t.includes('college') || t.includes('university') || t.includes('wear')) return '🎓';
                if (t.includes('corporate') || t.includes('office') || t.includes('suit')) return '👔';
                if (t.includes('sport') || t.includes('kit') || t.includes('tracksuit')) return '⚽';
                return '👕';
              };

              const handleCategoryClick = () => {
                appExperience.triggerFeedback('tap');
                setActiveTab(cat.title);
                const shopEl = document.getElementById('catalog-section') || document.getElementById('shop');
                if (shopEl) {
                  const offset = 80;
                  const elementPosition = shopEl.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - offset;
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  });
                }
              };

              return (
                <motion.button
                  key={`mobile-bubble-${cat.id || idx}`}
                  onClick={handleCategoryClick}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}
                  className="flex flex-col items-center flex-shrink-0 snap-center focus:outline-none"
                >
                  {/* Bubble Container */}
                  <div className="relative group/bubble">
                    {/* Ring background gradient effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-tr from-[#C8961A] to-[#C8102E] rounded-full blur-[2px] opacity-75 group-hover/bubble:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Inner Circle Image/Fallbacks */}
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white border border-white flex items-center justify-center p-0.5 shadow-md">
                      {cat.image ? (
                        <img 
                          src={cat.image} 
                          className="w-full h-full object-cover rounded-full" 
                          alt={cat.title} 
                          loading="lazy" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <span className="text-2xl">{getEmoji(cat.title)}</span>
                      )}
                    </div>

                    {/* App-like Crown badge for top picks */}
                    {idx === 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#C8961A] text-white text-[7px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm">
                        👑
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span className="text-[10px] font-extrabold text-slate-800 text-center tracking-wide mt-2 max-w-[72px] line-clamp-2 leading-tight">
                    {cat.title}
                  </span>
                </motion.button>
              );
            })
          ) : (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0 snap-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center animate-pulse">
                  <Package className="text-slate-300" size={20} />
                </div>
                <div className="w-12 h-2 bg-slate-100 rounded mt-2"></div>
              </div>
            ))
          )}
        </div>

        {/* Desktop & Tablet grid view (unchanged/highly polished cards) */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
          {categories.length > 0 ? (
            categories.slice(0, 4).map((cat, idx) => (
              <motion.div 
                key={cat.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -6 }}
                className="group relative h-[350px] rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer"
                onClick={() => {
                  appExperience.triggerFeedback('tap');
                  setActiveTab(cat.title);
                  const shopEl = document.getElementById('catalog-section') || document.getElementById('shop');
                  if (shopEl) {
                    const offset = 80; // Navbar height
                    const elementPosition = shopEl.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }}
              >
                <div className="absolute inset-0">
                  {cat.image ? (
                    <img 
                      src={cat.image} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={cat.title} 
                      loading="lazy" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center"><Package size={40} className="text-slate-200" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="absolute bottom-8 left-8 right-8">
                  {cat.subtitle && <p className="text-[10px] text-[#C8961A] font-black uppercase tracking-[2px] mb-2">{cat.subtitle}</p>}
                  <h3 className="text-xl font-bold text-white mb-4 line-clamp-2">{cat.title}</h3>
                  <div className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">
                    Shop Now <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-[350px] bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center animate-pulse">
                <Package className="text-slate-200 mb-4" size={40} />
                <div className="w-1/2 h-2 bg-slate-200 rounded mb-2"></div>
                <div className="w-1/3 h-2 bg-slate-200 rounded"></div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
