import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Fingerprint } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function Footer() {
  const { siteSettings } = useCart();

  return (
    <footer className="bg-[#0E121C] text-white/40 pt-20 pb-32 md:pb-20 px-6 border-t border-white/5">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16 px-4">
        {/* Column 1: Brand Info */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-3 mb-6">
            <div className="overflow-hidden shrink-0">
              {siteSettings?.siteLogo ? (
                <img src={siteSettings.siteLogo} alt={siteSettings?.siteName || 'Naisiae Textile'} className="w-14 h-14 object-contain" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center font-black text-xs text-white bg-gradient-to-tr from-[#C8102E] via-[#E94C36] to-[#C8961A] rounded-xl relative shadow-lg overflow-hidden select-none lowercase font-sans">nt</div>
              )}
            </div>
            <div className="leading-tight text-left">
              <div className="font-display text-2xl tracking-tight text-white uppercase font-black bg-gradient-to-r from-[#C8102E] via-[#E94C36] to-[#C8961A] bg-clip-text text-transparent">
                {siteSettings?.siteName || 'Naisiae'}
              </div>
              <div className="text-[10px] tracking-[2px] text-[#C8961A] uppercase font-bold">
                Naisiae Textiles, Nairobi
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-sm mb-4">
            Established at the heart of Nairobi, <strong>Uhuru Market Uniforms</strong> by Naisiae Textiles is your trusted partner for high-quality school uniforms, custom knitwear, and industrial branding.
          </p>
          <div className="text-[10px] text-white/20 italic max-w-xs">
            Serving schools across East & Central Africa from our specialized workshop at Uhuru Market.
          </div>
        </div>

        {/* Column 2: Company Links */}
        <div className="text-center md:text-left">
          <h4 className="font-display text-base tracking-[2px] uppercase text-white border-b-2 border-[#C8961A] pb-1.5 mb-6 inline-block md:block">Company</h4>
          <ul className="space-y-4 text-sm font-bold">
            <li><Link to="/about" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-3">About Us</Link></li>
            <li><Link to="/services" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-3">Services</Link></li>
            <li><Link to="/portfolio" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-3">Our Portfolio</Link></li>
            <li><Link to="/careers" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-3">Careers</Link></li>
            <li><Link to="/contact" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-3">Contact Us</Link></li>
          </ul>
        </div>

        {/* Column 3: Solutions & Tools */}
        <div className="text-center md:text-left">
           <h4 className="font-display text-base tracking-[2px] uppercase text-white border-b-2 border-[#C8961A] pb-1.5 mb-6 inline-block md:block">Explore</h4>
           <ul className="space-y-4 text-sm font-bold">
            <li><Link to="/uniform-simulator" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-3">Uniform Simulator</Link></li>
            <li><Link to="/categories" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-3">Product Categories</Link></li>
            <li><Link to="/fabric-gallery" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-3">Fabric Gallery</Link></li>
            <li><Link to="/wholesale" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-3">Wholesale Supply</Link></li>
            <li><Link to="/faq" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-3">Help & FAQ</Link></li>
          </ul>
        </div>

        {/* Column 4: Regional Hubs (SEO optimized for targets) */}
        <div className="text-center md:text-left">
           <h4 className="font-display text-base tracking-[2px] uppercase text-white border-b-2 border-[#C8961A] pb-1.5 mb-6 inline-block md:block">Regional Hubs</h4>
           <ul className="space-y-4 text-sm font-bold">
            <li>
              <Link to="/" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-2.5 group">
                <img src="https://flagcdn.com/w40/ke.png" alt="Kenya Flag" className="w-5 h-3.5 object-cover rounded-sm border border-white/10 group-hover:border-[#C8961A]/30 transition-colors shrink-0" referrerPolicy="no-referrer" />
                <span>Kenya (Nairobi HQ)</span>
              </Link>
            </li>
            <li>
              <Link to="/tanzania" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-2.5 group">
                <img src="https://flagcdn.com/w40/tz.png" alt="Tanzania Flag" className="w-5 h-3.5 object-cover rounded-sm border border-white/10 group-hover:border-[#C8961A]/30 transition-colors shrink-0" referrerPolicy="no-referrer" />
                <span>Tanzania Hub</span>
              </Link>
            </li>
            <li>
              <Link to="/dr-congo" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-2.5 group">
                <img src="https://flagcdn.com/w40/cd.png" alt="DR Congo Flag" className="w-5 h-3.5 object-cover rounded-sm border border-white/10 group-hover:border-[#C8961A]/30 transition-colors shrink-0" referrerPolicy="no-referrer" />
                <span>DR Congo Hub</span>
              </Link>
            </li>
            <li>
              <Link to="/uganda" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-2.5 group">
                <img src="https://flagcdn.com/w40/ug.png" alt="Uganda Flag" className="w-5 h-3.5 object-cover rounded-sm border border-white/10 group-hover:border-[#C8961A]/30 transition-colors shrink-0" referrerPolicy="no-referrer" />
                <span>Uganda Hub</span>
              </Link>
            </li>
            <li>
              <Link to="/ethiopia" className="hover:text-[#C8961A] transition-colors flex items-center justify-center md:justify-start gap-2.5 group">
                <img src="https://flagcdn.com/w40/et.png" alt="Ethiopia Flag" className="w-5 h-3.5 object-cover rounded-sm border border-white/10 group-hover:border-[#C8961A]/30 transition-colors shrink-0" referrerPolicy="no-referrer" />
                <span>Ethiopia Hub</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 5: Contact Info */}
        <div className="text-center md:text-left">
          <h4 className="font-display text-base tracking-[2px] uppercase text-white border-b-2 border-[#C8961A] pb-1.5 mb-6 inline-block md:block">Contact</h4>
          <div className="space-y-6 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C8961A] group-hover:bg-[#C8961A] group-hover:text-black transition-all"><Phone size={18} /></div>
              <div className="text-left">
                <div className="text-[9px] font-black uppercase text-white/30 tracking-widest">Phone</div>
                <div className="text-white font-bold text-sm">{siteSettings?.contactPhone || '+254 792 021 795'}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C8961A] group-hover:bg-[#C8961A] group-hover:text-black transition-all"><Mail size={18} /></div>
              <div className="text-left">
               <div className="text-[9px] font-black uppercase text-white/30 tracking-widest">Email</div>
               <div className="text-white font-bold text-sm truncate max-w-[150px]">{siteSettings?.contactEmail || 'support@naisiaetextiles.com'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-8 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest gap-6 sm:gap-2">
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 order-2 md:order-1 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span>© 2026 Naisiae Textiles Limited. All rights reserved.</span>
            <Link 
              to="/admin" 
              className="inline-flex items-center justify-center ml-1.5 p-1 rounded-md text-white/5 hover:text-[#C8961A] hover:bg-white/[0.03] transition-all duration-300 hover:scale-[1.15] active:scale-90 group cursor-pointer" 
              title="Secure Console"
            >
              <Fingerprint size={12} className="transition-transform duration-500 group-hover:rotate-45" />
            </Link>
          </div>
          <a 
            href="https://urbantechdev.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-[#C8102E] transition-all duration-300 flex items-center gap-3 group border-l border-white/10 pl-6 ml-6 hidden md:flex opacity-100"
          >
            <span className="text-[8px] font-black uppercase tracking-widest text-[#C8961A]">Developed by</span>
            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              <svg className="h-4 w-auto fill-none stroke-[#C8961A]" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span className="font-mono text-[9px] font-black tracking-[2px] text-white/90">URBAN<span className="text-[#C8961A]">TECH</span></span>
            </div>
          </a>
          {/* Mobile version */}
          <a 
            href="https://urbantechdev.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="md:hidden transition-all mt-4 flex flex-col items-center gap-2 opacity-100"
          >
            <span className="text-[8px] uppercase tracking-widest font-black text-[#C8961A]">Developed by </span>
            <div className="flex items-center gap-1.5 opacity-80">
              <svg className="h-3.5 w-auto fill-none stroke-[#C8961A]" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span className="font-mono text-[8px] font-black tracking-[2px] text-white/90">URBAN<span className="text-[#C8961A]">TECH</span></span>
            </div>
          </a>
        </div>
        <div className="flex flex-col items-center md:items-end gap-3 order-1 md:order-2">
          {/* Secure payment options visual row for Google Merchant Center crawler */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 mb-1">
            <span className="text-[8px] font-black text-white/30 tracking-[1.5px] uppercase mr-1 hidden sm:inline">Accepted Payments:</span>
            <span className="bg-white/5 text-white/70 px-2 py-0.5 rounded text-[8px] font-mono border border-white/5 font-extrabold shadow-sm select-none">M-PESA</span>
            <span className="bg-white/5 text-white/70 px-2 py-0.5 rounded text-[8px] font-mono border border-white/5 font-extrabold shadow-sm select-none">VISA</span>
            <span className="bg-white/5 text-white/70 px-2 py-0.5 rounded text-[8px] font-mono border border-white/5 font-extrabold shadow-sm select-none">MASTERCARD</span>
            <span className="bg-white/5 text-white/70 px-2 py-0.5 rounded text-[8px] font-mono border border-white/5 font-extrabold shadow-sm select-none">EFT/BANK</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-6 gap-y-2">
            <Link to="/privacy" className="hover:text-white transition-colors font-bold text-[10px] md:text-[10px] uppercase">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors font-bold text-[10px] md:text-[10px] uppercase">Terms</Link>
            <Link to="/shipping" className="hover:text-white transition-colors font-bold text-[10px] md:text-[10px] uppercase">Shipping</Link>
            <Link to="/returns" className="hover:text-white transition-colors font-bold text-[10px] md:text-[10px] uppercase">Returns</Link>
            <Link to="/contact" className="hover:text-white transition-colors font-bold text-[10px] md:text-[10px] uppercase">Contact</Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
