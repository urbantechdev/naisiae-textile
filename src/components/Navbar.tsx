import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Menu, 
  ChevronRight,
  Megaphone,
  GitCompare,
  Package,
  Search,
  X,
  Phone,
  Zap,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, doc, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion'; // Clean import mapping
import { db } from '../services/firebase';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  compareCount?: number;
  isMenuOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  setIsWishlistOpen: (open: boolean) => void;
  setIsMenuOpen: (open: boolean) => void;
  setIsQuoteModalOpen: (open: boolean) => void;
  setIsCompareModalOpen?: (open: boolean) => void;
}

// Fallback static configuration isolated outside of execution context
const DEFAULT_MEGA_MENUS = [
  {
    id: 'products',
    name: 'Products',
    featured: { 
      title: 'School Uniform Collection 2025',
      image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80',
      link: '/products'
    },
    categories: [
      { name: 'Primary Schools', items: ['Sweaters', 'Shorts', 'Dresses', 'Blazers'] },
      { name: 'Secondary Schools', items: ['Trousers', 'Skirts', 'Blouses', 'Ties'] },
      { name: 'Branding', items: ['Embroidery', 'Screen Printing', 'Heat Press'] }
    ]
  },
  {
    id: 'services',
    name: 'Services',
    featured: {
      title: 'Custom Textile Solutions',
      image: 'https://images.unsplash.com/photo-1524333865985-64906560938f?auto=format&fit=crop&q=80',
      link: '/services'
    },
    categories: [
      { name: 'Manufacturing', items: ['Wholesale Production', 'Custom Patterns', 'Bulk Orders'] },
      { name: 'Corporate', items: ['Staff Uniforms', 'Promotional Wear', 'Identity Branding'] }
    ]
  },
  {
    id: 'categories',
    name: 'Categories',
    featured: {
      title: 'Explore Our Catalog',
      image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80',
      link: '/categories'
    },
    categories: [
      { name: 'Shop By Sector', items: ['Healthcare', 'Education', 'Hospitality', 'Security'] },
      { name: 'Shop By Type', items: ['Woven Labels', 'Embossed Logos', 'Printed Fabrics'] }
    ]
  }
];

export function Navbar({ 
  cartCount, 
  wishlistCount,
  compareCount = 0,
  isMenuOpen,
  setIsCartOpen,
  setIsWishlistOpen,
  setIsMenuOpen,
  setIsQuoteModalOpen,
  setIsCompareModalOpen
}: NavbarProps) {
  const [megaMenus, setMegaMenus] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Subscriptions
    const qProducts = query(collection(db, 'products'), where('active', '==', true));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => console.error('Products fetch error:', error));

    const unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => console.error('Services fetch error:', error));
    
    const unsubMenus = onSnapshot(collection(db, 'mega_menus'), (snapshot) => {
      const menus = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMegaMenus(menus.length === 0 ? DEFAULT_MEGA_MENUS : menus);
    }, (error) => {
      console.error('Mega menus fetch error:', error);
      setMegaMenus(DEFAULT_MEGA_MENUS.slice(0, 2)); // Dynamic recovery subset fallback
    });
    
    const unsubSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSiteSettings(snapshot.data());
      } else {
        setSiteSettings({
          siteName: 'NAISIAE TEXTILES',
          siteTagline: 'Uhuru Market Uniforms',
          siteLogo: null
        });
      }
    });

    const qPromos = query(collection(db, 'promotions'), where('active', '==', true));
    const unsubPromos = onSnapshot(qPromos, (snapshot) => {
      setPromotions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubMenus();
      unsubSettings();
      unsubPromos();
      unsubProducts();
      unsubServices();
    };
  }, []);

  // Fixed React internal assignment references inside search pipeline
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    
    const prodResults = products
      .filter(p => 
        p.name?.toLowerCase().includes(q) || 
        p.category?.toLowerCase().includes(q) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(q))
      )
      .slice(0, 4)
      .map(p => ({ ...p, type: 'product', icon: <Package size={14} className="text-[#C8961A]" /> }));

    const serviceResults = services
      .filter(s => s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q))
      .slice(0, 2)
      .map(s => ({ ...s, name: s.title, type: 'service', icon: <Zap size={14} className="text-[#C8961A]" /> }));

    const categories = Array.from(new Set(products.map(p => p.category))).filter((c): c is string => !!c);
    const catResults = categories
      .filter(c => c.toLowerCase().includes(q))
      .slice(0, 2)
      .map(c => ({ id: c, name: c, type: 'category', icon: <Filter size={14} className="text-[#C8961A]" /> }));

    return [...prodResults, ...catResults, ...serviceResults];
  }, [searchQuery, products, services]);

  const navItems = [
    { name: 'Home', id: 'home', link: '/' },
    { name: 'Products', id: 'products', link: '/products', mega: true },
    { name: 'Services', id: 'services', link: '/services', mega: true },
    { name: 'Portfolio', id: 'portfolio', link: '/portfolio' },
    { name: 'Categories', id: 'categories', link: '/categories', mega: true }
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] transition-all duration-700">
      <AnimatePresence>
        {promotions.filter(p => p.type === 'top-bar').map(promo => (
          <motion.div 
            key={promo.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#0A1628] text-[#C8961A] overflow-hidden relative z-[110] border-b border-[#C8961A]/10"
          >
            <div className="max-w-[1440px] mx-auto px-6 py-2.5 flex items-center justify-between gap-6 text-[9px] font-black tracking-[3px] uppercase">
              <div className="flex items-center gap-4">
                <Megaphone size={12} className="shrink-0 animate-bounce" />
                <span className="hidden lg:inline">{promo.title}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white/60 lowercase tracking-widest italic">{promo.subtitle || 'Exclusive Offer'}</span>
                {promo.buttonLink && (
                  <Link to={promo.buttonLink} className="bg-[#C8961A] text-[#0A1628] px-4 py-1 rounded-full hover:bg-white transition-all font-black text-[8px]">
                    {promo.buttonText || 'Discover'}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <header 
        className={`w-full transition-all duration-700 border-b border-white/5 ${
          isScrolled 
            ? 'bg-[#050B16]/95 backdrop-blur-2xl py-3 md:py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
            : 'bg-[#050B16] py-5 md:py-8'
        }`}
        onMouseLeave={() => setActiveMegaMenu(null)}
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-20 flex items-center justify-between gap-4 md:gap-12">
          {/* Brand Identity */}
          <Link to="/" className="group flex items-center gap-3 md:gap-5 shrink-0">
            <div className={`relative transition-all duration-700 ${isScrolled ? 'w-10 h-10 md:w-12 md:h-12' : 'w-12 h-12 md:w-16 md:h-16'}`}>
              <div className="absolute inset-0 bg-[#C8961A]/20 blur-[10px] md:blur-[15px] group-hover:blur-[25px] transition-all rounded-full"></div>
              {siteSettings?.siteLogo ? (
                <img src={siteSettings.siteLogo} alt="Logo" className="w-full h-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-lg md:text-2xl text-[#C8961A] bg-[#0A1628] border border-[#C8961A]/30 rounded-xl md:rounded-2xl relative z-10 shadow-2xl overflow-hidden group-hover:border-[#C8961A] transition-all">
                  <span className="relative z-10">NT</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#C8961A]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg md:text-xl lg:text-3xl tracking-[4px] md:tracking-[8px] uppercase transition-all duration-700 leading-none text-white">
                {siteSettings?.siteName?.split(' ')[0] || 'NAISIAE'}
              </span>
              <span className="text-[7px] md:text-[8px] tracking-[3px] md:tracking-[5px] text-[#C8961A] uppercase font-black mt-1 group-hover:translate-x-1 transition-transform">
                {siteSettings?.siteTagline || 'Textiles Limited'}
              </span>
            </div>
          </Link>

          {/* Centered Navigation */}
          <nav className="hidden xl:flex items-center gap-12 flex-1 justify-center">
            {navItems.map((item) => (
              <div 
                key={item.id} 
                className="relative h-12 flex items-center"
                onMouseEnter={() => item.mega && setActiveMegaMenu(item.id)}
              >
                <Link 
                  to={item.link} 
                  className={`text-[10px] font-black uppercase tracking-[4px] transition-all duration-500 relative group py-2 px-1 ${
                    isScrolled ? 'text-white/70' : 'text-white'
                  } hover:text-[#C8961A]`}
                >
                  <span className="relative z-10">{item.name}</span>
                  <span className={`absolute -bottom-1 left-0 h-[1.5px] bg-[#C8961A] transition-all duration-700 ${
                    activeMegaMenu === item.id ? 'w-full' : 'w-0'
                  } group-hover:w-full`}></span>
                </Link>
              </div>
            ))}
          </nav>

          {/* Action Hub */}
          <div className="flex items-center gap-4 lg:gap-8">
             <div className="items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl border border white/10 hidden sm:flex">
               <button onClick={() => setIsWishlistOpen(true)} aria-label="Open Wishlist" className="p-1.5 md:p-2 text-white/50 hover:text-[#F0A500] transition-colors relative group">
                 <Heart size={18} className={wishlistCount > 0 ? "fill-[#F0A500] text-[#F0A500]" : "group-hover:scale-110 transition-transform md:w-5 md:h-5"} />
                 {wishlistCount > 0 && (
                   <span className="absolute top-1 right-1 w-2 h-2 bg-[#F0A500] rounded-full animate-ping"></span>
                 )}
               </button>
               <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
               <button onClick={() => setIsCompareModalOpen?.(true)} aria-label="Open Comparison" className="p-1.5 md:p-2 text-white/50 hover:text-[#C8961A] transition-colors relative group">
                 <GitCompare size={18} className="group-hover:rotate-45 transition-transform md:w-5 md:h-5" />
               </button>
            </div>

            <button 
              onClick={() => setIsCartOpen(true)}
              aria-label="Open Shopping Cart"
              className="group relative p-3 md:p-4 bg-[#C8961A] text-[#0A1628] hover:bg-white transition-all duration-500 rounded-xl md:rounded-2xl shadow-2xl active:scale-90"
            >
              <ShoppingBag size={20} className="relative z-10 md:w-5.5 md:h-5.5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-5 h-5 md:w-6 md:h-6 bg-[#C8102E] text-white text-[9px] md:text-[10px] font-black flex items-center justify-center rounded-full border-[2px] md:border-[3px] border-[#0A1628] shadow-lg">
                  {cartCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => setIsQuoteModalOpen(true)}
              className="hidden lg:flex items-center gap-3 bg-white text-[#0A1628] hover:bg-[#C8961A] hover:text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] transition-all duration-500 active:scale-95 shadow-[0_15px_40px_-5px_rgba(200,150,26,0.3)]"
            >
              <Package size={18} /> Catalog Quote
            </button>

            <button 
              onClick={() => setIsMenuOpen(true)} 
              className="xl:hidden p-3 md:p-4 text-white hover:bg-white/10 rounded-xl md:rounded-2xl transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu size={24} className="md:w-7 md:h-7" />
            </button>
          </div>
        </div>

        {/* Desktop Mega Menu Dropdown */}
        <AnimatePresence>
          {activeMegaMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute top-full left-0 w-full bg-white border-t border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] z-[90] pointer-events-auto"
            >
              <div className="max-w-[1440px] mx-auto grid grid-cols-12 gap-12 p-12 lg:px-12">
                {(() => {
                  const dynamicMenu = megaMenus.find(m => m.id === activeMegaMenu);
                  if (!dynamicMenu) return null;

                  return (
                    <>
                      <div className="col-span-8 grid grid-cols-3 gap-12">
                        {dynamicMenu.categories?.map((cat: any, idx: number) => (
                          <div key={idx} className="space-y-6">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-0.5 bg-[#C8961A]"></div>
                              <h4 className="text-[#0A1628] text-[11px] font-black tracking-[3px] uppercase">{cat.name}</h4>
                            </div>
                            <ul className="space-y-3">
                              {cat.items?.map((sub: string, sIdx: number) => (
                                <li key={sIdx}>
                                  <Link 
                                    to={activeMegaMenu === 'products' ? `/products#${cat.name.toLowerCase()}` : `/?tab=${activeMegaMenu}&sub=${sub}#shop`}
                                    className="text-slate-500 hover:text-[#0A1628] text-[12px] font-bold flex items-center justify-between group/link transition-all uppercase tracking-[1px] py-1 border-b border-transparent hover:border-slate-100"
                                  >
                                    {sub}
                                    <ChevronRight size={12} className="opacity-0 group-hover/link:opacity-100 -translate-x-2 group-hover/link:translate-x-0 transition-all text-[#C8961A]" />
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div className="col-span-4 border-l border-slate-100 pl-12 flex flex-col justify-center">
                        <div className="relative aspect-[16/10] rounded-3xl overflow-hidden group/feat shadow-2xl">
                          <img 
                            src={dynamicMenu.featured?.image || "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80"} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover/feat:scale-110" 
                            alt="Featured Collection" 
                            loading="lazy"
                            decode="async"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/20 to-transparent"></div>
                          <div className="absolute bottom-6 left-6 right-6">
                            <span className="text-[9px] text-[#C8961A] font-black uppercase tracking-[3px] mb-2 block font-sans">Special Edition</span>
                            <h5 className="text-white text-2xl font-bold mb-4 line-clamp-1">{dynamicMenu.featured?.title || 'Our Premium Selection'}</h5>
                            <Link 
                              to={dynamicMenu.featured?.link || '/products'} 
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A1628] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#C8961A] hover:text-white transition-all shadow-xl"
                            >
                              Shop Now <ChevronRight size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Sidebar Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-[#0A1628]/80 backdrop-blur-md lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-full max-w-[320px] bg-[#050B16] flex flex-col border-r border-[#C8961A]/10 shadow-[20px_0_100px_rgba(0,0,0,0.5)]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="font-display text-xl tracking-[4px] text-white">NAISIAE</div>
                  <div className="text-[7px] tracking-[3px] text-[#C8961A] font-black uppercase">Textiles Limited</div>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  aria-label="Close Mobile Menu"
                  className="p-3 text-white/50 hover:text-[#C8961A] bg-white/5 rounded-2xl hover:bg-[#C8961A]/10 transition-all border border-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Search Input */}
              <div className="p-6 border-b border-white/5 bg-[#0A1628]/30">
                <div className="relative group">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchQuery ? 'text-[#C8961A]' : 'text-white/30 group-focus-within:text-[#C8961A]'}`} size={16} />
                  <input 
                    type="text" 
                    placeholder="Search catalog, styles..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-[#C8961A]/30 focus:border-[#C8961A]/50 transition-all font-medium"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear Search"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Search Dropdown Panel */}
                <AnimatePresence>
                  {searchQuery && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="mt-4 bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
                    >
                      {searchResults.length > 0 ? (
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                          {searchResults.map((item, idx) => (
                            <Link 
                              key={`${item.type}-${item.id || idx}`}
                              to={item.type === 'product' ? '/products' : item.type === 'service' ? '/services' : '/categories'}
                              onClick={() => {
                                setIsMenuOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-3 p-4 hover:bg-white/5 border-b border-white/5 last:border-0 group transition-all"
                            >
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-[#C8961A]/30">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} className="w-full h-full object-cover rounded-lg" alt={item.name} />
                                ) : item.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white group-hover:text-[#C8961A] transition-colors truncate">{item.name}</p>
                                <span className="text-[8px] font-black uppercase text-[#C8961A]/50 tracking-[1px]">{item.type}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-[10px] text-white/30 uppercase tracking-[2px] font-bold">
                          No matches found
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation Action Container (Fixed Link-in-Button bug) */}
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {[
                  { name: 'Home', link: '/', icon: <ShoppingBag size={18} /> },
                  { name: 'Products', link: '/products', icon: <Package size={18} /> },
                  { name: 'Services', link: '/services', icon: <Zap size={18} /> },
                  { name: 'Portfolio', link: '/portfolio', icon: <ChevronRight size={18} /> },
                  { name: 'Catalog Quote', onClick: () => { setIsMenuOpen(false); setIsQuoteModalOpen(true); }, icon: <Plus size={18} />, highlight: true },
                ].map((item) => {
                  const commonStyle = `w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                    item.highlight 
                      ? 'bg-[#C8961A] text-[#0A1628] hover:bg-white' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`;

                  if (item.link) {
                    return (
                      <Link 
                        key={item.name} 
                        to={item.link} 
                        onClick={() => setIsMenuOpen(false)}
                        className={commonStyle}
                      >
                        <div className="flex items-center gap-4 w-full">
                          <span className={item.highlight ? '' : 'text-[#C8961A]/50 group-hover:text-[#C8961A]'}>{item.icon}</span>
                          <span className="text-sm font-bold tracking-wide uppercase">{item.name}</span>
                        </div>
                        <ChevronRight size={14} className={item.highlight ? 'opacity-50' : 'text-white/10 group-hover:text-[#C8961A]'} />
                      </Link>
                    );
                  }

                  return (
                    <button 
                      key={item.name}
                      onClick={item.onClick}
                      className={commonStyle}
                    >
                      <div className="flex items-center gap-4 w-full text-left">
                        <span className={item.highlight ? '' : 'text-[#C8961A]/50 group-hover:text-[#C8961A]'}>{item.icon}</span>
                        <span className="text-sm font-bold tracking-wide uppercase">{item.name}</span>
                      </div>
                      <ChevronRight size={14} className={item.highlight ? 'opacity-50' : 'text-white/10 group-hover:text-[#C8961A]'} />
                    </button>
                  );
                })}
              </div>

              {/* Footer Assistance */}
              <div className="p-6 mt-auto border-t border-white/5">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <div className="text-[8px] font-black text-[#C8961A] uppercase tracking-[3px] mb-2">Request Assistance</div>
                  <div className="text-white font-bold text-xs flex items-center justify-center gap-2">
                    <Phone size={14} className="text-[#C8961A]" />
                    +254 792 021 795
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
