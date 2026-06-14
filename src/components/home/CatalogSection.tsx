import React from 'react';
import { motion } from 'motion/react';
import { Search, ChevronRight, Heart, Package, X, Phone, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CatalogSectionProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
  activeSubCategory: string | null;
  setActiveSubCategory: (sub: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  allTags: string[];
  uniformSubCategories: string[];
  displayProducts: any[];
  showAllFeatured: boolean;
  setShowAllFeatured: (show: boolean) => void;
  setSelectedQuickViewProduct: (product: any) => void;
  toggleWishlist: (product: any) => void;
  addToCart: (product: any) => void;
  wishlist: any[];
}

export function CatalogSection({
  activeTab,
  setActiveTab,
  activeTag,
  setActiveTag,
  activeSubCategory,
  setActiveSubCategory,
  searchQuery,
  setSearchQuery,
  allTags,
  uniformSubCategories,
  displayProducts,
  showAllFeatured,
  setShowAllFeatured,
  setSelectedQuickViewProduct,
  toggleWishlist,
  addToCart,
  wishlist
}: CatalogSectionProps) {
  const navigate = useNavigate();
  const [expandedProductId, setExpandedProductId] = React.useState<string | null>(null);
  const clickTimeoutRef = React.useRef<{ [key: string]: NodeJS.Timeout | null }>({});

  React.useEffect(() => {
    return () => {
      // Cleanup timeouts on unmount to prevent memory leaks
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
        // Single tap -> expand description inline
        setExpandedProductId((prev) => (prev === productId ? null : productId));
      }, 250);
    }
  };

  return (
    <section id="catalog-section" className="py-20 max-w-[1440px] mx-auto px-8 scroll-mt-24">
      <div id="shop" className="absolute -mt-24"></div>
      <div className="flex flex-col lg:flex-row justify-between lg:items-end mb-8 gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-[#C8961A] text-[10px] font-extrabold tracking-[5px] uppercase mb-2">
            <div className="w-7 h-0.5 bg-[#C8961A]"></div> Featured Products
          </div>
          <h2 className="font-display text-5xl tracking-tight leading-none text-[#0E121C]">
            {activeTab === 'all' ? 'Top Flash Deals' : activeTab}
          </h2>
          
          <div className="mt-8">
            <div className="flex items-center gap-6 overflow-x-auto pb-4 hide-scrollbar">
              {['all', 'School Uniforms', 'College Wear', 'Corporate Wear', 'Sports Kits'].map((tab, idx) => {
                const isSelected = activeTab.toLowerCase() === tab.toLowerCase();
                return (
                  <button
                    key={`${tab}-${idx}`}
                    onClick={() => {
                       setActiveTab(tab);
                       setActiveSubCategory(null);
                    }}
                    className={`whitespace-nowrap text-[13px] font-black uppercase tracking-[2px] pb-2 transition-all border-b-2 shrink-0 ${
                      isSelected 
                        ? 'text-[#C8961A] border-[#C8961A]' 
                        : 'text-slate-400 border-transparent hover:text-slate-600'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
              
              {/* Show active tab if it's not in the hardcoded list */}
              {!['all', 'school uniforms', 'college wear', 'corporate wear', 'sports kits'].includes(activeTab.toLowerCase()) && (
                <button
                  onClick={() => {
                    setActiveTab(activeTab);
                    setActiveSubCategory(null);
                  }}
                  className="whitespace-nowrap text-[13px] font-black uppercase tracking-[2px] pb-2 transition-all border-b-2 text-[#C8961A] border-[#C8961A] shrink-0"
                >
                  {activeTab}
                </button>
              )}
            </div>
          </div>

          {activeTab === 'School Uniforms' && uniformSubCategories.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar w-full lg:w-auto">
                <button
                  onClick={() => setActiveSubCategory(null)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                    !activeSubCategory 
                      ? 'bg-[#0A1628] text-white border-transparent' 
                      : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  All Uniforms
                </button>
                {uniformSubCategories.map((subCat, idx) => (
                  <button
                    key={`${subCat}-${idx}`}
                    onClick={() => setActiveSubCategory(activeSubCategory === subCat ? null : subCat)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                      activeSubCategory === subCat 
                        ? 'bg-[#C8961A] text-white border-[#C8961A]' 
                        : 'bg-white text-slate-500 border-slate-100 hover:border-[#C8961A]/30'
                    }`}
                  >
                    {subCat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button 
          onClick={() => window.location.href = '/products'}
          className="text-[#0E121C] font-bold text-sm border-b-2 border-[#C8961A] pb-0.5 hover:text-[#C8102E] hover:border-[#C8102E] transition-all self-start lg:self-auto shrink-0 mb-2"
        >
          View All Products →
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-10 items-start lg:items-center justify-between w-full border-t border-slate-100 pt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar w-full lg:w-auto">
          <button 
            onClick={() => setActiveTag(null)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              !activeTag ? 'bg-[#C8961A] text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            All items
          </button>
          {allTags.map((tag, idx) => (
            <button 
              key={`${tag}-${idx}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTag === tag ? 'bg-[#C8102E] text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-[#C8961A]'
              }`}
            >
              <span className={activeTag === tag ? 'text-white' : 'text-[#C8961A]'}>#</span>
              {tag}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:max-w-md lg:ml-auto transform lg:translate-x-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Quick filter products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#C8961A] rounded-xl text-xs font-semibold uppercase tracking-wider outline-none focus:bg-white transition-all shadow-inner focus:ring-4 focus:ring-[#C8961A]/5"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#C8102E] p-1 rounded-full hover:bg-slate-100 transition-all"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
        {displayProducts.length > 0 ? displayProducts.slice(0, showAllFeatured ? undefined : 12).map((product) => {
          const isExpanded = expandedProductId === product.id;
          return (
            <motion.div 
              key={product.id}
              layout
              whileHover={{ y: isExpanded ? 0 : -6 }}
              className={`group bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col ${
                isExpanded 
                  ? 'border-[#C8961A] ring-2 ring-[#C8961A]/20 col-span-2 md:col-span-2 lg:col-span-2' 
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
                    decoding="async" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <Package size={40} className="text-[#C8961A]/20" />
                )}
                {product.badge && (
                  <span className="absolute top-2 left-2 bg-[#C8102E] text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase shadow-sm">{product.badge}</span>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => toggleWishlist(product)}
                    className={`w-8 h-8 md:w-9 md:h-9 bg-white rounded-full flex items-center justify-center shadow-md transition-colors ${
                      wishlist.find(i => i.id === product.id) ? "text-[#C8102E]" : "hover:bg-[#C8102E] hover:text-white"
                    }`}
                  >
                    <Heart size={14} className={wishlist.find(i => i.id === product.id) ? "fill-current" : ""} />
                  </button>
                </div>
              </div>
              <div className="p-3 sm:p-4 cursor-pointer flex flex-col flex-1" onClick={() => handleProductInteraction(product)}>
                <div className="text-[8px] sm:text-[9px] text-[#C8961A] font-bold tracking-widest uppercase mb-1">{product.category}</div>
                <h3 className="font-bold text-[13px] sm:text-[14px] mb-1 leading-tight group-hover:text-[#C8102E] transition-colors line-clamp-1">{product.name}</h3>
                
                {/* Interactive hint */}
                <span className="text-[9px] text-[#C8961A] font-bold mb-2 block leading-none antialiased">
                  {isExpanded ? '⚡ Double-click to preview • Click to collapse' : 'ℹ️ Click once to expand specs'}
                </span>

                <div className="mt-auto pt-3">
                  {product.tags?.some((t: string) => ['wholesale', 'bulk', 'corporate'].includes(t.toLowerCase())) ? (
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedQuickViewProduct(product); }}
                        className="w-full bg-[#C8961A] hover:bg-[#B08214] text-white py-2 rounded-lg font-bold text-[9px] sm:text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageSquare size={12} />
                        Enquire
                      </button>
                      <a 
                        href="tel:+254792021795"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-[#C8102E] hover:bg-[#A30D22] text-white py-2 rounded-lg font-bold text-[9px] sm:text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 text-center"
                      >
                        <Phone size={12} />
                        Call Now
                      </a>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[15px] sm:text-lg font-black text-[#C8961A]">{product.price.toLocaleString()}/-</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                          className="flex-1 bg-[#0E121C] hover:bg-slate-800 text-white py-2 rounded-lg font-extrabold text-[8.5px] sm:text-[9.5px] uppercase tracking-wider transition-colors text-center shadow-sm"
                          title="Add unit to shopping cart"
                        >
                          Add 🛒
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const cartItem = {
                              ...product,
                              selectedVariants: {},
                              quantity: 1,
                              price: product.price,
                              priceType: product.priceType || 'fixed'
                            };
                            addToCart(cartItem); 
                            navigate('/checkout');
                          }}
                          className="flex-1 bg-gradient-to-r from-[#C2102E] to-[#C8961A] hover:opacity-90 text-white py-2 rounded-lg font-extrabold text-[8.5px] sm:text-[9.5px] uppercase tracking-wider transition-all text-center shadow-sm"
                          title="Secure instant checkout"
                        >
                          Buy Now ⚡
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Expandable info tray which shifts below elements on layout expansion */}
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
                    <span className="font-extrabold uppercase tracking-wide text-slate-400 text-[9px] block">Description & Crafting Specs</span>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      {product.description || "Premium tailor-crafted apparel made from heavy-duty Nairobi Uhuru Market textile fabrics, with double-stitching construction in vibrant colorways to maximize longevity."}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100/50">
                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                      <span className="text-[8px] text-slate-400 font-extrabold block uppercase">Availability</span>
                      <span className="font-extrabold text-[#0E121C]">{(product.stock && Number(product.stock) > 0) ? `${product.stock} units` : 'Instock / Tailored'}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                      <span className="text-[8px] text-slate-400 font-extrabold block uppercase">Material Quality</span>
                      <span className="font-extrabold text-[#C8961A]">{product.tags?.includes('corporate') ? 'Super Wool' : 'Standard Drill'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-2 border-t border-dashed border-slate-200">
                    <span className="flex items-center gap-1 text-[9px]">⚡ Double-tap to preview modal</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setExpandedProductId(null); }}
                      className="text-[#C8102E] font-black uppercase text-[8px] tracking-wider hover:underline cursor-pointer"
                    >
                      Collapse ▲
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        }) : (
          <div className="col-span-full py-20 text-center text-gray-400">
            <p>No products found. Add some from the admin panel!</p>
          </div>
        )}
      </div>

      {displayProducts.length > 12 && (
        <div className="mt-16 flex justify-center">
          <button 
            onClick={() => setShowAllFeatured(!showAllFeatured)}
            className="px-12 py-5 bg-gradient-to-r from-[#0A1628] via-[#C8102E] to-[#C8961A] text-white hover:opacity-90 transition-all rounded-full flex items-center gap-4 text-[11px] font-black uppercase tracking-[3px] shadow-[0_4px_16px_rgba(200,150,26,0.25)] active:scale-95 cursor-pointer"
          >
            {showAllFeatured ? 'Show Less' : 'View More Products'} 
            <ChevronRight size={16} className={`transition-transform duration-500 ${showAllFeatured ? '-rotate-90' : 'rotate-90'}`} />
          </button>
        </div>
      )}
    </section>
  );
}
