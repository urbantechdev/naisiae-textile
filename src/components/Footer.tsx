import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function Footer() {
  const { siteSettings } = useCart();

  return (
    <footer className="bg-[#0E121C] text-white/40 pt-20 pb-32 md:pb-20 px-6 border-t border-white/5">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16 px-4">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-3 mb-6">
            <div className="overflow-hidden shrink-0">
              {siteSettings?.siteLogo ? (
                <img src={siteSettings.siteLogo} alt={siteSettings?.siteName || 'Naisiae Textile'} className="w-14 h-14 object-contain" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center font-black text-xs text-white bg-gradient-to-tr from-[#00C4CC] via-[#7D2AE8] to-[#FF4F5A] rounded-xl relative shadow-lg overflow-hidden select-none lowercase font-[Comfortaa]">canva</div>
              )}
            </div>
            <div className="leading-tight text-left">
              <div className="font-display text-2xl tracking-tight text-white uppercase font-black bg-gradient-to-r from-[#00C4CC] via-[#7D2AE8] to-[#FF4F5A] bg-clip-text text-transparent">
                {siteSettings?.siteName || 'Naisiae'}
              </div>
              <div className="text-[10px] tracking-[2px] text-[#00C4CC] uppercase font-bold">
                Naisiae Textiles, Nairobi
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-sm mb-4">
            Established at the heart of Nairobi, <strong>Uhuru Market Uniforms</strong> by Naisiae Textiles is your trusted partner for high-quality school uniforms, custom knitwear, and industrial branding.
          </p>
          <div className="text-[10px] text-white/20 italic max-w-xs">
            Serving schools across Kenya from our specialized workshop at Uhuru Market stalls.
          </div>
        </div>
        <div className="text-center md:text-left hidden md:block">
          <h4 className="font-display text-xl tracking-[2px] text-white border-b-2 border-[#00C4CC] pb-1.5 mb-6 inline-block md:block">Company</h4>
          <ul className="space-y-4 text-sm font-bold">
            <li><Link to="/about" className="hover:text-[#00C4CC] transition-colors flex items-center justify-center md:justify-start gap-3">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-[#00C4CC] transition-colors flex items-center justify-center md:justify-start gap-3">Contact Us</Link></li>
            <li><Link to="/portfolio" className="hover:text-[#00C4CC] transition-colors flex items-center justify-center md:justify-start gap-3">Our Portfolio</Link></li>
            <li><Link to="/services" className="hover:text-[#00C4CC] transition-colors flex items-center justify-center md:justify-start gap-3">Services</Link></li>
          </ul>
        </div>
        <div className="text-center md:text-left hidden md:block">
           <h4 className="font-display text-xl tracking-[2px] text-white border-b-2 border-[#00C4CC] pb-1.5 mb-6 inline-block md:block">Support</h4>
           <ul className="space-y-4 text-sm font-bold">
            <li><Link to="/terms" className="hover:text-[#00C4CC] transition-colors flex items-center justify-center md:justify-start gap-3">Terms & Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-[#00C4CC] transition-colors flex items-center justify-center md:justify-start gap-3">Privacy Policy</Link></li>
            <li><Link to="/shipping" className="hover:text-[#00C4CC] transition-colors flex items-center justify-center md:justify-start gap-3">Shipping Policy</Link></li>
            <li><Link to="/returns" className="hover:text-[#00C4CC] transition-colors flex items-center justify-center md:justify-start gap-3">Returns & Refunds</Link></li>
          </ul>
        </div>
        <div className="text-center md:text-left">
          <h4 className="font-display text-xl tracking-[2px] text-white border-b-2 border-[#00C4CC] pb-1.5 mb-6 inline-block md:block">Contact</h4>
          <div className="space-y-6 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#00C4CC] group-hover:bg-[#00C4CC] group-hover:text-black transition-all"><Phone size={20} /></div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase text-white/30 tracking-widest">Phone</div>
                <div className="text-white font-bold text-sm">{siteSettings?.contactPhone || '+254 792 021 795'}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#00C4CC] group-hover:bg-[#00C4CC] group-hover:text-black transition-all"><Mail size={20} /></div>
              <div className="text-left">
               <div className="text-[10px] font-black uppercase text-white/30 tracking-widest">Email</div>
               <div className="text-white font-bold text-sm truncate max-w-[200px]">{siteSettings?.contactEmail || 'support@naisiaetextiles.com'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-8 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest gap-6 sm:gap-2">
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 order-2 md:order-1 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span>© 2026 Naisiae Textiles Limited. All rights reserved.</span>
            <Link to="/admin" className="text-white/5 hover:text-[#00C4CC]/20 transition-colors" title="Management">
              <ShieldCheck size={10} />
            </Link>
          </div>
          <a 
            href="https://urbantechdev.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-[#C8102E] transition-all duration-300 flex items-center gap-3 group border-l border-white/10 pl-6 ml-6 hidden md:flex opacity-100"
          >
            <span className="text-[8px] font-black uppercase tracking-widest text-[#C8961A]">Developed by</span>
            <img 
              src="https://i.pinimg.com/736x/db/1d/a7/db1da77cd40c393aa9193e28d40ebffa.jpg" 
              alt="Urban Technology Developers" 
              className="h-6 w-auto object-contain rounded-sm brightness-110 contrast-110"
              referrerPolicy="no-referrer"
            />
          </a>
          {/* Mobile version */}
          <a 
            href="https://urbantechdev.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="md:hidden transition-all mt-4 flex flex-col items-center gap-2 opacity-100"
          >
            <span className="text-[8px] uppercase tracking-widest font-black text-[#C8961A]">Developed by </span>
            <img 
              src="https://i.pinimg.com/736x/db/1d/a7/db1da77cd40c393aa9193e28d40ebffa.jpg" 
              alt="Urban Technology Developers" 
              className="h-5 w-auto object-contain rounded-sm brightness-110 contrast-110"
              referrerPolicy="no-referrer"
            />
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
