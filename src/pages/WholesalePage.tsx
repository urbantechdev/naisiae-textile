import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ShoppingBag, 
  Heart, 
  Search, 
  Menu, 
  Phone, 
  Mail, 
  MapPin, 
  X, 
  User as UserIcon,
  Zap,
  Package,
  CheckCircle2,
  GitCompare,
  Share2,
  Plus,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { Breadcrumb } from '../components/Breadcrumb';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { useCart } from '../context/CartContext';

export default function WholesalePage() {
  const { 
    cart, 
    addToCart, 
    isCartOpen, 
    setIsCartOpen, 
    wishlist, 
    toggleWishlist: toggleWishlistGlobal, 
    isInWishlist,
    isWishlistOpen,
    setIsWishlistOpen
  } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [inquiryQty, setInquiryQty] = useState(50);
  const [customizationDetails, setCustomizationDetails] = useState('');
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) setSiteSettings(snapshot.data());
    });

    const q = query(
      collection(db, 'products'), 
      where('active', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort in-memory to avoid index requirement for combined query
      const sortedItems = allItems.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      
      // Filter for wholesale items (tagged 'Wholesale' or 'Bulk')
      const wholesaleItems = sortedItems.filter(item => 
        item.tags?.some((t: string) => t.toLowerCase() === 'wholesale' || t.toLowerCase() === 'bulk' || t.toLowerCase() === 'corporate')
      );
      setProducts(wholesaleItems);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubscribeSettings();
    };
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const toggleWishlist = (product: any) => {
    toggleWishlistGlobal(product);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0A1628]">
      <Navbar 
        wishlistCount={wishlist.length}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />
      <Breadcrumb />

      {/* Hero Section */}
      <section className="relative py-24 bg-[#0A1628] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8961A]/10 border border-[#C8961A]/20 rounded-full text-[#C8961A] text-[10px] font-black tracking-[4px] uppercase mb-8"
            >
              <Zap size={14} /> Bulk & Institution Solutions
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-6xl md:text-8xl text-white tracking-[2px] leading-[0.9] mb-6"
            >
              Wholesale <span className="text-[#C8961A]">Catalogue</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-10"
            >
              School Uniforms institutional wear, corporate apparel, and branding materials at competitive bulk pricing for schools and organizations across Kenya.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Product Feed */}
      <div className="max-w-7xl mx-auto px-4 -mt-12 mb-24 relative z-20">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-black/5 p-8 lg:p-12 border border-slate-100">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-8 justify-between items-center mb-12 border-b border-slate-50 pb-12">
            <div className="flex flex-wrap gap-3">
              {categories.map((cat, idx) => (
                <button
                  key={`${cat}-${idx}`}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[3px] transition-all ${
                    activeCategory === cat 
                    ? 'bg-[#0A1628] text-white shadow-xl shadow-[#0A1628]/20' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-[#0A1628]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="w-full lg:w-96 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#C8102E] transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search catalog..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 bg-slate-50 border-none rounded-[20px] pl-16 pr-8 text-sm outline-none ring-2 ring-transparent focus:ring-[#C8102E]/10 transition-all font-medium"
              />
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-slate-100 rounded-[32px] animate-pulse"></div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <WholesaleCard 
                  key={product.id} 
                  product={product} 
                  addToCart={addToCart}
                  toggleWishlist={toggleWishlist}
                  isWishlisted={wishlist.some(p => p.id === product.id)}
                  onPreview={() => setSelectedProduct(product)}
                  isExpanded={expandedProductId === product.id}
                  onToggleExpand={() => setExpandedProductId(expandedProductId === product.id ? null : product.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <Package size={64} className="mx-auto text-slate-100 mb-6" />
              <h3 className="text-2xl font-bold text-slate-400">No products found</h3>
              <p className="text-slate-300 mt-2">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats / Proof Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-[#C8961A]/10 text-[#C8961A] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <Package size={32} />
            </div>
            <h4 className="font-display text-3xl tracking-wide">Bulk Production</h4>
            <p className="text-slate-400 text-sm leading-relaxed">State-of-the-art facilities capable of delivering 10,000+ units per month with consistent quality.</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-[#1C3560]/10 text-[#1C3560] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="font-display text-3xl tracking-wide">ISO Quality Control</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Every garment undergoes a 5-step inspection process to ensure durable stitching and accurate branding.</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-[#C8102E]/10 text-[#C8102E] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <Zap size={32} />
            </div>
            <h4 className="font-display text-3xl tracking-wide">Fast Turnaround</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Swift production timelines with dedicated logistical support for institutions across East Africa.</p>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-[#0A1628]/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3 }}
              className="bg-white w-full max-w-5xl rounded-3xl md:rounded-[40px] overflow-hidden flex flex-col lg:flex-row relative z-10 shadow-2xl max-h-[92vh] md:max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 w-10 h-10 sm:w-12 sm:h-12 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 hover:text-[#C8102E] transition-all shadow-lg border border-slate-100 hover:scale-110 active:scale-95 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="w-full lg:w-1/2 bg-slate-50 relative overflow-hidden flex items-center justify-center p-6 sm:p-10 lg:p-12 shrink-0 h-48 sm:h-64 md:h-80 lg:h-auto">
                {selectedProduct.imageUrl ? (
                  <img 
                    src={selectedProduct.imageUrl} 
                    className="w-full h-full object-contain rounded-2xl drop-shadow-xl"
                    alt={selectedProduct.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-2xl">
                    <Package size={60} className="text-slate-200" />
                  </div>
                )}
                
                {selectedProduct.badge && (
                  <span className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-[#C8102E] text-white text-[10px] md:text-[12px] font-black px-4 md:px-6 py-1.5 md:py-2 rounded-full tracking-[2px] md:tracking-[3px] uppercase shadow-lg">
                    {selectedProduct.badge}
                  </span>
                )}
              </div>

              <div className="w-full lg:w-1/2 flex flex-col min-h-0 bg-white">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-12">
                  <div className="text-[11px] text-[#C8961A] font-black tracking-[3px] uppercase mb-4 flex items-center gap-2">
                    <span className="w-6 h-[1.5px] bg-[#C8961A]"></span>
                    {selectedProduct.category}
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#0A1628] leading-[1.1] mb-3">
                    {selectedProduct.name}
                  </h2>
                  <div className="mb-6">
                    <span className="inline-block text-[10px] font-black uppercase tracking-[2px] text-[#C8961A] bg-[#C8961A]/10 px-3 py-1 rounded-md">
                      Institutional Bulk Order
                    </span>
                  </div>
                  
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
                    {selectedProduct.description || "Institutional grade apparel engineered for Kenya's leading organizations. Durable fabric with industrial-strength stitching."}
                  </p>

                  {selectedProduct.priceType === 'wholesale' && (
                    <div className="space-y-4 mb-8 p-4 sm:p-6 bg-orange-50/40 rounded-2xl border border-orange-100/40">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-[#C8961A] tracking-wider ml-1">Inquiry Quantity</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="1"
                            value={inquiryQty}
                            onChange={(e) => setInquiryQty(parseInt(e.target.value) || 1)}
                            className="w-full bg-white border border-orange-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-black outline-none focus:border-[#C8102E] transition-all"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-orange-300 uppercase tracking-widest">PCS</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-[#C8961A] tracking-wider ml-1">Customization / Branding Details</label>
                        <textarea 
                          placeholder="Please specify size range, logo placement (embroidery/print), or specific fabric requirements..."
                          value={customizationDetails}
                          onChange={(e) => setCustomizationDetails(e.target.value)}
                          className="w-full bg-white border border-orange-200 rounded-xl px-4 py-3 text-[11px] font-medium outline-none focus:border-[#C8102E] transition-all min-h-[100px] resize-none"
                        ></textarea>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                    <div>
                      <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[2px] mb-1">Material Grade</h4>
                      <p className="text-[11px] sm:text-xs font-bold text-[#0A1628]">Institutional Heavy Duty</p>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[2px] mb-1">Min. Bulk order</h4>
                      <p className="text-[11px] sm:text-xs font-bold text-[#0A1628]">50 Units (Varies)</p>
                    </div>
                  </div>
                </div>

                {/* Sticky/Fixed polished Interactive Action Footer */}
                <div className="bg-white/95 backdrop-blur-md p-4 sm:p-6 lg:p-8 border-t border-slate-100 shrink-0 space-y-3 shadow-[0_-12px_30px_rgba(0,0,0,0.03)]">
                  {/* Row 1: Inquiry Cart & Wishlist */}
                  <div className="flex gap-3">
                    <button 
                      onClick={() => { 
                        addToCart({
                          ...selectedProduct,
                          price: selectedProduct.priceType === 'wholesale' ? 0 : selectedProduct.price,
                          quantity: selectedProduct.priceType === 'wholesale' ? inquiryQty : 1,
                          customization: selectedProduct.priceType === 'wholesale' ? customizationDetails : undefined
                        }); 
                        setSelectedProduct(null); 
                        // Reset inputs
                        setInquiryQty(50);
                        setCustomizationDetails('');
                      }}
                      className="flex-grow bg-[#0A1628] hover:bg-[#C8102E] text-white h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-[2px] transition-all flex items-center justify-center gap-2.5 shadow-xl hover:shadow-[#0A1628]/10 active:scale-[0.98] cursor-pointer"
                    >
                      <ShoppingBag size={18} /> 
                      <span>{selectedProduct.priceType === 'wholesale' ? 'Add to Inquiry' : 'Wholesale Request'}</span>
                    </button>
                    <button 
                      onClick={() => toggleWishlist(selectedProduct)}
                      className={`w-12 sm:w-14 h-12 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 transition-all cursor-pointer shrink-0 ${
                        wishlist.some(p => p.id === selectedProduct.id) 
                          ? "bg-red-50 border-red-100 text-red-500" 
                          : "border-slate-100 text-slate-400 hover:text-red-400 hover:border-red-100 bg-slate-50/50"
                      }`}
                      title="Add to Wishlist"
                    >
                      <Heart size={18} className={wishlist.some(p => p.id === selectedProduct.id) ? "fill-current scale-110" : "transition-transform hover:scale-110"} />
                    </button>
                  </div>

                  {/* Row 2: Instant Contact */}
                  <div className="grid grid-cols-2 gap-3">
                    <a 
                      href={`https://wa.me/254792021795?text=Hello, I'm interested in wholesale order for ${selectedProduct.name}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] hover:bg-[#128C7E] text-white h-11 sm:h-12 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] sm:text-[11px] uppercase tracking-[1.5px] transition-all shadow-md hover:shadow-[#25D366]/10 active:scale-[0.98] flex"
                    >
                      <MessageSquare size={16} />
                      <span className="truncate">WhatsApp Inquiry</span>
                    </a>
                    <a 
                      href="tel:+254792021795"
                      className="bg-[#C8102E] hover:bg-[#A30D25] text-white h-11 sm:h-12 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] sm:text-[11px] uppercase tracking-[1.5px] transition-all shadow-md hover:shadow-[#C8102E]/10 active:scale-[0.98] flex"
                    >
                      <Phone size={16} />
                      <span>Call Now</span>
                    </a>
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

function WholesaleCard({ product, addToCart, toggleWishlist, isWishlisted, onPreview, isExpanded, onToggleExpand }: any) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand();
  };

  return (
    <motion.div 
      layout
      className={`group relative flex ${
        isExpanded 
          ? "flex-col col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-3 ring-2 ring-[#C8961A]/50 shadow-2xl bg-gradient-to-br from-white to-slate-50/70 border-transparent p-5" 
          : "flex-row md:flex-col border-[#E4E8EF] hover:shadow-xl hover:border-[#C8961A]/20 bg-white border rounded-[24px] md:rounded-[32px] p-3 md:p-5 transition-all duration-300"
      }`}
    >
      {!isExpanded ? (
        <>
          <div 
            onClick={handleClick}
            className="aspect-square md:aspect-[4/3] bg-[#F1F5F9] rounded-[18px] md:rounded-[24px] overflow-hidden relative mb-0 md:mb-6 cursor-pointer flex items-center justify-center p-2 shrink-0 w-[115px] md:w-full border-r md:border-r-0 md:border-b border-slate-100"
          >
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover rounded-[14px] md:rounded-[20px] transition-all duration-700 group-hover:scale-105"
              />
            ) : (
              <Package size={48} className="text-slate-200" />
            )}
            
            <div className="absolute inset-0 bg-[#0A1628]/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 rounded-[18px] md:rounded-[24px]" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                className="w-12 h-12 rounded-2xl bg-white text-[#0A1628] flex items-center justify-center hover:bg-[#C8102E] hover:text-white transition-all shadow-xl hover:-translate-y-1"
              >
                <Plus size={20} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl hover:-translate-y-1 ${
                  isWishlisted ? 'bg-[#C8102E] text-white' : 'bg-white text-slate-400 hover:text-red-500'
                }`}
              >
                <Heart size={20} className={isWishlisted ? "fill-current" : ""} />
              </button>
            </div>

            {product.badge && (
              <span className="absolute top-2 left-2 md:top-4 md:left-4 bg-[#C8102E] text-white text-[7px] md:text-[8px] font-black px-1.5 py-0.5 md:px-3 md:py-1 rounded-full tracking-[1.5px] md:tracking-[2px] uppercase shadow-lg">
                {product.badge}
              </span>
            )}
          </div>

          <div className="pl-3 md:px-2 flex flex-col justify-between flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
            <div>
              <div className="flex items-center gap-2 mb-1 md:mb-2">
                <span className="text-[8px] md:text-[9px] font-black text-[#C8961A] uppercase tracking-[1.5px] md:tracking-[3px]">{product.category}</span>
                <div className="h-[1px] flex-1 bg-slate-100 hidden md:block"></div>
                <Package size={12} className="text-slate-300 hidden md:block" />
              </div>
              <h3 className="font-display text-sm md:text-2xl text-[#0A1628] leading-tight mb-1 md:mb-2 group-hover:text-[#C8102E] transition-colors line-clamp-2 md:line-clamp-1">{product.name}</h3>
              
              {/* Interactive hint */}
              <span className="text-[8px] md:text-[9px] text-[#C8961A]/75 font-bold mb-2 block leading-none antialiased">
                ✨ Tap to inspect wholesale details
              </span>
            </div>

            <div className="flex flex-col gap-2 mt-auto">
              <div className="flex items-center justify-between hidden md:flex">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  Bulk Inquiry Required
                </span>
              </div>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <a 
                  href={`https://wa.me/254792021795?text=Hello, I'm interested in wholesale order for ${product.name}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white py-1.5 md:py-2.5 rounded-lg md:rounded-xl font-black text-[8px] md:text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageSquare size={12} />
                  Enquire
                </a>
                <a 
                  href="tel:+254792021795"
                  className="flex-1 bg-[#C8102E] hover:bg-[#9E0D24] text-white py-1.5 md:py-2.5 rounded-lg md:rounded-xl font-black text-[8px] md:text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Phone size={12} />
                  Call
                </a>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 w-full text-left h-full">
          {/* Left Column: Visual Area */}
          <div className="w-full md:w-5/12 bg-white flex flex-col border-b md:border-b-0 md:border-r border-slate-100 shrink-0 pb-4 md:pb-0 md:pr-4">
            <div className="relative aspect-[4/3] md:aspect-[4/5] overflow-hidden bg-slate-50 rounded-2xl flex items-center justify-center p-2 mb-4">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover rounded-xl" 
                />
              ) : (
                <Package size={50} className="text-[#C8961A]/20" />
              )}
              {product.badge && (
                <span className="absolute top-3 left-3 bg-[#C8102E] text-white text-[9.5px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase shadow-md z-10">{product.badge}</span>
              )}
            </div>
            <div>
              <div className="text-[10px] text-[#C8961A] font-black tracking-widest uppercase mb-1">{product.category}</div>
              <h3 className="font-display text-2xl text-[#0A1628] leading-tight line-clamp-2">{product.name}</h3>
            </div>
          </div>

          {/* Right Column: Specifications & Forms */}
          <div className="w-full md:w-7/12 flex flex-col justify-between relative bg-white min-h-0">
            {/* Close / Collapse button */}
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              className="absolute right-0 top-0 w-8 h-8 rounded-full bg-slate-50 hover:bg-red-50 hover:text-[#C8102E] border border-slate-200/60 flex items-center justify-center text-slate-500 transition-all shadow-sm active:scale-95"
              title="Close specification details"
            >
              <X size={15} />
            </button>

            <div className="pr-6 pt-1">
              <span className="inline-block bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider mb-4">
                Bulk Supply Specifications
              </span>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</h4>
                  <p className="text-[12px] text-slate-600 leading-relaxed font-bold">
                    {product.description || "Premium bespoke uniform textile engineered for superior lifespan under heavy-duty institutional service. Perfect colors, fade-resistant fabrics."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[8px] text-slate-400 font-extrabold block uppercase">Minimum Order</span>
                    <span className="font-extrabold text-[#0E121C] text-[11px]">50 Units</span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[8px] text-slate-400 font-extrabold block uppercase">Lead Time</span>
                    <span className="font-extrabold text-[#C8961A] text-[11px]">7 - 14 Days</span>
                  </div>
                </div>

                {product.tags && product.tags.length > 0 && (
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fabric Properties</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {product.tags.map((t: string, idx: number) => (
                        <span key={idx} className="bg-slate-50 border border-slate-200 text-[#C8961A] text-[9.5px] font-black px-2.5 py-1 rounded-lg">
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
                <a 
                  href={`https://wa.me/254792021795?text=Hello, I'm interested in wholesale order for ${product.name}.`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#128C7E] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-center"
                >
                  <MessageSquare size={13} />
                  Enquire WhatsApp
                </a>
                <a 
                  href="tel:+254792021795"
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#C8102E] hover:bg-[#9E0D24] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-center"
                >
                  <Phone size={13} />
                  Call Now
                </a>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onPreview(); }}
                className="w-full text-[#C8961A] hover:text-[#C8102E] text-[9px] font-black uppercase tracking-widest text-center mt-1 block"
              >
                🔍 Click to open detailed inquiry/quote builder
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
