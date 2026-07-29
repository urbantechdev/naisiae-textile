import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Package, ChevronRight, Plus, Phone, MessageSquare, X, Timer, Flame, ShoppingCart, Star, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocalization } from '../../context/LocalizationContext';
import { useCart } from '../../context/CartContext';

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
  const { formatPrice } = useLocalization();
  const { addToCart } = useCart();
  
  const wholesaleProducts = products.filter(p => 
    p.tags?.some((t: string) => t.toLowerCase() === 'wholesale' || t.toLowerCase() === 'bulk' || t.toLowerCase() === 'corporate')
  );

  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const clickTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout | null }>({});

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 24, seconds: 12 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 4, minutes: 59, seconds: 59 }; // Loop/reset
        }
      });
    }, 1000);

    return () => {
      clearInterval(timer);
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
      setSelectedQuickViewProduct(product);
    } else {
      clickTimeoutRef.current[productId] = setTimeout(() => {
        clickTimeoutRef.current[productId] = null;
        setExpandedProductId((prev) => (prev === productId ? null : productId));
      }, 250);
    }
  };

  // Mock static values for stars and claim percentages for each item based on id
  const getProductStars = (id: string) => {
    const sum = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
    return (sum % 2 === 0) ? 5 : 4;
  };

  const getProductReviewsCount = (id: string) => {
    const sum = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
    return 15 + (sum % 80);
  };

  const getClaimPercent = (id: string) => {
    const sum = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
    return 45 + (sum % 45); // Between 45% and 90%
  };

  const handleQuickAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    onProductTap?.();
    const cartItem = {
      ...product,
      selectedVariants: { Size: 'M', Color: 'Navy' },
      quantity: 1,
      price: product.price || 1800,
      priceType: product.priceType || 'fixed'
    };
    addToCart(cartItem);
  };

  return (
    <section id="wholesale-deals" className="pt-6 pb-12 sm:py-24 bg-slate-50/50 border-b border-slate-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        
        {/* Dynamic Countdown Sales Header Banner */}
        <div className="mb-10 bg-gradient-to-r from-[#0A1628] via-[#C8102E] to-[#C8961A] rounded-3xl p-6 sm:p-10 text-white flex flex-col lg:flex-row justify-between items-center gap-6 shadow-[0_20px_50px_rgba(200,16,46,0.15)] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          
          <div className="relative z-10 text-center lg:text-left">
            <span className="text-[10px] sm:text-xs font-black tracking-[4px] uppercase bg-white/20 text-white border border-white/10 px-3.5 py-1.5 rounded-full inline-block mb-3 animate-pulse">
              ⚡ Limited-Time Wholesale Flash Sale ⚡
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-medium tracking-tight leading-tight">
              Uhuru Market Bulk Deals
            </h2>
            <p className="text-white/85 text-xs sm:text-sm mt-2 max-w-lg font-medium leading-relaxed">
              Order direct-from-factory with live wholesale discounts. Grab top quality school uniforms and blazers before current batches sell out.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 bg-white/10 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-white/15 shadow-inner">
            <div className="flex items-center gap-2">
              <Timer className="text-amber-300 shrink-0" size={18} />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/80">Sale Ends In:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="bg-[#0A1628]/90 font-mono font-black text-lg sm:text-xl px-3 py-1.5 rounded-lg border border-white/10 tracking-widest text-[#C8961A]">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest text-white/70 mt-1">Hours</span>
              </div>
              <span className="text-lg font-black text-amber-300 animate-pulse">:</span>
              <div className="flex flex-col items-center">
                <span className="bg-[#0A1628]/90 font-mono font-black text-lg sm:text-xl px-3 py-1.5 rounded-lg border border-white/10 tracking-widest text-[#C8961A]">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest text-white/70 mt-1">Mins</span>
              </div>
              <span className="text-lg font-black text-amber-300 animate-pulse">:</span>
              <div className="flex flex-col items-center">
                <span className="bg-[#0A1628]/90 font-mono font-black text-lg sm:text-xl px-3 py-1.5 rounded-lg border border-white/10 tracking-widest text-[#C8961A]">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest text-white/70 mt-1">Secs</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
          {wholesaleProducts
            .slice(0, showAllWholesale ? undefined : 6)
            .map(product => {
              const isExpanded = expandedProductId === product.id;
              const stars = getProductStars(product.id);
              const reviews = getProductReviewsCount(product.id);
              const claimPercent = getClaimPercent(product.id);

              return (
                <motion.div 
                   key={product.id}
                   layout
                   whileHover={isExpanded ? undefined : { y: -6 }}
                   className={`group bg-white rounded-[24px] overflow-hidden shadow-sm flex transition-all duration-300 ${
                     isExpanded 
                       ? "flex-col col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-3 shadow-[0_30px_70px_rgba(0,0,0,0.15)] bg-white" 
                       : "flex-row sm:flex-col hover:shadow-xl w-full"
                   }`}
                >
                  {!isExpanded ? (
                    <>
                      {/* Product Visual */}
                      <div 
                        className="relative aspect-[4/5] sm:aspect-[4/3] w-[130px] sm:w-full overflow-hidden bg-slate-50/50 cursor-pointer flex items-center justify-center p-0 shrink-0" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onProductTap?.();
                          setSelectedQuickViewProduct(product);
                        }}
                      >
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
                        <span className="absolute top-2 left-2 bg-[#C8102E] text-white text-[7px] sm:text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase shadow-sm flex items-center gap-1">
                          <Flame size={10} className="text-amber-200 fill-current" /> Save Big
                        </span>
                      </div>
                      
                      {/* Product Content Details */}
                      <div className="p-3 sm:p-4 flex flex-col justify-between flex-grow min-w-0">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <div className="flex text-amber-400">
                              {Array(stars).fill(0).map((_, i) => (
                                <Star key={i} size={10} className="fill-current" />
                              ))}
                            </div>
                            <span className="text-[8px] text-slate-400 font-bold">({reviews})</span>
                          </div>
                          
                          <h3 
                            onClick={(e) => {
                              e.stopPropagation();
                              onProductTap?.();
                              setSelectedQuickViewProduct(product);
                            }}
                            className="font-extrabold text-[12px] sm:text-[13px] mb-1 leading-tight line-clamp-2 text-[#0E121C] group-hover:text-[#C8102E] transition-colors cursor-pointer"
                          >
                            {product.name}
                          </h3>
                          
                          {/* Price Display */}
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-xs sm:text-sm font-black text-[#C8102E]">{formatPrice(product.price)}</span>
                            <span className="text-[9px] text-slate-400 line-through font-bold">{formatPrice(Math.round(product.price * 1.35))}</span>
                          </div>

                          {/* Claim level progress bar */}
                          <div className="mt-2 pt-2 border-t border-slate-50">
                            <div className="flex justify-between items-center mb-1 text-[8px] font-extrabold text-slate-400 uppercase">
                              <span>Stock claimed</span>
                              <span className="text-[#C8961A] font-black">{claimPercent}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#C8102E] to-[#C8961A]" style={{ width: `${claimPercent}%` }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive shopping buttons */}
                        <div className="flex items-center gap-1.5 mt-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onProductTap?.(); setSelectedQuickViewProduct(product); }}
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0"
                            title="Spec Inquiry & HD View"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            onClick={(e) => handleQuickAddToCart(e, product)}
                            className="flex-1 h-8 sm:h-9 bg-[#0E121C] hover:bg-[#C8102E] text-white rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
                            title="Add to Cart"
                          >
                            <ShoppingCart size={15} />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col md:flex-row h-full w-full">
                      {/* Left Column: Product visual card and cost */}
                      <div className="w-full md:w-5/12 bg-white flex flex-col border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
                        <div className="relative aspect-[4/3] md:aspect-[4/5] overflow-hidden bg-slate-50/50 flex items-center justify-center p-2">
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
                          <span className="absolute top-3 left-3 bg-gradient-to-r from-[#C8102E] to-[#C8961A] text-white text-[9px] font-black px-2.5 py-1 rounded tracking-widest uppercase shadow-md z-10 flex items-center gap-1">
                            <Flame size={11} className="text-amber-200 fill-current" /> Hot Deal
                          </span>
                        </div>
                        <div className="p-4 bg-slate-50/50 flex-grow flex flex-col justify-between">
                          <div>
                            <div className="text-[9px] text-[#C8961A] font-bold tracking-widest uppercase mb-1">{product.category}</div>
                            <h3 className="font-extrabold text-[#0E121C] text-sm leading-snug line-clamp-2">{product.name}</h3>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Flash Price</span>
                            <div className="flex flex-col items-end">
                              <span className="text-base font-black text-[#C8102E]">{formatPrice(product.price)}</span>
                              <span className="text-[10px] text-slate-400 line-through font-bold">{formatPrice(Math.round(product.price * 1.35))}</span>
                            </div>
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
                          <span className="inline-block bg-[#C8102E]/5 border border-[#C8102E]/10 text-[#C8102E] text-[8px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider mb-3">Bulk Flash Deal Specs</span>
                          
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
                                <span className="font-extrabold text-[#0E121C] text-[11px]">10 Units</span>
                              </div>
                              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[8px] text-slate-400 font-extrabold block uppercase">Fabric Standard</span>
                                <span className="font-extrabold text-[#C8961A] text-[11px]">Heavy Gabardine</span>
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
                          <button 
                            onClick={(e) => {
                              handleQuickAddToCart(e, product);
                              setExpandedProductId(null);
                            }}
                            className="w-full bg-gradient-to-r from-[#C2102E] to-[#C8961A] hover:opacity-95 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                          >
                            <ShoppingCart size={13} />
                            Add Bulk Bundle to Cart 🛒
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onProductTap?.(); setSelectedQuickViewProduct(product); }}
                              className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 py-2 rounded-xl font-bold text-[9.5px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <MessageSquare size={13} />
                              Inquire Custom Specs
                            </button>
                            <a 
                              href="tel:+254792021795"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 py-2 rounded-xl font-bold text-[9.5px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 text-center shadow-sm"
                            >
                              <Phone size={13} />
                              Call Direct Desk
                            </a>
                          </div>
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
               className="px-10 py-4 bg-white border border-slate-200 hover:border-[#C8102E] text-slate-800 hover:text-white hover:bg-[#C8102E] rounded-xl text-[10px] font-black uppercase tracking-[3px] transition-all flex items-center gap-3 group shadow-sm"
              >
                {showAllWholesale ? 'Show Less' : 'View More Deals'} 
                <Plus size={14} className={`transition-transform duration-500 ${showAllWholesale ? 'rotate-45' : ''}`} />
              </button>
           )}
        </div>

        {wholesaleProducts.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <Package className="mx-auto text-slate-300 mb-4" size={40} />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Flash Collection Launching Soon</p>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Contact us directly for bulk pricing on any catalog item.</p>
            </div>
          )}
        </div>
    </section>
  );
}
