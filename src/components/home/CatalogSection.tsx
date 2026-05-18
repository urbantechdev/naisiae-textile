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
          <div className="flex items-center gap-2.5 text-[#C8961A] text-[10px] font-extrabold tracking-[5px] uppercase mb-2">
            <div className="w-7 h-0.5 bg-[#C8961A]"></div> Featured Products
          </div>
          <h2 className="font-display text-5xl tracking-tight leading-none text-[#0A1628]">
            {activeTab === 'all' ? 'Top Flash Deals' : activeTab}
          </h2>
          
          <div className="flex flex-wrap gap-4 mt-8">
            {['all', 'School Uniforms', 'College Wear', 'Corporate Wear', 'Sports Kits'].map((tab, idx) => {
              const isSelected = activeTab.toLowerCase() === tab.toLowerCase();
              return (
                <button
                  key={`${tab}-${idx}`}
                  onClick={() => {
                    setActiveTab(tab);
                    setActiveSubCategory(null);
                  }}
                  className={`text-[12px] font-black uppercase tracking-widest pb-2 transition-all border-b-2 ${
                    isSelected 
                      ? 'text-[#C8102E] border-[#C8102E]' 
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
                className="text-[12px] font-black uppercase tracking-widest pb-2 transition-all border-b-2 text-[#C8102E] border-[#C8102E]"
              >
                {activeTab}
              </button>
            )}
          </div>

          {activeTab === 'School Uniforms' && uniformSubCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 px-1 py-1 bg-slate-50/50 rounded-xl border border-slate-100">
              <button
                onClick={() => setActiveSubCategory(null)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                  !activeSubCategory ? 'bg-white text-[#C8102E] shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                All Uniforms
              </button>
              {uniformSubCategories.map((subCat, idx) => (
                <button
                  key={`${subCat}-${idx}`}
                  onClick={() => setActiveSubCategory(activeSubCategory === subCat ? null : subCat)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    activeSubCategory === subCat ? 'bg-[#C8102E] text-white shadow-md' : 'bg-white/50 text-slate-500 border border-slate-100 hover:bg-white'
                  }`}
                >
                  {subCat}
                </button>
              ))}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setActiveTag(null)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!activeTag ? 'bg-[#1C3560] text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                All items
              </button>
              {allTags.map((tag, idx) => (
                <button 
                  key={`${tag}-${idx}`}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTag === tag ? 'bg-[#C8102E] text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-[#F59E0B]'}`}
                >
                  <span className={activeTag === tag ? 'text-white' : 'text-[#F59E0B]'}>#</span>
                  {tag}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Quick filter products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-wider outline-none focus:bg-white focus:border-[#C8961A] transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
        <button className="text-[#15284A] font-bold text-sm border-b-2 border-[#C8961A] pb-0.5 hover:text-[#C8102E] hover:border-[#C8102E] transition-all self-start lg:self-auto">View All Products →</button>
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
                  src={`${product.imageUrl}?q=60&w=400`} 
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
                <span className="absolute top-2 left-2 bg-[#C8102E] text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">{product.badge}</span>
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
            <div className="p-3 sm:p-4 cursor-pointer flex flex-col flex-1" onClick={() => setSelectedQuickViewProduct(product)}>
              <div className="text-[8px] sm:text-[9px] text-[#15284A] font-bold tracking-widest uppercase mb-1">{product.category}</div>
              <h3 className="font-bold text-[13px] sm:text-[14px] mb-1 leading-tight group-hover:text-[#C8102E] transition-colors line-clamp-1">{product.name}</h3>
              <div className="mt-auto pt-3">
                {product.tags?.some((t: string) => ['wholesale', 'bulk', 'corporate'].includes(t.toLowerCase())) ? (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedQuickViewProduct(product); }}
                      className="w-full bg-[#C8961A] hover:bg-[#A67C16] text-white py-2 rounded-lg font-bold text-[9px] sm:text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={12} />
                      Enquire
                    </button>
                    <a 
                      href="tel:+254792021795"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-[#C8102E] hover:bg-[#9E0D24] text-white py-2 rounded-lg font-bold text-[9px] sm:text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 text-center"
                    >
                      <Phone size={12} />
                      Call Now
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] sm:text-lg font-black text-[#C8102E]">{product.price.toLocaleString()}/-</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                      className="mt-3 w-full bg-[#0A1628] hover:bg-[#C8102E] text-white py-2 rounded-lg font-bold text-[9px] sm:text-[10px] uppercase tracking-widest transition-colors"
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
            className="px-12 py-5 bg-[#0A1628] text-white hover:bg-[#C8961A] transition-all rounded-full flex items-center gap-4 text-[11px] font-black uppercase tracking-[3px] shadow-2xl active:scale-95"
          >
            {showAllFeatured ? 'Show Less' : 'View More Products'} 
            <ChevronRight size={16} className={`transition-transform duration-500 ${showAllFeatured ? '-rotate-90' : 'rotate-90'}`} />
          </button>
        </div>
      )}
    </section>
  );
}
