import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, Compass, Users, Award, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '../services/firebase';

import { useCart } from '../context/CartContext';

export default function AboutPage() {
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
      <div className="pt-20"> {/* Offset for sticky nav */}
        <Breadcrumb />
        {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C8102E] mb-4 block">Our Story</span>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-8 uppercase">
              Excellence <br /> In Textiles.
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed font-medium max-w-2xl">
              We provide high-quality school uniforms specifically engineered for the Kenyan climate. 
              Since our inception, we've been outfitting the future leaders of our nation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission Blocks */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Mission Block */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative bg-[#0A1628] rounded-[40px] p-12 md:p-16 overflow-hidden min-h-[500px] flex flex-col justify-end"
          >
            <div className="absolute top-12 left-12 w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
              <Target size={40} />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-6">Our Mission</h2>
              <p className="text-lg text-slate-300 leading-relaxed font-medium">
                To revolutionize the institutional apparel industry in Kenya by combining superior 
                fabric engineering with distinctive branding, delivering matched value 
                in comfort, durability, and identity to every student and professional.
              </p>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#C8102E]/20 rounded-full blur-[100px] pointer-events-none" />
          </motion.div>

          {/* Vision Block */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative bg-[#C8102E] rounded-[40px] p-12 md:p-16 overflow-hidden min-h-[500px] flex flex-col justify-end"
          >
            <div className="absolute top-12 left-12 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
              <Compass size={40} />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-6">Our Vision</h2>
              <p className="text-lg text-white/90 leading-relaxed font-medium">
                To be the undisputed leader in quality school and corporate wear across East Africa, 
                defining high standards for textile manufacturing and professional 
                institutional identity.
              </p>
            </div>
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">The Values We Live By</h2>
            <div className="w-20 h-1.5 bg-[#C8102E] mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: <Award size={32} />, title: "Excellence", text: "We never settle for 'good enough'. Precision is our baseline." },
              { icon: <Users size={32} />, title: "Collaboration", text: "Your vision is our blueprint. We build together." },
              { icon: <ShieldCheck size={32} />, title: "Integrity", text: "Transparent pricing and honest timelines, always." }
            ].map((value, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-10 rounded-[32px] shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#C8102E] mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3 font-sans italic">{value.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{value.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto bg-slate-900 rounded-[40px] p-12 md:p-20 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8">Ready to transform?</h2>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 bg-[#C8102E] px-10 py-5 rounded-full text-sm font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all duration-300"
            >
              Explore Our Collection
            </Link>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#C8102E]/20 to-transparent opacity-50" />
        </div>
      </section>
      <Footer />
      </div>
    </div>
  );
}
