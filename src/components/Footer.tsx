import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLocalization } from '../context/LocalizationContext';

export function Footer() {
  const { siteSettings } = useCart();
  const { currentCountry } = useLocalization();

  const brandName = siteSettings?.siteName || 'Naisiae Textiles';
  const contactPhone = siteSettings?.contactPhone || '+254 792 021 795';
  const contactEmail = siteSettings?.contactEmail || 'support@naisiaetextiles.com';

  return (
    <footer className="bg-[#04023D] text-slate-400 py-12 px-6 lg:px-12 border-t border-white/10 font-sans">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand Info */}
        <div className="space-y-4">
          <Link to="/" className="inline-block">
            <span className="font-display text-2xl font-black text-white">{brandName}</span>
          </Link>
          <div className="hidden md:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-[#FA9411]/50 text-[#FA9411] text-[11px] font-black uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FA9411] animate-pulse"></span>
              <span>Powered by Urbantechdev</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            Naisiae Textiles, Uhuru Market, Nairobi. The ultimate school uniform manufacturer and supplier.
          </p>
        </div>

        {/* Essential Links */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-widest">Shop</h4>
            <Link to="/products" className="block hover:text-white transition-colors">Products</Link>
            <Link to="/categories" className="block hover:text-white transition-colors">Categories</Link>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-widest">Company</h4>
            <Link to="/about" className="block hover:text-white transition-colors">About Us</Link>
            <Link to="/contact" className="block hover:text-white transition-colors">Contact</Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3 text-xs">
          <h4 className="font-bold text-white uppercase tracking-widest">Connect</h4>
          <p>{contactPhone}</p>
          <p>{contactEmail}</p>
        </div>
      </div>

      {/* Sub-footer */}
      <div className="max-w-[1440px] mx-auto mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <p>© 2026 {brandName}. All rights reserved.</p>
          <span className="hidden md:inline text-slate-600">•</span>
          <p className="hidden md:block font-bold text-[#FA9411] tracking-wider uppercase">Powered by Urbantechdev</p>
        </div>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
