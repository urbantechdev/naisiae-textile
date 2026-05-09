import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, ShieldCheck } from 'lucide-react';

interface FooterProps {
  siteSettings: any;
}

export function Footer({ siteSettings }: FooterProps) {
  return (
    <footer className="bg-[#0A1628] text-white/40 py-20 px-6 border-t border-white/5">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="overflow-hidden shrink-0">
              {siteSettings?.siteLogo ? (
                <img src={siteSettings.siteLogo} alt={siteSettings?.siteName || 'Uhuru Market Uniforms'} className="w-14 h-14 object-contain" />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center font-black text-xl text-[#C8102E] bg-white rounded-xl border-4 border-[#C8102E]">UMU</div>
              )}
            </div>
            <div className="leading-tight">
              <div className="font-['Bebas_Neue'] text-2xl tracking-[2px] text-white">
                {siteSettings?.siteName || 'Uhuru Market Uniforms'}
              </div>
              <div className="text-[10px] tracking-[2px] text-[#C8961A] uppercase font-bold">
                Uhuru Market Uniforms
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-6">Your trusted partner for quality school uniforms, custom knitwear and professional branding services across Kenya.</p>
        </div>
        <div>
          <h4 className="font-['Bebas_Neue'] text-xl tracking-[2px] text-white border-b-2 border-[#C8102E] pb-2 mb-6">Uniforms</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/#shop" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Primary School Uniforms</Link></li>
            <li><Link to="/#shop" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Junior Secondary</Link></li>
            <li><Link to="/#shop" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Corporate Uniforms</Link></li>
            <li><Link to="/#shop" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Sports Kits</Link></li>
          </ul>
        </div>
        <div>
           <h4 className="font-['Bebas_Neue'] text-xl tracking-[2px] text-white border-b-2 border-[#C8102E] pb-2 mb-6">Services</h4>
           <ul className="space-y-3 text-sm">
            <li><Link to="/#shop" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Knitting Services</Link></li>
            <li><Link to="/#shop" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Embroidery</Link></li>
            <li><Link to="/#shop" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Screen Printing</Link></li>
            <li><Link to="/#shop" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Design & Mockup</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-['Bebas_Neue'] text-xl tracking-[2px] text-white border-b-2 border-[#C8102E] pb-2 mb-6">Contact</h4>
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
               <div className="text-white font-bold">info@uhurumarketuniforms.com</div>
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
