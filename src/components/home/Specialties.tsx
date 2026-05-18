import React from 'react';
import { motion } from 'motion/react';
import { Package, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SpecialtiesProps {
  categories: any[];
  setActiveTab: (tab: string) => void;
}

export function Specialties({ categories, setActiveTab }: SpecialtiesProps) {
  return (
    <section id="specialties" className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-3 text-[#C8102E] text-[10px] font-black tracking-[4px] uppercase mb-4">
              <div className="w-8 h-[2px] bg-[#C8102E]"></div> Our Specialties
            </div>
            <h2 className="text-4xl lg:text-5xl font-display text-[#0A1628] leading-none mb-4">
              Featured Categories
            </h2>
          </div>
          <Link to="/products" className="hidden sm:flex text-sm font-bold text-[#0A1628] hover:text-[#C8102E] transition-colors items-center gap-2">
            Explore Catalog <ChevronRight size={14} />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
          {categories.length > 0 ? (
            categories.slice(0, 4).map((cat, idx) => (
              <motion.div 
                key={cat.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -6 }}
                className="group relative h-[350px] rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer"
                onClick={() => {
                  setActiveTab(cat.title);
                  const shopEl = document.getElementById('catalog-section') || document.getElementById('shop');
                  if (shopEl) {
                    const offset = 80; // Navbar height
                    const elementPosition = shopEl.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }}
              >
                <div className="absolute inset-0">
                  {cat.image ? (
                    <img 
                      src={cat.image} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={cat.title} 
                      loading="lazy" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center"><Package size={40} className="text-slate-200" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="absolute bottom-8 left-8 right-8">
                  {cat.subtitle && <p className="text-[10px] text-[#C8961A] font-black uppercase tracking-[2px] mb-2">{cat.subtitle}</p>}
                  <h3 className="text-xl font-bold text-white mb-4 line-clamp-2">{cat.title}</h3>
                  <div className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">
                    Shop Now <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-[350px] bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center animate-pulse">
                <Package className="text-slate-200 mb-4" size={40} />
                <div className="w-1/2 h-2 bg-slate-200 rounded mb-2"></div>
                <div className="w-1/3 h-2 bg-slate-200 rounded"></div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
