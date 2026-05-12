import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { motion } from 'motion/react';
import { ExternalLink, ShoppingBag, Heart, Menu, ChevronRight } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

interface PageProps {
  cart: any[];
  setCart: React.Dispatch<React.SetStateAction<any[]>>;
  wishlist: any[];
  setWishlist: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function PortfolioPage({ cart, setCart, wishlist, setWishlist }: PageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

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
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        setIsCartOpen={setIsCartOpen}
        setIsWishlistOpen={setIsWishlistOpen}
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
                    key={project.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="group"
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
    </div>
  );
}
