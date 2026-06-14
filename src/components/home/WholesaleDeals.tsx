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

  const [expandedProductId, setExpandedProductId] = React.useState<string | null>(null);
  const clickTimeoutRef = React.useRef<{ [key: string]: NodeJS.Timeout | null }>({});

  React.useEffect(() => {
    return () => {
      // Clean up timeouts on unmount
      Object.values(clickTimeoutRef.current).forEach((t) => {
        if (t) clearTimeout(t);
      });
    };
  }, []);

  const handleProductInteraction = (product: any) => {
    const productId = product.id;
    if (clickTimeoutRef.current[productId]) {
      clearTimeout(clickTimeoutRef.current[productId]!);
      clickTimeoutRef.current[productId] = null;
      // Double tap -> preview popup
      setSelectedQuickViewProduct(product);
    } else {
      clickTimeoutRef.current[productId] = setTimeout(() => {
        clickTimeoutRef.current[productId] = null;
        // Single tap -> expand
        setExpandedProductId((prev) => (prev === productId ? null : productId));
      }, 250);
    }
  };

  return (
    <section id="wholesale-deals" className="py-20 bg-white border-b border-slate-100">
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-2.5 text-[#00C4CC] text-[10px] font-extrabold tracking-[5px] uppercase mb-2">
              <div className="w-7 h-0.5 bg-[#00C4CC]"></div> Bulk Pricing Available
            </div>
            <h2 className="font-display text-5xl tracking-tight leading-none text-[#0E121C]">Wholesale Deals</h2>
          </div>
          <Link to="/wholesale" className="text-[12px] font-black uppercase tracking-wider text-[#7D2AE8] hover:text-[#FF4F5A] transition-colors border-b-2 border-transparent hover:border-[#FF4F5A] pb-1 flex items-center gap-2">
            View All Wholesale Items <ChevronRight size={14} />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
          {wholesaleProducts
            .slice(0, showAllWholesale ? undefined : 6)
            .map(product => {
              const isExpanded = expandedProductId === product.id;
              return (
                <motion.div 
                  key={product.id}
                  layout
                  whileHover={{ y: isExpanded ? 0 : -6 }}
                  className={`group bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col ${
                    isExpanded 
                      ? 'border-[#00C4CC] ring-2 ring-[#00C4CC]/20 col-span-2 md:col-span-2 lg:col-span-2' 
                      : 'border-[#E4E8EF]'
                  }`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#FDFAF4] cursor-pointer flex items-center justify-center p-2" onClick={() => handleProductInteraction(product)}>
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" 
                        loading="lazy" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <Package size={40} className="text-[#00C4CC]/20" />
                    )}
                    <span className="absolute top-3 left-3 bg-gradient-to-r from-[#FF4F5A] to-[#7D2AE8] text-white text-[9.5px] font-black px-2.5 py-1 rounded tracking-widest uppercase shadow-sm">Wholesale</span>
                  </div>
                  <div className="p-4 cursor-pointer flex flex-col flex-grow" onClick={() => handleProductInteraction(product)}>
                    <h3 className="font-bold text-[13px] mb-2 leading-tight line-clamp-1 text-[#0E121C]">{product.name}</h3>
                    
                    {/* Interactive hint */}
                    <span className="text-[9px] text-[#00C4CC] font-bold mb-3 block leading-none antialiased">
                      {isExpanded ? '⚡ Double-click to preview • Click to collapse' : 'ℹ️ Click once to expand specs'}
                    </span>

                    <div className="flex flex-col gap-2 mt-auto">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedQuickViewProduct(product); }}
                        className="w-full py-2 bg-[#00C4CC] text-white hover:bg-[#008F94] rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare size={12} />
                        Enquire
                      </button>
                      <a 
                        href="tel:+254792021795"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2 bg-[#FF4F5A] hover:bg-[#E03B46] text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-center"
                      >
                        <Phone size={12} />
                        Call Now
                      </a>
                    </div>
                  </div>

                  {/* Expand tray */}
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-slate-100 bg-slate-50/80 p-4 text-xs space-y-3 cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div>
                        <span className="font-extrabold uppercase tracking-wide text-slate-400 text-[9px] block">Bulk Supply Details</span>
                        <p className="text-slate-600 mt-1 leading-relaxed">
                          {product.description || "Premium high-grade textiles tailored for institutional bulk supply. High threadcount fabrics suited for regular intensive washing schedules."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100/50">
                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                          <span className="text-[8px] text-slate-400 font-extrabold block uppercase">Minimum Order</span>
                          <span className="font-extrabold text-[#0E121C]">50 Units</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                          <span className="text-[8px] text-slate-400 font-extrabold block uppercase">Industry Fit</span>
                          <span className="font-extrabold text-[#00C4CC]">Hospitality / School</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-2 border-t border-dashed border-slate-200">
                        <span className="flex items-center gap-1 text-[9px]">⚡ Double-tap to preview modal</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setExpandedProductId(null); }}
                          className="text-[#FF4F5A] font-black uppercase text-[8px] tracking-wider hover:underline cursor-pointer"
                        >
                          Collapse ▲
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          }
        </div>

        <div className="mt-12 flex justify-center">
           {wholesaleProducts.length > 6 && (
             <button 
              onClick={() => setShowAllWholesale(!showAllWholesale)}
              className="px-10 py-4 bg-slate-100 hover:bg-[#7D2AE8] hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[3px] transition-all flex items-center gap-3 group shadow-sm"
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
