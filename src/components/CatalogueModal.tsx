import React, { useState, useEffect } from 'react';
import { X, Download, Phone, MessageSquare, ChevronLeft, ChevronRight, BookOpen, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface CatalogPage {
  id: string | number;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  highlights: string[];
  sortOrder?: number;
}

const CATALOG_PAGES: CatalogPage[] = [
  {
    id: 1,
    title: "Premium School Uniform Essentials",
    category: "Primary & Secondary School Wear",
    description: "Our signature collection for schools. Tailored from super-durable, breathable wool-blends and combed cotton that withstands heavy playground wear and daily machine washes while retaining vibrant, unfaded institution colors.",
    imageUrl: "https://images.unsplash.com/photo-1544717305-27a734ef1904?auto=format&fit=crop&q=80&w=600",
    highlights: ["Anti-pilling premium knitwear", "Stain-resistant fabric treatment", "Reinforced double-stitch seams", "Tailored crest & custom colorways"],
    sortOrder: 1
  },
  {
    id: 2,
    title: "Executive College & Varsity apparel",
    category: "Colleges & Higher Institutions",
    description: "Trendy, sophisticated, high-identity varsity jackets, custom laboratory coats, institutional blazers, and polo shirts engineered to elevate college pride and withstand professional campus activities.",
    imageUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=600&auto=format&fit=crop",
    highlights: ["Heavy-duty fleece varsities", "High-definition custom school crests", "Breathable clinical/lab fabrics", "Premium cotton-pique polos"],
    sortOrder: 2
  },
  {
    id: 3,
    title: "Corporate Identity & Executive wear",
    category: "Corporate Sourcing",
    description: "Sleek, sharply structured suiting, executive shirts, dresses, and customized outerwear for corporate institutions, hotels, and security teams with customized tailoring for clean fittings.",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
    highlights: ["Crease-resistant formal shirting", "Premium wool-blend blazers", "Cohesive brand-matching accents", "Custom-molded corporate accessories"],
    sortOrder: 3
  },
  {
    id: 4,
    title: "Elite Athletics & Sports Kits",
    category: "Athleisure & Sports Teams",
    description: "Moisture-wicking, highly flexible, custom sub-laminated jerseys and athletic tracksuits engineered to support maximum range of motion and breathability for school leagues and professional clubs.",
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop",
    highlights: ["Dry-fit active breathability", "Four-way stretch flexible seams", "High-fidelity digital sublimation", "Windproof and water-resistant tracksuits"],
    sortOrder: 4
  }
];

export function CatalogueModal() {
  const { isCatalogueModalOpen, setIsCatalogueModalOpen, setIsQuoteModalOpen } = useCart();
  const [pages, setPages] = useState<CatalogPage[]>(CATALOG_PAGES);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'catalogue_pages'), orderBy('sortOrder', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CatalogPage)));
      } else {
        setPages(CATALOG_PAGES);
      }
    }, (error) => {
      console.warn("Could not load catalogue_pages from firestore", error);
    });
    return () => unsub();
  }, []);

  const nextPage = () => {
    setCurrentPageIndex((prev) => (prev + 1) % pages.length);
  };

  const prevPage = () => {
    setCurrentPageIndex((prev) => (prev - 1 + pages.length) % pages.length);
  };

  const activePage = pages[currentPageIndex] || CATALOG_PAGES[0];

  const handleDownload = () => {
    // Generate an authentic PDF-like user prompt download
    const link = document.createElement('a');
    link.href = activePage.imageUrl;
    link.download = `Naisiae_Textiles_Sourcing_Catalogue_2026.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isCatalogueModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsCatalogueModalOpen(false)}
        >
          <motion.div 
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-[#0A1628] w-full max-w-4xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-[#07101E] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C8961A]/10 flex items-center justify-center text-[#C8961A]">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="font-display text-xl md:text-2xl text-white font-bold leading-none mb-1">Interactive Sourcing Catalogue</h2>
                  <p className="text-[9px] md:text-[10px] text-[#C8961A] font-black uppercase tracking-[2px]">Naisiae Textiles Limited Sourcing Guide (2026 Edition)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCatalogueModalOpen(false)} 
                className="text-white/60 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all active:scale-90"
              >
                <X size={22} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-center justify-center bg-gradient-to-b from-[#0A1628] to-[#060D18]">
              {/* Left Column: Premium Interactive Slide */}
              <div className="w-full lg:w-1/2 flex flex-col">
                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-white/10 bg-black/40 group shadow-lg">
                  <img 
                    src={activePage.imageUrl} 
                    alt={activePage.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end">
                    <span className="text-[8px] font-black tracking-widest text-[#C8961A] uppercase bg-black/40 self-start px-2 py-0.5 rounded border border-[#C8961A]/20">
                      {activePage.category}
                    </span>
                    <h3 className="text-white text-base md:text-lg font-black mt-1 tracking-tight">{activePage.title}</h3>
                  </div>

                  {/* Nav Arrows */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); prevPage(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-[#C8961A] text-white flex items-center justify-center transition-colors border border-white/5 active:scale-95 cursor-pointer z-10"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); nextPage(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-[#C8961A] text-white flex items-center justify-center transition-colors border border-white/5 active:scale-95 cursor-pointer z-10"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Page Indicator */}
                <div className="flex justify-center gap-1.5 mt-3">
                  {pages.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentPageIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentPageIndex ? 'w-6 bg-[#C8961A]' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Right Column: Information & Actions */}
              <div className="w-full lg:w-1/2 flex flex-col justify-between text-left h-full">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-emerald-400 font-extrabold tracking-widest uppercase">Verified Custom Textile Sourcing</span>
                  </div>
                  <h4 className="text-white text-xl md:text-2xl font-black tracking-tight leading-tight uppercase text-zinc-100">
                    {activePage.category}
                  </h4>
                  <p className="text-white/70 text-[11px] md:text-[13px] leading-relaxed mt-3 border-l-2 border-[#C8961A] pl-3.5 font-medium italic">
                    {activePage.description}
                  </p>

                  <div className="mt-6 space-y-2">
                    <p className="text-[9px] text-[#C8961A] font-black uppercase tracking-[2.5px]">Technical Fabric Specifications</p>
                    <div className="grid grid-cols-2 gap-2">
                      {activePage.highlights.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] md:text-[11px] text-white/80 font-bold">
                          <span className="w-1.5 h-1.5 bg-[#C8102E] rounded-full shrink-0"></span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="mt-8 pt-4 border-t border-white/5 shrink-0 flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleDownload}
                    className="flex-1 bg-[#C8102E] hover:bg-[#A30D25] text-white rounded-xl py-3.5 px-6 font-black text-[10px] md:text-[11px] uppercase tracking-[3px] transition-colors duration-300 flex items-center justify-center gap-2.5 shadow-lg active:scale-95"
                  >
                    <Download size={14} />
                    Download Catalogue
                  </button>

                  <button 
                    onClick={() => {
                      setIsCatalogueModalOpen(false);
                      setIsQuoteModalOpen(true);
                    }}
                    className="flex-1 bg-white hover:bg-[#C8961A] hover:text-white text-[#0A1628] rounded-xl py-3.5 px-6 font-black text-[10px] md:text-[11px] uppercase tracking-[3px] transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-95"
                  >
                    <FileText size={14} />
                    Instant Sourcing Inquiry
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Consultation footer */}
            <div className="bg-[#07101E] px-4 py-3 shrink-0 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400">
              <span className="font-bold uppercase tracking-wider">Direct Sourcing Desk:</span>
              <div className="flex gap-4 items-center">
                <a href="tel:+254792021795" className="flex items-center gap-1.5 font-black text-white hover:text-[#C8961A] transition-colors">
                  <Phone size={11} className="text-[#C8961A]" /> +254 792 021 795
                </a>
                <a href="https://wa.me/254792021795?text=Hello, I would like to request a specialized uniform catalog." className="flex items-center gap-1.5 font-black text-white hover:text-emerald-400 transition-colors">
                  <MessageSquare size={11} className="text-[#C8961A]" /> WhatsApp Chat
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
