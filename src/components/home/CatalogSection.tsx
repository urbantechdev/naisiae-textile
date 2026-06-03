import React from 'react';
import { motion } from 'motion/react';
import { Search, ChevronRight, Heart, Package, X, Phone, MessageSquare } from 'lucide-react';

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
  return (
    <section id="catalog-section" className="py-20 max-w-[1440px] mx-auto px-8 scroll-mt-24">
      <div id="shop" className="absolute -mt-24"></div>
      <div className="flex flex-col lg:flex-row justify-between lg:items-end mb-10 gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-[#00C4CC] text-[10px] font-extrabold tracking-[5px] uppercase mb-2">
            <div className="w-7 h-0.5 bg-[#00C4CC]"></div> Featured Products
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
                        ? 'text-[#7D2AE8] border-[#7D2AE8]' 
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
                  className="whitespace-nowrap text-[13px] font-black uppercase tracking-[2px] pb-2 transition-all border-b-2 text-[#7D2AE8] border-[#7D2AE8] shrink-0"
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
                      ? 'bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] text-white border-transparent' 
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
                        ? 'bg-[#7D2AE8] text-white border-[#7D2AE8]' 
                        : 'bg-white text-slate-500 border-slate-100 hover:border-[#8B3DFF]/30'
                    }`}
                  >
                    {subCat}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row gap-4 mt-8 items-start lg:items-center">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar w-full lg:w-auto">
              <button 
                onClick={() => setActiveTag(null)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  !activeTag ? 'bg-[#7D2AE8] text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                All items
              </button>
              {allTags.map((tag, idx) => (
                <button 
                  key={`${tag}-${idx}`}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    activeTag === tag ? 'bg-gradient-to-r from-[#FF4F5A] to-[#7D2AE8] text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-[#00C4CC]'
                  }`}
                >
                  <span className={activeTag === tag ? 'text-white' : 'text-[#00C4CC]'}>#</span>
                  {tag}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Quick filter products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-wider outline-none focus:bg-white focus:border-[#8B3DFF] transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#FF4F5A]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
        <button className="text-[#0E121C] font-bold text-sm border-b-2 border-[#00C4CC] pb-0.5 hover:text-[#FF4F5A] hover:border-[#FF4F5A] transition-all self-start lg:self-auto">View All Products →</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
        {displayProducts.length > 0 ? displayProducts.slice(0, showAllFeatured ? undefined : 12).map((product) => (
          <motion.div 
            key={product.id}
            whileHover={{ y: -6 }}
            className="group bg-white border border-[#E4E8EF] rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-[#FDFAF4] cursor-pointer flex items-center justify-center p-2" onClick={() => setSelectedQuickViewProduct(product)}>
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
                <Package size={40} className="text-[#00C4CC]/20" />
              )}
              {product.badge && (
                <span className="absolute top-2 left-2 bg-gradient-to-r from-[#FF4F5A] to-[#7D2AE8] text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase shadow-sm">{product.badge}</span>
              )}
              <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => toggleWishlist(product)}
                  className={`w-8 h-8 md:w-9 md:h-9 bg-white rounded-full flex items-center justify-center shadow-md transition-colors ${
                    wishlist.find(i => i.id === product.id) ? "text-[#FF4F5A]" : "hover:bg-[#FF4F5A] hover:text-white"
                  }`}
                >
                  <Heart size={14} className={wishlist.find(i => i.id === product.id) ? "fill-current" : ""} />
                </button>
              </div>
            </div>
            <div className="p-3 sm:p-4 cursor-pointer flex flex-col flex-1" onClick={() => setSelectedQuickViewProduct(product)}>
              <div className="text-[8px] sm:text-[9px] text-[#00C4CC] font-bold tracking-widest uppercase mb-1">{product.category}</div>
              <h3 className="font-bold text-[13px] sm:text-[14px] mb-1 leading-tight group-hover:text-[#FF4F5A] transition-colors line-clamp-1">{product.name}</h3>
              <div className="mt-auto pt-3">
                {product.tags?.some((t: string) => ['wholesale', 'bulk', 'corporate'].includes(t.toLowerCase())) ? (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedQuickViewProduct(product); }}
                      className="w-full bg-[#00C4CC] hover:bg-[#008F94] text-white py-2 rounded-lg font-bold text-[9px] sm:text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={12} />
                      Enquire
                    </button>
                    <a 
                      href="tel:+254792021795"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-[#FF4F5A] hover:bg-[#E03B46] text-white py-2 rounded-lg font-bold text-[9px] sm:text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 text-center"
                    >
                      <Phone size={12} />
                      Call Now
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] sm:text-lg font-black text-[#7D2AE8]">{product.price.toLocaleString()}/-</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                      className="mt-3 w-full bg-[#0E121C] hover:bg-[#FF4F5A] text-white py-2 rounded-lg font-bold text-[9px] sm:text-[10px] uppercase tracking-widest transition-colors"
                    >
                      Add to Cart
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 text-center text-gray-400">
            <p>No products found. Add some from the admin panel!</p>
          </div>
        )}
      </div>

      {displayProducts.length > 12 && (
        <div className="mt-16 flex justify-center">
          <button 
            onClick={() => setShowAllFeatured(!showAllFeatured)}
            className="px-12 py-5 bg-gradient-to-r from-[#00C4CC] via-[#7D2AE8] to-[#FF4F5A] text-white hover:opacity-90 transition-all rounded-full flex items-center gap-4 text-[11px] font-black uppercase tracking-[3px] shadow-[0_4px_16px_rgba(125,42,232,0.3)] active:scale-95"
          >
            {showAllFeatured ? 'Show Less' : 'View More Products'} 
            <ChevronRight size={16} className={`transition-transform duration-500 ${showAllFeatured ? '-rotate-90' : 'rotate-90'}`} />
          </button>
        </div>
      )}
    </section>
  );
}
