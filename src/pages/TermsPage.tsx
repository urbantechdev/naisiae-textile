import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Scale, Gavel, FileCheck, HelpCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function TermsPage({ cart, setCart, wishlist, setWishlist }: any) {
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

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
        cartCount={cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)}
        wishlistCount={wishlist.length}
        setIsCartOpen={setIsCartOpen}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />

      <div className="pt-20">
        <section className="py-24 px-6 bg-[#C8102E] text-white">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-[#C8102E] mx-auto mb-8"
            >
              <Scale size={40} />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-display tracking-tight leading-none mb-6 italic">Terms of Service</h1>
            <p className="text-white/60 font-bold text-[10px] uppercase tracking-[4px]">Agreement of Engagement</p>
          </div>
        </section>

        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto prose prose-slate">
            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-black text-[#0A1628] uppercase tracking-tight mb-6 flex items-center gap-3 italic">
                  <span className="w-10 h-[2px] bg-[#C8102E]"></span> 1. Acceptance of Terms
                </h2>
                <p className="text-slate-600 leading-relaxed font-medium">
                  By accessing the Naisiae Textiles Limited website and placing an order, you agree to comply with and be bound by these terms. These terms govern all institutional sales, wholesale contracts, and individual purchases.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-black text-[#0A1628] uppercase tracking-tight mb-6 flex items-center gap-3 italic">
                  <span className="w-10 h-[2px] bg-[#C8102E]"></span> 2. Custom Manufacturing
                </h2>
                <p className="text-slate-600 leading-relaxed font-medium">
                  For custom orders (Uniforms, Knitwear, Branding):
                </p>
                <ul className="list-disc pl-6 space-y-3 text-slate-600 mt-4 font-medium italic">
                  <li>Specifications must be confirmed in writing (Email/Portal).</li>
                  <li>A 50% deposit is required before production commences.</li>
                  <li>Final balance is due upon notification of completion, prior to dispatch.</li>
                  <li>Minor variations in textile shade may occur within industry-standard tolerances.</li>
                </ul>
              </div>

              <div className="bg-slate-900 p-10 rounded-[32px] text-white">
                <h2 className="text-2xl font-display tracking-[3px] mb-6 flex items-center gap-3">
                  <Gavel size={24} className="text-[#C8961A]" /> Order Cancellation
                </h2>
                <p className="text-white/70 leading-relaxed text-sm font-medium">
                  Customized items cannot be cancelled once production has started. For stock items, cancellations must be made within 4 hours of order placement.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-black text-[#0A1628] uppercase tracking-tight mb-6 flex items-center gap-3 italic">
                  <span className="w-10 h-[2px] bg-[#C8102E]"></span> 3. Pricing & Payments
                </h2>
                <p className="text-slate-600 leading-relaxed font-medium">
                  All prices are in Kenyan Shillings (/-) and inclusive of relevant taxes unless stated otherwise for wholesale bulk exports. We currenty accept M-Pesa, Bank Transfers, and Major Credit Cards.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-black text-[#0A1628] uppercase tracking-tight mb-6 flex items-center gap-3 italic">
                  <span className="w-10 h-[2px] bg-[#C8102E]"></span> 4. Limitation of Liability
                </h2>
                <p className="text-slate-600 leading-relaxed font-medium">
                  Naisiae Textiles Limited shall not be liable for any indirect or consequential loss caused by delays in logistical transport partners. Our liability is limited to the value of the goods purchased.
                </p>
              </div>
            </div>
            
            <div className="mt-20 pt-10 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 font-sans italic">Updated: Jan 2026</p>
              <FileCheck size={20} className="text-slate-200" />
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
}
