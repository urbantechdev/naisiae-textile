import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, Heart, Package, X, Phone, MessageSquare, Filter, SlidersHorizontal, Star, ShoppingCart, Check, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../../context/LocalizationContext';
import { LazyImage } from '../LazyImage';

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
  const { formatPrice } = useLocalization();
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  
  // Local E-commerce filter states
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string | null>(null);
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Card Variant selections stored by product ID
  const [selectedSizes, setSelectedSizes] = useState<{ [productId: string]: string }>({});
  const [selectedColors, setSelectedColors] = useState<{ [productId: string]: string }>({});

  const [isBgRemoverActive, setIsBgRemoverActive] = useState(() => {
    return localStorage.getItem('auto_bg_remover') !== 'false';
  });

  const toggleBgRemover = () => {
    const newVal = !isBgRemoverActive;
    setIsBgRemoverActive(newVal);
    localStorage.setItem('auto_bg_remover', String(newVal));
    window.dispatchEvent(new Event('autoBgRemoverChanged'));
  };

  const handleProductInteraction = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    onProductTap?.();
    if (expandedProductId === product.id) {
      setExpandedProductId(null);
    } else {
      setExpandedProductId(product.id);
    }
  };

  // Pre-baked sizes & color palettes for dynamic custom swatches
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const availableColors = [
    { name: 'Navy Blue', hex: '#0B2240' },
    { name: 'Maroon Red', hex: '#631212' },
    { name: 'Forest Green', hex: '#163B23' },
    { name: 'Classic Black', hex: '#111111' },
    { name: 'Khaki Gold', hex: '#C29F68' }
  ];

  // Helper reviews pre-calculation
  const getProductStars = (id: string) => {
    const sum = id.charCodeAt(0) + (id.charCodeAt(id.length - 1) || 0);
    return (sum % 2 === 0) ? 5 : 4;
  };

  const getProductRatingDecimal = (id: string) => {
    const sum = id.charCodeAt(0) + (id.charCodeAt(id.length - 1) || 0);
    return (sum % 2 === 0) ? '4.9' : '4.7';
  };

  const getProductReviews = (id: string) => {
    const sum = id.charCodeAt(0) + (id.charCodeAt(id.length - 1) || 0);
    return 10 + (sum % 110);
  };

  // Multi-tier wholesale pricing tooltips helper
  const getWholesalePricing = (price: number) => {
    return [
      { qty: '1 - 10 pcs', price: price },
      { qty: '11 - 50 pcs', price: Math.round(price * 0.9) },
      { qty: '50+ pcs (Bulk)', price: Math.round(price * 0.8) }
    ];
  };

  // Client-side Filter, Sort and Selection pipeline
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...displayProducts];

    // 1. Price Range filter
    if (selectedPriceRange !== 'all') {
      result = result.filter(p => {
        if (selectedPriceRange === 'under1000') return p.price < 1000;
        if (selectedPriceRange === '1000to2500') return p.price >= 1000 && p.price <= 2500;
        if (selectedPriceRange === 'above2500') return p.price > 2500;
        return true;
      });
    }

    // 2. Material/Fabric property tag filter
    if (selectedMaterialFilter) {
      result = result.filter(p => 
        p.tags?.some((t: string) => t.toLowerCase().includes(selectedMaterialFilter.toLowerCase()))
      );
    }

    // 3. Sorting pipeline
    if (sortBy === 'priceAsc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceDesc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => {
        const ratingA = Number(getProductRatingDecimal(a.id));
        const ratingB = Number(getProductRatingDecimal(b.id));
        return ratingB - ratingA;
      });
    } else if (sortBy === 'discount') {
      result.sort((a, b) => {
        const discA = a.badge?.toLowerCase().includes('off') ? 1 : 0;
        const discB = b.badge?.toLowerCase().includes('off') ? 1 : 0;
        return discB - discA;
      });
    }

    return result;
  }, [displayProducts, selectedPriceRange, selectedMaterialFilter, sortBy]);

  // Quick action adding to shopping cart with micro-toast notice
  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    onProductTap?.();
    const size = selectedSizes[product.id] || 'M';
    const color = selectedColors[product.id] || 'Navy Blue';
    
    const cartItem = {
      ...product,
      selectedVariants: { Size: size, Color: color },
      quantity: 1,
      price: product.price || 1800,
      priceType: product.priceType || 'fixed'
    };
    
    addToCart(cartItem);
    
    // Show premium screen toast
    setToastMessage(`Added ${product.name} (${size}, ${color}) to cart successfully!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <section id="catalog-section" className="py-12 sm:py-24 max-w-[1440px] mx-auto px-4 sm:px-8 scroll-mt-24 relative">
      <div id="shop" className="absolute -mt-24"></div>

      {/* Screen Toast for E-commerce Actions */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-[#08047D] text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xs">✓</div>
            <span className="text-xs font-black tracking-wide uppercase">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern High-Conversion Header */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end mb-8 gap-6 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2.5 text-[#FA9411] text-[10px] font-extrabold tracking-[5px] uppercase mb-2">
            <div className="w-7 h-0.5 bg-[#FA9411]"></div> Retail Storefront
          </div>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight leading-none text-[#04023D]">
            {activeTab === 'all' ? 'Quality Uniform Shop' : `${activeTab}`}
          </h2>
          
          {/* Main Category Filter Horizontal Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-4 overflow-x-auto pb-2 hide-scrollbar">
            {['all', 'School Uniforms', 'College Wear', 'Corporate Wear', 'Sports Kits'].map((tab, idx) => {
              const isSelected = activeTab.toLowerCase() === tab.toLowerCase();
              return (
                <button
                  key={`${tab}-${idx}`}
                  onClick={() => {
                     setActiveTab(tab);
                     setActiveSubCategory(null);
                  }}
                  className={`whitespace-nowrap text-xs font-black uppercase tracking-[2px] px-4 py-2 rounded-xl transition-all ${
                    isSelected 
                      ? 'bg-[#08047D] text-white shadow-lg' 
                      : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {tab === 'all' ? 'All Uniforms' : tab}
                </button>
              );
            })}
          </div>

          {activeTab === 'School Uniforms' && uniformSubCategories.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveSubCategory(null)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                  !activeSubCategory 
                    ? 'bg-[#08047D] text-white border-transparent' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                All School Uniforms
              </button>
              {uniformSubCategories.map((subCat, idx) => (
                <button
                  key={`${subCat}-${idx}`}
                  onClick={() => setActiveSubCategory(activeSubCategory === subCat ? null : subCat)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                    activeSubCategory === subCat 
                      ? 'bg-[#FA9411] text-white border-[#FA9411]' 
                      : 'bg-white text-slate-500 border-slate-100 hover:border-[#FA9411]/30'
                  }`}
                >
                  {subCat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search and Extra controllers */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={toggleBgRemover}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm ${
              isBgRemoverActive 
                ? 'bg-gradient-to-r from-[#08047D]/5 to-[#FA9411]/5 text-[#FA9411] border-[#FA9411]/40' 
                : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
            }`}
            title="Toggle background removal for catalog visuals"
          >
            <span className={`w-2 h-2 rounded-full ${isBgRemoverActive ? 'bg-[#FA9411] animate-pulse' : 'bg-slate-300'}`}></span>
            ✨ Smart BG Clean
          </button>

          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden px-4 py-2.5 bg-[#08047D] text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-sm"
          >
            <Filter size={12} />
            Filters & Sorting
          </button>
        </div>
      </div>

      {/* Main E-commerce Layout: Sidebar (Left) + Products Grid (Right) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Desktop Sidebar Filter Panel */}
        <div className="hidden lg:block w-[280px] shrink-0 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm sticky top-28">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-6">
            <SlidersHorizontal size={16} className="text-[#08047D]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#04023D]">Catalog Filters</span>
          </div>

          {/* Search bar inside Sidebar */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="Filter by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#FA9411] rounded-xl text-[10px] font-bold uppercase tracking-wider outline-none focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter Section: Sort Order */}
          <div className="mb-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Sort Results</h4>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-700 outline-none cursor-pointer focus:bg-white"
            >
              <option value="featured">🔥 Featured Best Seller</option>
              <option value="priceAsc">📈 Price: Low to High</option>
              <option value="priceDesc">📉 Price: High to Low</option>
              <option value="rating">⭐️ Top Rated (Reviews)</option>
              <option value="discount">🏷️ Best Active Discount</option>
            </select>
          </div>

          {/* Filter Section: Price range */}
          <div className="mb-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Price Bracket</h4>
            <div className="space-y-2">
              {[
                { id: 'all', label: 'All Price Brackets' },
                { id: 'under1000', label: 'Under KES 1,000' },
                { id: '1000to2500', label: 'KES 1,000 - 2,500' },
                { id: 'above2500', label: 'Above KES 2,500' }
              ].map(range => (
                <button
                  key={range.id}
                  onClick={() => setSelectedPriceRange(range.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-between border ${
                    selectedPriceRange === range.id 
                      ? 'bg-[#FA9411]/5 border-[#FA9411]/40 text-[#FA9411]' 
                      : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span>{range.label}</span>
                  {selectedPriceRange === range.id && <span className="w-1.5 h-1.5 rounded-full bg-[#FA9411]"></span>}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Section: Fabric Quality Materials */}
          <div className="mb-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Fabric Properties</h4>
            <div className="flex flex-wrap gap-1.5">
              {['Wool', 'Gabardine', 'Cotton', 'Polyester', 'Acrylic', 'Twill'].map(tag => {
                const isSelected = selectedMaterialFilter === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedMaterialFilter(isSelected ? null : tag)}
                    className={`px-2.5 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all border ${
                      isSelected 
                        ? 'bg-[#08047D] text-white border-transparent' 
                        : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-[#FA9411]'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Shop Contact card */}
          <div className="p-4 bg-gradient-to-br from-[#08047D] to-[#1714B8] rounded-2xl text-white">
            <span className="text-[8px] font-black uppercase tracking-widest text-amber-400">Jogoo Road Factory</span>
            <p className="text-[11px] font-extrabold mt-1">Need a custom sizing or bulk embroidery quote?</p>
            <div className="mt-4 flex flex-col gap-2">
              <a 
                href="tel:+254792021795" 
                className="w-full py-2 bg-white text-[#08047D] text-center text-[9px] font-black uppercase rounded-lg hover:bg-amber-400 transition-colors"
              >
                Call Factory 📞
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Filter Drawer Drawer UI */}
        <AnimatePresence>
          {showMobileFilters && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex justify-end"
            >
              <motion.div 
                initial={{ x: 100 }}
                animate={{ x: 0 }}
                exit={{ x: 100 }}
                className="w-5/6 max-w-sm h-full bg-white p-6 shadow-2xl overflow-y-auto flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                      <SlidersHorizontal size={14} /> Shop Options
                    </span>
                    <button onClick={() => setShowMobileFilters(false)} className="p-2 text-slate-400 hover:text-red-500">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Search inside mobile drawer */}
                  <div className="relative mb-6">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text"
                      placeholder="Keyword Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold uppercase outline-none"
                    />
                  </div>

                  {/* Sort mobile */}
                  <div className="mb-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Sort</h4>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-700 outline-none"
                    >
                      <option value="featured">🔥 Featured best seller</option>
                      <option value="priceAsc">📈 Price: Low to High</option>
                      <option value="priceDesc">📉 Price: High to Low</option>
                      <option value="rating">⭐️ Top Rated</option>
                    </select>
                  </div>

                  {/* Price mobile */}
                  <div className="mb-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Price</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'all', label: 'All prices' },
                        { id: 'under1000', label: 'Under 1k' },
                        { id: '1000to2500', label: '1k - 2.5k' },
                        { id: 'above2500', label: 'Above 2.5k' }
                      ].map(range => (
                        <button
                          key={range.id}
                          onClick={() => setSelectedPriceRange(range.id)}
                          className={`px-3 py-2.5 rounded-lg text-[9px] font-black uppercase border text-center ${
                            selectedPriceRange === range.id 
                              ? 'bg-[#FA9411] text-white border-transparent' 
                              : 'bg-white border-slate-200 text-slate-500'
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full bg-[#08047D] text-white text-center py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest mt-12"
                >
                  Apply & See Results
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Product Grid */}
        <div className="flex-grow w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {filteredAndSortedProducts.length > 0 ? (
              filteredAndSortedProducts.slice(0, showAllFeatured ? undefined : 12).map((product) => {
                const isExpanded = expandedProductId === product.id;
                
                // Get active selection variables
                const activeSize = selectedSizes[product.id] || 'M';
                const activeColor = selectedColors[product.id] || 'Navy Blue';
                
                const stars = getProductStars(product.id);
                const decimal = getProductRatingDecimal(product.id);
                const reviews = getProductReviews(product.id);
                const pricingTiers = getWholesalePricing(product.price);

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
                        {/* Retail Visual Card with hover interactions */}
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
                              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110" 
                              loading="lazy" 
                              referrerPolicy="no-referrer" 
                            />
                          ) : (
                            <Package size={45} className="text-[#FA9411]/10" />
                          )}
                          
                          {/* Top Badges */}
                          {product.badge ? (
                            <span className="absolute top-2.5 left-2.5 bg-[#08047D] text-white text-[7.5px] sm:text-[9px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase shadow-md z-10">
                              {product.badge}
                            </span>
                          ) : (
                            <span className="absolute top-2.5 left-2.5 bg-[#08047D] text-white text-[7.5px] sm:text-[9px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase shadow-md z-10">
                              Verified ✓
                            </span>
                          )}

                          {/* Float Wishlist button */}
                          <div className="absolute top-2.5 right-2.5 z-10">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                              className={`w-8 h-8 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all ${
                                wishlist.find(i => i.id === product.id) ? "text-[#08047D]" : "text-slate-400 hover:text-[#08047D]"
                              }`}
                            >
                              <Heart size={14} className={wishlist.find(i => i.id === product.id) ? "fill-[#08047D]" : ""} />
                            </button>
                          </div>

                          {/* Quick View actions for mobile & desktop */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center gap-2 z-10">
                            <button
                              onClick={(e) => { e.stopPropagation(); onProductTap?.(); setSelectedQuickViewProduct(product); }}
                              className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#08047D] flex items-center justify-center shadow-lg backdrop-blur-md border border-white/30 active:scale-95 transition-all"
                              title="View Specs & HD Details"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Retail Details and Multi-Variant Selection Box */}
                        <div className="p-3.5 sm:p-5 flex flex-col justify-between flex-grow min-w-0">
                          <div>
                            {/* Star rating info */}
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <div className="flex text-amber-400">
                                {Array(stars).fill(0).map((_, i) => (
                                  <Star key={i} size={10} className="fill-current" />
                                ))}
                              </div>
                              <span className="text-[9px] text-slate-500 font-extrabold">{decimal} ({reviews} reviews)</span>
                            </div>

                            <h3 
                              onClick={(e) => {
                                e.stopPropagation();
                                onProductTap?.();
                                setSelectedQuickViewProduct(product);
                              }}
                              className="font-extrabold text-[12px] sm:text-[14px] leading-tight text-[#04023D] group-hover:text-[#08047D] transition-colors line-clamp-2 mb-1.5 cursor-pointer"
                            >
                              {product.name}
                            </h3>
                            <div className="text-[8.5px] font-black text-[#FA9411] tracking-wider uppercase mb-3">{product.category}</div>
                            
                            {/* Sizing selection directly on the card */}
                            <div className="mt-3">
                              <div className="flex justify-between text-[7.5px] text-slate-400 font-extrabold uppercase mb-1">
                                <span>Select Size</span>
                                <span className="text-slate-700">{activeSize}</span>
                              </div>
                              <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1">
                                {availableSizes.map(sz => (
                                  <button
                                    key={sz}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSizes(prev => ({ ...prev, [product.id]: sz }));
                                    }}
                                    className={`w-6 h-6 shrink-0 rounded-md text-[8px] font-black flex items-center justify-center transition-all border ${
                                      activeSize === sz 
                                        ? 'bg-[#04023D] text-white border-transparent' 
                                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Color Swatches selection directly on the card */}
                            <div className="mt-2.5">
                              <div className="flex justify-between text-[7.5px] text-slate-400 font-extrabold uppercase mb-1.5">
                                <span>Select Color</span>
                                <span className="text-slate-700">{activeColor}</span>
                              </div>
                              <div className="flex gap-1.5">
                                {availableColors.map(col => (
                                  <button
                                    key={col.name}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedColors(prev => ({ ...prev, [product.id]: col.name }));
                                    }}
                                    style={{ backgroundColor: col.hex }}
                                    className={`w-4 h-4 rounded-full border relative transition-all ${
                                      activeColor === col.name 
                                        ? 'ring-2 ring-offset-1 ring-[#08047D] scale-110' 
                                        : 'border-slate-200 opacity-80 hover:opacity-100'
                                    }`}
                                    title={col.name}
                                  >
                                    {activeColor === col.name && (
                                      <Check size={8} className="text-white absolute inset-0 m-auto" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Footer pricing and Quick buy */}
                          <div className="mt-5 pt-3.5 border-t border-slate-50 flex items-center justify-between gap-2">
                            <div className="flex flex-col">
                              <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Base Cost</span>
                              <span className="text-sm sm:text-base font-black text-[#08047D] mt-1">{formatPrice(product.price)}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onProductTap?.(); setSelectedQuickViewProduct(product); }}
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all"
                                title="View Specs"
                              >
                                <Eye size={15} />
                              </button>
                              <button 
                                onClick={(e) => handleAddToCart(e, product)}
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#08047D] hover:bg-[#050259] text-white flex items-center justify-center active:scale-95 transition-all shadow-md shadow-red-100"
                                title="Add to Cart"
                              >
                                <ShoppingCart size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col md:flex-row h-full w-full">
                        {/* Expanded Left Column: Product visual card and price */}
                        <div className="w-full md:w-5/12 bg-white flex flex-col border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
                          <div className="relative aspect-[4/3] md:aspect-[4/5] overflow-hidden bg-slate-50/50 flex items-center justify-center p-2">
                            {product.imageUrl ? (
                              <LazyImage 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="w-full h-full object-cover object-top" 
                                wrapperClassName="w-full h-full"
                              />
                            ) : (
                              <Package size={50} className="text-[#FA9411]/20" />
                            )}
                            
                            <span className="absolute top-3 left-3 bg-[#08047D] text-white text-[9px] font-black px-2.5 py-1 rounded tracking-widest uppercase shadow-md z-10">
                              DIRECT SPEC
                            </span>
                            
                            <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                              <button 
                                onClick={() => toggleWishlist(product)}
                                className={`w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md transition-colors ${
                                  wishlist.find(i => i.id === product.id) ? "text-[#08047D]" : "hover:text-[#08047D] text-slate-400"
                                }`}
                              >
                                <Heart size={14} className={wishlist.find(i => i.id === product.id) ? "fill-current" : ""} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-slate-50/50 flex-grow flex flex-col justify-between">
                            <div>
                              <div className="text-[9px] text-[#FA9411] font-bold tracking-widest uppercase mb-1">{product.category}</div>
                              <h3 className="font-extrabold text-[#04023D] text-sm leading-snug line-clamp-2">{product.name}</h3>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Single Unit</span>
                              <span className="text-base font-black text-[#08047D]">{formatPrice(product.price)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Right Column: Spec details and actions */}
                        <div className="w-full md:w-7/12 p-4 sm:p-5 flex flex-col justify-between bg-white relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setExpandedProductId(null); }}
                            className="absolute right-3 top-3 w-8 h-8 rounded-full bg-slate-50 hover:bg-red-50 hover:text-[#08047D] border border-slate-200/60 flex items-center justify-center text-slate-500 transition-all shadow-sm active:scale-95"
                            title="Collapse details view"
                          >
                            <X size={15} />
                          </button>

                          <div className="pr-6">
                            <span className="inline-block bg-slate-50 border border-slate-100 text-slate-500 text-[8px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider mb-3">Specification Panel</span>
                            
                            <div className="space-y-4 mt-2">
                              <div>
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Catalog Description</h4>
                                <p className="text-[11.5px] text-slate-600 leading-relaxed font-bold">
                                  {product.description || "Premium bespoke uniform textile engineered for superior lifespan under heavy-duty institutional service. Perfect colors, fade-resistant fabrics."}
                                </p>
                              </div>

                              {/* Multi-tier Wholesale Pricing Table */}
                              <div>
                                <h4 className="text-[9px] font-black text-[#FA9411] uppercase tracking-widest mb-1.5">Wholesale Price List (Direct)</h4>
                                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                  {pricingTiers.map((tier, idx) => (
                                    <div key={idx} className="text-center">
                                      <span className="text-[7.5px] text-slate-400 font-extrabold block uppercase">{tier.qty}</span>
                                      <span className="font-extrabold text-[#04023D] text-[10px]">{formatPrice(tier.price)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Active Sizing & Color display in specifications */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Selected Size</span>
                                  <span className="inline-block bg-slate-50 border border-slate-100 text-[#04023D] text-[10px] font-black px-2.5 py-1 rounded-md">{activeSize}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Selected Color</span>
                                  <span className="inline-block bg-slate-50 border border-slate-100 text-[#04023D] text-[10px] font-black px-2.5 py-1 rounded-md">{activeColor}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                            <button 
                              onClick={(e) => { 
                                handleAddToCart(e, product);
                                setExpandedProductId(null);
                                navigate('/checkout');
                              }}
                              className="w-full bg-gradient-to-r from-[#08047D] to-[#FA9411] hover:opacity-95 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all text-center shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                              title="Secure checkout"
                            >
                              Buy Selected Right Now ⚡
                            </button>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onProductTap?.(); setSelectedQuickViewProduct(product); }}
                                className="bg-slate-50 border border-slate-200 hover:border-[#04023D]/30 text-[#04023D] py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 active:scale-95"
                              >
                                <MessageSquare size={13} strokeWidth={2.5} />
                                Enquire ✉️
                              </button>
                              <a 
                                href="tel:+254792021795"
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-50 border border-slate-200 hover:border-[#04023D]/30 text-[#04023D] py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 active:scale-95"
                              >
                                <Phone size={13} strokeWidth={2.5} />
                                Call Now 📞
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-100">
                <Package className="mx-auto text-slate-300 mb-4 animate-bounce" size={40} />
                <p className="text-sm font-bold uppercase tracking-wider">No matching uniform products found</p>
                <p className="text-xs mt-1 font-medium">Try broadening your search query or selecting a different category folder.</p>
              </div>
            )}
          </div>

          {filteredAndSortedProducts.length > 12 && (
            <div className="mt-16 flex justify-center">
              <button 
                onClick={() => setShowAllFeatured(!showAllFeatured)}
                className="px-12 py-5 bg-gradient-to-r from-[#08047D] via-[#08047D] to-[#FA9411] text-white hover:opacity-90 transition-all rounded-full flex items-center gap-4 text-[11px] font-black uppercase tracking-[3px] shadow-[0_4px_16px_rgba(250, 148, 17,0.25)] active:scale-95 cursor-pointer"
              >
                {showAllFeatured ? 'Show Less' : 'View More Products'} 
                <ChevronRight size={16} className={`transition-transform duration-500 ${showAllFeatured ? '-rotate-90' : 'rotate-90'}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
