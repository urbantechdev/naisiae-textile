import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Menu, 
  ChevronRight,
  Megaphone,
  GitCompare,
  Package
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, doc, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/firebase';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  compareCount?: number;
  setIsCartOpen: (open: boolean) => void;
  setIsWishlistOpen: (open: boolean) => void;
  setIsMenuOpen: (open: boolean) => void;
  setIsQuoteModalOpen: (open: boolean) => void;
  setIsCompareModalOpen?: (open: boolean) => void;
}

export function Navbar({ 
  cartCount, 
  wishlistCount,
  compareCount = 0,
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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    const unsubMenus = onSnapshot(collection(db, 'mega_menus'), (snapshot) => {
      setMegaMenus(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    const unsubSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) setSiteSettings(snapshot.data());
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
    };
  }, []);

  const navItems = [
    { name: 'Home', id: 'home', link: '/' },
    { name: 'Products', id: 'products', link: '/products', mega: true },
    { name: 'Services', id: 'services', link: '/services', mega: true },
    { name: 'Portfolio', id: 'portfolio', link: '/portfolio' },
    { name: 'Categories', id: 'categories', link: '/categories', mega: true }
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500">
      <AnimatePresence>
        {promotions.filter(p => p.type === 'top-bar').map(promo => (
          <motion.div 
            key={promo.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#C8102E] text-white overflow-hidden relative z-[110]"
          >
            <div className="max-w-[1440px] mx-auto px-4 py-2 flex items-center justify-center gap-6 text-[10px] font-black tracking-[2px] uppercase text-center">
              <Megaphone size={12} className="shrink-0" />
              <div className="flex items-center gap-3">
                <span className="hidden md:inline">{promo.title}</span>
                <span className="hidden md:inline w-1 h-1 rounded-full bg-white/40"></span>
                <span className="text-white/80">{promo.subtitle || promo.title}</span>
              </div>
              {promo.buttonLink && (
                <Link to={promo.buttonLink} className="underline hover:text-[#C8961A] transition-colors font-black">
                  {promo.buttonText}
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <header 
        className={`w-full transition-all duration-500 border-b ${
          isScrolled 
            ? 'bg-[#0A1628]/95 backdrop-blur-xl border-white/5 py-4 shadow-2xl' 
            : 'bg-transparent border-transparent py-6'
        }`}
        onMouseLeave={() => setActiveMegaMenu(null)}
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-4">
            <div className={`relative transition-all duration-500 ${isScrolled ? 'w-10 h-10' : 'w-14 h-14'}`}>
              <div className="absolute inset-0 bg-[#C8961A] rounded-xl rotate-6 group-hover:rotate-12 transition-transform opacity-20"></div>
              {siteSettings?.siteLogo ? (
                <img src={siteSettings.siteLogo} alt="Logo" className="w-full h-full object-contain relative z-10" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-lg text-white bg-gradient-to-br from-[#C8102E] to-[#8B0000] rounded-xl relative z-10 shadow-lg">NT</div>
              )}
            </div>
            <div className="flex flex-col">
              <span className={`font-display text-lg lg:text-2xl tracking-[5px] uppercase transition-colors duration-500 ${
                isScrolled ? 'text-white' : 'text-white'
              }`}>
                {siteSettings?.sharingTitle?.split(' ')[0] || 'NAISIAE'}
              </span>
              <span className="text-[7px] lg:text-[8px] tracking-[4px] text-white/50 uppercase font-black -mt-1 group-hover:text-[#C8961A] transition-colors">
                {siteSettings?.siteTagline || 'Textiles Limited'}
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {navItems.map((item) => (
              <div 
                key={item.id} 
                className="relative h-12 flex items-center"
                onMouseEnter={() => item.mega && setActiveMegaMenu(item.id)}
              >
                <Link 
                  to={item.link} 
                  className="text-[10px] font-black uppercase tracking-[3px] transition-all duration-300 relative group py-2 px-1 text-white hover:text-[#C8961A]"
                >
                  {item.name}
                  <span className={`absolute bottom-0 left-0 h-[2px] bg-[#C8961A] transition-all duration-500 ${
                    activeMegaMenu === item.id ? 'w-full' : 'w-0'
                  } group-hover:w-full`}></span>
                </Link>
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-1 lg:gap-3">
            <div className="flex items-center gap-1 mr-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 hidden sm:flex">
               <button onClick={() => setIsWishlistOpen(true)} className="p-2 text-white/70 hover:text-[#F0A500] transition-colors relative group">
                 <Heart size={18} className={wishlistCount > 0 ? "fill-[#F0A500] text-[#F0A500]" : "group-hover:scale-110 transition-transform"} />
                 {wishlistCount > 0 && (
                   <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F0A500] text-[#0A1628] text-[8px] font-black flex items-center justify-center rounded-full">
                     {wishlistCount}
                   </span>
                 )}
               </button>
               <div className="w-[1px] h-4 bg-white/10"></div>
               <button onClick={() => setIsCompareModalOpen?.(true)} className="p-2 text-white/70 hover:text-[#C8961A] transition-colors relative group">
                 <GitCompare size={18} className={compareCount > 0 ? "text-[#C8961A]" : "group-hover:rotate-12 transition-transform"} />
               </button>
            </div>

            <button 
              onClick={() => setIsCartOpen(true)}
              className="group relative p-3 bg-white hover:bg-[#C8961A] text-[#0A1628] hover:text-white rounded-xl transition-all duration-300 shadow-xl active:scale-95"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#C8102E] text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-[#0A1628]">
                  {cartCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => setIsMenuOpen(true)} 
              className="lg:hidden p-3 text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>

            <button 
              onClick={() => setIsQuoteModalOpen(true)}
              className="hidden lg:flex items-center gap-2 bg-[#C8102E] hover:bg-white text-white hover:text-[#C8102E] border-2 border-[#C8102E] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all duration-300 active:scale-95 ml-2 shadow-lg shadow-[#C8102E]/20"
            >
              Get Quote
            </button>
          </div>
        </div>

        <AnimatePresence>
          {activeMegaMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute top-full left-0 w-full bg-[#0A1628]/98 backdrop-blur-2xl border-t border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] z-[90] pointer-events-auto"
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
                              <h4 className="text-white text-[11px] font-black tracking-[3px] uppercase">{cat.name}</h4>
                            </div>
                            <ul className="space-y-3">
                              {cat.items?.map((sub: string, sIdx: number) => (
                                <li key={sIdx}>
                                  <Link 
                                    to={activeMegaMenu === 'products' ? `/products#${cat.name.toLowerCase()}` : `/?tab=${activeMegaMenu}&sub=${sub}#shop`}
                                    className="text-white/50 hover:text-white text-[12px] font-bold flex items-center justify-between group/link transition-all uppercase tracking-[1px] py-1 border-b border-transparent hover:border-white/10"
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

                      <div className="col-span-4 border-l border-white/5 pl-12 flex flex-col justify-center">
                        <div className="relative aspect-[16/10] rounded-3xl overflow-hidden group/feat shadow-2xl">
                          <img 
                            src={dynamicMenu.featured?.image || "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80"} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover/feat:scale-110" 
                            alt="Featured" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/40 to-transparent"></div>
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
    </div>
  );
}

