import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, ShieldCheck } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

export function Footer() {
  const [siteSettings, setSiteSettings] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) setSiteSettings(snapshot.data());
    });
    return () => unsubscribe();
  }, []);

  return (
    <footer className="bg-[#0A1628] text-white/40 py-20 px-6 border-t border-white/5">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="overflow-hidden shrink-0">
              {siteSettings?.siteLogo ? (
                <img src={siteSettings.siteLogo} alt={siteSettings?.siteName || 'Naisiae Textile'} className="w-14 h-14 object-contain" />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center font-black text-xl text-[#C8102E] bg-white rounded-xl border-4 border-[#C8102E]">NT</div>
              )}
            </div>
            <div className="leading-tight">
              <div className="font-display text-2xl tracking-[2px] text-white uppercase">
                {siteSettings?.siteName || 'Naisiae Textile'}
              </div>
              <div className="text-[10px] tracking-[2px] text-[#C8961A] uppercase font-bold">
                Uhuru Market, Nairobi
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-6">Your trusted partner for quality school uniforms, custom knitwear and professional branding services across Kenya.</p>
        </div>
        <div>
          <h4 className="font-display text-xl tracking-[2px] text-white border-b-2 border-[#C8102E] pb-2 mb-6">Company</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/about" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Contact Us</Link></li>
            <li><Link to="/portfolio" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Our Portfolio</Link></li>
            <li><Link to="/services" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Services</Link></li>
          </ul>
        </div>
        <div>
           <h4 className="font-display text-xl tracking-[2px] text-white border-b-2 border-[#C8102E] pb-2 mb-6">Support</h4>
           <ul className="space-y-3 text-sm">
            <li><Link to="/terms" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Terms & Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Privacy Policy</Link></li>
            <li><Link to="/shipping" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Shipping Policy</Link></li>
            <li><Link to="/returns" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Returns & Refunds</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-xl tracking-[2px] text-white border-b-2 border-[#C8102E] pb-2 mb-6">Contact</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#C8961A]"><Phone size={18} /></div>
              <div>
                <div className="text-[10px] font-bold uppercase text-white/50">Phone</div>
                <div className="text-white font-bold">{siteSettings?.contactPhone || '+254 792 021 795'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#C8961A]"><Mail size={18} /></div>
              <div>
               <div className="text-[10px] font-bold uppercase text-white/50">Email</div>
               <div className="text-white font-bold">support@naisiaetextile.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs">
        <div className="flex items-center gap-3">
          <span>© 2026 Uhuru Market Uniforms. All rights reserved.</span>
          <Link to="/admin" className="text-white/5 hover:text-[#C8961A]/20 transition-colors" title="Management">
            <ShieldCheck size={10} />
          </Link>
        </div>
        <div className="mt-4 md:mt-0 flex gap-6">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link to="/shipping" className="hover:text-white transition-colors">Shipping</Link>
          <Link to="/returns" className="hover:text-white transition-colors">Returns</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
