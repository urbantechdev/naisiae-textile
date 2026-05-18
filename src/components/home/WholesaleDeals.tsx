import React from 'react';
import { motion } from 'motion/react';
import { Package, ChevronRight, Plus, Phone, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WholesaleDealsProps {
  products: any[];
  showAllWholesale: boolean;
  setShowAllWholesale: (show: boolean) => void;
  setSelectedQuickViewProduct: (product: any) => void;
}

export function WholesaleDeals({ 
  products, 
  showAllWholesale, 
  setShowAllWholesale, 
  setSelectedQuickViewProduct 
}: WholesaleDealsProps) {
  const wholesaleProducts = products.filter(p => 
    p.tags?.some((t: string) => t.toLowerCase() === 'wholesale' || t.toLowerCase() === 'bulk' || t.toLowerCase() === 'corporate')
  );

  return (
    <section id="wholesale-deals" className="py-20 bg-white border-b border-slate-100">
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-2.5 text-[#C8102E] text-[10px] font-extrabold tracking-[5px] uppercase mb-2">
              <div className="w-7 h-0.5 bg-[#C8102E]"></div> Bulk Pricing Available
            </div>
            <h2 className="font-display text-5xl tracking-tight leading-none text-[#0A1628]">Wholesale Deals</h2>
          </div>
          <Link to="/wholesale" className="text-[12px] font-black uppercase tracking-wider text-[#1C3560] hover:text-[#C8102E] transition-colors border-b-2 border-transparent hover:border-[#C8102E] pb-1 flex items-center gap-2">
            View All Wholesale Items <ChevronRight size={14} />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
          {wholesaleProducts
            .slice(0, showAllWholesale ? undefined : 6)
            .map(product => (
              <motion.div 
                key={product.id}
                whileHover={{ y: -6 }}
                className="group bg-white border border-[#E4E8EF] rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#FDFAF4] cursor-pointer flex items-center justify-center p-2" onClick={() => setSelectedQuickViewProduct(product)}>
                  {product.imageUrl ? (
                    <img 
                      src={`${product.imageUrl}?q=60&w=400`} 
                      alt={product.name} 
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" 
                      loading="lazy" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <Package size={40} className="text-[#C8961A]/20" />
                  )}
                  <span className="absolute top-3 left-3 bg-[#C8961A] text-white text-[10px] font-bold px-2.5 py-1 rounded tracking-widest uppercase">Wholesale</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[13px] mb-3 leading-tight line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => setSelectedQuickViewProduct(product)}
                      className="w-full py-2 bg-[#C8961A] text-white hover:bg-[#A67C16] rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={12} />
                      Enquire
                    </button>
                    <a 
                      href="tel:+254792021795"
                      className="w-full py-2 bg-[#C8102E] hover:bg-[#9E0D24] text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <Phone size={12} />
                      Call Now
                    </a>
                  </div>
                </div>
              </motion.div>
            ))
          }
        </div>

        <div className="mt-12 flex justify-center">
           {wholesaleProducts.length > 6 && (
             <button 
              onClick={() => setShowAllWholesale(!showAllWholesale)}
              className="px-10 py-4 bg-slate-100/50 hover:bg-[#C8961A] hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[3px] transition-all flex items-center gap-3 group"
             >
               {showAllWholesale ? 'Show Less' : 'View More Wholesale Items'} 
               <Plus size={14} className={`transition-transform duration-500 ${showAllWholesale ? 'rotate-45' : ''}`} />
             </button>
           )}
        </div>

        {wholesaleProducts.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <Package className="mx-auto text-slate-300 mb-4" size={40} />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Wholesale Collection Launching Soon</p>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Contact us directly for bulk pricing on any catalog item.</p>
            </div>
          )}
        </div>
    </section>
  );
}
