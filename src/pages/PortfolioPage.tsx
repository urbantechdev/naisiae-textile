import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, ShoppingBag, Heart, Menu, ChevronRight, X } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

import { useCart } from '../context/CartContext';

export default function PortfolioPage() {
  const { cartCount, wishlistCount, setIsCartOpen, setIsWishlistOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const q = query(collection(db, 'portfolio'), orderBy('sortOrder', 'asc'));
        const querySnapshot = await getDocs(q);
        const ports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (ports.length > 0) {
          setProjects(ports);
        } else {
          setProjects([
            {
              title: 'Loreto Schools Kenya',
              tag: 'Education',
              image: 'https://images.unsplash.com/photo-1544717305-27a734ef1904?auto=format&fit=crop&q=80',
              description: 'Full custom uniform engineering including bespoke blazers, sweaters with school patterns, and performance sports kits.'
            },
            {
              title: 'Safaricom Sports Day',
              tag: 'Events',
              image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80',
              description: 'Bulk production of 5000+ branded moisture-wicking t-shirts and caps for corporate athletics event.'
            },
            {
              title: 'Nairobi Hospital',
              tag: 'Healthcare',
              image: 'https://images.unsplash.com/photo-1576091160550-217359f42f8c?auto=format&fit=crop&q=80',
              description: 'Durable, anti-microbial scrubs and lab coats designed for medical professionals in high-traffic environments.'
            },
            {
              title: 'KCB Bank Corporate',
              tag: 'Corporate',
              image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80',
              description: 'Custom embroidered cardigans and v-neck sweaters for regional staff, maintaining strict brand identity.'
            },
            {
              title: 'St. Mary\'s Academy',
              tag: 'Wholesale',
              image: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&q=80',
              description: 'End-to-end supply of primary and secondary uniforms with local Uhuru Market distribution points.'
            },
            {
              title: 'Standard Chartered',
              tag: 'Marketing',
              image: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&q=80',
              description: 'Branded promotional items and uniform caps for the Nairobi Marathon series.'
            }
          ]);
        }
      } catch (error) {
        console.error("Error fetching portfolio: ", error);
      }
    };
    fetchPortfolio();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-[#0A1628]">
      <Navbar 
        wishlistCount={wishlistCount}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />

      <section className="py-32 px-6">
        <div className="max-w-[1440px] mx-auto text-center mb-24">
            <h1 className="font-display text-8xl md:text-[10rem] text-[#0A1628] leading-[0.8] tracking-tighter mb-12 uppercase italic">
                Our <span className="text-white/0 stroke-text font-black" style={{ WebkitTextStroke: '2px #0A1628' }}>Legacy</span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm uppercase font-black tracking-[5px]">
                Proven scale, quality, and commitment to excellence across Kenya.
            </p>
        </div>

        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {projects.map((project, idx) => (
                <motion.div 
                    key={`${project.title}-${idx}`}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                >
                    <div className="aspect-[3/4] rounded-[3.5rem] overflow-hidden mb-10 relative">
                        <img src={project.image} alt={project.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-[1.05]" />
                        <div className="absolute inset-0 bg-[#0A1628]/10 group-hover:bg-transparent transition-colors"></div>
                        <div className="absolute top-8 left-8">
                            <span className="px-4 py-1.5 bg-white text-[#0A1628] text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                {project.tag}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-3xl font-display uppercase tracking-widest text-[#0A1628] mb-4">{project.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{project.description}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-[#C8102E] group-hover:border-[#C8102E] transition-all cursor-pointer">
                            <ExternalLink size={20} />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      </section>

      <section className="py-32 px-6 bg-[#0A1628] text-white">
         <div className="max-w-[1440px] mx-auto text-center">
            <h2 className="font-display text-5xl md:text-7xl tracking-tighter mb-12 italic">Join the Leading <span className="text-[#C8961A]">Institutions</span></h2>
            <button 
              onClick={() => setIsQuoteModalOpen(true)}
              className="px-16 py-6 bg-[#C8961A] text-white rounded-full font-black text-[12px] uppercase tracking-[4px] hover:bg-white hover:text-[#0A1628] transition-all"
            >
                Start Your Partnership
            </button>
         </div>
      </section>

      <Footer />

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 lg:p-8 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-[#0A1628]/95 backdrop-blur-xl"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedProject(null)}
                className="absolute top-6 right-6 z-50 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-800 hover:text-red-500 transition-all border border-slate-100 shadow-xl"
              >
                <X size={20} />
              </button>

              <div className="w-full md:w-1/2 h-[300px] md:h-auto bg-slate-100 flex items-center justify-center overflow-hidden">
                <img 
                  src={selectedProject.image} 
                  className="w-full h-full object-cover" 
                  alt={selectedProject.title} 
                />
              </div>

              <div className="w-full md:w-1/2 p-10 lg:p-14 flex flex-col justify-center overflow-y-auto">
                <span className="text-[10px] font-black uppercase text-[#C8961A] tracking-[4px] mb-4">
                  {selectedProject.tag} Project
                </span>
                <h2 className="font-display text-4xl lg:text-6xl text-[#0A1628] leading-[0.9] mb-8 uppercase italic">
                  {selectedProject.title}
                </h2>
                
                <div className="h-0.5 w-12 bg-[#0A1628] mb-8"></div>
                
                <p className="text-slate-500 text-base lg:text-lg leading-relaxed font-light mb-10 italic">
                  {selectedProject.description || "A comprehensive custom textile solution developed with precision and care, ensuring institutional legacy through superior craftsmanship."}
                </p>

                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-[#C8102E] tracking-widest">Specifications</h3>
                    <div className="space-y-2">
                       <div className="text-[11px] font-bold text-[#0A1628] flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-slate-300"></div> Double-knit weave
                       </div>
                       <div className="text-[11px] font-bold text-[#0A1628] flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-slate-300"></div> High-tensile thread
                       </div>
                       <div className="text-[11px] font-bold text-[#0A1628] flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-slate-300"></div> Institutional Grade
                       </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-[#C8102E] tracking-widest">Impact</h3>
                    <div className="space-y-2">
                       <div className="text-[11px] font-bold text-[#0A1628] flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-slate-300"></div> 500+ Students clad
                       </div>
                       <div className="text-[11px] font-bold text-[#0A1628] flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-slate-300"></div> 3 Year Lifecycle
                       </div>
                       <div className="text-[11px] font-bold text-[#0A1628] flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-slate-300"></div> Brand Perfection
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-100 pt-8">
                  <div className="flex items-center gap-4 py-3 border-b border-slate-100/50">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest w-24">Deliverable</span>
                    <span className="text-xs font-bold text-[#0A1628]">Custom Textile Design & Bulk Production</span>
                  </div>
                  <div className="flex items-center gap-4 py-3 border-b border-slate-100/50">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest w-24">Partner</span>
                    <span className="text-xs font-bold text-[#0A1628]">{selectedProject.title}</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSelectedProject(null);
                    setIsQuoteModalOpen(true);
                  }}
                  className="mt-12 w-full py-5 bg-[#0A1628] text-white rounded-2xl font-black text-[10px] uppercase tracking-[3px] hover:bg-[#C8102E] transition-all shadow-xl active:scale-95"
                >
                  Inquire For Your Project
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
