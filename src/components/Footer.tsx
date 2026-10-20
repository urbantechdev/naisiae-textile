import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  Fingerprint, 
  Award, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Star, 
  ArrowUpRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLocalization } from '../context/LocalizationContext';

export function Footer() {
  const { siteSettings } = useCart();
  const { currentCountry } = useLocalization();

  const brandName = siteSettings?.siteName || 'Naisiae Textiles';
  const brandTagline = siteSettings?.siteTagline || 'Uhuru Market, Nairobi';
  const contactPhone = siteSettings?.contactPhone || '+254 792 021 795';
  const contactEmail = siteSettings?.contactEmail || 'support@naisiaetextiles.com';

  return (
    <footer className="relative bg-[#04023D] text-slate-300 pt-16 pb-28 md:pb-16 px-6 lg:px-12 border-t border-white/10 overflow-hidden font-sans">
      {/* Subtle ambient lighting glow */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-[#08047D]/40 to-transparent pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#FA9411]/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-[1440px] mx-auto">
        {/* Top Engagement & Verified Trust Row (Modern Dual Cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          {/* Card 1: Google Verified Reviews */}
          <div className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-amber-400/40 rounded-3xl p-6 sm:p-7 transition-all duration-300 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 group shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 shrink-0 text-xl shadow-inner">
                ⭐
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex text-amber-400 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className="fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                    5.0 Verified Rating
                  </span>
                </div>
                <h3 className="text-white font-display text-base sm:text-lg font-black tracking-tight">
                  Pleased with {brandName}?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mt-0.5">
                  Your feedback empowers local garment craftsmanship at Uhuru Market, Nairobi.
                </p>
              </div>
            </div>
            <a 
              href="https://g.page/r/CZb3o2nm3vRgEBM/review" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3 bg-[#FA9411] hover:bg-[#E08208] text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shrink-0 flex items-center justify-center gap-2 shadow-md shadow-[#FA9411]/20 group-hover:translate-x-0.5"
            >
              <span>Write a Review</span>
              <ArrowUpRight size={14} />
            </a>
          </div>

          {/* Card 2: Certified Uhuru Market Manufacturing Facility */}
          <div className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-[#FA9411]/40 rounded-3xl p-6 sm:p-7 transition-all duration-300 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 group shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#08047D] border border-white/20 flex items-center justify-center text-[#FA9411] shrink-0 shadow-inner">
                <Award size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Verified Manufacturer
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">• 15+ Years Legacy</span>
                </div>
                <h3 className="text-white font-display text-base sm:text-lg font-black tracking-tight">
                  Jogoo Road Production Workshop
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mt-0.5">
                  Direct factory wholesale rates, computer embroidery, and rapid nationwide courier logistics.
                </p>
              </div>
            </div>
            <a 
              href="https://www.google.com/maps/place/UHURU+MARKET+UNIFORMS/@-1.294565,36.8611397,15z" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3 bg-white/10 hover:bg-white hover:text-[#08047D] text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shrink-0 flex items-center justify-center gap-2 border border-white/20 shadow-sm"
            >
              <span>Get Directions</span>
              <MapPin size={14} className="text-[#FA9411]" />
            </a>
          </div>
        </div>

        {/* Main 5-Column Modern Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-16">
          {/* Column 1: Brand Info & Quick Direct Contacts (4 columns) */}
          <div className="sm:col-span-2 lg:col-span-4 flex flex-col pr-0 lg:pr-6">
            <Link to="/" className="inline-flex items-center gap-3.5 group mb-5">
              {siteSettings?.siteLogo ? (
                <img 
                  src={siteSettings.siteLogo} 
                  alt={brandName} 
                  className="w-12 h-12 object-contain rounded-xl" 
                  loading="lazy" 
                  decoding="async" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="w-11 h-11 flex items-center justify-center font-display font-black text-xs text-white bg-gradient-to-br from-[#08047D] to-[#120B8A] border border-white/20 rounded-xl relative shadow-md overflow-hidden select-none">
                  <span>NT</span>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-[#FA9411]"></div>
                </div>
              )}
              <div>
                <span className="font-display text-2xl font-black tracking-tight uppercase text-white block group-hover:text-amber-400 transition-colors">
                  {brandName}
                </span>
                <span className="text-[9px] font-black uppercase tracking-[2.5px] text-[#FA9411] block">
                  {brandTagline}
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed font-normal mb-6 max-w-sm">
              Naisiae Textiles operates as Nairobi&apos;s leading high-performance school uniform manufacturer and corporate apparel supplier, crafting custom institutional garments directly from Uhuru Market along Jogoo Road.
            </p>

            {/* Quick Contact Micro-Cards */}
            <div className="space-y-3 max-w-sm">
              <a 
                href={`tel:${contactPhone.replace(/\s+/g, '')}`} 
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all text-xs text-slate-300 group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FA9411]/15 text-[#FA9411] flex items-center justify-center shrink-0 group-hover:bg-[#FA9411] group-hover:text-white transition-colors">
                  <Phone size={14} />
                </div>
                <div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">Factory Call Line</div>
                  <div className="font-bold text-white group-hover:text-amber-400 transition-colors">{contactPhone}</div>
                </div>
              </a>

              <a 
                href={`mailto:${contactEmail}`} 
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all text-xs text-slate-300 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Mail size={14} />
                </div>
                <div className="truncate">
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">Official Inquiries</div>
                  <div className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{contactEmail}</div>
                </div>
              </a>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Clock size={14} />
                </div>
                <div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">Workshop Hours</div>
                  <div className="font-bold text-white">Mon – Sat: 8:00 AM – 6:00 PM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Apparel & Uniforms (2 columns) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-black uppercase tracking-[2.5px] text-white border-b border-white/10 pb-2.5 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FA9411]"></span>
              Apparel
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li>
                <Link to="/product" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
                  Primary Uniforms
                </Link>
              </li>
              <li>
                <Link to="/product" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
                  Secondary Uniforms
                </Link>
              </li>
              <li>
                <Link to="/product" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
                  College & Campus Wear
                </Link>
              </li>
              <li>
                <Link to="/product" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
                  Corporate Wear & Blazers
                </Link>
              </li>
              <li>
                <Link to="/product" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
                  Medical Scrubs & Coats
                </Link>
              </li>
              <li>
                <Link to="/product" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
                  Sports Kits & Tracksuits
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Manufacturing & Tools (2 columns) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-black uppercase tracking-[2.5px] text-white border-b border-white/10 pb-2.5 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Manufacturing
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li>
                <Link to="/uniform-simulator" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  3D Uniform Simulator
                </Link>
              </li>
              <li>
                <Link to="/wholesale" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  Wholesale Bulk Supply
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  Computerized Embroidery
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  Screen Printing & Badging
                </Link>
              </li>
              <li>
                <Link to="/textiles" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  Fabric & Swatch Gallery
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  Product Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Company & Support (2 columns) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-black uppercase tracking-[2.5px] text-white border-b border-white/10 pb-2.5 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Company
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li>
                <Link to="/about" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-white transition-colors" />
                  About Our Factory
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-white transition-colors" />
                  Client Portfolio
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-white transition-colors" />
                  Tailoring Services
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-white transition-colors" />
                  Help Center & FAQ
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-white transition-colors" />
                  Careers & Tailoring
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-white transition-colors" />
                  Contact Workshop
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Regional Hubs (2 columns) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-black uppercase tracking-[2.5px] text-white border-b border-white/10 pb-2.5 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Regional Hubs
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors flex items-center gap-2.5 group">
                  <img src="https://flagcdn.com/w40/ke.png" alt="Kenya Flag" className="w-4 h-3 object-cover rounded-sm border border-white/20 shrink-0" referrerPolicy="no-referrer" />
                  <span className="group-hover:text-white transition-colors font-medium">Kenya (Nairobi HQ)</span>
                </Link>
              </li>
              <li>
                <Link to="/tanzania" className="hover:text-white transition-colors flex items-center gap-2.5 group">
                  <img src="https://flagcdn.com/w40/tz.png" alt="Tanzania Flag" className="w-4 h-3 object-cover rounded-sm border border-white/20 shrink-0" referrerPolicy="no-referrer" />
                  <span className="group-hover:text-white transition-colors font-medium">Tanzania Hub</span>
                </Link>
              </li>
              <li>
                <Link to="/dr-congo" className="hover:text-white transition-colors flex items-center gap-2.5 group">
                  <img src="https://flagcdn.com/w40/cd.png" alt="DR Congo Flag" className="w-4 h-3 object-cover rounded-sm border border-white/20 shrink-0" referrerPolicy="no-referrer" />
                  <span className="group-hover:text-white transition-colors font-medium">DR Congo Hub</span>
                </Link>
              </li>
              <li>
                <Link to="/uganda" className="hover:text-white transition-colors flex items-center gap-2.5 group">
                  <img src="https://flagcdn.com/w40/ug.png" alt="Uganda Flag" className="w-4 h-3 object-cover rounded-sm border border-white/20 shrink-0" referrerPolicy="no-referrer" />
                  <span className="group-hover:text-white transition-colors font-medium">Uganda Hub</span>
                </Link>
              </li>
              <li>
                <Link to="/ethiopia" className="hover:text-white transition-colors flex items-center gap-2.5 group">
                  <img src="https://flagcdn.com/w40/et.png" alt="Ethiopia Flag" className="w-4 h-3 object-cover rounded-sm border border-white/20 shrink-0" referrerPolicy="no-referrer" />
                  <span className="group-hover:text-white transition-colors font-medium">Ethiopia Hub</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-Footer Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-slate-400">
          {/* Left: Copyright & Admin Fingerprint */}
          <div className="flex flex-wrap items-center gap-3 text-center md:text-left">
            <span>© 2026 {brandName}. All rights reserved.</span>
            <Link 
              to="/admin" 
              className="inline-flex items-center justify-center p-1 rounded-md text-slate-500 hover:text-amber-400 hover:bg-white/10 transition-all duration-300 group" 
              title="Secure Console"
            >
              <Fingerprint size={13} className="transition-transform duration-500 group-hover:rotate-45" />
            </Link>
          </div>

          {/* Center: Accepted Payments Modern Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase mr-1 hidden sm:inline">Accepted:</span>
            <span className="bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-md text-[9px] font-mono border border-emerald-500/30 font-extrabold select-none">
              M-PESA
            </span>
            <span className="bg-white/[0.06] text-slate-200 px-2.5 py-0.5 rounded-md text-[9px] font-mono border border-white/15 font-extrabold select-none">
              VISA
            </span>
            <span className="bg-white/[0.06] text-slate-200 px-2.5 py-0.5 rounded-md text-[9px] font-mono border border-white/15 font-extrabold select-none">
              MASTERCARD
            </span>
            <span className="bg-white/[0.06] text-slate-200 px-2.5 py-0.5 rounded-md text-[9px] font-mono border border-white/15 font-extrabold select-none">
              EFT / BANK
            </span>
          </div>

          {/* Right: Policies & Credits */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to="/policy" className="hover:text-white transition-colors font-bold uppercase tracking-wider">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors font-bold uppercase tracking-wider">
              Terms
            </Link>
            <Link to="/shipping" className="hover:text-white transition-colors font-bold uppercase tracking-wider">
              Shipping
            </Link>
            <Link to="/returns" className="hover:text-white transition-colors font-bold uppercase tracking-wider">
              Returns
            </Link>
            <a 
              href="https://urbantechdev.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-slate-500 group pl-2 border-l border-white/10"
            >
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">By</span>
              <span className="font-mono text-[9px] font-black tracking-wider text-slate-300 group-hover:text-amber-400 transition-colors">
                URBAN<span className="text-[#FA9411]">TECH</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
