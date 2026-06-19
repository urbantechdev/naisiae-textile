import React from 'react';
import { motion } from 'motion/react';
import { Package, ChevronRight, Plus, Phone, MessageSquare, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WholesaleDealsProps {
  products: any[];
  showAllWholesale: boolean;
  setShowAllWholesale: (show: boolean) => void;
  setSelectedQuickViewProduct: (product: any) => void;
  onProductTap?: () => void;
}

export function WholesaleDeals({ 
  products, 
  showAllWholesale, 
  setShowAllWholesale, 
  setSelectedQuickViewProduct,
  onProductTap
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
    onProductTap?.();
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2.5 text-[#C8102E] text-[10px] font-extrabold tracking-[5px] uppercase mb-2">
              <div className="w-7 h-0.5 bg-[#C8102E]"></div> Bulk Pricing Available
            </div>
            <h2 className="font-display text-5xl tracking-tight leading-none text-[#0E121C]">Wholesale Deals</h2>
          </div>
          <Link to="/wholesale" className="text-[12px] font-black uppercase tracking-wider text-[#C8102E] hover:text-[#C8961A] transition-colors border-b-2 border-transparent hover:border-[#C8961A] pb-1 flex items-center gap-2">
            View All Wholesale Items <ChevronRight size={14} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
          {wholesaleProducts
            .slice(0, showAllWholesale ? undefined : 6)
            .map(product => {
              const isExpanded = expandedProductId === product.id;
              return (
                <motion.div 
                   key={product.id}
                   layout
                   whileHover={isExpanded ? undefined : { y: -6 }}
                   className={`group bg-white border rounded-xl overflow-hidden shadow-sm flex ${
                     isExpanded 
                       ? "flex-col col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-3 ring-2 ring-[#C8961A]/50 shadow-2xl bg-gradient-to-br from-white to-slate-50/70" 
                       : "flex-row sm:flex-col border-[#E4E8EF] hover:shadow-2xl hover:border-[#C8961A]/30 w-full"
                   }`}
                >
                  {!isExpanded ? (
                    <>
                      <div className="relative aspect-square sm:aspect-[4/3] w-[120px] sm:w-full overflow-hidden bg-[#FDFAF4] cursor-pointer flex items-center justify-center p-2 shrink-0 border-r sm:border-r-0 sm:border-b border-slate-100" onClick={() => handleProductInteraction(product)}>
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" 
                            loading="lazy" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <Package size={40} className="text-[#C8961A]/20" />
                        )}
                        <span className="absolute top-2 left-2 bg-gradient-to-r from-[#C8102E] to-[#C8961A] text-white text-[7px] sm:text-[9.5px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase shadow-sm">Wholesale</span>
                      </div>
                      <div className="p-3 sm:p-4 cursor-pointer flex flex-col justify-between flex-grow min-w-0" onClick={() => handleProductInteraction(product)}>
                        <div>
                          <h3 className="font-bold text-[12px] sm:text-[13px] mb-1 sm:mb-2 leading-tight line-clamp-2 min-h-[1.5rem] sm:line-clamp-1 text-[#0E121C]">{product.name}</h3>
                          
                          {/* Interactive hint */}
                          <span className="text-[8px] sm:text-[9px] text-[#C8961A] font-bold mb-2 block leading-none antialiased flex items-center gap-1.5 mt-1 border-t border-slate-50 pt-1.5 sm:pt-2">
                            <span>✨</span> Tap to inspect details
                          </span>
                        </div>

                        <div className="flex flex-row sm:flex-col gap-2 mt-auto pt-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onProductTap?.(); setSelectedQuickViewProduct(product); }}
                            className="flex-grow sm:w-full py-1.5 sm:py-2 bg-[#C8961A] text-white hover:bg-[#B08214] rounded-lg text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare size={11} />
                            Enquire
                          </button>
                          <a 
                            href="tel:+254792021795"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-grow sm:w-full py-1.5 sm:py-2 bg-[#C8102E] hover:bg-[#AF0B23] text-white rounded-lg text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 text-center"
                          >
                            <Phone size={11} />
                            Call Now
                          </a>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col md:flex-row h-full">
                      {/* Left Column: Product visual card and cost */}
                      <div className="w-full md:w-5/12 bg-white flex flex-col border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
                        <div className="relative aspect-[4/3] md:aspect-[4/5] overflow-hidden bg-[#FDFAF4] flex items-center justify-center p-2">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="w-full h-full object-cover object-top" 
                              loading="lazy" 
                              referrerPolicy="no-referrer" 
                            />
                          ) : (
                            <Package size={50} className="text-[#C8961A]/20" />
                          )}
                          <span className="absolute top-3 left-3 bg-gradient-to-r from-[#C8102E] to-[#C8961A] text-white text-[9.5px] font-black px-2.5 py-1 rounded tracking-widest uppercase shadow-md z-10">Wholesale</span>
                        </div>
                        <div className="p-4 bg-slate-50/50 flex-grow flex flex-col justify-between">
                          <div>
                            <div className="text-[9px] text-[#C8961A] font-bold tracking-widest uppercase mb-1">{product.category}</div>
                            <h3 className="font-extrabold text-[#0E121C] text-sm leading-snug line-clamp-2">{product.name}</h3>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Wholesale Spec</span>
                            <span className="text-base font-black text-[#C8102E]">{product.price.toLocaleString()}/-</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Spec details and actions */}
                      <div className="w-full md:w-7/12 p-4 sm:p-5 flex flex-col justify-between bg-white relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setExpandedProductId(null); }}
                          className="absolute right-3 top-3 w-8 h-8 rounded-full bg-slate-50 hover:bg-red-50 hover:text-red-500 border border-slate-200/60 flex items-center justify-center text-slate-500 transition-all shadow-sm active:scale-95 z-20"
                          title="Collapse details view"
                        >
                          <X size={15} />
                        </button>

                        <div className="pr-6">
                          <span className="inline-block bg-slate-50 border border-slate-100 text-slate-500 text-[8px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider mb-3">Bulk Supply Specifications</span>
                          
                          <div className="space-y-3.5 mt-2">
                            <div>
                              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Catalog Description</h4>
                              <p className="text-[11.5px] text-slate-600 leading-relaxed font-bold">
                                {product.description || "Premium high-grade textiles tailored for institutional bulk supply. High threadcount fabrics suited for regular intensive washing schedules."}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[8px] text-slate-400 font-extrabold block uppercase">Minimum Order</span>
                                <span className="font-extrabold text-[#0E121C] text-[11px]">50 Units</span>
                              </div>
                              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[8px] text-slate-400 font-extrabold block uppercase">Industry Fit</span>
                                <span className="font-extrabold text-[#C8961A] text-[11px]">Hospitality / School</span>
                              </div>
                            </div>

                            {product.tags && product.tags.length > 0 && (
                              <div>
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fabric Properties</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {product.tags.map((t: string, idx: number) => (
                                    <span key={idx} className="bg-slate-100 border border-slate-200 text-[#C8102E] text-[9.5px] font-black px-2.5 py-1 rounded-lg">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onProductTap?.(); setSelectedQuickViewProduct(product); }}
                              className="bg-[#C8961A] hover:bg-[#B08214] text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <MessageSquare size={13} />
                              Enquire
                            </button>
                            <a 
                              href="tel:+254792021795"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-[#C8102E] hover:bg-[#AF0B23] text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 text-center shadow-sm"
                            >
                              <Phone size={13} />
                              Call Now
                            </a>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onProductTap?.(); setSelectedQuickViewProduct(product); }}
                            className="w-full text-[#C8961A] hover:text-[#C8102E] text-[8.5px] font-black uppercase tracking-widest text-center mt-1 block"
                          >
                            🔍 Open full-screen overlay modal
                          </button>
                        </div>
                      </div>
                    </div>
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
              className="px-10 py-4 bg-slate-100 hover:bg-[#C8102E] hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[3px] transition-all flex items-center gap-3 group shadow-sm"
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
