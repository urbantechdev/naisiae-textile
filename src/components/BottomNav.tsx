import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingBag, 
  LayoutGrid, 
  Barcode, 
  ClipboardList, 
  CreditCard, 
  Smartphone, 
  X, 
  Check, 
  Menu, 
  ChevronRight, 
  ChevronDown,
  FileText, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  ShieldCheck, 
  Scissors, 
  Zap, 
  Sparkles, 
  HelpCircle, 
  MapPin, 
  Package,
  Layers,
  Award,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { appExperience } from '../utils/haptics';
import { useCart } from '../context/CartContext';
import { useLocalization, COUNTRIES } from '../context/LocalizationContext';
import { AnimateStkPushModal } from './pos/AnimateStkPushModal';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    cart, 
    cartTotal, 
    cartCount, 
    clearCart, 
    setToast, 
    setIsCartOpen, 
    setIsQuoteModalOpen, 
    setIsCatalogueModalOpen 
  } = useCart();
  const { currentCountry, currentLanguage, changeCountry, changeLanguage, formatPrice } = useLocalization();

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isStkOpen, setIsStkOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('categories');

  const desktopNavItems = [
    { name: 'Home', icon: LayoutGrid, link: '/' },
    { name: 'Products', icon: ShoppingBag, link: '/products' },
    { name: 'Scan', icon: Barcode, action: () => { appExperience.triggerFeedback('tap'); navigate('/'); } },
    { name: 'Orders', icon: ClipboardList, link: '/admin' },
    { name: 'Checkout', icon: CreditCard, link: '/checkout' },
  ];

  const handleOpenPhoneModal = () => {
    appExperience.triggerFeedback('tap');
    if (cart.length === 0) {
      setToast({ message: 'Your cart is empty. Add items before paying.', type: 'error' });
      return;
    }
    setIsPhoneModalOpen(true);
  };

  const handleStartStk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 9) {
      setToast({ message: 'Please enter a valid M-Pesa phone number.', type: 'error' });
      return;
    }
    setIsPhoneModalOpen(false);
    setIsStkOpen(true);
  };

  const handleStkSuccess = (txCode: string) => {
    setIsStkOpen(false);
    
    try {
      addDoc(collection(db, 'orders'), {
        orderNumber: `TK-${Date.now().toString().slice(-6)}`,
        type: 'online_stk',
        source: 'Platform Bottom Nav M-Pesa',
        status: 'queued',
        customerName: 'Quick M-Pesa Customer',
        customerPhone: phoneNumber,
        customerType: 'Retail',
        items: cart,
        subtotal: cartTotal,
        discount: 0,
        tax: 0,
        total: cartTotal,
        paymentMethod: 'M-Pesa Express',
        paymentRef: txCode,
        paymentStatus: 'paid',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Could not queue order:', err);
    }

    setToast({ message: `M-Pesa payment successful! Ref: ${txCode}`, type: 'success' });
    clearCart();
    setPhoneNumber('');
  };

  const toggleSection = (id: string) => {
    appExperience.triggerFeedback('tap');
    setExpandedSection(prev => prev === id ? null : id);
  };

  const handleNavigateAndClose = (path: string) => {
    appExperience.triggerFeedback('tap');
    setIsMenuDrawerOpen(false);
    navigate(path);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[90] bg-[#E2E8F0]/98 backdrop-blur-md shadow-[0_-12px_35px_rgba(250,148,17,0.25)]">
        {/* Single Wave Curved Top Edge with Brand Yellow / Amber Accent */}
        <div className="absolute -top-[22px] sm:-top-[26px] left-0 right-0 w-full overflow-visible pointer-events-none select-none z-30">
          <svg 
            viewBox="0 0 1200 50" 
            preserveAspectRatio="none" 
            className="w-full h-[24px] sm:h-[28px] block drop-shadow-[0_-4px_8px_rgba(250,148,17,0.45)]"
          >
            <defs>
              <linearGradient id="bottomNavYellowWave" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FA9411" />
                <stop offset="20%" stopColor="#FACC15" />
                <stop offset="50%" stopColor="#FFE082" />
                <stop offset="80%" stopColor="#FACC15" />
                <stop offset="100%" stopColor="#FA9411" />
              </linearGradient>
            </defs>
            {/* Wave fill matching bottom nav bright grey (#E2E8F0) */}
            <path 
              d="M 0 26 C 320 50, 680 2, 1200 26 L 1200 50 L 0 50 Z" 
              fill="#E2E8F0" 
              fillOpacity="0.98"
            />
            {/* Vibrant luminous yellow top wave curve */}
            <path 
              d="M 0 26 C 320 50, 680 2, 1200 26" 
              fill="none" 
              stroke="url(#bottomNavYellowWave)" 
              strokeWidth="4.5" 
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Luminous Yellow Glow Top Edge Effect */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#FA9411] via-[#FACC15] via-[#FFE082] to-[#FA9411] shadow-[0_0_15px_#FA9411,0_0_25px_#FACC15]"></div>

        {/* Mobile-Only Navigation Bar - Pure Icon Buttons (Enlarged touch targets) */}
        <div className="md:hidden flex items-center justify-around px-4 py-2 pb-safe max-w-lg mx-auto">
          {/* 1. Home Icon Button */}
          <button
            onClick={() => {
              appExperience.triggerFeedback('tap');
              navigate('/');
            }}
            aria-label="Home"
            title="Home"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative active:scale-90 ${
              location.pathname === '/' 
                ? 'text-[#08047D] bg-white shadow-md ring-2 ring-[#08047D]/20 scale-105' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <LayoutGrid size={24} />
            {location.pathname === '/' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#FA9411] rounded-full shadow-xs"></span>
            )}
          </button>

          {/* 2. Products Icon Button */}
          <button
            onClick={() => {
              appExperience.triggerFeedback('tap');
              navigate('/products');
            }}
            aria-label="Products"
            title="Products"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative active:scale-90 ${
              location.pathname.startsWith('/products') 
                ? 'text-[#08047D] bg-white shadow-md ring-2 ring-[#08047D]/20 scale-105' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShoppingBag size={24} />
            {location.pathname.startsWith('/products') && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#FA9411] rounded-full shadow-xs"></span>
            )}
          </button>

          {/* 3. Center Highlight: Elevated Floating Pay with M-Pesa Button (Floats above all other buttons) */}
          <div className="relative -mt-8 z-40 flex items-center justify-center shrink-0">
            {/* Ambient amber glowing halo */}
            <div className="absolute -inset-2 rounded-full bg-amber-500/50 blur-xl animate-pulse pointer-events-none"></div>

            {/* Glowing gold/amber rim light */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-b from-[#FFE082] via-amber-400 to-amber-600 opacity-95 blur-[1.5px] pointer-events-none"></div>

            <button
              onClick={handleOpenPhoneModal}
              aria-label="Pay with M-Pesa"
              title="Pay with M-Pesa"
              className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-amber-700 via-amber-500 to-amber-400 text-white shadow-[0_14px_32px_rgba(217,119,6,0.6),0_4px_14px_rgba(0,0,0,0.22)] ring-4 ring-white active:scale-90 hover:scale-105 transition-all duration-300 flex items-center justify-center cursor-pointer group"
            >
              {/* Top glass gloss highlight */}
              <div className="absolute inset-x-3 top-2 h-4 rounded-t-full bg-gradient-to-b from-white/45 to-transparent pointer-events-none"></div>

              <Smartphone size={28} className="text-white relative z-10 stroke-[2.3] drop-shadow-md animate-pulse" />
            </button>
          </div>

          {/* 4. Cart Icon Button */}
          <button
            onClick={() => {
              appExperience.triggerFeedback('tap');
              setIsCartOpen(true);
            }}
            aria-label="Shopping Cart"
            title="Cart"
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all relative active:scale-90 cursor-pointer"
          >
            <CreditCard size={24} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[20px] h-5 px-1 bg-[#FA9411] text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-md animate-pulse ring-2 ring-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* 5. Menu Icon Button (Opens simplified submenus drawer) */}
          <button
            onClick={() => {
              appExperience.triggerFeedback('tap');
              setIsMenuDrawerOpen(true);
            }}
            aria-label="All Menus & Catalog"
            title="Menu"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative active:scale-90 ${
              isMenuDrawerOpen 
                ? 'text-[#FA9411] bg-white shadow-md ring-2 ring-[#FA9411]/40' 
                : 'text-slate-700 hover:text-[#08047D] bg-white/70 hover:bg-white ring-1 ring-slate-200/80 shadow-xs'
            }`}
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Desktop Navigation Bar - Icon + Text Name Buttons (Larger sizing & comfortable padding) */}
        <div className="hidden md:flex max-w-[1780px] mx-auto py-2.5 sm:py-3 px-4 sm:px-6 lg:px-12 justify-between items-center gap-4">
          {/* Left/Center: Navigation Items with Icon + Text */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Pay with M-Pesa Button with Text */}
            <button
              onClick={handleOpenPhoneModal}
              aria-label="Pay with M-Pesa"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2.5 cursor-pointer font-bold text-xs sm:text-sm"
            >
              <Smartphone size={18} className="animate-pulse" />
              <span>Pay M-Pesa</span>
            </button>

            {/* Desktop Navigation Group with Icon + Text */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-slate-200/80 shadow-xs">
              {desktopNavItems.map((item) => {
                const isActive = location.pathname === item.link;
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      if (item.link) navigate(item.link);
                      if (item.action) item.action();
                    }}
                    aria-label={item.name}
                    className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all cursor-pointer relative active:scale-95 flex items-center gap-2 text-xs sm:text-sm font-bold ${
                      isActive 
                        ? 'bg-[#08047D] text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </button>
                );
              })}

              {/* Cart Button with Text on Desktop */}
              <button
                onClick={() => {
                  appExperience.triggerFeedback('tap');
                  setIsCartOpen(true);
                }}
                aria-label="Cart"
                className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer relative active:scale-95 flex items-center gap-2 text-xs sm:text-sm font-bold"
              >
                <CreditCard size={18} />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#FA9411] text-white text-[10px] font-black rounded-full shadow-xs">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right: Total Due Badge + Powered by Urbantechdev */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total:</span>
              <span className="text-base sm:text-xl font-black text-[#08047D] font-mono">
                {formatPrice(cartTotal)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900/5 border border-[#FA9411]/40 text-[#FA9411] text-[10.5px] font-black uppercase tracking-wider shadow-xs select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FA9411] animate-pulse"></span>
              <span>Powered by Urbantechdev</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Mobile App Menu Drawer (Submenus simplified into a bottom sheet) */}
      <AnimatePresence>
        {isMenuDrawerOpen && (
          <div className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuDrawerOpen(false)}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
            />

            {/* Bottom Sheet Drawer - Full screen on mobile, elegant modal on tablet/desktop */}
            <motion.div
              initial={{ y: '100%', opacity: 0.9 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.8 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="relative w-full h-[100dvh] sm:h-auto max-w-none sm:max-w-lg bg-white rounded-none sm:rounded-3xl max-h-none sm:max-h-[90vh] flex flex-col shadow-2xl z-20 overflow-hidden"
            >
              {/* Drag Handle Indicator on Tablet / Desktop */}
              <div className="hidden sm:flex pt-3 pb-1 justify-center">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>

              {/* Drawer Header */}
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#08047D] text-white flex items-center justify-center font-black shadow-md">
                    <Layers size={18} className="text-[#FA9411]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight">
                      Uhuru Market Textiles
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">Mobile Navigation</span>
                      <span className="hidden md:inline text-[9px] font-black text-[#FA9411] bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200/60">
                        Powered by Urbantechdev
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsMenuDrawerOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body - Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar pb-8">
                {/* Quick App Shortcuts Grid */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                    Quick App Actions
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Instant Quote */}
                    <button
                      onClick={() => {
                        appExperience.triggerFeedback('tap');
                        setIsMenuDrawerOpen(false);
                        setIsQuoteModalOpen(true);
                      }}
                      className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 rounded-2xl flex flex-col items-center text-center transition-all active:scale-95 hover:shadow-xs cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#FA9411] text-white flex items-center justify-center shadow-xs mb-1.5">
                        <FileText size={18} />
                      </div>
                      <span className="text-xs font-black text-slate-900 leading-tight">Get Quote</span>
                      <span className="text-[9px] font-bold text-amber-700">Custom Uniform</span>
                    </button>

                    {/* PDF Catalogue */}
                    <button
                      onClick={() => {
                        appExperience.triggerFeedback('tap');
                        setIsMenuDrawerOpen(false);
                        setIsCatalogueModalOpen(true);
                      }}
                      className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/70 rounded-2xl flex flex-col items-center text-center transition-all active:scale-95 hover:shadow-xs cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#08047D] text-white flex items-center justify-center shadow-xs mb-1.5">
                        <Package size={18} />
                      </div>
                      <span className="text-xs font-black text-slate-900 leading-tight">Catalogue</span>
                      <span className="text-[9px] font-bold text-blue-700">Download PDF</span>
                    </button>

                    {/* Live WhatsApp */}
                    <a
                      href="https://wa.me/254792021795?text=Hello%20Naisiae%20Uhuru%20Market,%20I%20would%20like%20to%20enquire%20about%20uniforms."
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        appExperience.triggerFeedback('tap');
                        setIsMenuDrawerOpen(false);
                      }}
                      className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-2xl flex flex-col items-center text-center transition-all active:scale-95 hover:shadow-xs cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs mb-1.5">
                        <MessageSquare size={18} />
                      </div>
                      <span className="text-xs font-black text-slate-900 leading-tight">WhatsApp</span>
                      <span className="text-[9px] font-bold text-emerald-700">Direct Chat</span>
                    </a>
                  </div>
                </div>

                {/* Simplified Accordion Submenus */}
                <div className="space-y-3">
                  {/* Submenu 1: Uniform Categories */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                    <button
                      onClick={() => toggleSection('categories')}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left font-black text-xs text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#08047D]/10 text-[#08047D] flex items-center justify-center">
                          <ShoppingBag size={15} />
                        </div>
                        <span>Uniform Categories & Products</span>
                      </div>
                      {expandedSection === 'categories' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {expandedSection === 'categories' && (
                      <div className="p-3 pt-0 grid grid-cols-2 gap-2 border-t border-slate-100 bg-white">
                        {[
                          { title: 'School Uniforms', subtitle: 'Primary & High School', link: '/products?category=school' },
                          { title: 'Security Wear', subtitle: 'Guards, Sweaters, Caps', link: '/products?category=security' },
                          { title: 'Hospital Scrubs', subtitle: 'Lab Coats, Theatre Sets', link: '/products?category=medical' },
                          { title: 'Hospitality & Chef', subtitle: 'Aprons, Chef Jackets', link: '/products?category=hospitality' },
                          { title: 'Corporate Workwear', subtitle: 'Overalls, Dustcoats', link: '/products?category=workwear' },
                          { title: 'Sports & Tracksuits', subtitle: 'Jerseys & PE Kits', link: '/products?category=sports' },
                        ].map((cat) => (
                          <button
                            key={cat.title}
                            onClick={() => handleNavigateAndClose(cat.link)}
                            className="p-2.5 bg-slate-50 hover:bg-amber-50/70 border border-slate-200/80 rounded-xl text-left transition-all active:scale-95 group"
                          >
                            <p className="text-xs font-bold text-slate-900 group-hover:text-[#FA9411] transition-colors leading-tight">
                              {cat.title}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                              {cat.subtitle}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submenu 2: Manufacturing & Services */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                    <button
                      onClick={() => toggleSection('services')}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left font-black text-xs text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <Scissors size={15} />
                        </div>
                        <span>Manufacturing & Factory Services</span>
                      </div>
                      {expandedSection === 'services' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {expandedSection === 'services' && (
                      <div className="p-3 pt-0 space-y-1.5 border-t border-slate-100 bg-white">
                        {[
                          { title: 'Bulk Uniform Production', desc: 'Orders from 50 to 50,000+ pieces at wholesale rates', link: '/services' },
                          { title: 'Custom Embroidery & Screen Printing', desc: 'School crests, company logos and personalized tags', link: '/services' },
                          { title: 'Wholesale Fabric & Textiles Gallery', desc: 'Woolen wear, twill, cotton blends from Uhuru Market', link: '/textiles' },
                          { title: 'Uniform Visualizer & Simulator', desc: 'Preview institutional uniform combos in 3D / matrix', link: '/uniform-simulator' },
                        ].map((svc) => (
                          <button
                            key={svc.title}
                            onClick={() => handleNavigateAndClose(svc.link)}
                            className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-left flex items-center justify-between transition-colors"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-900">{svc.title}</p>
                              <p className="text-[10px] text-slate-500">{svc.desc}</p>
                            </div>
                            <ChevronRight size={14} className="text-slate-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submenu 3: Orders, Queue & Cashier POS */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                    <button
                      onClick={() => toggleSection('tools')}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left font-black text-xs text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-[#08047D] flex items-center justify-center">
                          <Zap size={15} />
                        </div>
                        <span>Orders, Tracking & POS Terminal</span>
                      </div>
                      {expandedSection === 'tools' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {expandedSection === 'tools' && (
                      <div className="p-3 pt-0 space-y-1.5 border-t border-slate-100 bg-white">
                        <button
                          onClick={() => handleNavigateAndClose('/admin')}
                          className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-left flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">Orders Queue & Management</p>
                            <p className="text-[10px] text-slate-500">Live order status, invoice generation & dispatch</p>
                          </div>
                          <ChevronRight size={14} className="text-slate-400 shrink-0" />
                        </button>
                        <button
                          onClick={() => handleNavigateAndClose('/checkout')}
                          className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-left flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">Direct Checkout & Payment</p>
                            <p className="text-[10px] text-slate-500">Instant M-Pesa Express & Card settlement</p>
                          </div>
                          <ChevronRight size={14} className="text-slate-400 shrink-0" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submenu 4: Help, Physical Stall & Support */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                    <button
                      onClick={() => toggleSection('support')}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left font-black text-xs text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-[#FA9411] flex items-center justify-center">
                          <HelpCircle size={15} />
                        </div>
                        <span>Help, Support & Location</span>
                      </div>
                      {expandedSection === 'support' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {expandedSection === 'support' && (
                      <div className="p-3 pt-0 space-y-2 border-t border-slate-100 bg-white">
                        <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <MapPin size={14} className="text-[#FA9411] shrink-0" />
                            <span>Uhuru Market, Stall B-42, Jogoo Road, Nairobi</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <a
                              href="tel:+254792021795"
                              className="text-xs font-black text-[#08047D] hover:underline flex items-center gap-1.5"
                            >
                              <Phone size={12} className="text-[#FA9411]" />
                              +254 792 021 795
                            </a>
                            <span className="text-[10px] font-bold text-slate-400">Open 7:30 AM - 6:30 PM</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleNavigateAndClose('/faq')}
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-left text-xs font-bold text-slate-700"
                          >
                            Frequently Asked (FAQs)
                          </button>
                          <button
                            onClick={() => handleNavigateAndClose('/review')}
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-left text-xs font-bold text-slate-700"
                          >
                            Customer Reviews
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Country & Currency Switcher inside Mobile Drawer */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Region & Currency
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {COUNTRIES.slice(0, 4).map((c) => {
                      const isSelected = currentCountry.code === c.code;
                      return (
                        <button
                          key={`bottom-nav-country-${c.code}`}
                          onClick={() => {
                            appExperience.triggerFeedback('tap');
                            changeCountry(c.code);
                          }}
                          className={`p-2 rounded-xl flex items-center justify-between text-left transition-all border ${
                            isSelected
                              ? 'bg-white border-[#FA9411] text-[#08047D] shadow-xs'
                              : 'bg-white/60 hover:bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-base">{c.flag}</span>
                            <span className="text-[10px] font-black uppercase truncate">{c.name}</span>
                          </div>
                          <span className="text-[9px] font-bold text-[#FA9411]">{c.currency}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Drawer Footer Branding */}
                <div className="text-center pt-2 pb-1 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Uhuru Market Nairobi · All Rights Reserved
                  </p>
                  <p className="hidden md:block text-[9px] font-bold text-[#FA9411] mt-0.5">
                    Powered by Urbantechdev
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Simple Phone Number Popup Modal */}
      <AnimatePresence>
        {isPhoneModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPhoneModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">M-Pesa Express Checkout</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Enter phone to receive STK push</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhoneModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleStartStk} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    M-Pesa Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +254
                    </span>
                    <input
                      type="tel"
                      placeholder="712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      autoFocus
                      className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Total Amount:</span>
                  <span className="text-sm font-black text-emerald-700 font-mono">{formatPrice(cartTotal)}</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  <span>Send STK Prompt</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Animated STK Push Modal */}
      <AnimateStkPushModal
        isOpen={isStkOpen}
        phoneNumber={phoneNumber}
        amount={cartTotal}
        onSuccess={handleStkSuccess}
        onCancel={() => setIsStkOpen(false)}
      />
    </>
  );
}

