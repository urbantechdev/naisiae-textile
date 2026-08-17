import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { motion } from 'motion/react';
import { ChevronRight, Scissors, Ruler, Palette, ShoppingBag, Heart, Menu } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

import { useCart } from '../context/CartContext';

export default function ServicesPage() {
  const { cartCount, wishlistCount, setIsCartOpen, setIsWishlistOpen, setIsQuoteModalOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const q = query(collection(db, 'services'), orderBy('sortOrder', 'asc'));
        const querySnapshot = await getDocs(q);
        const srvs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (srvs.length > 0) {
          setServices(srvs);
        } else {
          setServices([
            {
              id: 'knitting',
              title: 'Knitting Services',
              description: 'Our state-of-the-art knitting facility produces high-quality sweaters, cardigans, and pullovers. We specialize in custom school patterns, corporate knitwear, and winter accessories with precision and durability.',
              image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80',
              features: ['Custom School Patterns', 'High-Grade Wool & Acrylic', 'Precision Ribbing', 'Corporate Vests']
            },
            {
              id: 'embroidery',
              title: 'Professional Embroidery',
              description: 'Bring your brand to life with high-density computer embroidery. From simple chest logos to complex back designs, we ensure every stitch represents your institution or business with prestige.',
              image: 'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?auto=format&fit=crop&q=80',
              features: ['3D Puff Embroidery', 'Multi-Color Logos', 'Badge Production', 'Direct-to-Garment']
            },
            {
              id: 'branding',
              title: 'Branding & Screen Printing',
              description: 'Comprehensive branding solutions for school uniforms and corporate identity. We use high-quality inks and modern printing techniques that withstand industrial washing and heavy use.',
              image: 'https://images.unsplash.com/photo-1534452285072-c5cee3316af7?auto=format&fit=crop&q=80',
              features: ['Plastisol Printing', 'Vinyl Heat Press', 'Sublimation', 'Corporate Gift Items']
            }
          ]);
        }
      } catch (error) {
        console.error("Error fetching services: ", error);
      }
    };
    fetchServices();
  }, []);

  const getIcon = (idx: number) => {
    if (idx % 3 === 0) return <Scissors size={32} className="text-[#FA9411]" />;
    if (idx % 3 === 1) return <Ruler size={32} className="text-[#FA9411]" />;
    return <Palette size={32} className="text-[#FA9411]" />;
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#08047D]">
      <Navbar 
        wishlistCount={wishlistCount}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />
      <Breadcrumb />

      {/* Hero Section */}
      <section className="bg-[#08047D] py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FA9411] rounded-full blur-[120px]"></div>
        </div>
        <div className="max-w-[1440px] mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-6xl md:text-8xl text-white tracking-tighter mb-8 italic">
              Unmatched <span className="text-[#FA9411]">Precision</span>
            </h1>
            <p className="text-white/60 max-w-2xl mx-auto text-lg leading-relaxed font-medium uppercase tracking-[3px]">
              Full-service textile engineering from knitting to final branding.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services List */}
      <section className="py-24 px-6">
        <div className="max-w-[1440px] mx-auto space-y-32">
          {services.map((service, idx) => (
            <motion.div 
              key={service.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-16 lg:gap-24`}
            >
              <div className="lg:w-1/2 relative">
                <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl relative group">
                  <img src={service.image} alt={service.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08047D]/60 to-transparent"></div>
                </div>
                <div className={`absolute -bottom-8 ${idx % 2 === 0 ? '-right-8' : '-left-8'} bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-4`}>
                    <div className="p-4 bg-slate-50 rounded-2xl">{getIcon(idx)}</div>
                    <div>
                        <div className="text-[10px] font-black text-[#FA9411] uppercase tracking-[3px]">Since 2018</div>
                        <div className="text-lg font-bold text-[#08047D]">Expert Craft</div>
                    </div>
                </div>
              </div>

              <div className="lg:w-1/2">
                <div className="inline-block px-4 py-1.5 bg-slate-100 text-[#08047D] text-[10px] font-black uppercase tracking-[4px] rounded-full mb-8">
                  Service {idx + 1}
                </div>
                <h2 className="font-display text-5xl md:text-7xl text-[#08047D] leading-[0.9] mb-8 tracking-tighter">
                  {service.title}
                </h2>
                <p className="text-slate-500 text-lg leading-relaxed mb-10 max-w-xl">
                  {service.description}
                </p>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-12">
                   {(service.features || []).map((f: string) => (
                     <div key={f} className="flex items-center gap-3 text-sm font-bold text-[#1E293B]">
                        <div className="w-2 h-2 rounded-full bg-[#08047D]"></div> {f}
                     </div>
                   ))}
                </div>
                <button 
                  onClick={() => setIsQuoteModalOpen(true)}
                  className="bg-[#08047D] text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[3px] hover:bg-[#08047D] transition-all shadow-xl shadow-black/10 flex items-center gap-2 group"
                >
                  Request Consultation <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
