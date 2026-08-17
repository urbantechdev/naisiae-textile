import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Truck, MapPin, Globe, Clock, PackageCheck } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '../services/firebase';

import { useCart } from '../context/CartContext';

export default function ShippingPage() {
  const { cartCount, wishlistCount, setIsCartOpen, setIsWishlistOpen, isCartOpen, isWishlistOpen, setIsQuoteModalOpen } = useCart();
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) setSiteSettings(snapshot.data());
    });

    const qPromos = query(collection(db, 'promotions'), where('active', '==', true));
    const unsubscribePromos = onSnapshot(qPromos, (snapshot) => {
      setPromotions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeSettings();
      unsubscribePromos();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#08047D]">
      <Navbar 
        wishlistCount={wishlistCount}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />
      <div className="pt-20">
        <Breadcrumb />
        <section className="relative h-[60vh] bg-[#08047D] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
          </div>
          <div className="text-center relative z-10 px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[#FA9411] text-[10px] font-black tracking-[4px] uppercase mb-8"
            >
              <Truck size={16} /> Logistics & Delivery
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-7xl md:text-9xl text-white tracking-[2px] leading-none mb-6"
            >
              Swift <span className="text-[#08047D]">Fulfillment.</span>
            </motion.h1>
          </div>
        </section>

        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-16">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Shipping Methods</h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    {[
                      { 
                        title: "Nairobi Express", 
                        time: "24-48 Hours", 
                        desc: "Same-day or next-day delivery within Nairobi County and its environs.",
                        price: "350/-"
                      },
                      { 
                        title: "Upcountry Delivery", 
                        time: "3-5 Business Days", 
                        desc: "Serving all 47 counties via our trusted courier partners (G4S, Wells Fargo, etc).",
                        price: "From 500/-"
                      },
                      { 
                        title: "Wholesale Bulk", 
                        time: "Scheduled", 
                        desc: "Lorry delivery for large institutional orders of 1000+ units.",
                        price: "Custom Quote"
                      },
                      { 
                        title: "HQ Pickup", 
                        time: "Ready in 4 Hours", 
                        desc: "Free collection from our Industrial Area manufacturing hub.",
                        price: "Free"
                      }
                    ].map((method, idx) => (
                      <div key={idx} className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 group hover:bg-white hover:shadow-2xl transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                          <h3 className="font-bold text-xl uppercase tracking-tighter">{method.title}</h3>
                          <span className="text-[10px] font-black text-[#08047D] bg-[#08047D]/5 px-3 py-1 rounded-full uppercase">{method.price}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#FA9411] text-[10px] font-black uppercase tracking-widest mb-4">
                          <Clock size={12} /> {method.time}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{method.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-12 bg-[#08047D] rounded-[40px] text-white overflow-hidden relative">
                  <div className="relative z-10 grid md:grid-cols-2 gap-12">
                    <div>
                      <h3 className="font-display text-4xl tracking-widest mb-6">Global Wholesale</h3>
                      <p className="text-white/60 text-sm leading-relaxed mb-8">
                        We export high-quality Kenyan textiles worldwide. For international institutional orders, we coordinate via seafreight or airfreight with full customs documentation support.
                      </p>
                      <button className="flex items-center gap-3 text-[#FA9411] text-[10px] font-black uppercase tracking-[3px] border-b border-[#FA9411]/30 pb-1 hover:text-white transition-colors">
                        International Quote <Globe size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="w-full aspect-square bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center backdrop-blur-sm">
                        <Truck size={100} className="text-[#08047D] opacity-50" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="space-y-8">
                <div className="p-10 bg-slate-900 rounded-[40px] text-white">
                  <h3 className="font-display text-2xl tracking-[2px] mb-8 border-b border-white/10 pb-4">Order Tracking</h3>
                  <div className="space-y-6">
                    <p className="text-xs text-white/40 leading-relaxed">Once your order is processed, you'll receive a tracking number via SMS/Email to monitor your textile journey in real-time.</p>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Order ID" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold focus:bg-white/10 outline-none transition-all"
                      />
                      <button className="absolute right-2 top-2 bottom-2 bg-[#08047D] px-4 rounded-xl text-[10px] font-black uppercase">Track</button>
                    </div>
                  </div>
                </div>

                <div className="p-10 border border-slate-100 rounded-[40px]">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-6">Fulfillment Process</h3>
                  <div className="space-y-6">
                    {[
                      { step: "01", title: "Order Validation", desc: "Textile check and branding verification." },
                      { step: "02", title: "Packaging", desc: "Institutional grade eco-friendly transport protection." },
                      { step: "03", title: "Dispatch", desc: "Handover to primary logistics partner." },
                      { step: "04", title: "Last Mile", desc: "Door-to-door delivery completion." }
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-4">
                        <span className="text-[#FA9411] font-black text-xs pt-1">{item.step}</span>
                        <div>
                          <h4 className="text-xs font-black uppercase text-[#08047D]">{item.title}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
}
