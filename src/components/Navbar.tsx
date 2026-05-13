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
      let menus: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // If no data in DB, provide default fallbacks so the UI isn't broken
      if (menus.length === 0) {
        menus = [
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
      }
      setMegaMenus(menus);
    }, (error) => {
      console.error('Mega menus fetch error:', error);
      // Fallback for demo/missing data
      setMegaMenus([
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
        }
      ]);
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
            ? 'bg-[#050B16]/95 backdrop-blur-2xl py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
            : 'bg-[#050B16] py-8'
        }`}
        onMouseLeave={() => setActiveMegaMenu(null)}
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20 flex items-center justify-between gap-12">
          {/* Brand Identity */}
          <Link to="/" className="group flex items-center gap-5 shrink-0">
            <div className={`relative transition-all duration-700 ${isScrolled ? 'w-12 h-12' : 'w-16 h-16'}`}>
              <div className="absolute inset-0 bg-[#C8961A]/20 blur-[15px] group-hover:blur-[25px] transition-all rounded-full"></div>
              {siteSettings?.siteLogo ? (
                <img src={siteSettings.siteLogo} alt="Logo" className="w-full h-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-2xl text-[#C8961A] bg-[#0A1628] border border-[#C8961A]/30 rounded-2xl relative z-10 shadow-2xl overflow-hidden group-hover:border-[#C8961A] transition-all">
                  <span className="relative z-10">NT</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#C8961A]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className={`font-display text-xl lg:text-3xl tracking-[8px] uppercase transition-all duration-700 leading-none ${
                isScrolled ? 'text-white' : 'text-white'
              }`}>
                {siteSettings?.siteName?.split(' ')[0] || 'NAISIAE'}
              </span>
              <span className="text-[8px] tracking-[5px] text-[#C8961A] uppercase font-black mt-1 group-hover:translate-x-1 transition-transform">
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
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hidden sm:flex">
               <button onClick={() => setIsWishlistOpen(true)} title="Wishlist" className="p-2 text-white/50 hover:text-[#F0A500] transition-colors relative group">
                 <Heart size={20} className={wishlistCount > 0 ? "fill-[#F0A500] text-[#F0A500]" : "group-hover:scale-110 transition-transform"} />
                 {wishlistCount > 0 && (
                   <span className="absolute top-1 right-1 w-2 h-2 bg-[#F0A500] rounded-full animate-ping"></span>
                 )}
               </button>
               <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
               <button onClick={() => setIsCompareModalOpen?.(true)} title="Compare" className="p-2 text-white/50 hover:text-[#C8961A] transition-colors relative group">
                 <GitCompare size={20} className="group-hover:rotate-45 transition-transform" />
               </button>
            </div>

            <button 
              onClick={() => setIsCartOpen(true)}
              className="group relative p-4 bg-[#C8961A] text-[#0A1628] hover:bg-white transition-all duration-500 rounded-2xl shadow-2xl active:scale-90"
            >
              <ShoppingBag size={22} className="relative z-10" />
              {cartCount > 0 && (
                <span className="absolute -top-3 -right-3 w-6 h-6 bg-[#C8102E] text-white text-[10px] font-black flex items-center justify-center rounded-full border-[3px] border-[#0A1628] shadow-lg">
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
              className="xl:hidden p-4 text-white hover:bg-white/10 rounded-2xl transition-colors"
            >
              <Menu size={28} />
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
                            alt="Featured" 
                            loading="lazy"
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
    </div>
  );
}

