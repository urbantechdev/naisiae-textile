import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeroProps {
  siteSettings: any;
  currentSlide: number;
  setCurrentSlide: (idx: number) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showSearchSuggestions: boolean;
  setShowSearchSuggestions: (show: boolean) => void;
  searchResults: any[];
  setSelectedQuickViewProduct: (product: any) => void;
  setIsQuoteModalOpen: (open: boolean) => void;
}

export function Hero({
  siteSettings,
  currentSlide,
  setCurrentSlide,
  searchQuery,
  setSearchQuery,
  showSearchSuggestions,
  setShowSearchSuggestions,
  searchResults,
  setSelectedQuickViewProduct,
  setIsQuoteModalOpen
}: HeroProps) {
  const heroImages = siteSettings?.heroImages || [];
  
  return (
    <section id="hero" className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden bg-[#0A1628]">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628] from-[40%] via-[#0A1628]/95 via-[45%] to-transparent to-[75%] z-10"></div>
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0A1628] to-transparent z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(200,150,26,0.05),_transparent_70%)] z-10"></div>

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] }
            }}
            exit={{ 
              opacity: 0, 
              scale: 1.05,
              transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] }
            }}
            className="absolute inset-0"
          >
            <img 
              src={`${heroImages[currentSlide]?.url || "https://images.unsplash.com/photo-1558769132-cb1aea458c5e"}?q=80&w=1920&auto=format&fit=crop`}
              srcSet={`${heroImages[currentSlide]?.url}?q=60&w=800 800w, ${heroImages[currentSlide]?.url}?q=80&w=1280 1280w, ${heroImages[currentSlide]?.url}?q=80&w=1920 1920w`}
              sizes="100vw"
              className="w-full h-full object-contain md:object-cover object-right md:object-center"
              alt={heroImages[currentSlide]?.title || 'Hero'}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              fetchPriority="high"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-30 w-full h-full max-w-[1440px] mx-auto px-6 lg:px-24 flex flex-col lg:flex-row items-center lg:justify-between pt-32 sm:pt-40 pb-12 lg:py-0 gap-8 lg:gap-10">
        <div className="max-w-xl lg:max-w-2xl w-full flex flex-col gap-6 lg:gap-8 order-1 lg:order-1">
          <div className="min-h-[140px] sm:min-h-[180px] lg:min-h-[220px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentSlide}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4 lg:space-y-8"
              >
                <div className="space-y-4 lg:space-y-8">
                  <motion.h1 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="font-display font-medium text-4xl md:text-5xl lg:text-7xl text-white leading-[0.9] tracking-[-0.04em]"
                  >
                    <span className="block overflow-hidden">
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="block"
                      >
                        {heroImages[currentSlide]?.title || "CRAFTING"}
                      </motion.span>
                    </span>
                    <span className="text-[#C8961A] italic inline-block relative">
                      {heroImages[currentSlide]?.subtitle ? 'SCHOOL UNIFORMS' : 'SCHOOL UNIFORMS'}
                      <motion.div 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="absolute -bottom-2 lg:-bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-[#C8961A] to-transparent origin-left"
                      />
                    </span>
                  </motion.h1>

                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/60 max-w-xl text-base lg:text-lg leading-relaxed font-light tracking-wide italic border-l-2 border-[#C8961A] pl-6 lg:pl-8"
                  >
                    {heroImages[currentSlide]?.subtitle || "Engineered school uniforms for the modern institution. Quality guaranteed for generations."}
                  </motion.p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="lg:hidden w-full mb-2">
            <div className="w-full group relative">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="text-[#0A1628]/30 group-focus-within:text-[#C8961A] transition-all" size={18} />
              </div>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length > 1 && setShowSearchSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                placeholder="Find your institution or uniform..."
                className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl pl-12 pr-6 py-4 text-[#0A1628] text-base outline-none focus:ring-4 focus:ring-[#C8961A]/10 focus:border-[#C8961A]/50 transition-all placeholder:text-slate-400 shadow-lg"
              />
            </div>
          </div>

          <div className="flex flex-row items-center gap-3 sm:gap-4 lg:gap-6 pt-2 w-full">
            <Link
              to="/products"
              className="flex-1 lg:flex-none group relative px-6 sm:px-10 lg:px-12 py-4 sm:py-5 bg-[#C8102E] text-white rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(200,16,46,0.2)] flex items-center justify-center lg:min-w-[220px]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <span className="relative z-10 text-[9px] sm:text-[10px] lg:text-[11px] font-black uppercase tracking-[2px] sm:tracking-[4px] flex items-center gap-2 sm:gap-3">
                Shop <ChevronRight size={18} className="hidden sm:block group-hover:translate-x-2 transition-transform" />
              </span>
            </Link>
            <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="flex-1 lg:flex-none group px-6 sm:px-10 lg:px-12 py-4 sm:py-5 bg-white/10 backdrop-blur-2xl border border-white/10 text-white rounded-xl sm:rounded-2xl transition-all duration-500 hover:bg-white hover:text-[#0A1628] shadow-2xl flex items-center justify-center lg:min-w-[220px]"
            >
              <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-black uppercase tracking-[2px] sm:tracking-[4px] flex items-center gap-2 sm:gap-3">
                Catalog <Scissors size={18} className="hidden sm:block group-hover:rotate-12 transition-transform" />
              </span>
            </button>
          </div>
        </div>

        <div className="hidden lg:flex max-w-xl w-full flex-col items-center justify-center lg:items-end order-2 lg:order-2 mt-16 lg:mt-0">
          <div className="w-full lg:max-w-md group relative">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="text-[#0A1628]/40 group-focus-within:text-[#C8961A] transition-all" size={24} />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 1 && setShowSearchSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
              placeholder="Search products"
              className="w-full bg-white border border-slate-200 lg:border-white/20 rounded-3xl pl-16 pr-6 py-5 lg:py-8 text-[#0A1628] text-xl lg:text-2xl outline-none focus:ring-4 focus:ring-[#C8961A]/30 transition-all placeholder:text-slate-400 shadow-2xl"
            />
            <AnimatePresence>
              {showSearchSuggestions && searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-100 rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden max-h-[400px] overflow-y-auto z-[60]"
                >
                  {searchResults.map((product) => (
                    <div 
                      key={product.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedQuickViewProduct(product);
                        setSearchQuery('');
                        setShowSearchSuggestions(false);
                      }}
                      className="p-5 hover:bg-slate-50 cursor-pointer flex items-center gap-5 transition-colors border-b border-slate-50 last:border-none group/search"
                    >
                      <div className="w-16 h-16 rounded-xl bg-slate-100 p-2 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={product.imageUrl} className="w-full h-full object-cover object-top transition-transform group-hover/search:scale-110" alt={product.name} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-[#0A1628] uppercase tracking-wider mb-1">{product.name}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-[#C8961A] font-black uppercase tracking-widest bg-[#C8961A]/5 px-2 py-0.5 rounded">{product.category}</span>
                          <span className="text-xs font-bold text-slate-400">{product.price.toLocaleString()}/-</span>
                        </div>
                      </div>
                      <ChevronRight className="text-slate-200 group-hover/search:text-[#C8961A] group-hover/search:translate-x-1 transition-all" size={20} />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 right-12 z-40 flex items-center gap-5">
        {heroImages.map((_: any, idx: number) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className="group relative flex flex-col items-center gap-4 py-2"
          >
            <span className={`text-[10px] font-black transition-all ${currentSlide === idx ? 'text-[#C8961A] translate-y-0 opacity-100' : 'text-white/20 translate-y-2 opacity-0'}`}>
              0{idx + 1}
            </span>
            <div className="relative w-12 h-[2px] bg-white/10 overflow-hidden rounded-full">
              <motion.div 
                initial={false}
                animate={{ 
                  scaleX: currentSlide === idx ? 1 : 0,
                  opacity: currentSlide === idx ? 1 : 0
                }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 bg-[#C8961A] origin-left"
              />
            </div>
          </button>
        ))}
      </div>

      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity cursor-pointer group"
        onClick={() => document.getElementById('specialties')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <span className="text-[8px] font-black uppercase tracking-[6px] text-white group-hover:text-[#C8961A] transition-colors">Scroll To Explore</span>
        <div className="w-[1px] h-20 bg-gradient-to-b from-white/0 via-white/50 to-white/0 lg:group-hover:via-[#C8961A] transition-colors"></div>
      </motion.div>
    </section>
  );
}
