import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '../services/firebase';

import { useCart } from '../context/CartContext';

export default function PrivacyPage() {
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
        <section className="py-24 px-6 bg-slate-50 border-b border-slate-100">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-[#C8102E] mx-auto mb-8 border border-slate-100"
            >
              <Shield size={40} />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-display text-[#0A1628] tracking-tight leading-none mb-6 italic">Privacy Policy</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[4px]">Effective Date: January 1, 2026</p>
          </div>
        </section>

        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto prose prose-slate">
            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-black text-[#0A1628] uppercase tracking-tight mb-6 flex items-center gap-3 italic">
                  <span className="w-10 h-[2px] bg-[#C8102E]"></span> 1. Data Collection
                </h2>
                <p className="text-slate-600 leading-relaxed font-medium">
                  At Naisiae Textiles Limited, we collect information that helps us provide a better experience for you. This includes:
                </p>
                <ul className="list-disc pl-6 space-y-3 text-slate-600 mt-4 font-medium italic">
                  <li>Personal identifiers (Name, Email, Phone Number)</li>
                  <li>Institutional details for wholesale orders</li>
                  <li>Billing and shipping addresses</li>
                  <li>Technical data like IP addresses and browsing behavior</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-black text-[#0A1628] uppercase tracking-tight mb-6 flex items-center gap-3 italic">
                  <span className="w-10 h-[2px] bg-[#C8102E]"></span> 2. How We Use Data
                </h2>
                <p className="text-slate-600 leading-relaxed font-medium">
                  Your data is used strictly for technical performance, order fulfillment, and client relationship management. We use it to:
                </p>
                <ul className="list-disc pl-6 space-y-3 text-slate-600 mt-4 font-medium italic">
                  <li>Process and ship your textile orders</li>
                  <li>Communicate regarding quotes and institutional contracts</li>
                  <li>Improve our manufacturing and delivery efficiency</li>
                  <li>Comply with Kenyan textile industry regulations</li>
                </ul>
              </div>

              <div className="bg-[#0A1628] p-10 rounded-[32px] text-white">
                <h2 className="text-2xl font-display tracking-[3px] mb-6 flex items-center gap-3">
                  <Lock size={24} className="text-[#C8961A]" /> Security Protocol
                </h2>
                <p className="text-white/70 leading-relaxed text-sm font-medium">
                  We employ industry-standard encryption and security measures to protect your data from unauthorized access, alteration, or destruction. We never sell your personal information to third parties.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-black text-[#0A1628] uppercase tracking-tight mb-6 flex items-center gap-3 italic">
                  <span className="w-10 h-[2px] bg-[#C8102E]"></span> 3. Cookies & Tracking
                </h2>
                <p className="text-slate-600 leading-relaxed font-medium">
                  Our website uses cookies to enhance navigation and understand how you interact with our platform. You can manage cookie preferences through your browser settings.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-black text-[#0A1628] uppercase tracking-tight mb-6 flex items-center gap-3 italic">
                  <span className="w-10 h-[2px] bg-[#C8102E]"></span> 4. Your Rights
                </h2>
                <p className="text-slate-600 leading-relaxed font-medium">
                  Under the Data Protection Act of Kenya, you have the right to access, rectify, or request the deletion of your personal data held by Naisiae Textiles Limited.
                </p>
              </div>
            </div>
            
            <div className="mt-20 pt-10 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400">© 2026 NAISIAE TEXTILE</p>
              <FileText size={20} className="text-slate-200" />
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
}
