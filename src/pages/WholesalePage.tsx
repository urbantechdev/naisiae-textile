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
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' } | null>(null);

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
    const exists = isInWishlist(product.id);
    toggleWishlistGlobal(product);
    setToast({ 
      message: exists ? "Removed from your collection." : "Added to your collection!", 
      type: exists ? 'warning' : 'success' 
    });
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
                  onClick={() => setSelectedProduct(product)}
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

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-[#0A1628]' : toast.type === 'error' ? 'bg-red-600' : 'bg-orange-500'
            }`}
          >
            <CheckCircle2 size={20} className="text-[#C8961A]" />
            <span className="text-[12px] uppercase tracking-[3px] pt-1">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-5xl rounded-[40px] overflow-hidden flex flex-col lg:flex-row relative z-10 shadow-2xl"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-20 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 hover:text-[#C8102E] transition-all shadow-lg border border-slate-100"
              >
                <X size={24} />
              </button>

              <div className="lg:w-1/2 bg-slate-50 relative overflow-hidden flex items-center justify-center p-12">
                {selectedProduct.imageUrl ? (
                  <img 
                    src={selectedProduct.imageUrl} 
                    className="w-full h-auto max-h-[60vh] object-contain rounded-2xl drop-shadow-2xl"
                    alt={selectedProduct.name}
                  />
                ) : (
                  <div className="w-full h-auto aspect-square flex items-center justify-center bg-slate-100 rounded-2xl">
                    <Package size={80} className="text-slate-200" />
                  </div>
                )}
                
                {selectedProduct.badge && (
                  <span className="absolute top-12 left-12 bg-[#C8102E] text-white text-[12px] font-black px-6 py-2 rounded-full tracking-[3px] uppercase shadow-xl">
                    {selectedProduct.badge}
                  </span>
                )}
              </div>

              <div className="lg:w-1/2 p-12 lg:p-16 flex flex-col">
                <div className="flex-1">
                  <div className="text-[12px] text-[#C8961A] font-black tracking-[4px] uppercase mb-6 flex items-center gap-3">
                    <span className="w-8 h-[2px] bg-[#C8961A]"></span>
                    {selectedProduct.category}
                  </div>
                  <h2 className="font-display text-5xl lg:text-7xl text-[#0A1628] leading-[0.9] mb-4">
                    {selectedProduct.name}
                  </h2>
                  <div className="flex flex-col gap-3 mb-8">
                    <span className="text-sm font-black uppercase tracking-[3px] text-[#C8961A]">
                      Institutional Bulk Order
                    </span>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a 
                        href={`https://wa.me/254792021795?text=Hello, I'm interested in wholesale order for ${selectedProduct.name}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white h-14 rounded-2xl font-black text-[11px] uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 shadow-xl"
                      >
                        <MessageSquare size={18} />
                        Enquire on WhatsApp
                      </a>
                      <a 
                        href="tel:+254792021795"
                        className="flex-1 bg-[#C8102E] hover:bg-[#9E0D24] text-white h-14 rounded-2xl font-black text-[11px] uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 shadow-xl"
                      >
                        <Phone size={18} />
                        Call Now
                      </a>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    {selectedProduct.description || "Institutional grade apparel engineered for Kenya's leading organizations. Durable fabric with industrial-strength stitching."}
                  </p>

                  {selectedProduct.priceType === 'wholesale' && (
                    <div className="space-y-6 mb-10 p-6 bg-orange-50/50 rounded-[30px] border border-orange-100/50">
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-black uppercase text-[#C8961A] tracking-widest ml-1">Inquiry Quantity</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              min="1"
                              value={inquiryQty}
                              onChange={(e) => setInquiryQty(parseInt(e.target.value) || 1)}
                              className="w-full bg-white border border-orange-200 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-[#C8102E] transition-all"
                            />
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-orange-300 uppercase tracking-widest">PCS</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[#C8961A] tracking-widest ml-1">Customization / Branding Details</label>
                        <textarea 
                          placeholder="Please specify size range, logo placement (embroidery/print), or any specific fabric requirements..."
                          value={customizationDetails}
                          onChange={(e) => setCustomizationDetails(e.target.value)}
                          className="w-full bg-white border border-orange-200 rounded-2xl px-5 py-4 text-xs font-medium outline-none focus:border-[#C8102E] transition-all min-h-[120px] resize-none"
                        ></textarea>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-8 mb-10 pt-10 border-t border-slate-100">
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] mb-3">Material Grade</h4>
                      <p className="text-xs font-bold text-[#0A1628]">Institutional Heavy Duty</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] mb-3">Min. Bulk order</h4>
                      <p className="text-xs font-bold text-[#0A1628]">50 Units (Varies)</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
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
                    className="flex-1 bg-[#0A1628] hover:bg-[#C8102E] text-white py-5 rounded-[20px] font-black text-[12px] uppercase tracking-[3px] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                  >
                    <ShoppingBag size={20} /> {selectedProduct.priceType === 'wholesale' ? 'Add to Inquiry' : 'Wholesale Request'}
                  </button>
                  <button 
                    onClick={() => toggleWishlist(selectedProduct)}
                    className={`w-16 h-16 rounded-[20px] flex items-center justify-center border-2 transition-all ${
                      wishlist.some(p => p.id === selectedProduct.id) 
                        ? "bg-red-50 border-red-100 text-red-500" 
                        : "border-slate-100 text-slate-400 hover:text-red-400 hover:border-red-100"
                    }`}
                  >
                    <Heart size={24} className={wishlist.some(p => p.id === selectedProduct.id) ? "fill-current" : ""} />
                  </button>
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

function WholesaleCard({ product, addToCart, toggleWishlist, isWishlisted, onClick }: any) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative"
    >
      <div 
        onClick={onClick}
        className="aspect-[4/5] bg-[#F1F5F9] rounded-[32px] overflow-hidden relative mb-6 cursor-pointer flex items-center justify-center"
      >
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
          />
        ) : (
          <Package size={64} className="text-slate-200" />
        )}
        
        <div className="absolute inset-0 bg-[#0A1628]/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
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
          <span className="absolute top-6 left-6 bg-[#C8102E] text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-[2px] uppercase shadow-lg">
            {product.badge}
          </span>
        )}
      </div>

      <div className="px-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-black text-[#C8961A] uppercase tracking-[3px]">{product.category}</span>
          <div className="h-[1px] flex-1 bg-slate-100"></div>
          <Package size={12} className="text-slate-300" />
        </div>
        <h3 className="font-display text-3xl text-[#0A1628] leading-none mb-3 group-hover:text-[#C8102E] transition-colors">{product.name}</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
              Bulk Inquiry Required
            </span>
          </div>
          <div className="flex gap-2">
            <a 
              href={`https://wa.me/254792021795?text=Hello, I'm interested in wholesale order for ${product.name}.`}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              rel="noopener noreferrer"
              className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageSquare size={12} />
              Enquire
            </a>
            <a 
              href="tel:+254792021795"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-[#C8102E] hover:bg-[#9E0D24] text-white py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Phone size={12} />
              Call
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
