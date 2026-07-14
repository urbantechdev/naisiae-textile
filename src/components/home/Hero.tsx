import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, Scissors, RefreshCw, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useLocalization } from '../../context/LocalizationContext';

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
  onProductTap?: () => void;
  isReshufflingPaused?: boolean;
  setIsReshufflingPaused?: (paused: boolean) => void;
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
  products = [],
  onProductTap,
  isReshufflingPaused,
  setIsReshufflingPaused
}: HeroProps) {
  const { setIsCatalogueModalOpen } = useCart();
  const { formatPrice } = useLocalization();
  const heroImages = siteSettings?.heroImages || [];
  const [videoErrorSlides, setVideoErrorSlides] = React.useState<Record<number, boolean>>({});
  const [isMobile, setIsMobile] = React.useState(false);
  const [shuffledProducts, setShuffledProducts] = React.useState<any[]>([]);

  const reshuffle = React.useCallback(() => {
    if (!products || products.length === 0) return;
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    setShuffledProducts(shuffled.slice(0, 3));
  }, [products]);

  const productsRef = React.useRef(products);
  React.useEffect(() => {
    productsRef.current = products;
  }, [products]);

  React.useEffect(() => {
    if (products && products.length > 0) {
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setShuffledProducts(shuffled.slice(0, 3));
    }
  }, [products]);

  React.useEffect(() => {
    if (isReshufflingPaused) return;
    const interval = setInterval(() => {
      const currentProducts = productsRef.current;
      if (!currentProducts || currentProducts.length === 0) return;
      const shuffled = [...currentProducts].sort(() => 0.5 - Math.random());
      setShuffledProducts(shuffled.slice(0, 3));
    }, 7000);
    return () => clearInterval(interval);
  }, [isReshufflingPaused]);

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
    <>
      <section id="hero" className="relative min-h-[35vh] lg:h-[70vh] lg:min-h-[525px] flex items-center justify-center overflow-hidden bg-[#0E121C] py-4 lg:py-0">
      <div className="absolute inset-0 z-0 overflow-hidden">
        
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
                src={heroImages[currentSlide]?.url ? heroImages[currentSlide].url : "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fm=webp&q=60&w=1280"}
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

      <div className="relative z-30 w-full h-full max-w-[1440px] mx-auto px-6 lg:px-24 flex flex-col lg:flex-row items-center lg:justify-between pt-10 sm:pt-14 pb-8 lg:py-0 gap-4 lg:gap-10">
        <div className="max-w-xl lg:max-w-[750px] w-full flex flex-col gap-4 lg:gap-8 order-1 lg:order-1">

          <div className="hidden lg:flex min-h-[140px] sm:min-h-[180px] lg:min-h-[220px] flex-col justify-center">
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
                    <motion.div 
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
                          {currentSlide === 0 || !heroImages[currentSlide]?.title || heroImages[currentSlide]?.title === 'CRAFTING' ? "uhuru market" : heroImages[currentSlide].title.toLowerCase()}
                        </motion.span>
                      </span>
                      <span className="bg-gradient-to-r from-[#C8102E] via-[#E94C36] to-[#C8961A] bg-clip-text text-transparent italic inline-block relative pr-4">
                        {currentSlide === 0 || !heroImages[currentSlide]?.title || heroImages[currentSlide]?.title === 'CRAFTING' ? "UNIFORMS" : (heroImages[currentSlide]?.subtitle ? heroImages[currentSlide].subtitle.split(' ').slice(-2).join(' ') : 'SOLUTIONS')}
                        <motion.div 
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.8, duration: 1 }}
                          className="absolute -bottom-2 lg:-bottom-4 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C8102E] via-[#C8961A] to-transparent origin-left"
                        />
                      </span>
                    </motion.div>
 
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/70 max-w-xl text-base lg:text-lg leading-relaxed font-light tracking-wide italic border-l-2 border-[#C8961A] pl-6 lg:pl-8"
                  >
                    {currentSlide === 0 || !heroImages[currentSlide]?.title || heroImages[currentSlide]?.title === 'CRAFTING' ? "Uhuru Market Uniforms: The leading high-performance uniform manufacturer at Uhuru Market, Nairobi." : (heroImages[currentSlide]?.subtitle || "Precision tailoring for educational, medical, and corporate sectors across Kenya.")}
                  </motion.p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>





          <div className="hidden lg:flex flex-row items-center gap-3 sm:gap-4 lg:gap-6 pt-2 w-full">
            <Link
              to="/product"
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

          {/* Mobile Product Highlights Row */}
          {shuffledProducts.length > 0 && (
            <div className="hidden w-full mt-6 bg-[#0E121C]/65 border border-white/10 rounded-3xl p-4 shadow-xl backdrop-blur-xl relative text-left overflow-hidden">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase tracking-[2px] text-[#C8961A]">
                  ⚡ SPOTLIGHT PICKS
                </span>
                <button 
                  onClick={reshuffle}
                  className="text-[9px] font-bold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-all uppercase tracking-wider"
                >
                  Reshuffle
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {shuffledProducts.slice(0, 2).map((p, idx) => {
                  const discount = (p.oldPrice && p.price && p.oldPrice > p.price)
                    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
                    : 0;
                  return (
                    <button
                      key={`highlight-mobile-${p.id}`}
                      onClick={() => setSelectedQuickViewProduct(p)}
                      className="bg-white/5 active:bg-white/10 hover:bg-white/10 border border-white/5 hover:border-[#C8961A]/50 rounded-2xl p-2.5 flex flex-col text-left transition-all relative overflow-hidden"
                    >
                      <div className="w-full aspect-[4/3] bg-white rounded-xl overflow-hidden mb-2 relative shrink-0">
                        {p.imageUrl ? (
                          <img 
                            src={p.imageUrl} 
                            className="w-full h-full object-cover object-top" 
                            alt={p.name}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100 font-bold text-xs">
                            🧥
                          </div>
                        )}
                        {discount > 0 && (
                          <div className="absolute top-1.5 left-1.5 bg-[#C8102E] text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider z-10 shadow-md">
                            -{discount}% OFF
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 w-full px-1">
                        <p className="text-[11px] font-bold text-white truncate leading-tight mb-1">{p.name}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-[#C8961A] font-sans">
                            {p.price ? formatPrice(p.price) : 'Bulk Price'}
                          </p>
                          <span className="text-[7px] font-bold uppercase text-white/40 bg-white/5 px-1 py-0.5 rounded leading-none shrink-0 border border-white/5">
                            ⭐ 4.9
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>


      </div>

      <div className="hidden lg:flex absolute bottom-6 right-12 z-50 items-center gap-5">
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
        className="hidden lg:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex-col items-center gap-3 opacity-40 hover:opacity-100 transition-opacity cursor-pointer group"
        onClick={() => document.getElementById('specialties')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <span className="text-[8px] font-black uppercase tracking-[6px] text-white group-hover:text-[#C8961A] transition-colors">Scroll To Explore</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/0 via-white/50 to-white/0 lg:group-hover:via-[#C8102E] transition-colors"></div>
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

    {/* Responsive Search Bar placed below the Hero for all screen sizes */}
    <div className="w-full px-6 py-6 md:py-8 bg-white border-b border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative z-20">
      <div className="w-full max-w-lg lg:max-w-2xl mx-auto group relative">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="text-slate-400 group-focus-within:text-[#C8102E] transition-all" size={20} />
        </div>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length > 1 && setShowSearchSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
          placeholder="Search school uniforms, scrubs, blazers..."
          className="w-full bg-slate-50 border border-slate-200 rounded-full pl-14 pr-6 py-3.5 md:py-4 text-[#0E121C] text-sm md:text-base outline-none focus:ring-4 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/40 transition-all placeholder:text-slate-400 shadow-md hover:shadow-lg focus:shadow-lg focus:bg-white animate-blink-maroon"
        />
        <AnimatePresence>
          {showSearchSuggestions && searchResults.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-[32px] shadow-[0_30px_70px_rgba(0,0,0,0.2)] p-4 sm:p-6 w-[100vw] max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[550px] overflow-y-auto z-[60]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <span className="text-[10px] font-black tracking-[2.5px] uppercase text-slate-400">Search Results ({searchResults.length})</span>
                <span className="text-[9px] font-bold text-[#C8961A] bg-[#C8961A]/5 border border-[#C8961A]/10 px-2 py-0.5 rounded-full uppercase">Instant Match</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((product) => (
                  <div 
                    key={product.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedQuickViewProduct(product);
                      setSearchQuery('');
                      setShowSearchSuggestions(false);
                    }}
                    className="group/search bg-slate-50/50 hover:bg-white border border-slate-100/80 hover:border-[#C8102E]/30 rounded-2xl p-4 flex gap-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] hover:scale-[1.01]"
                  >
                    <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-slate-100 p-1.5 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100/50">
                      <img src={product.imageUrl} className="w-full h-full object-cover object-top rounded-lg transition-transform duration-500 group-hover/search:scale-[1.06]" alt={product.name} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <span className="text-[9px] text-[#C8961A] font-black uppercase tracking-widest bg-[#C8961A]/10 px-2 py-0.5 rounded-md inline-block mb-1.5">{product.category}</span>
                        <h4 className="text-xs sm:text-sm font-black text-[#0E121C] uppercase tracking-wide leading-snug group-hover/search:text-[#C8102E] transition-colors line-clamp-2">{product.name}</h4>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2">
                        <span className="text-xs sm:text-sm font-black text-slate-900">{formatPrice(product.price)}</span>
                        <span className="text-[10px] font-bold text-[#C8961A] flex items-center gap-0.5 opacity-80 group-hover/search:opacity-100 group-hover/search:translate-x-0.5 transition-all">
                          Quick View <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </>
  );
}
