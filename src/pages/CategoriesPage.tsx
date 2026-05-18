import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { motion } from 'motion/react';
import { ChevronRight, ShoppingBag, Heart, Menu } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

import { useCart } from '../context/CartContext';

export default function CategoriesPage() {
  const { cartCount, wishlistCount, setIsCartOpen, setIsWishlistOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [majorCategories, setMajorCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
        const querySnapshot = await getDocs(q);
        const cats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (cats.length > 0) {
          setMajorCategories(cats);
        } else {
          // Default fallback
          setMajorCategories([
            {
              id: 'school',
              title: 'School Uniforms',
              subtitle: 'Primary, Secondary & College',
              image: 'https://images.unsplash.com/photo-1544717305-27a734ef1904?auto=format&fit=crop&q=80',
              description: 'Comprehensive uniform kits engineered for daily school use.',
              link: '/?tab=School Uniforms#shop'
            },
            {
              id: 'casual',
              title: 'Casual Wear',
              subtitle: 'School Uniforms Everyday Styles',
              image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80',
              description: 'Comfortable, durable t-shirts, hoodies, and leisure wear.',
              link: '/?tab=Casual Wear#shop'
            },
            {
              id: 'corporate',
              title: 'Corporate Wear',
              subtitle: 'Professional Branch Identity',
              image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80',
              description: 'Polished apparel for office environments and corporate teams.',
              link: '/?tab=Corporate Wear#shop'
            }
          ]);
        }
      } catch (error) {
        console.error("Error fetching categories: ", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-[#0A1628]">
      <Navbar 
        wishlistCount={wishlistCount}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />

      <section className="py-32 px-6">
        <div className="max-w-[1440px] mx-auto text-center mb-24">
            <h1 className="font-display text-8xl md:text-9xl text-[#0A1628] leading-[0.8] tracking-tighter mb-8 italic">
                Our <span className="text-[#C8102E]">Categories</span>
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
                    className="relative group bg-[#0A1628] rounded-[3rem] overflow-hidden aspect-[3/4] shadow-2xl"
                >
                    <img src={cat.image} alt={cat.title} className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-100 transition-all duration-1000" loading="lazy" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-transparent to-transparent"></div>
                    
                    <div className="absolute bottom-12 left-12 right-12">
                        <div className="text-[10px] font-black text-[#C8961A] uppercase tracking-[4px] mb-2">{cat.subtitle}</div>
                        <h3 className="text-4xl font-display text-white italic mb-4 leading-none">{cat.title}</h3>
                        <p className="text-white/40 text-sm mb-8 line-clamp-2">{cat.description}</p>
                        <button 
                            onClick={() => window.location.href = cat.link}
                            className="bg-white text-[#0A1628] px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[3px] hover:bg-[#C8961A] hover:text-white transition-all shadow-xl shadow-black/40 flex items-center gap-2 group/btn"
                        >
                            Explore Collection <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
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
