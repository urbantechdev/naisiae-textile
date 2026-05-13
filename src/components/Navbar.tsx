import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Menu, 
  Phone, 
  Mail, 
  ChevronRight,
  Megaphone,
  GitCompare,
  Package
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, doc, query, where } from 'firebase/firestore';
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

  useEffect(() => {
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
      unsubMenus();
      unsubSettings();
      unsubPromos();
    };
  }, []);

  return (
    <div className="font-sans text-[#0A1628]">
      {/* Top Promotion Bar */}
      {promotions.filter(p => p.type === 'top-bar').map(promo => (
        <div key={promo.id} className="bg-[#1C3560] text-white py-2 px-4 text-center text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-4 animate-in fade-in slide-in-from-top duration-500 z-[60] relative">
          <Megaphone size={12} className="text-[#C8961A]" />
          <span>{promo.title} — {promo.subtitle}</span>
          {promo.buttonLink && (
            <Link to={promo.buttonLink} className="underline hover:text-[#C8961A] transition-colors ml-2 font-black">{promo.buttonText}</Link>
          )}
        </div>
      ))}

      {/* Main Navbar */}
      <nav className="sticky top-0 z-50 bg-gradient-to-b from-[#0A1628] to-[#15284A] shadow-xl">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 flex items-center h-[68px] justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="overflow-hidden">
              {siteSettings?.siteLogo ? (
                <img src={siteSettings.siteLogo} alt="Logo" className="w-14 h-14 object-contain" />
              ) : (
                <div className="w-14 h-14 flex items-center justify-center font-bold text-xl text-[#C8102E]">NT</div>
              )}
            </div>
            <div className="leading-tight">
              <div className="font-display text-xl lg:text-2xl tracking-[4px] text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#FCD34D] to-[#D97706]">
                <span className="lg:hidden">NAISIAE</span>
                <span className="hidden lg:inline">{siteSettings?.sharingTitle || 'NAISIAE TEXTILE'}</span>
              </div>
              <div className="text-[8px] tracking-[3px] text-[#F59E0B]/70 uppercase font-bold">
                {siteSettings?.siteTagline || 'Naisiae Textiles Limited'}
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-10">
            {[
              { name: 'Home', id: 'home', link: '/' },
              { 
                name: 'Products', 
                id: 'products', 
                link: '/products',
                mega: {
                   featured: {
                     title: 'Wholesale Solutions',
                     image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80',
                     link: '/products#wholesale'
                   },
                   categories: [
                     { name: 'Wholesale', items: ['Bulk Orders', 'School Supply', 'Corporate Deals'] },
                     { name: 'Design', items: ['Template Designs', 'Color Options', 'Catalog'] },
                     { name: 'Custom', items: ['Bespoke Weave', 'Performance Fabric', 'Unique Patterns'] }
                   ]
                }
              },
              { 
                name: 'Services', 
                id: 'services', 
                link: '/services',
                mega: {
                  featured: {
                    title: 'Embroidery Excellence',
                    image: 'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?auto=format&fit=crop&q=80',
                    link: '/services#embroidery'
                  },
                  categories: [
                    { name: 'Knitting', items: ['Sweaters', 'Cardigans', 'Pullovers', 'Vests'] },
                    { name: 'Embroidery', items: ['Logos', 'Badges', '3D Puff', 'Monograms'] },
                    { name: 'Branding', items: ['Screen Printing', 'Vinyl Press', 'Promotional Items'] }
                  ]
                }
              },
              { name: 'Portfolio', id: 'portfolio', link: '/portfolio' },
              { 
                name: 'Categories', 
                id: 'categories', 
                link: '/categories',
                mega: {
                  featured: {
                    title: 'School Uniforms',
                    image: 'https://images.unsplash.com/photo-1544717305-27a734ef1904?auto=format&fit=crop&q=80',
                    link: '/categories#school'
                  },
                  categories: [
                    { name: 'School Uniforms', items: ['Primary', 'Secondary', 'College'] },
                    { name: 'Casual Wear', items: ['T-Shirts', 'Hoodies', 'Tracksuits'] },
                    { name: 'Corporate Wear', items: ['Shirts', 'Suits', 'Workwear'] }
                  ]
                }
              },
            ].map((defaultItem) => {
              const dynamicMega = megaMenus.find(m => m.id === defaultItem.id);
              const item = {
                ...defaultItem,
                mega: dynamicMega ? {
                  ...defaultItem.mega,
                  featured: dynamicMega.featured || defaultItem.mega?.featured,
                  categories: dynamicMega.categories || defaultItem.mega?.categories
                } : defaultItem.mega
              };

              return (
                <div key={item.id} className="group relative">
                  <Link 
                    to={item.link || `/?tab=${item.name}#shop`} 
                    className="text-white/90 hover:text-[#C8961A] font-sans text-sm font-semibold tracking-wider h-[68px] flex items-center transition-colors uppercase"
                  >
                    {item.name}
                  </Link>
                  
                  {item.mega && (
                    <div className="absolute top-[68px] left-1/2 -translate-x-1/2 w-[1100px] bg-white shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] rounded-b-[2rem] p-12 opacity-0 invisible translate-y-4 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-500 z-[100] border border-slate-100 flex gap-16">
                      <div className="flex-1 grid grid-cols-3 gap-12">
                        {item.mega.categories.map((cat: any) => (
                          <div key={cat.name}>
                            <h4 className="font-sans text-[#0A1628] text-base font-bold tracking-wider mb-6 border-b-2 border-slate-100 pb-3 uppercase">{cat.name}</h4>
                            <ul className="space-y-3">
                              {cat.items.map((sub: string) => (
                                <li key={sub}>
                                  <Link 
                                    to={
                                      item.id === 'products' ? `/products#${cat.name.toLowerCase()}` : 
                                      item.id === 'services' ? `/services#${sub.toLowerCase()}` :
                                      item.id === 'categories' ? `/categories#${cat.name.split(' ')[0].toLowerCase()}` :
                                      `/?tab=${item.name}&sub=${sub}#shop`
                                    } 
                                    onClick={() => {}} 
                                    className="text-[12px] text-[#64748B] hover:text-[#C8102E] font-black flex items-center justify-between group/link transition-all uppercase tracking-[2px]"
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
                      <div className="w-[320px] shrink-0 border-l border-slate-100 pl-16">
                        <div className="relative h-full rounded-2xl overflow-hidden group/feat shadow-xl flex items-center justify-center bg-[#0A1628]">
                          {item.mega.featured.image ? (
                            <img src={item.mega.featured.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover/feat:scale-110" alt={item.mega.featured.title} />
                          ) : (
                            <div className="text-white/20"><Package size={64} /></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/40 to-transparent"></div>
                          <div className="absolute bottom-6 left-6 right-6">
                            <p className="text-[10px] text-[#C8961A] font-black uppercase tracking-[4px] mb-2">Editor's Pick</p>
                            <h5 className="text-white font-display text-3xl leading-none mb-4">{item.mega.featured.title}</h5>
                            <Link to={item.mega.featured.link || `/?tab=${item.name}#shop`} className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-[10px] text-white hover:bg-[#C8102E] hover:border-[#C8102E] transition-all uppercase font-black tracking-widest">
                              Shop Collection <ChevronRight size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (window.location.pathname === '/') setIsWishlistOpen(true);
                else window.location.href = '/?action=wishlist';
              }}
              className="p-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors relative"
            >
              <Heart size={20} className={wishlistCount > 0 ? "fill-[#F0A500] text-[#F0A500]" : ""} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#F0A500] text-[#0A1628] text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#15284A]">
                  {wishlistCount}
                </span>
              )}
            </button>
            
            {setIsCompareModalOpen && (
              <button 
                onClick={() => {
                  if (window.location.pathname === '/') setIsCompareModalOpen(true);
                  else window.location.href = '/?action=compare';
                }}
                className="p-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors relative"
                title="Compare Products"
              >
                <GitCompare size={20} className={compareCount > 0 ? "text-[#C8961A]" : ""} />
                {compareCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#C8961A] text-[#0A1628] text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#15284A]">
                    {compareCount}
                  </span>
                )}
              </button>
            )}

            <button 
              onClick={() => {
                if (window.location.pathname === '/') setIsCartOpen(true);
                else window.location.href = '/?action=cart';
              }}
              className="p-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors relative"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#C8102E] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#15284A]">
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={() => {
                if (window.location.pathname === '/') setIsMenuOpen(true);
                else window.location.href = '/?action=menu';
              }} className="lg:hidden p-2 text-white/80 hover:bg-white/10 rounded-lg">
              <Menu size={24} />
            </button>
            <Link to="/contact" 
              className="hidden lg:flex bg-[#C8102E] hover:bg-[#8B0000] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-[#B91C1C]/30"
            >
              Get Quote
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
