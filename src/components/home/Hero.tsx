import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, Scissors, RefreshCw, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

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
  products?: any[];
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
  setIsQuoteModalOpen,
  products = []
}: HeroProps) {
  const { setIsCatalogueModalOpen } = useCart();
  const heroImages = siteSettings?.heroImages || [];
  const [videoErrorSlides, setVideoErrorSlides] = React.useState<Record<number, boolean>>({});
  const [isMobile, setIsMobile] = React.useState(false);
  const [shuffledProducts, setShuffledProducts] = React.useState<any[]>([]);

  const reshuffle = React.useCallback(() => {
    if (!products || products.length === 0) return;
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    setShuffledProducts(shuffled.slice(0, 3));
  }, [products]);

  React.useEffect(() => {
    if (products && products.length > 0) {
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setShuffledProducts(shuffled.slice(0, 3));
    }
  }, [products]);

  React.useEffect(() => {
    const checkMobileWidth = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobileWidth();
    window.addEventListener('resize', checkMobileWidth);
    return () => window.removeEventListener('resize', checkMobileWidth);
  }, []);

  const isNonEmbeddableUrl = (url?: string) => {
    if (!url) return true;
    const lower = url.toLowerCase();
    return lower.includes('pinterest.com') ||
           lower.includes('pin.it') ||
           lower.includes('instagram.com') ||
           lower.includes('facebook.com') ||
           lower.includes('tiktok.com') ||
           lower.includes('twitter.com') ||
           lower.includes('x.com');
  };

  const videoUrl = heroImages[currentSlide]?.videoUrl;
  const showVideo = !isMobile && videoUrl && !videoErrorSlides[currentSlide] && !isNonEmbeddableUrl(videoUrl);
  
  return (
    <section id="hero" className="relative min-h-screen lg:h-screen lg:min-h-[750px] flex items-center justify-center overflow-hidden bg-[#0E121C] py-12 lg:py-0">
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Mobile-only gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0E121C] from-[40%] via-[#0E121C]/95 via-[45%] to-transparent to-[75%] z-10 lg:hidden"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(139,61,255,0.09),_transparent_70%)] z-10 lg:hidden"></div>
        
        {/* Subtle bottom shadow overlay to transition into sections below */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0E121C] to-transparent z-10"></div>
 
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.03 }}
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
              {showVideo ? (
                <div className="w-full h-full">
                  {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${
                        videoUrl.includes('v=') 
                          ? videoUrl.split('v=')[1].split('&')[0] 
                          : videoUrl.split('/').pop()
                      }?autoplay=1&mute=1&loop=1&playlist=${
                        videoUrl.includes('v=') 
                          ? videoUrl.split('v=')[1].split('&')[0] 
                          : videoUrl.split('/').pop()
                      }&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
                      className="w-[100vw] h-[56.25vw] min-h-screen min-w-[177.77vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      allow="autoplay; encrypted-media; fullscreen"
                      title="Hero Video"
                    />
                  ) : videoUrl.includes('vimeo.com') ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${videoUrl.split('/').pop()}?autoplay=1&muted=1&loop=1&autopause=0&background=1`}
                      className="w-[100vw] h-[56.25vw] min-h-screen min-w-[177.77vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      allow="autoplay; fullscreen"
                      title="Hero Video"
                    />
                  ) : (
                    <video 
                      key={videoUrl}
                      autoPlay 
                      muted 
                      loop 
                      playsInline
                      className="w-full h-full object-cover object-left md:object-center"
                      onError={() => {
                        console.warn("Hero video failed to load for url:", videoUrl, "Falling back to static image.");
                        setVideoErrorSlides(prev => ({ ...prev, [currentSlide]: true }));
                      }}
                    >
                      <source src={videoUrl} type="video/mp4" />
                      <source src={videoUrl} type="video/webm" />
                      <source src={videoUrl} type="video/ogg" />
                    </video>
                  )}
                  <div className="absolute inset-0 bg-black/20 z-0"></div>
                </div>
              ) : (
              <img 
                src={heroImages[currentSlide]?.url ? heroImages[currentSlide].url : "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1280&auto=format&fit=crop"}
                className="w-full h-full object-cover object-left md:object-center"
                alt={heroImages[currentSlide]?.title || 'Hero'}
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
                fetchPriority="high"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dynamic Vertical Wave Partition dividing dark left and image right on desktop */}
      <div className="absolute inset-y-0 left-0 w-[68vw] xl:w-[62vw] pointer-events-none hidden lg:block z-10 select-none">
        <svg viewBox="0 0 750 1000" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="vertical-wave-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C8102E" />
              <stop offset="50%" stopColor="#E94C36" />
              <stop offset="100%" stopColor="#C8961A" />
            </linearGradient>
            <linearGradient id="vertical-wave-glow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C8102E" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#E94C36" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#C8961A" stopOpacity="0.75" />
            </linearGradient>
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Solid fill matching the left side's pure page bg */}
          <path d="M 0,0 L 700,0 C 550,300 450,650 650,1000 L 0,1000 Z" className="fill-[#0E121C]" />
          
          {/* 1. Underlying blur neon glow decorative path */}
          <path 
            d="M 700,0 C 550,300 450,650 650,1000" 
            fill="none" 
            stroke="url(#vertical-wave-glow)" 
            strokeWidth="14" 
            className="opacity-30" 
            filter="url(#neon-glow)"
          />
          
          {/* 2. Secondary delicate accent offset line for modern layered 3D depth */}
          <path 
            d="M 703,0 C 553,300 453,650 653,1000" 
            fill="none" 
            stroke="#C8961A" 
            strokeWidth="1.5" 
            className="opacity-25" 
          />

          {/* 3. Main precise glowing wave outline trace */}
          <path 
            d="M 700,0 C 550,300 450,650 650,1000" 
            fill="none" 
            stroke="url(#vertical-wave-grad)" 
            strokeWidth="3.5" 
            className="opacity-95" 
          />
        </svg>
      </div>

      <div className="relative z-30 w-full h-full max-w-[1440px] mx-auto px-6 lg:px-24 flex flex-col lg:flex-row items-center lg:justify-between pt-24 sm:pt-36 pb-24 lg:py-0 gap-8 lg:gap-10">
        <div className="max-w-xl lg:max-w-2xl w-full flex flex-col gap-6 lg:gap-8 order-1 lg:order-1">
          {/* Desktop Search on top of the sliding text of the left column */}
          <div className="hidden lg:block w-full group relative z-40 mb-2">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="text-slate-400 group-focus-within:text-[#C8102E] transition-all" size={24} />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 1 && setShowSearchSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
              placeholder="Search products..."
              className="w-full bg-white border border-slate-200 lg:border-white/20 rounded-3xl pl-16 pr-6 py-5 lg:py-6 text-[#0E121C] text-lg lg:text-xl outline-none focus:ring-4 focus:ring-[#C8102E]/35 transition-all placeholder:text-slate-400 shadow-2xl"
            />
            <AnimatePresence>
              {showSearchSuggestions && searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-100 rounded-3xl shadow-[0_45px_90px_rgba(0,0,0,0.65)] overflow-hidden max-h-[400px] overflow-y-auto z-[60]"
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
                        <p className="text-sm font-black text-[#0E121C] uppercase tracking-wider mb-1">{product.name}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-[#C8961A] font-black uppercase tracking-widest bg-[#C8961A]/5 px-2 py-0.5 rounded">{product.category}</span>
                          <span className="text-xs font-bold text-slate-400">{product.price.toLocaleString()}/-</span>
                        </div>
                      </div>
                      <ChevronRight className="text-slate-200 group-hover/search:text-[#C8961A]/80 group-hover/search:translate-x-1 transition-all" size={20} />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                      className="font-display font-black text-4xl md:text-5xl lg:text-7xl text-white leading-[0.9] tracking-[-0.04em]"
                    >
                      <span className="block overflow-hidden">
                        <motion.span 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.8 }}
                          className="block lowercase font-[Comfortaa] lg:mb-2"
                        >
                          {heroImages[currentSlide]?.title ? heroImages[currentSlide].title.toLowerCase() : (currentSlide === 0 ? "uhuru market" : "crafting")}
                        </motion.span>
                      </span>
                      <span className="bg-gradient-to-r from-[#C8102E] via-[#E94C36] to-[#C8961A] bg-clip-text text-transparent italic inline-block relative pr-4">
                        {currentSlide === 0 ? "UNIFORMS" : (heroImages[currentSlide]?.subtitle ? heroImages[currentSlide].subtitle.split(' ').slice(-2).join(' ') : 'SOLUTIONS')}
                        <motion.div 
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.8, duration: 1 }}
                          className="absolute -bottom-2 lg:-bottom-4 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C8102E] via-[#C8961A] to-transparent origin-left"
                        />
                      </span>
                    </motion.h1>

                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/70 max-w-xl text-base lg:text-lg leading-relaxed font-light tracking-wide italic border-l-2 border-[#C8961A] pl-6 lg:pl-8"
                  >
                    {heroImages[currentSlide]?.subtitle || (currentSlide === 0 ? "Naisiae Textiles: The leading high-performance uniform manufacturer at Uhuru Market, Nairobi." : "Precision tailoring for educational, medical, and corporate sectors across Kenya.")}
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
              onClick={() => setIsCatalogueModalOpen(true)}
              className="flex-1 lg:flex-none group px-6 sm:px-10 lg:px-12 py-4 sm:py-5 bg-white/10 backdrop-blur-2xl border border-white/10 text-white rounded-xl sm:rounded-2xl transition-all duration-500 hover:bg-white hover:text-[#0A1628] shadow-2xl flex items-center justify-center lg:min-w-[220px]"
            >
              <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-black uppercase tracking-[2px] sm:tracking-[4px] flex items-center gap-2 sm:gap-3">
                Catalog <Scissors size={18} className="hidden sm:block group-hover:rotate-12 transition-transform" />
              </span>
            </button>
          </div>
        </div>

        <div className="flex max-w-xl lg:max-w-[540px] w-full flex-col items-center justify-center lg:items-end order-2 lg:order-2 mt-8 lg:mt-0 pb-16 lg:pb-28 transform lg:translate-x-12">
          {/* Spotlight Picks Block */}
          {shuffledProducts.length > 0 && (
            <div className="w-full lg:max-w-[540px] mt-6 bg-[#0E121C]/65 border border-white/10 rounded-[2.5rem] p-5 lg:p-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative text-left backdrop-blur-xl overflow-hidden group/spotlight">
              {/* Dynamic decorative visual glow corner inside */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#C8961A]/10 rounded-full blur-2xl pointer-events-none transition-opacity duration-700 group-hover/spotlight:opacity-100"></div>
              
              {/* High-end accent bar at the right edge in faded grey */}
              <div className="absolute top-0 right-0 bottom-0 w-[4px] bg-white/10 opacity-40 group-hover/spotlight:opacity-75 transition-opacity duration-500 rounded-r-[2.5rem] z-20"></div>
              
              <div className="flex items-center justify-between mb-4 px-1 relative z-10">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C8961A] animate-pulse"></span>
                    <span className="text-[11px] font-black text-[#C8961A] tracking-[2px] uppercase">Spotlight Picks</span>
                  </div>
                  <span className="text-[7px] font-black text-white/30 uppercase tracking-[1.5px] mt-0.5">High Performance Selections</span>
                </div>
                <button 
                  onClick={reshuffle}
                  className="flex items-center gap-1.5 text-white/40 hover:text-white text-[9px] font-black tracking-widest uppercase bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full cursor-pointer transition-all active:scale-95 group/shuffle font-sans border border-white/5 hover:border-white/10"
                >
                  <RefreshCw size={10} className="group-hover/shuffle:rotate-180 transition-transform duration-500 text-[#C8961A]" />
                  Reshuffle
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 relative z-10">
                {shuffledProducts.map((p, idx) => {
                  // Determine offer/promo badge content gracefully
                  const discount = (p.oldPrice && p.price && p.oldPrice > p.price)
                    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
                    : null;
                  
                  // Use procedural deterministic badges for items without set discount percent
                  const labelHash = p.name ? p.name.length : (p.id ? p.id.length : 0);
                  const defaultLabel = labelHash % 3 === 0 ? "10% OFF" : labelHash % 3 === 1 ? "15% OFF" : "SALE";
                  const promoLabel = discount ? `-${discount}%` : defaultLabel;

                  return (
                    <motion.button
                      key={`spotlight-${p.id}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      onClick={() => setSelectedQuickViewProduct(p)}
                      className="bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 hover:border-[#C8961A]/50 rounded-2xl p-2.5 flex flex-col items-start text-left transition-all hover:-translate-y-1.5 duration-300 active:scale-95 group/card shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_24px_rgba(200,150,26,0.18)] relative overflow-hidden shrink-0"
                    >
                      {/* Premium interactive right edge faded grey stripe */}
                      <div className="absolute top-0 right-0 bottom-0 w-[3px] bg-white/10 opacity-30 group-hover/card:opacity-60 transition-all duration-300 z-20 rounded-r-2xl" />
                      <div className="w-full aspect-[4/5] bg-white rounded-xl overflow-hidden mb-3 relative border border-white/10 shrink-0">
                        {p.imageUrl ? (
                          <img 
                            src={p.imageUrl} 
                            alt={p.name} 
                            className="w-full h-full object-cover object-top group-hover/card:scale-110 transition-transform duration-500 ease-out"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800">
                            <Package size={16} className="text-white/20" />
                          </div>
                        )}
                        
                        {/* Bulking Label on Left */}
                        {p.priceType === 'wholesale' && (
                          <div className="absolute top-1.5 left-1.5 bg-[#0E121C]/95 text-[#C8961A] text-[6px] lg:text-[7px] font-black uppercase px-1.5 py-0.5 rounded border border-white/10 tracking-widest z-10">
                            Bulk
                          </div>
                        )}

                        {/* High-Contrast Red Offer Tag on Right */}
                        <div className="absolute top-1.5 right-1.5 bg-[#C8102E] text-white text-[6px] lg:text-[7px] font-black uppercase px-1.5 py-0.5 rounded shadow-[0_4px_12px_rgba(200,16,46,0.35)] border border-white/10 tracking-wider z-10 animate-pulse">
                          {promoLabel}
                        </div>
                      </div>
                      <div className="min-w-0 w-full px-1">
                        <p className="text-[10px] font-black text-white truncate leading-tight group-hover/card:text-[#C8961A] transition-colors">{p.name}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[9.5px] font-black text-[#C8961A] tracking-wide font-sans">
                            {p.price ? `Ksh ${p.price.toLocaleString()}/-` : 'Bulk Price'}
                          </p>
                          <span className="text-[6.5px] font-bold uppercase text-white/50 tracking-[1px] bg-white/5 px-1 py-0.5 rounded leading-none shrink-0 border border-white/5 group-hover/card:border-[#C8961A]/20 group-hover/card:text-[#C8961A] transition-all">
                            ⭐ 4.9
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-12 right-12 z-50 flex items-center gap-5">
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
            <div className="relative w-12 h-[2.5px] bg-white/10 overflow-hidden rounded-full">
              <motion.div 
                initial={false}
                animate={{ 
                  scaleX: currentSlide === idx ? 1 : 0,
                  opacity: currentSlide === idx ? 1 : 0
                }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 bg-gradient-to-r from-[#C8102E] to-[#C8961A] origin-left"
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
        <div className="w-[1px] h-20 bg-gradient-to-b from-white/0 via-white/50 to-white/0 lg:group-hover:via-[#C8102E] transition-colors"></div>
      </motion.div>

      {/* Elegant Single Wave Partition Divider */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-25 pointer-events-none">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px] md:h-[80px] lg:h-[120px]">
          <defs>
            <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C8102E" />
              <stop offset="50%" stopColor="#E94C36" />
              <stop offset="100%" stopColor="#C8961A" />
            </linearGradient>
          </defs>
          {/* Main wave matching next section's bg-white */}
          <path d="M0,40 C300,100 800,0 1200,50 L1200,122 L0,122 Z" className="fill-white" />
          {/* Premium outline highlight trace following the wave */}
          <path d="M0,40 C300,100 800,0 1200,50" fill="none" stroke="url(#wave-grad)" strokeWidth="3" className="opacity-80" />
        </svg>
      </div>
    </section>
  );
}
