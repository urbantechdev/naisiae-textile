import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCcw, ShieldAlert, CheckCircle2, HelpCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '../services/firebase';

import { useCart } from '../context/CartContext';

export default function ReturnsPage() {
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
    <div className="min-h-screen bg-white">
      <Navbar 
        wishlistCount={wishlistCount}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />
      <div className="pt-20">
        <Breadcrumb />
        <section className="py-24 px-6 bg-slate-900 text-white overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, rotate: -180 }}
              animate={{ opacity: 1, rotate: 0 }}
              className="w-20 h-20 bg-[#FA9411] rounded-3xl shadow-xl flex items-center justify-center text-white mx-auto mb-8"
            >
              <RefreshCcw size={40} />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-display tracking-tight leading-none mb-6">Returns & Exchanges</h1>
            <p className="text-white/40 font-bold text-[10px] uppercase tracking-[4px]">Our Commitment to Satisfaction</p>
          </div>
        </section>

        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-16">
              <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100">
                <h2 className="text-2xl font-black uppercase tracking-tight mb-6 text-[#08047D]">Return Window</h2>
                <p className="text-slate-600 leading-relaxed font-medium mb-6">
                  Items must be returned within <span className="text-[#08047D] font-black">7 days</span> of delivery. The items must be in their original condition, unworn, unwashed, and with all textile tags attached.
                </p>
                <div className="flex items-center gap-4 text-[#08047D] text-xs font-black uppercase tracking-widest bg-white border border-slate-200 p-4 rounded-2xl w-fit">
                  <CheckCircle2 size={18} className="text-green-500" /> Original Condition Only
                </div>
              </div>

              <div className="space-y-8">
                <h2 className="text-2xl font-black uppercase tracking-tight text-[#08047D] flex items-center gap-4">
                  <span className="w-12 h-1 bg-[#08047D]"></span> Process for Return
                </h2>
                <div className="grid gap-6">
                  {[
                    { title: "Initiate Request", desc: "Contact our customer service team with your Order ID and reason for return." },
                    { title: "Verification", desc: "Our textile team will review the request (especially for branding/custom errors)." },
                    { title: "Shipment", desc: "For stock items, return the item to our Industrial Area HQ via your preferred courier." },
                    { title: "Resolution", desc: "Upon inspection, we will issue an exchange or a store credit within 3-5 business days." }
                  ].map((step, idx) => (
                    <div key={idx} className="flex gap-8 group">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center font-black text-[#08047D] text-lg shrink-0 group-hover:bg-[#08047D] group-hover:text-white transition-all duration-300">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-[#08047D] mb-1">{step.title}</h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-10 bg-[#08047D]/5 rounded-[40px] border-2 border-dashed border-[#08047D]/20">
                <h3 className="text-xl font-black uppercase tracking-tight mb-6 text-[#08047D] flex items-center gap-3">
                  <ShieldAlert size={24} /> Non-Returnable Items
                </h3>
                <ul className="space-y-4 text-sm font-bold text-slate-600">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-[#08047D] rounded-full mt-2 shrink-0" />
                    Custom branded uniforms with your institution's logo.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-[#08047D] rounded-full mt-2 shrink-0" />
                    Bespoke sized items tailored specifically to your measurements.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-[#08047D] rounded-full mt-2 shrink-0" />
                    Items purchased during clearance sales or outlet events.
                  </li>
                </ul>
              </div>

              <div className="bg-[#08047D] p-12 rounded-[50px] flex flex-col md:flex-row items-center gap-10 text-white">
                <div className="shrink-0">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-[#FA9411]">
                    <HelpCircle size={40} />
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-3xl tracking-widest mb-4">Still have questions?</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">Our dedicated institutional support team is here to help you resolve any textile quality issues immediately.</p>
                  <a href="/contact" className="text-[#FA9411] text-[10px] font-black uppercase tracking-[3px] border-b border-[#FA9411]/30 pb-1">Contact Support</a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
}
