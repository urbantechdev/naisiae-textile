import React from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Menu, 
  Phone, 
  Mail, 
  ChevronRight,
  Megaphone,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  siteSettings: any;
  promotions: any[];
  cartCount: number;
  wishlistCount: number;
  setIsCartOpen: (open: boolean) => void;
  setIsWishlistOpen: (open: boolean) => void;
  setIsMenuOpen: (open: boolean) => void;
  setIsQuoteModalOpen: (open: boolean) => void;
}

export function Navbar({ 
  siteSettings, 
  promotions, 
  cartCount, 
  wishlistCount,
  setIsCartOpen,
  setIsWishlistOpen,
  setIsMenuOpen,
  setIsQuoteModalOpen
}: NavbarProps) {
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

      {/* Top Bar */}
      <div className="hidden lg:flex bg-[#0A1628] text-white/50 text-[11.5px] py-2 border-b border-white/5">
        <div className="max-w-[1440px] mx-auto w-full px-8 flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <span className="flex items-center gap-1.5"><Phone size={12} /> <a href={`tel:${siteSettings?.contactPhone || '+254792021795'}`} className="hover:text-[#C8961A]">{siteSettings?.contactPhone || '+254 792 021 795'}</a></span>
            <div className="w-px h-3.5 bg-white/20"></div>
            <span className="flex items-center gap-1.5"><Mail size={12} /> <a href={`mailto:${siteSettings?.contactEmail || 'info@naisiaetextile.com'}`} className="hover:text-[#C8961A]">{siteSettings?.contactEmail || 'info@naisiaetextile.com'}</a></span>
          </div>
          <div className="flex gap-4 items-center">
            <span>Mon–Sat: 8am–6pm</span>
            <div className="w-px h-3.5 bg-white/20"></div>
            <span>7–14 Day Turnaround</span>
          </div>
        </div>
      </div>

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
              <div className="font-['Bebas_Neue'] text-2xl tracking-[4px] text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#FCD34D] to-[#D97706]">
                {siteSettings?.sharingTitle || 'NAISIAE TEXTILE'}
              </div>
              <div className="text-[8px] tracking-[3px] text-[#F59E0B]/70 uppercase font-bold">
                {siteSettings?.siteTagline || 'Uhuru Market Uniforms'}
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-10">
            {[
              { name: 'School Uniforms', link: '/#shop' },
              { name: 'Knitting', link: '/#shop' },
              { name: 'Branding', link: '/#shop' },
              { name: 'Wholesale', link: '/wholesale' },
              { name: 'About Us', link: '/about' },
              { name: 'Contact', link: '/contact' },
            ].map((item) => (
              <div key={item.name} className="group relative">
                <Link 
                  to={item.link} 
                  className="text-white/90 hover:text-[#C8961A] font-['Bebas_Neue'] text-lg tracking-[2px] h-[68px] flex items-center transition-colors"
                >
                  {item.name}
                </Link>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsWishlistOpen(true)}
              className="p-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors relative"
            >
              <Heart size={20} className={wishlistCount > 0 ? "fill-[#F0A500] text-[#F0A500]" : ""} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#F0A500] text-[#0A1628] text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#15284A]">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors relative"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#C8102E] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#15284A]">
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 text-white/80 hover:bg-white/10 rounded-lg">
              <Menu size={24} />
            </button>
            <button 
              onClick={() => setIsQuoteModalOpen(true)}
              className="hidden lg:flex bg-[#C8102E] hover:bg-[#8B0000] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-[#B91C1C]/30"
            >
              Get Quote
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
