import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProductScrollNavigator } from '../components/ProductScrollNavigator';
import { motion } from 'motion/react';
import { ChevronRight, Package, Grid, Layout, Scissors, HelpCircle, Phone, MessageSquare, FileText } from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { LazyImage } from '../components/LazyImage';

import { useCart } from '../context/CartContext';

export default function ProductsPage() {
  const { 
    cartCount, 
    wishlistCount, 
    setIsCartOpen, 
    setIsWishlistOpen,
    setIsQuoteModalOpen,
    addToCart,
    setQuoteProduct
  } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('active', '==', true), limit(500));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const unsorted = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(unsorted.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    });
    return () => unsubscribe();
  }, []);

  const wholesaleProducts = useMemo(() => 
    products.filter(p => p.tags?.some((t: string) => t.toLowerCase() === 'wholesale' || t.toLowerCase() === 'bulk' || t.toLowerCase() === 'corporate'))
  , [products]);

  const sections = [
    {
      id: 'wholesale',
      title: 'Wholesale Solutions',
      subtitle: 'Premium Bulk Manufacturing',
      description: 'Exclusive pricing for schools, resellers, and corporate clients requiring bulk quantities of standard designs.',
      image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80',
      action: 'Browse Wholesale Deals'
    },
    {
      id: 'designs',
      title: 'Our Design Studio',
      subtitle: 'Contemporary Catalog',
      description: 'Explore our pre-vetted catalog of school uniforms, sports kits, and corporate office wear ready for your logo.',
      image: 'https://images.unsplash.com/photo-1544717305-27a734ef1904?auto=format&fit=crop&q=80',
      action: 'Explore Design Catalog'
    },
    {
      id: 'customization',
      title: 'Bespoke Customization',
      subtitle: 'Your Vision, Engineered',
      description: 'Custom patterns, unique color ways, and specialized fabrics for institutions that want to stand out.',
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80',
      action: 'Start Custom Design'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-[#0A1628]">
      <Navbar 
        wishlistCount={wishlistCount}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />
      <Breadcrumb />

      {/* Section Header */}
      <div className="py-24 px-6 bg-[#0A1628] text-white text-center">
        <div className="max-w-7xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-7xl md:text-9xl tracking-tighter italic mb-8"
          >
            Our <span className="text-[#C8961A]">Products</span>
          </motion.h1>
          <p className="text-white/40 text-sm font-black uppercase tracking-[5px] max-w-xl mx-auto">
            Industrial grade school uniforms and corporate textiles engineered for durability.
          </p>
        </div>
      </div>

      {/* Floating Section Nav */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-8 flex justify-center gap-12">
            {sections.map(s => (
                <button 
                    key={s.id}
                    onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    className="py-5 text-[10px] font-black uppercase tracking-[3px] text-slate-400 hover:text-[#C8102E] transition-all relative group"
                >
                    {s.title}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C8102E] scale-x-0 group-hover:scale-x-100 transition-transform"></div>
                </button>
            ))}
        </div>
      </div>

      {/* Wholesale Section */}
      <section id="wholesale" className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
             <div className="lg:w-1/2">
                <div className="flex items-center gap-3 text-[#C8102E] text-[10px] font-black tracking-[4px] uppercase mb-8">
                    <Package size={16} /> Volume Scalability
                </div>
                <h2 className="font-display text-7xl md:text-8xl text-[#0A1628] leading-[0.85] tracking-tighter mb-10">
                   Wholesale <br/> <span className="text-[#C8961A]">Precision</span>
                </h2>
                <p className="text-slate-500 text-lg leading-relaxed mb-12 max-w-lg">
                    Order directly from the source. Our wholesale platform is built for high-performance institutions needing 100+ units with consistent quality control and guaranteed delivery slots.
                </p>
                <div className="flex flex-wrap gap-4">
                    <button onClick={() => setIsQuoteModalOpen(true)} className="px-10 py-5 bg-[#0A1628] text-white rounded-2xl font-black text-[11px] uppercase tracking-[3px] hover:bg-[#C8102E] transition-all">
                        Bulk Inquiry
                    </button>
                    <div className="flex items-center gap-4 text-[#0A1628]">
                        <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center"><Phone size={18} /></div>
                        <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">Call Account Manager</div>
                            <div className="font-bold">+254 792 021 795</div>
                        </div>
                    </div>
                </div>
             </div>
             <div className="lg:w-1/2 grid grid-cols-2 gap-6 relative">
                {wholesaleProducts.slice(0, 4).map((p, idx) => (
                    <motion.div 
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`rounded-3xl overflow-hidden border border-slate-100 shadow-xl flex flex-col justify-between ${idx % 2 !== 0 ? 'mt-12' : ''}`}
                    >
                        <LazyImage src={p.imageUrl} alt={p.name} className="object-cover object-top" wrapperClassName="w-full aspect-[4/5]" placeholderColor="bg-slate-100" />
                        <div className="p-5 bg-white flex flex-col justify-between flex-grow">
                            <div>
                                <h4 className="font-bold text-xs uppercase tracking-wider mb-1 line-clamp-1">{p.name}</h4>
                                <p className="text-[10px] font-black text-[#C8102E] uppercase tracking-wider mb-3">BULK PRICE ON REQUEST</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setQuoteProduct(p);
                                        setIsQuoteModalOpen(true);
                                    }}
                                    className="flex-1 bg-[#0A1628] hover:bg-[#C8102E] text-white py-2 px-3 rounded-xl font-extrabold text-[9px] uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                                    title="Submit wholesale quote request"
                                >
                                    <FileText size={11} /> Quote ✉️
                                </button>
                                <a
                                    href={`https://wa.me/254792021795?text=${encodeURIComponent(`Hello Naisiae Textiles, I am interested in ordering a bulk custom volume of "${p.name}". Please let me know the pricing and options.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl font-extrabold text-[9px] uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                                    title="Direct WhatsApp Inquiry"
                                >
                                    <MessageSquare size={11} /> Chat 💬
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* Designs Section */}
      <section id="designs" className="py-32 px-6 bg-[#0A1628] text-white">
        <div className="max-w-[1440px] mx-auto text-center">
             <div className="inline-block px-6 py-2 border-2 border-[#C8961A] text-[#C8961A] text-[10px] font-black uppercase tracking-[5px] rounded-full mb-12">
                Catalog Essentials
             </div>
             <h2 className="font-display text-7xl md:text-9xl text-white italic tracking-tighter mb-16 leading-none">
                Vetted <span className="text-white/20">Styles</span>
             </h2>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {products.filter(p => !p.tags?.includes('wholesale')).slice(0, 6).map((p, idx) => (
                    <motion.div 
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="group text-left"
                    >
                        <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden mb-8 relative">
                             <LazyImage src={p.imageUrl} alt={p.name} className="object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-700 bg-[#FDFAF4]" placeholderColor="bg-[#FDFAF4]/20" />
                             <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-20"></div>
                        </div>
                        <h3 className="text-2xl font-display uppercase tracking-widest mb-1">{p.name}</h3>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-[3px]">{p.category}</p>
                          <span className="text-[16px] font-black text-[#C8961A]">{p.price?.toLocaleString()}/-</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2.5 rounded-xl font-extrabold text-[9.5px] uppercase tracking-wide transition-all text-center shadow-sm"
                            title="Add unit to shopping cart"
                          >
                            Add 🛒
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              const cartItem = {
                                ...p,
                                selectedVariants: p.selectedVariants || {},
                                quantity: 1,
                                price: p.price,
                                priceType: p.priceType || 'fixed'
                              };
                              addToCart(cartItem); 
                              navigate('/checkout');
                            }}
                            className="flex-1 bg-gradient-to-r from-[#C2102E] to-[#C8961A] text-white py-2.5 rounded-xl font-extrabold text-[9.5px] uppercase tracking-wide transition-all text-center shadow-md hover:opacity-95"
                            title="Secure instant checkout"
                          >
                            Buy Now ⚡
                          </button>
                        </div>
                    </motion.div>
                ))}
             </div>
             <div className="mt-20">
                <button 
                  onClick={() => window.location.href = '/#shop'}
                  className="px-12 py-6 bg-[#C8961A] text-white rounded-full font-black text-[12px] uppercase tracking-[4px] hover:bg-white hover:text-[#0A1628] transition-all"
                >
                    View All Designs
                </button>
             </div>
        </div>
      </section>

      {/* Customization Section */}
      <section id="customization" className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-24 items-center">
            <div className="lg:w-1/2 relative">
                <div className="relative">
                    <div className="rounded-[4rem] overflow-hidden shadow-2xl w-full aspect-[4/5]">
                        <LazyImage 
                            src="https://images.unsplash.com/photo-1524333865985-64906560938f?auto=format&fit=crop&q=80" 
                            alt="Customization" 
                            className="object-cover" 
                            placeholderColor="bg-slate-100"
                        />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#C8102E] rounded-full blur-[80px] opacity-20 -z-10"></div>
                </div>
            </div>
            <div className="lg:w-1/2">
                <h2 className="font-display text-7xl text-[#0A1628] tracking-tighter italic mb-10 leading-none">
                   Bespoke <br/> <span className="text-[#C8102E]">Uniforms</span>
                </h2>
                <p className="text-slate-500 text-lg leading-relaxed mb-12">
                   Don't settle for off-the-shelf. Our design team works with you to choose unique fabrics, specialized weave patterns, and bespoke color palettes that define your institution's prestige.
                </p>
                <div className="space-y-8 mb-16">
                    {[
                        { title: 'Custom Patterns', desc: 'Unique checks, stripes, and solid weave variations.' },
                        { title: 'Signature Logos', desc: 'Exclusive high-density embroidery placements.' },
                        { title: 'Performance Fabrics', desc: 'Moisture-wicking, anti-pilling, and fade-resistant textiles.' }
                    ].map((item, idx) => (
                        <div key={`${item.title}-${idx}`} className="flex gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#C8102E] shrink-0 font-display text-xl">0{idx + 1}</div>
                            <div>
                                <h4 className="font-black text-sm uppercase tracking-widest text-[#0A1628] mb-1">{item.title}</h4>
                                <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <button 
                  onClick={() => setIsQuoteModalOpen(true)}
                  className="w-full py-6 bg-[#0A1628] text-white rounded-3xl font-black text-[12px] uppercase tracking-[4px] hover:bg-[#C8102E] transition-all shadow-2xl"
                >
                   Start Your Custom Project
                </button>
            </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
