import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Package, 
  Grid, 
  Layout, 
  Scissors, 
  HelpCircle, 
  Phone, 
  MessageSquare, 
  FileText, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Check, 
  Heart, 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  Sparkles, 
  Award, 
  ShieldCheck, 
  Truck, 
  Star,
  Info,
  Eye,
  Zap,
  Mail
} from 'lucide-react';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { LazyImage } from '../components/LazyImage';
import { ImageZoomViewer } from '../components/ImageZoomViewer';
import { useCart } from '../context/CartContext';
import { useLocalization } from '../context/LocalizationContext';
import { GoogleMerchantSchema } from '../components/GoogleMerchantSchema';

export default function ProductsPage() {
  const { 
    wishlistCount, 
    setIsCartOpen, 
    setIsQuoteModalOpen,
    addToCart,
    setQuoteProduct,
    wishlist,
    toggleWishlist,
    isInWishlist
  } = useCart();
  const { formatPrice, currentCountry } = useLocalization();
  const navigate = useNavigate();
  
  // State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState<number>(10000);
  const [onlyWholesale, setOnlyWholesale] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isBgRemoverActive, setIsBgRemoverActive] = useState(() => {
    return localStorage.getItem('auto_bg_remover') !== 'false';
  });

  useEffect(() => {
    const handleToggle = () => {
      setIsBgRemoverActive(localStorage.getItem('auto_bg_remover') !== 'false');
    };
    window.addEventListener('autoBgRemoverChanged', handleToggle);
    return () => window.removeEventListener('autoBgRemoverChanged', handleToggle);
  }, []);

  // Quick View / Options selector Drawer state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Navy');
  const [qty, setQty] = useState(1);
  const [brandingText, setBrandingText] = useState('');
  const [embroideryOption, setEmbroideryOption] = useState('none'); // 'none', 'embroidery', 'printing'
  const [embroideryPosition, setEmbroideryPosition] = useState('Chest');

  // Load products dynamically from Firestore
  useEffect(() => {
    const q = query(collection(db, 'products'), where('active', '==', true), limit(500));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const unsorted = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(unsorted.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    });
    return () => unsubscribe();
  }, []);

  // Compute Categories with product count
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach(p => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Compute Tags with product count
  const allTags = useMemo(() => {
    const tagsMap: Record<string, number> = {};
    products.forEach(p => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach((t: string) => {
          const clean = t.trim().toLowerCase();
          if (clean) tagsMap[clean] = (tagsMap[clean] || 0) + 1;
        });
      }
    });
    return Object.entries(tagsMap)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .slice(0, 8)
      .map(entry => entry[0]);
  }, [products]);

  // Max price finder dynamically
  const maxProductPrice = useMemo(() => {
    if (products.length === 0) return 10000;
    const prices = products.map(p => Number(p.price) || 0).filter(p => p > 0);
    return prices.length > 0 ? Math.max(...prices) : 10000;
  }, [products]);

  // Set default slider price range when maxProductPrice changes
  useEffect(() => {
    if (maxProductPrice > 0) {
      setPriceRange(maxProductPrice);
    }
  }, [maxProductPrice]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Search Query
      const nameMatch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const catMatch = p.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = nameMatch || catMatch || descMatch;

      // 2. Category selection
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      // 3. Wholesale Filter
      const isProductWholesale = p.priceType === 'wholesale' || p.tags?.some((t: string) => 
        ['wholesale', 'bulk', 'corporate'].includes(t.toLowerCase())
      );
      const matchesWholesale = !onlyWholesale || isProductWholesale;

      // 4. Tag selection
      const matchesTag = !activeTag || p.tags?.some((t: string) => t.toLowerCase() === activeTag.toLowerCase());

      // 5. Price Limit
      // If wholesale or quote required, we don't strictly apply maximum price limit to hide it unless it fits
      const priceVal = Number(p.price) || 0;
      const matchesPrice = priceVal <= priceRange || priceVal === 0 || isProductWholesale;

      return matchesSearch && matchesCategory && matchesWholesale && matchesTag && matchesPrice;
    });
  }, [products, searchQuery, selectedCategory, onlyWholesale, activeTag, priceRange]);

  // Sorting Logic
  const sortedAndFilteredProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'price-asc') {
      return list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price-desc') {
      return list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'name-asc') {
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      // Featured / Default by sortOrder
      return list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
  }, [filteredProducts, sortBy]);

  // Reset all filters convenience button
  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setOnlyWholesale(false);
    setActiveTag(null);
    setPriceRange(maxProductPrice);
    setSortBy('featured');
  };

  // Open Quick View Overlay
  const handleOpenQuickView = (product: any) => {
    setSelectedProduct(product);
    // Initialize variant presets
    setSelectedSize('M');
    setSelectedColor('Navy');
    setQty(1);
    setBrandingText('');
    setEmbroideryOption('none');
    setEmbroideryPosition('Chest');
  };

  // Safe Interactive calculated price based on customizable selections
  const computedProductPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    let basePrice = selectedProduct.price || 0;
    
    // Customization branding charges add extra premium value (industry standard)
    if (embroideryOption === 'embroidery') {
      basePrice += 250; // computer-assisted high precision embroidery
    } else if (embroideryOption === 'printing') {
      basePrice += 150; // silk screen printing
    }
    
    return basePrice * qty;
  }, [selectedProduct, embroideryOption, qty]);

  // Final Add-To-Cart handler that propagates the customizations properly
  const handleAddCustomProductToCart = () => {
    if (!selectedProduct) return;
    
    const isWholesaleItem = selectedProduct.priceType === 'wholesale' || selectedProduct.tags?.some((t: string) => 
      ['wholesale', 'bulk', 'corporate'].includes(t.toLowerCase())
    );

    // If wholesale item requires bulk quote, launch the central quote flow
    if (isWholesaleItem && (!selectedProduct.price || selectedProduct.price === 0)) {
      setQuoteProduct(selectedProduct);
      setIsQuoteModalOpen(true);
      setSelectedProduct(null);
      return;
    }

    // Build the custom dynamic cart entry
    const finalCartItem = {
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: (selectedProduct.price || 0) + (embroideryOption === 'embroidery' ? 250 : embroideryOption === 'printing' ? 150 : 0),
      imageUrl: selectedProduct.imageUrl,
      category: selectedProduct.category,
      subCategory: selectedProduct.subCategory,
      priceType: selectedProduct.priceType || 'fixed',
      selectedVariants: {
        Size: selectedSize,
        Color: selectedColor,
        Branding: embroideryOption === 'embroidery' ? 'Embroidered' : embroideryOption === 'printing' ? 'Printed' : 'Standard Platter'
      },
      customization: brandingText || undefined,
      brandingType: embroideryOption !== 'none' ? embroideryOption : undefined,
      brandingPosition: embroideryOption !== 'none' ? embroideryPosition : undefined
    };

    addToCart(finalCartItem, qty);
    setSelectedProduct(null);
  };

  // Fast Buy Flow for instant checkout
  const handleBuyNow = (product: any) => {
    // Instantly add with standard settings and navigate
    const isWholesaleItem = product.priceType === 'wholesale' || product.tags?.some((t: string) => 
      ['wholesale', 'bulk', 'corporate'].includes(t.toLowerCase())
    );

    if (isWholesaleItem && (!product.price || product.price === 0)) {
      setQuoteProduct(product);
      setIsQuoteModalOpen(true);
      return;
    }

    const defaultCartItem = {
      id: product.id,
      name: product.name,
      price: product.price || 0,
      imageUrl: product.imageUrl,
      category: product.category,
      subCategory: product.subCategory,
      priceType: product.priceType || 'fixed',
      selectedVariants: {
        Size: 'M',
        Color: 'Navy'
      }
    };

    addToCart(defaultCartItem, 1);
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-[#0A1628]">
      <Navbar 
        wishlistCount={wishlistCount}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />
      
      <Breadcrumb />

      {/* Modern High-End E-commerce Hero */}
      <div className="relative py-20 px-6 overflow-hidden bg-[#0A1628] text-white">
        {/* Abstract background graphics with low latency vector shapes */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        <div className="max-w-[1440px] mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[#C8961A] text-[9px] font-black uppercase tracking-[3px] mb-4">
              <Sparkles size={12} /> Live Factory Sourcing
            </div>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-none tracking-tight font-black uppercase mb-4">
              THE UNIFORM <span className="text-[#C8961A] italic">CATALOG</span>
            </h1>
            <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-lg font-light">
              Explore Nairobi's premier institutional collection. From standard school wear to customized corporate profiles & industrial sportswear, order and customize units seamlessly.
            </p>
          </div>

          <div className="bg-[#12223a] border border-white/5 p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6 shadow-xl w-full md:w-auto">
            <div className="flex gap-4 shrink-0 text-white">
              <div className="bg-white/5 border border-white/10 w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold leading-none flex-col">
                <span className="text-[#C8961A] text-lg font-black">20+</span>
                <span className="text-[7px] text-white/40 uppercase">Years</span>
              </div>
              <div className="bg-white/5 border border-white/10 w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold leading-none flex-col">
                <span className="text-[#C8961A] text-lg font-black">47</span>
                <span className="text-[7px] text-white/40 uppercase">Counties</span>
              </div>
              <div className="bg-white/5 border border-white/10 w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold leading-none flex-col">
                <span className="text-[#C8961A] text-lg font-black">0.0</span>
                <span className="text-[7px] text-white/40 uppercase">Defects</span>
              </div>
            </div>
            <div className="text-center sm:text-left border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6">
              <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Direct Wholesale Line</div>
              <a href="tel:+254792021795" className="text-lg font-black text-white hover:text-[#C8961A] transition-colors flex items-center justify-center sm:justify-start gap-1">
                +254 792 021 795
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR: E-COMMERCE FILTERS PANEL */}
          <aside className="w-full lg:w-[280px] shrink-0 space-y-8 bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm self-start">
            
            {/* Auto Background Remover Section */}
            <div className="p-4 bg-gradient-to-br from-[#FDFAF4] to-slate-50 border border-[#C8961A]/10 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-[2.5px] text-slate-800">Visual Style</span>
                <span className="text-[7.5px] font-black text-[#C8961A] bg-[#C8961A]/10 border border-[#C8961A]/20 px-1.5 py-0.5 rounded uppercase">NEW AI Tool</span>
              </div>
              <p className="text-[9.5px] text-slate-500 font-medium mb-3 leading-relaxed">
                Automatically isolates garments from their background for a clean, premium catalogue look.
              </p>
              <button
                onClick={() => {
                  const currentVal = localStorage.getItem('auto_bg_remover') !== 'false';
                  const newVal = !currentVal;
                  localStorage.setItem('auto_bg_remover', String(newVal));
                  window.dispatchEvent(new Event('autoBgRemoverChanged'));
                  setIsBgRemoverActive(newVal);
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                  isBgRemoverActive 
                    ? 'bg-[#C8961A] text-white border-transparent shadow-md hover:bg-[#B08011]' 
                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isBgRemoverActive ? 'bg-white animate-pulse' : 'bg-slate-300'}`}></span>
                {isBgRemoverActive ? 'Bg Remover: Active' : 'Bg Remover: Disabled'}
              </button>
            </div>

            {/* Search Box inside filter area */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Search Catalog</h4>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Keywords (e.g. Blazer)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:ring-1 focus:ring-[#C8961A] focus:border-[#C8961A] transition-all"
                />
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h4 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Categories</h4>
                {selectedCategory !== 'all' && (
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className="text-[9px] font-bold text-[#C8102E] uppercase hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {Object.keys(categoriesWithCounts).map(catName => {
                  const isSelected = selectedCategory === catName;
                  const displayName = catName === 'all' ? 'All Uniforms & Wear' : catName;
                  const count = categoriesWithCounts[catName];
                  return (
                    <button
                      key={catName}
                      onClick={() => setSelectedCategory(catName)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all text-xs font-bold ${
                        isSelected 
                          ? 'bg-[#0A1628] text-white' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-[#0A1628]'
                      }`}
                    >
                      <span className="line-clamp-1">{displayName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wholesale vs Retail Toggle */}
            <div className="space-y-3 pb-4">
              <h4 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Order Channel</h4>
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Package size={16} className="text-[#C8961A]" />
                  <div>
                    <div className="text-xs font-black text-[#0A1628]">Wholesale Volume</div>
                    <div className="text-[9px] text-slate-400">Inquire for 50+ units</div>
                  </div>
                </div>
                <button
                  onClick={() => setOnlyWholesale(!onlyWholesale)}
                  className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 outline-none ${
                    onlyWholesale ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                      onlyWholesale ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Price Limit Slider Filter (Only matches retail catalog items with a valid pricing) */}
            <div className="space-y-3 pb-2">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Max Price Limit</h4>
                <span className="font-mono text-xs font-extrabold text-[#C8961A]">{formatPrice(priceRange)}</span>
              </div>
              <input 
                type="range"
                min="0"
                max={maxProductPrice}
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-[#C8961A] cursor-pointer bg-slate-100 h-1.5 rounded-lg"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>0/-</span>
                <span>{formatPrice(maxProductPrice)} limit</span>
              </div>
            </div>

            {/* Smart Tags cloud */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Popular Tags</h4>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allTags.map(tag => {
                  const isSelected = activeTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(isSelected ? null : tag)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                        isSelected 
                          ? 'bg-[#C8961A] text-white border-transparent' 
                          : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sticky mini summary */}
            <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Selected {sortedAndFilteredProducts.length} items</span>
              <button onClick={handleClearFilters} className="text-[#C8102E] font-black uppercase tracking-wider hover:underline">
                Clear All
              </button>
            </div>

          </aside>

          {/* RIGHT SIDE: PRODUCT LISTING ECOMMERCE SPACE */}
          <main className="flex-1 space-y-8">
            
            {/* Toolbar section */}
            <div className="bg-white border border-slate-200/60 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-[#0A1628]">
                  <Grid size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0A1628]">Institutional Storefront</h3>
                  <p className="text-[10px] text-slate-400">Displaying {sortedAndFilteredProducts.length} factory verified styles</p>
                </div>
              </div>

              {/* Sorting & options tools */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-xs font-bold text-slate-500">
                  <ArrowUpDown size={14} className="text-slate-400" />
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent border-none outline-none pr-4 font-bold text-[#0A1628]"
                  >
                    <option value="featured">Best Seller Order</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Alphabetical (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ACTIVE FILTERS CHIPS */}
            {(selectedCategory !== 'all' || activeTag !== null || onlyWholesale || searchQuery) && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Filters:</span>
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200/75 rounded-full text-[11px] font-bold text-slate-700">
                    Category: {selectedCategory}
                    <button onClick={() => setSelectedCategory('all')} className="hover:text-black">×</button>
                  </span>
                )}
                {activeTag && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C8961A]/10 text-[#C8961A] rounded-full text-[11px] font-bold">
                    Tag: {activeTag}
                    <button onClick={() => setActiveTag(null)} className="hover:text-black">×</button>
                  </span>
                )}
                {onlyWholesale && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[11px] font-bold">
                    Wholesale Scale
                    <button onClick={() => setOnlyWholesale(false)} className="hover:text-emerald-900 font-extrabold">×</button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200/75 rounded-full text-[11px] font-bold text-slate-700">
                    Query: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-black">×</button>
                  </span>
                )}
                <button 
                  onClick={handleClearFilters}
                  className="text-[10px] font-black uppercase tracking-wider text-[#C8102E] hover:underline ml-2"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* PRODUCT CARDS LISTING GRID */}
            {sortedAndFilteredProducts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border border-slate-200/60 rounded-3xl p-16 text-center shadow-sm"
              >
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
                  <Search size={28} />
                </div>
                <h3 className="font-bold text-lg text-[#0A1628] mb-2">No Matching Products Found</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto mb-8">
                  We couldn't find any products in our database matching your current filter choices. Try widening your search criteria or resetting filters.
                </p>
                <button 
                  onClick={handleClearFilters}
                  className="px-6 py-3.5 bg-[#0A1628] text-white rounded-xl font-black text-[10px] uppercase tracking-[3px] hover:bg-[#C8102E] transition-all"
                >
                  Reset Active Filters
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {sortedAndFilteredProducts.map((p, index) => {
                  const isWholesaleItem = p.priceType === 'wholesale' || p.tags?.some((t: string) => 
                    ['wholesale', 'bulk', 'corporate'].includes(t.toLowerCase())
                  );
                  const isItemInWishlist = isInWishlist(p.id);

                  return (
                    <motion.div 
                      key={p.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.4) }}
                      className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full relative animate-blink-orange"
                    >
                      {/* Badge Display */}
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 flex flex-col gap-1 sm:gap-1.5 items-start">
                        {isWholesaleItem ? (
                          <span className="bg-emerald-600 text-white text-[7px] sm:text-[8px] font-black uppercase tracking-[1px] sm:tracking-[1.5px] px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md shadow-sm">
                            Wholesale Scale
                          </span>
                        ) : p.price && p.price > 0 ? (
                          <span className="bg-[#0A1628] text-white text-[7px] sm:text-[8px] font-black uppercase tracking-[1px] sm:tracking-[1.5px] px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md shadow-sm">
                            Retail Ready
                          </span>
                        ) : null}
                        {p.tags?.includes('bestseller') && (
                          <span className="bg-[#C8961A] text-white text-[6px] sm:text-[7px] font-black uppercase tracking-[1px] sm:tracking-[1.5px] px-1.5 py-0.5 rounded shadow-sm">
                            Best Seller 🔥
                          </span>
                        )}
                      </div>

                      {/* Wishlist Icon Action Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(p);
                        }}
                        className={`absolute top-2 right-2 sm:top-4 sm:right-4 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                          isItemInWishlist 
                            ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                            : 'bg-white/80 select-backdrop-blur border border-slate-100 text-slate-400 hover:text-rose-500'
                        }`}
                        title={isItemInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart size={14} className={isItemInWishlist ? 'fill-current' : ''} />
                      </button>

                      {/* Product Image Area */}
                      <div 
                        onClick={() => handleOpenQuickView(p)}
                        className="w-full aspect-[4/5] bg-slate-50 relative overflow-hidden group-hover:cursor-pointer"
                      >
                        <LazyImage 
                          src={p.imageUrl} 
                          alt={p.name} 
                          className="object-cover object-top w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" 
                          wrapperClassName="w-full h-full"
                          placeholderColor="bg-slate-100" 
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenQuickView(p); }}
                            className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#0A1628] flex items-center justify-center shadow-lg backdrop-blur-md border border-white/30 active:scale-95 transition-all"
                            title="Quick View Specs"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Details Area */}
                      <div className="p-3 sm:p-5 flex flex-col flex-grow justify-between bg-white">
                        <div>
                          <div className="flex items-center justify-between gap-1 sm:gap-2 mb-1 sm:mb-1.5">
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-[#C8961A] font-mono">
                              {p.category}
                            </span>
                          </div>
                          
                          <h3 
                            onClick={() => handleOpenQuickView(p)}
                            className="font-bold text-xs sm:text-sm text-[#0A1628] hover:text-[#C8102E] transition-colors line-clamp-1 mb-1 sm:mb-2 hover:cursor-pointer"
                          >
                            {p.name}
                          </h3>
                          
                          <p className="hidden xs:line-clamp-2 sm:line-clamp-2 text-slate-400 text-[10px] sm:text-xs mb-3 sm:mb-4 font-medium leading-relaxed">
                            {p.description || "Premium institutional garment tailored with extra heavy duty double-stitched cotton blend."}
                          </p>
                        </div>

                        <div>
                          {/* Retail / Wholesale Pricing */}
                          <div className="flex items-baseline gap-1 sm:gap-2 mb-3 sm:mb-4">
                            {isWholesaleItem && (!p.price || p.price === 0) ? (
                              <div>
                                <span className="text-xs sm:text-base font-black text-slate-700">Custom Quote Req</span>
                                <span className="text-[7.5px] sm:text-[9px] block text-emerald-600 font-extrabold uppercase tracking-wide">Direct wholesale pricing</span>
                              </div>
                            ) : (
                              <>
                                <span className="text-sm sm:text-lg font-black text-[#0A1628] font-mono">
                                  {formatPrice(p.price || 1800)}
                                </span>
                                {p.oldPrice && (
                                  <span className="text-[10px] sm:text-xs text-slate-400 line-through font-mono">
                                    {formatPrice(p.oldPrice)}
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {/* Simplified Icon Action Bar */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <button 
                              onClick={() => handleBuyNow(p)}
                              className="flex-1 bg-[#C2102E] hover:bg-[#A80B23] text-white h-9 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all text-xs"
                              title="Instant Checkout"
                            >
                              <Zap size={14} className="fill-current text-amber-300" />
                            </button>
                            <button 
                              onClick={() => handleOpenQuickView(p)}
                              className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center active:scale-95 transition-all shrink-0"
                              title="View Specs & HD Image"
                            >
                              <Eye size={15} />
                            </button>
                            <button 
                              onClick={() => {
                                setQuoteProduct(p);
                                setIsQuoteModalOpen(true);
                              }}
                              className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center active:scale-95 transition-all shrink-0"
                              title="Request Custom Quote"
                            >
                              <Mail size={15} />
                            </button>
                            <a 
                              href="tel:+254792021795"
                              className="w-9 h-9 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center active:scale-95 transition-all shrink-0"
                              title="Call Direct Desk"
                            >
                              <Phone size={14} />
                            </a>
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Dynamic Sourcing highlights banner */}
            <div className="bg-gradient-to-r from-[#0A1628] to-[#12243d] border border-white/5 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-md mt-16">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-[3px] text-[#C8961A] font-black">Uhuru Market Guarantee</span>
                <h4 className="text-xl font-display font-medium">Ordering Institutional Supplies at Scale?</h4>
                <p className="text-xs text-white/60 max-w-lg">
                  Naisiae Textiles operates on computerized machinery directly from Jogoo Rd Nairobi with capacities of 5,000 units weekly. Contact us to coordinate direct container bulk rates.
                </p>
              </div>
              <button 
                onClick={() => setIsQuoteModalOpen(true)}
                className="px-8 py-4 bg-[#C8961A] text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-[3px] hover:bg-white hover:text-slate-900 transition-all shrink-0"
              >
                Inquire Bulk Capacity
              </button>
            </div>

          </main>
        </div>
      </div>

      {/* QUICK VIEW & DETAILED CUSTOMIZATION OVERLAY DIALOG */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[200] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <GoogleMerchantSchema product={selectedProduct} currency={currentCountry.currency} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl border border-slate-100 flex flex-col lg:flex-row relative max-h-[92vh] sm:max-h-[88vh] my-auto"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 border border-slate-200 hover:bg-slate-200 text-slate-700 hover:text-black flex items-center justify-center transition-colors shadow-lg active:scale-95"
              >
                <X size={18} />
              </button>

              {/* Left Column: Product Info & Image gallery indicator */}
              <div className="w-full lg:w-1/2 bg-slate-50 p-3 sm:p-6 flex flex-col items-center justify-center relative border-b lg:border-b-0 lg:border-r border-slate-100 shrink-0 max-h-[38vh] lg:max-h-none overflow-hidden">
                <ImageZoomViewer 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.name}
                  imageUrls={selectedProduct.imageUrls}
                  badge={selectedProduct.badge}
                  aspectRatio="aspect-square max-h-[30vh] lg:max-h-[44vh] max-w-[260px] sm:max-w-[340px] mx-auto"
                />
                <div className="mt-2 text-center text-slate-400 text-[10px] font-bold">
                  🔍 Batch Ref: #{selectedProduct.id?.slice(0, 8).toUpperCase()}
                </div>
              </div>

              {/* Right Column: Interactive customization options form */}
              <div className="w-full lg:w-1/2 flex flex-col min-h-0 min-w-0 bg-white overflow-hidden flex-1">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4">
                  <h2 className="text-xl lg:text-2xl font-bold text-[#0A1628] mb-2">{selectedProduct.name}</h2>
                  
                  {/* Detailed features review block */}
                  <div className="flex gap-4 items-center text-slate-500 text-xs mb-4">
                    <span className="flex items-center gap-1"><Star size={12} className="fill-current text-amber-500" /> 4.9 (48 ratings)</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-emerald-600 font-bold">100% Cotton-blend</span>
                  </div>

                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                    {selectedProduct.description || "Industrial grade garment. Woven from durable ring-spun yarns that withstand institutional scouring and rugged wash cycles without sagging."}
                  </p>

                  <div className="space-y-5">
                    
                    {/* Size Selector */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-[#0A1628] uppercase tracking-wider text-[10px]">Select Uniform Size</span>
                        <a href="/faq#sizing" target="_blank" className="text-[#C8102E] font-bold text-[10px] hover:underline flex items-center gap-1">
                          <Info size={11} /> Size Chart Guide
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(sz => (
                          <button
                            key={sz}
                            onClick={() => setSelectedSize(sz)}
                            className={`px-4 py-2 text-xs font-black rounded-xl border transition-all ${
                              selectedSize === sz 
                                ? 'bg-[#0A1628] text-white border-transparent shadow' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color selection swatches */}
                    <div className="space-y-2">
                      <span className="font-extrabold text-[#0A1628] uppercase tracking-wider text-[10px] block">Material Colorway</span>
                      <div className="flex gap-2">
                        {[
                          { name: 'Navy', hex: '#0B1C3C' },
                          { name: 'Forest Green', hex: '#163E27' },
                          { name: 'Maroon', hex: '#580816' },
                          { name: 'Gold/Yellow', hex: '#D29C0F' },
                          { name: 'Royal Blue', hex: '#1D40C4' },
                          { name: 'Sky Blue', hex: '#77A3DF' }
                        ].map(col => (
                          <button
                            key={col.name}
                            onClick={() => setSelectedColor(col.name)}
                            className={`w-7 h-7 rounded-full border-2 transition-all p-0.5 relative flex items-center justify-center ${
                              selectedColor === col.name ? 'border-[#C8961A] scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: col.hex }}
                            title={col.name}
                          >
                            {selectedColor === col.name && (
                              <Check size={12} className="text-white drop-shadow-md" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Custom Embroidery block */}
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#0A1628] uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <Scissors size={12} className="text-[#C8961A]" /> Embedded Custom Logo?
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">Embroidery optional</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'none', label: 'None', desc: 'No Logo' },
                          { id: 'embroidery', label: 'Embroidery', desc: 'Sourced (Ksh 250)' },
                          { id: 'printing', label: 'Screen Print', desc: 'Sourced (Ksh 150)' }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setEmbroideryOption(opt.id)}
                            className={`p-2 border rounded-xl text-left transition-all ${
                              embroideryOption === opt.id 
                                ? 'bg-white border-[#C8961A] ring-1 ring-[#C8961A] shadow-sm' 
                                : 'bg-white/50 border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <div className="text-[10px] font-black text-[#0A1628] leading-none mb-1">{opt.label}</div>
                            <div className="text-[8px] text-slate-400 leading-none">{opt.desc}</div>
                          </button>
                        ))}
                      </div>

                      {embroideryOption !== 'none' && (
                        <div className="space-y-3 pt-2">
                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Branding Name / Institution Name</label>
                            <input 
                              type="text"
                              placeholder="E.g. JOGOO ROAD PRIMARY SCHOOL"
                              value={brandingText}
                              onChange={(e) => setBrandingText(e.target.value)}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C8961A]"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Position Placement</label>
                            <select 
                              value={embroideryPosition}
                              onChange={(e) => setEmbroideryPosition(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                            >
                              <option value="Chest">Left Breast (Chest)</option>
                              <option value="Back">Large Back Print</option>
                              <option value="Collar">Collar Label</option>
                              <option value="Sleeve">Right Arm Sleeve</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Qty Counter */}
                    <div className="flex items-center justify-between py-2">
                      <span className="font-extrabold text-[#0A1628] uppercase tracking-wider text-[10px]">Select Quantity</span>
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                        <button 
                          onClick={() => setQty(Math.max(1, qty - 1))}
                          className="w-8 h-8 rounded-lg hover:bg-slate-200 text-[#0A1628] flex items-center justify-center transition-colors"
                        >
                          <Minus size={12} strokeWidth={2.5} />
                        </button>
                        <span className="w-10 text-center font-mono text-sm font-black text-[#0A1628]">{qty}</span>
                        <button 
                          onClick={() => setQty(qty + 1)}
                          className="w-8 h-8 rounded-lg hover:bg-slate-200 text-[#0A1628] flex items-center justify-center transition-colors"
                        >
                          <Plus size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Pricing summary & Quick Action Area */}
                <div className="shrink-0 bg-white border-t border-slate-100 p-3.5 sm:p-4 z-20 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Calculated Value</span>
                    <span className="text-xl sm:text-2xl font-black text-[#0A1628] font-mono">
                      {formatPrice(computedProductPrice)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={handleAddCustomProductToCart}
                      className="w-10 h-10 sm:w-11 sm:h-11 bg-[#0A1628] hover:bg-[#C8102E] text-white rounded-xl transition-all flex items-center justify-center active:scale-95 shrink-0 cursor-pointer shadow-md"
                      title="Add to Cart"
                    >
                      <ShoppingBag size={16} />
                    </button>
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
