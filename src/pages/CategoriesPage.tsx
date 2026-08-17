import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { motion } from 'motion/react';
import { ChevronRight, ShoppingBag, Heart, Menu, Sparkles } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { getCategoryPlaceholder } from '../utils/image';

import { useCart } from '../context/CartContext';

export default function CategoriesPage() {
  const { cartCount, wishlistCount, setIsCartOpen, setIsWishlistOpen, setIsQuoteModalOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [majorCategories, setMajorCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        // Fetch explicit categories
        const catSnap = await getDocs(query(collection(db, 'categories'), orderBy('sortOrder', 'asc')));
        const explicitCats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

        // Fetch products to synthesize categories
        const prodSnap = await getDocs(collection(db, 'products'));
        const products = prodSnap.docs.map(doc => doc.data());
        
        const catMap = new Map<string, { count: number, image: string }>();
        products.forEach(p => {
          if (p.category) {
            const entry = catMap.get(p.category) || { count: 0, image: p.imageUrl };
            entry.count++;
            if (p.imageUrl && !entry.image) entry.image = p.imageUrl;
            catMap.set(p.category, entry);
          }
        });

        const synthCats = Array.from(catMap.entries()).map(([name, data]) => {
          const explicit = explicitCats.find(c => (c.title || c.name) === name);
          return {
            id: explicit?.id || name.toLowerCase().replace(/\s+/g, '-'),
            title: name,
            subtitle: explicit?.subtitle || `${data.count} Products Available`,
            image: explicit?.image || getCategoryPlaceholder(name),
            description: explicit?.description || `Explore our high-quality ${name.toLowerCase()} range tailored for institutional needs.`,
            link: `/?tab=${encodeURIComponent(name)}#shop`
          };
        });

        if (synthCats.length > 0) {
          setMajorCategories(synthCats);
        } else {
          // Final fallback with complete, professional sector categories using custom placeholder images
          setMajorCategories([
            { 
              id: 'school', 
              title: 'School Uniforms', 
              subtitle: 'Primary, Secondary & College', 
              image: getCategoryPlaceholder('School Uniforms'), 
              description: 'Comprehensive schoolwear engineered for Nairobi’s learning institutions, including durable sweaters, shirts, blouses, trousers, and skirts.', 
              link: '/?tab=School Uniforms#shop' 
            },
            { 
              id: 'corporate', 
              title: 'Corporate Wear', 
              subtitle: 'Professional Team Identity', 
              image: getCategoryPlaceholder('Corporate Wear'), 
              description: 'Polished suits, elegant blazers, branded shirts, and formal wear crafted to strengthen company and institutional brands.', 
              link: '/?tab=Corporate Wear#shop' 
            },
            { 
              id: 'healthcare', 
              title: 'Healthcare & Medical', 
              subtitle: 'Hospitals & Specialized Clinics', 
              image: getCategoryPlaceholder('Healthcare'), 
              description: 'Antimicrobial scrub suits, sterile doctor lab coats, protective gowns, and patient apparel optimized for extreme hygiene standards.', 
              link: '/?tab=Healthcare#shop' 
            },
            { 
              id: 'hospitality', 
              title: 'Hospitality & Culinary', 
              subtitle: 'Premium Catering & Hotel Staff', 
              image: getCategoryPlaceholder('Hospitality'), 
              description: 'Breathable chef jackets, multi-pocket aprons, hotel server vests, and reception uniforms for world-class dining operations.', 
              link: '/?tab=Hospitality#shop' 
            },
            { 
              id: 'industrial', 
              title: 'Industrial Workwear', 
              subtitle: 'Safety & Heavy Duty Workwear', 
              image: getCategoryPlaceholder('Industrial'), 
              description: 'Rugged dustcoats, reflective safety jackets, heavy-duty boiler suits, and high-visibility workwear compliant with workplace standards.', 
              link: '/?tab=Industrial#shop' 
            },
            { 
              id: 'sports', 
              title: 'Sports Kits', 
              subtitle: 'Athletics & Institutional Teams', 
              image: getCategoryPlaceholder('Sports Kits'), 
              description: 'Performance soccer jerseys, breathable sports shorts, dynamic warm-up tracksuits, and customized team activewear.', 
              link: '/?tab=Sports Kits#shop' 
            }
          ]);
        }
      } catch (error) {
        console.error("Error fetching categories: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoriesData();
  }, []);

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

      <section className="py-32 px-6">
        <div className="max-w-[1440px] mx-auto text-center mb-24">
            <h1 className="font-display text-8xl md:text-9xl text-[#08047D] leading-[0.8] tracking-tighter mb-8 italic">
                Our <span className="text-[#08047D]">Categories</span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm uppercase font-black tracking-[5px]">
                Browse our specialized collections engineered for specific sector needs.
            </p>
        </div>

        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {majorCategories.map((cat, idx) => (
                <motion.div 
                    key={cat.id}
                    initial={{ opacity: 0, x: idx === 0 ? -20 : idx === 2 ? 20 : 0, y: 10 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true }}
                    className="relative group bg-[#08047D] rounded-[3rem] overflow-hidden aspect-[3/4] shadow-2xl"
                >
                    <img src={cat.image} alt={cat.title} className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-100 transition-all duration-1000" loading="lazy" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08047D] via-transparent to-transparent"></div>
                    
                    <div className="absolute bottom-12 left-12 right-12">
                        <div className="text-[10px] font-black text-[#FA9411] uppercase tracking-[4px] mb-2">{cat.subtitle}</div>
                        <h3 className="text-4xl font-display text-white italic mb-4 leading-none">{cat.title}</h3>
                        <p className="text-white/40 text-sm mb-8 line-clamp-2">{cat.description}</p>
                        <button 
                            onClick={() => window.location.href = cat.link}
                            className="bg-white text-[#08047D] px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[3px] hover:bg-[#FA9411] hover:text-white transition-all shadow-xl shadow-black/40 flex items-center gap-2 group/btn"
                        >
                            Explore Collection <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>

        {/* Uniform Simulator CTA banner */}
        <div className="max-w-[1440px] mx-auto mt-24 bg-gradient-to-r from-[#04023D] to-[#1C2A3E] rounded-[3.5rem] p-12 md:p-16 text-white relative overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(250, 148, 17,0.1),transparent)] pointer-events-none" />
          <div className="space-y-6 max-w-2xl relative z-10">
            <span className="text-[10px] font-black text-[#FA9411] uppercase tracking-[4px] bg-[#FA9411]/10 px-4 py-2 rounded-full inline-block">
              3D Virtual Tailoring
            </span>
            <h2 className="font-display text-4xl md:text-6xl italic leading-none">
              Interactive <span className="text-white/0 stroke-text" style={{ WebkitTextStroke: '1.5px #FFFFFF' }}>School Uniform</span> Simulator
            </h2>
            <p className="text-slate-400 text-sm font-semibold leading-relaxed">
              Skip the guesswork. Customize sweaters, shirts, blazers, trim patterns, and school tie stripes with our state-of-the-art interactive designer and get instant volume tender quotes for your school or institution.
            </p>
          </div>
          <div className="shrink-0 relative z-10">
            <button 
              onClick={() => window.location.href = '/uniform-simulator'}
              className="bg-[#08047D] hover:bg-white text-white hover:text-[#08047D] px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-[3px] transition-all shadow-2xl shadow-[#08047D]/25 flex items-center gap-3 group/sim"
            >
              Launch Simulator <Sparkles size={16} className="group-hover/sim:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
