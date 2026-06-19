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
  onProductTap?: () => void;
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
  wishlist,
  onProductTap
}: CatalogSectionProps) {
  const navigate = useNavigate();
  const [expandedProductId, setExpandedProductId] = React.useState<string | null>(null);

  const handleProductInteraction = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    onProductTap?.();
    if (expandedProductId === product.id) {
      setExpandedProductId(null);
    } else {
      setExpandedProductId(product.id);
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
          
          <div className="mt-8 hidden lg:block">
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
            <div className="mt-4 hidden lg:block">
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

      <div className="hidden lg:flex flex-col lg:flex-row gap-4 mb-10 items-start lg:items-center justify-between w-full border-t border-slate-100 pt-6">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
        {displayProducts.length > 0 ? displayProducts.slice(0, showAllFeatured ? undefined : 12).map((product) => {
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
                  <div className="relative aspect-square sm:aspect-[4/3] w-[120px] sm:w-full overflow-hidden bg-[#FDFAF4] cursor-pointer flex items-center justify-center p-2 shrink-0 border-r sm:border-r-0 sm:border-b border-slate-100" onClick={(e) => handleProductInteraction(product, e)}>
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
                      <span className="absolute top-2 left-2 bg-[#C8102E] text-white text-[7px] sm:text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase shadow-sm">{product.badge}</span>
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
                  <div className="p-3 sm:p-4 cursor-pointer flex flex-col justify-between flex-grow min-w-0" onClick={(e) => handleProductInteraction(product, e)}>
                    <div>
                      <div className="text-[8px] sm:text-[9px] text-[#C8961A] font-bold tracking-widest uppercase mb-0.5 sm:mb-1">{product.category}</div>
                      <h3 className="font-bold text-[12px] sm:text-[14px] mb-1 leading-tight group-hover:text-[#C8102E] transition-colors line-clamp-2 min-h-[1.5rem] sm:line-clamp-1">{product.name}</h3>
                      
                      {/* Interactive hint */}
                      <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold mb-2 block leading-none antialiased flex items-center gap-1.5 mt-1 border-t border-slate-50 pt-1.5 sm:pt-2">
                        <span>✨</span> Tap to inspect details
                      </span>
                    </div>

                    <div className="pt-2 sm:pt-3">
                      {product.tags?.some((t: string) => ['wholesale', 'bulk', 'corporate'].includes(t.toLowerCase())) ? (
                        <div className="flex flex-row sm:flex-col gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleProductInteraction(product, e); }}
                            className="flex-1 sm:w-full bg-[#C8961A] hover:bg-[#B08214] text-white py-1.5 sm:py-2 rounded-lg font-bold text-[8.5px] sm:text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare size={11} />
                            Enquire
                          </button>
                          <a 
                            href="tel:+254792021795"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 sm:w-full bg-[#C8102E]/10 hover:bg-[#C8102E]/20 text-[#C8102E] py-1.5 sm:py-2 rounded-lg font-bold text-[8.5px] sm:text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 text-center"
                          >
                            <Phone size={11} />
                            Call Now
                          </a>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                            <span className="text-[13px] sm:text-lg font-black text-[#C8961A]">{product.price.toLocaleString()}/-</span>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                              className="flex-1 bg-[#0E121C] hover:bg-slate-800 text-white py-1.5 sm:py-2 rounded-lg font-extrabold text-[8px] sm:text-[9.5px] uppercase tracking-wider transition-colors text-center shadow-sm"
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
                              className="flex-1 bg-gradient-to-r from-[#C2102E] to-[#C8961A] hover:opacity-90 text-white py-1.5 sm:py-2 rounded-lg font-extrabold text-[8px] sm:text-[9.5px] uppercase tracking-wider transition-all text-center shadow-sm"
                              title="Secure instant checkout"
                            >
                              Buy Now ⚡
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col md:flex-row h-full">
                  {/* Left Column: Product visual card and price */}
                  <div className="w-full md:w-5/12 bg-white flex flex-col border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
                    <div className="relative aspect-[4/3] md:aspect-[4/5] overflow-hidden bg-[#FDFAF4] flex items-center justify-center p-2">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover object-top" 
                          loading="lazy" 
                          decoding="async" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <Package size={50} className="text-[#C8961A]/20" />
                      )}
                      {product.badge && (
                        <span className="absolute top-3 left-3 bg-[#C8102E] text-white text-[9px] font-black px-2.5 py-1 rounded tracking-widest uppercase shadow-md z-10">{product.badge}</span>
                      )}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                        <button 
                          onClick={() => toggleWishlist(product)}
                          className={`w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md transition-colors ${
                            wishlist.find(i => i.id === product.id) ? "text-[#C8102E]" : "hover:text-[#C8102E] text-slate-400"
                          }`}
                        >
                          <Heart size={14} className={wishlist.find(i => i.id === product.id) ? "fill-current" : ""} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50/50 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="text-[9px] text-[#C8961A] font-bold tracking-widest uppercase mb-1">{product.category}</div>
                        <h3 className="font-extrabold text-[#0E121C] text-sm leading-snug line-clamp-2">{product.name}</h3>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Cost</span>
                        <span className="text-base font-black text-[#C8961A]">{product.price.toLocaleString()}/-</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Spec details and actions */}
                  <div className="w-full md:w-7/12 p-4 sm:p-5 flex flex-col justify-between bg-white relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setExpandedProductId(null); }}
                      className="absolute right-3 top-3 w-8 h-8 rounded-full bg-slate-50 hover:bg-red-50 hover:text-[#C8102E] border border-slate-200/60 flex items-center justify-center text-slate-500 transition-all shadow-sm active:scale-95"
                      title="Collapse details view"
                    >
                      <X size={15} />
                    </button>

                    <div className="pr-6">
                      <span className="inline-block bg-slate-50 border border-slate-100 text-slate-500 text-[8px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider mb-3">Specification Panel</span>
                      
                      <div className="space-y-3.5 mt-2">
                        <div>
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Catalog Description</h4>
                          <p className="text-[11.5px] text-slate-600 leading-relaxed font-bold">
                            {product.description || "Premium bespoke uniform textile engineered for superior lifespan under heavy-duty institutional service. Perfect colors, fade-resistant fabrics."}
                          </p>
                        </div>

                        {product.tags && product.tags.length > 0 && (
                          <div>
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fabric Properties</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {product.tags.map((t: string, idx: number) => (
                                <span key={idx} className="bg-[#FDFAF4] border border-[#C8961A]/10 text-[#C8961A] text-[9px] font-black px-2.5 py-1 rounded-lg">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                      {product.tags?.some((t: string) => ['wholesale', 'bulk', 'corporate'].includes(t.toLowerCase())) ? (
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
                            className="bg-[#C8102E] hover:bg-[#A30D22] text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 text-center shadow-sm"
                          >
                            <Phone size={13} />
                            Call Now
                          </a>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                            className="flex-1 bg-[#0E121C] hover:bg-slate-800 text-white py-2.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-colors text-center shadow-sm"
                            title="Add to cart"
                          >
                            Add to Cart 🛒
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
                            className="flex-1 bg-gradient-to-r from-[#C2102E] to-[#C8961A] hover:opacity-90 text-white py-2.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-all text-center shadow-sm"
                            title="Secure checkout"
                          >
                            Buy Now ⚡
                          </button>
                        </div>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); onProductTap?.(); setSelectedQuickViewProduct(product); }}
                        className="w-full text-[#C8961A] hover:text-[#C8102E] text-[8.5px] font-black uppercase tracking-widest text-center mt-1 block"
                      >
                        🔍 Open full screen overlay modal
                      </button>
                    </div>
                  </div>
                </div>
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
