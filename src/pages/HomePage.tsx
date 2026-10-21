import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Barcode, 
  CheckCircle2, 
  Sparkles, 
  Scissors, 
  User as UserIcon,
  Zap,
  ArrowRight,
  Camera,
  ImagePlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ImageZoomViewer } from '../components/ImageZoomViewer';
import { AddProductImageModal } from '../components/AddProductImageModal';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, doc, setDoc, increment } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import { useLocalization } from '../context/LocalizationContext';
import { appExperience } from '../utils/haptics';
import { GoogleMerchantSchema } from '../components/GoogleMerchantSchema';

// POS Components
import { POSHeader } from '../components/pos/POSHeader';
import { POSCategoryTabs } from '../components/pos/POSCategoryTabs';
import { POSProductCard } from '../components/pos/POSProductCard';
import { POSCheckoutCart } from '../components/pos/POSCheckoutCart';
import { POSReceiptModal, POSSaleRecord } from '../components/pos/POSReceiptModal';
import { POSHeldOrdersModal, HeldOrder } from '../components/pos/POSHeldOrdersModal';
import { POSCustomItemModal } from '../components/pos/POSCustomItemModal';
import { POSCustomerModal, POSCustomerInfo } from '../components/pos/POSCustomerModal';
import { KenyaSizingMatrixModal } from '../components/KenyaSizingMatrixModal';
import { enrichProductWithPriceMaster, SIZE_CATEGORIES } from '../constants/uniformPriceMaster';

export default function HomePage() {
  const { 
    cart, 
    addToCart, 
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartSubtotal,
    cartCount,
    wishlistCount,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsQuoteModalOpen,
    siteSettings,
    setToast
  } = useCart();
  const { currentCountry, formatPrice } = useLocalization();
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation and header modal states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // POS Catalog states
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('category') || params.get('tab') || 'School Uniforms';
    } catch {
      return 'School Uniforms';
    }
  });
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [activeSizeCategory, setActiveSizeCategory] = useState<string>('all');
  const [activeSector, setActiveSector] = useState<string>('All');
  const [activeGender, setActiveGender] = useState<string>('All');
  const [isSizingGuideOpen, setIsSizingGuideOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCatalogExpanded, setIsCatalogExpanded] = useState(false);

  // POS Modals state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<POSSaleRecord | null>(null);

  const [isCustomItemOpen, setIsCustomItemOpen] = useState(false);
  const [isHeldOrdersOpen, setIsHeldOrdersOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Customer profile for active ticket
  const [customer, setCustomer] = useState<POSCustomerInfo>({
    name: 'Walk-in Customer',
    phone: '',
    type: 'walk-in'
  });

  // Held / Parked Orders (persisted in localStorage)
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    try {
      const saved = localStorage.getItem('naisiae_pos_held_orders_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('naisiae_pos_held_orders_v1', JSON.stringify(heldOrders));
  }, [heldOrders]);

  // Quick View product inspection modal
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<any>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [brandingType, setBrandingType] = useState('None');
  const [brandingPosition, setBrandingPosition] = useState('Left Chest');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [customLogoName, setCustomLogoName] = useState('');
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);

  // Handle URL product parameter
  useEffect(() => {
    if (productId && products.length > 0) {
      const match = products.find(p => p.id === productId);
      if (match) setSelectedQuickViewProduct(match);
    }
  }, [productId, products]);

  const handleCloseQuickView = () => {
    setSelectedQuickViewProduct(null);
    if (productId) {
      const prefix = currentCountry.code === 'KE' ? '' : `/${currentCountry.name.toLowerCase().replace(/ /g, '-')}`;
      navigate(prefix || '/');
    }
  };

  // Fetch Live Products and Categories from Firestore
  useEffect(() => {
    const q = query(collection(db, 'products'), where('active', '==', true), limit(500));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => enrichProductWithPriceMaster({ id: doc.id, ...doc.data() }));
      setProducts(items.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    const qCats = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
    const unsubscribeCats = onSnapshot(qCats, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    return () => {
      unsubscribe();
      unsubscribeCats();
    };
  }, []);

  // Compute Categories with Item Counts (School Uniforms as Premier Default)
  const categoryTabs = useMemo(() => {
    const counts: Record<string, number> = {};
    let schoolCount = 0;
    products.forEach(p => {
      const cat = p.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
      if (cat.toLowerCase().includes('school')) {
        schoolCount++;
      }
    });

    const list = [
      { id: 'School Uniforms', name: 'School Uniforms', count: schoolCount || counts['School Uniforms'] || 0 },
      { id: 'all', name: 'All Products', count: products.length }
    ];

    if (categories.length > 0) {
      categories.forEach(c => {
        const title = c.title || c.name;
        if (title.toLowerCase() !== 'school uniforms' && title.toLowerCase() !== 'all') {
          list.push({
            id: title,
            name: title,
            count: counts[title] || 0
          });
        }
      });
    } else {
      Object.keys(counts).forEach(cat => {
        if (cat.toLowerCase() !== 'school uniforms') {
          list.push({
            id: cat,
            name: cat,
            count: counts[cat]
          });
        }
      });
    }

    return list;
  }, [products, categories]);

  // Compute Size Category Counts
  const sizeCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    SIZE_CATEGORIES.forEach(sc => {
      if (sc.id !== 'all') {
        counts[sc.id] = products.filter(p => p.sizeCategory === sc.id).length;
      }
    });
    return counts;
  }, [products]);

  // Compute Subcategories for currently active category
  const subCategories = useMemo(() => {
    if (activeCategory === 'all') {
      return Array.from(new Set(products.map(p => p.subCategory).filter(Boolean))).slice(0, 8);
    }
    return Array.from(
      new Set(
        products
          .filter(p => 
            p.category?.toLowerCase() === activeCategory.toLowerCase() ||
            (activeCategory.toLowerCase() === 'school uniforms' && p.category?.toLowerCase().includes('school'))
          )
          .map(p => p.subCategory)
          .filter(Boolean)
      )
    );
  }, [products, activeCategory]);

  // Filtered Products for POS Display with Size Categories, Sectors, and Gender
  const filteredProducts = useMemo(() => {
    const hasSchoolUniforms = products.some(p => 
      p.category?.toLowerCase() === 'school uniforms' || 
      p.category?.toLowerCase().includes('school')
    );

    return products.filter(p => {
      const queryLower = searchQuery.toLowerCase().trim();
      const matchesSearch = !queryLower ||
        p.name.toLowerCase().includes(queryLower) ||
        p.category?.toLowerCase().includes(queryLower) ||
        p.subCategory?.toLowerCase().includes(queryLower) ||
        p.typicalSizes?.toLowerCase().includes(queryLower) ||
        p.skuPrefix?.toLowerCase().includes(queryLower) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(queryLower)) ||
        p.id.toLowerCase().includes(queryLower);

      const matchesCat = activeCategory === 'all' || 
        Boolean(queryLower) ||
        (!hasSchoolUniforms && activeCategory === 'School Uniforms') ||
        p.category?.toLowerCase() === activeCategory.toLowerCase() ||
        (activeCategory.toLowerCase() === 'school uniforms' && (
          p.category?.toLowerCase().includes('school') ||
          p.category?.toLowerCase() === 'school uniforms'
        ));

      const matchesSub = !activeSubCategory || p.subCategory === activeSubCategory;

      const matchesSizeCategory = activeSizeCategory === 'all' || p.sizeCategory === activeSizeCategory;

      const matchesSector = activeSector === 'All' || p.educationSector?.toLowerCase() === activeSector.toLowerCase();

      const matchesGender = activeGender === 'All' || p.gender === activeGender || p.gender === 'Unisex';

      return matchesSearch && matchesCat && matchesSub && matchesSizeCategory && matchesSector && matchesGender;
    });
  }, [products, searchQuery, activeCategory, activeSubCategory, activeSizeCategory, activeSector, activeGender]);

  // Map product quantities in current cart for instant display on cards
  const cartQuantityMap = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach(item => {
      map[item.id] = (map[item.id] || 0) + item.quantity;
    });
    return map;
  }, [cart]);

  // Barcode scan simulation
  const handleSimulateBarcodeScan = () => {
    if (products.length === 0) return;
    const randomIndex = Math.floor(Math.random() * products.length);
    const item = products[randomIndex];
    appExperience.triggerFeedback('cart_add');
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      category: item.category
    }, 1);

    setToast({
      message: `Scanned Barcode: ${item.name} (${formatPrice(item.price)})`,
      type: 'success'
    });
  };

  // Quick custom item added
  const handleAddCustomItem = (customItem: any) => {
    appExperience.triggerFeedback('cart_add');
    addToCart(customItem, customItem.quantity || 1);
    setToast({
      message: `Added custom line: "${customItem.name}"`,
      type: 'success'
    });
  };

  // Hold / Park Sale
  const handleHoldSale = () => {
    if (cart.length === 0) return;
    appExperience.triggerFeedback('pop');

    const ticketNumber = `NT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newHeld: HeldOrder = {
      id: `held_${Date.now()}`,
      ticketNumber,
      heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: customer.name,
      items: [...cart],
      subtotal: cartSubtotal,
      total: cartTotal,
      note: customer.type !== 'walk-in' ? `${customer.type} order` : undefined
    };

    setHeldOrders(prev => [newHeld, ...prev]);
    clearCart();
    setCustomer({ name: 'Walk-in Customer', phone: '', type: 'walk-in' });

    setToast({
      message: `Ticket #${ticketNumber} parked. Ready for next customer.`,
      type: 'info'
    });
  };

  // Recall Held Sale
  const handleRecallOrder = (order: HeldOrder) => {
    appExperience.triggerFeedback('success');
    clearCart();
    order.items.forEach(item => {
      addToCart(item, item.quantity);
    });
    setCustomer({
      name: order.customerName,
      phone: '',
      type: 'walk-in'
    });
    setHeldOrders(prev => prev.filter(o => o.id !== order.id));
    setIsHeldOrdersOpen(false);

    setToast({
      message: `Resumed parked Ticket #${order.ticketNumber}!`,
      type: 'success'
    });
  };

  // Discard Held Sale
  const handleDiscardOrder = (orderId: string) => {
    appExperience.triggerFeedback('pop');
    setHeldOrders(prev => prev.filter(o => o.id !== orderId));
    setToast({
      message: 'Parked order discarded.',
      type: 'warning'
    });
  };

  // Complete Sale
  const handleCompleteSale = (sale: POSSaleRecord) => {
    setCompletedSale(sale);
    setIsReceiptOpen(true);
    clearCart();
    setCustomer({ name: 'Walk-in Customer', phone: '', type: 'walk-in' });

    // Queue transaction into unified Admin 'orders' collection
    try {
      addDoc(collection(db, 'orders'), {
        orderNumber: sale.ticketNumber,
        type: 'pos',
        source: 'Uhuru Market Stall 4B (POS Till 01)',
        status: 'queued',
        customerName: sale.customerName || 'Walk-in Customer',
        customerPhone: sale.customerPhone || '',
        customerType: sale.customerType || 'Retail',
        items: sale.items,
        subtotal: sale.subtotal,
        discount: sale.discount,
        tax: sale.tax,
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        paymentRef: sale.paymentRef || null,
        paymentStatus: 'paid',
        amountTendered: sale.amountTendered,
        changeDue: sale.changeDue,
        cashier: sale.cashier,
        station: sale.station,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(err => {
        console.warn('Could not queue to orders collection:', err);
      });

      // Also preserve legacy pos_orders
      addDoc(collection(db, 'pos_orders'), {
        ...sale,
        createdAt: serverTimestamp()
      }).catch(err => {
        console.warn('Could not record to pos_orders in firestore:', err);
      });
    } catch (e) {
      // offline-resilient
    }

    setToast({
      message: `Sale #${sale.ticketNumber} completed! Receipt generated.`,
      type: 'success'
    });
  };

  // Reset for next sale from receipt modal
  const handleNewSale = () => {
    setIsReceiptOpen(false);
    setCompletedSale(null);
    clearCart();
    setCustomer({ name: 'Walk-in Customer', phone: '', type: 'walk-in' });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none antialiased text-slate-800">
      {/* 1. Restored Authentic Header Bar Design */}
      <Navbar 
        wishlistCount={wishlistCount}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
        setIsCompareModalOpen={setIsCompareModalOpen}
        setSelectedQuickViewProduct={setSelectedQuickViewProduct}
      />

      {/* 2. Main POS Workspace with safe offset for the fixed Navbar */}
      <main className="flex-1 max-w-[1780px] w-full mx-auto px-3 sm:px-4 lg:px-6 pt-20 sm:pt-28 md:pt-40 lg:pt-48 pb-24 lg:pb-8 flex flex-col">
        {/* POS Action Toolbar: Search input alone on mobile, secondary tools on md+ */}
        <POSHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenHeldOrders={() => setIsHeldOrdersOpen(true)}
          heldCount={heldOrders.length}
          onSimulateBarcodeScan={handleSimulateBarcodeScan}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          totalProductsCount={products.length}
        />

        {/* POS 2-Column Split: Left = Catalog (66%), Right = Checkout Cart (34% on lg+) */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-5 items-start">
          
          {/* Left Column: POS Category Filters & Products */}
          <section className="w-full lg:w-[58%] xl:w-[60%] 2xl:w-[63%] flex flex-col">
            {/* Category Menus, Sectors & Size Matrix: Hidden on mobile per user instruction (desktop only) */}
            <div className="hidden md:block">
              <POSCategoryTabs
                categories={categoryTabs}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                subCategories={subCategories}
                activeSubCategory={activeSubCategory}
                onSelectSubCategory={setActiveSubCategory}
                activeSizeCategory={activeSizeCategory}
                onSelectSizeCategory={setActiveSizeCategory}
                sizeCategoryCounts={sizeCategoryCounts}
                activeSector={activeSector}
                onSelectSector={setActiveSector}
                activeGender={activeGender}
                onSelectGender={setActiveGender}
                onOpenSizingGuide={() => setIsSizingGuideOpen(true)}
              />
            </div>

            {/* Products Grid / Dense List: Display all products directly */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center my-auto shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <Search size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No products matched your search</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try checking your spelling or clear search to view all Uhuru Market uniforms.
                </p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); setActiveSubCategory(null); }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#08047D] text-white text-xs font-bold hover:bg-[#050259] transition-all shadow-xs cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-2">
                {filteredProducts.map(product => (
                  <POSProductCard
                    key={product.id}
                    product={product}
                    inCartQuantity={cartQuantityMap[product.id] || 0}
                    onAddToCart={(p, variant) => {
                      addToCart({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        imageUrl: p.imageUrl,
                        category: p.category,
                        selectedVariants: variant
                      }, 1);
                    }}
                    onUpdateQuantity={(qty, variant) => {
                      updateQuantity(product.id, qty, variant);
                    }}
                    onQuickView={(p) => setSelectedQuickViewProduct(p)}
                    viewMode="list"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
                {filteredProducts.map(product => (
                  <POSProductCard
                    key={product.id}
                    product={product}
                    inCartQuantity={cartQuantityMap[product.id] || 0}
                    onAddToCart={(p, variant) => {
                      addToCart({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        imageUrl: p.imageUrl,
                        category: p.category,
                        selectedVariants: variant
                      }, 1);
                    }}
                    onUpdateQuantity={(qty, variant) => {
                      updateQuantity(product.id, qty, variant);
                    }}
                    onQuickView={(p) => setSelectedQuickViewProduct(p)}
                    viewMode="grid"
                  />
                ))}
              </div>
            )}
          </section>

          {/* Right Column: Dedicated Sticky POS Checkout Cart (Desktop only, mobile has bottom nav cart) */}
          <aside className="w-full lg:w-[42%] xl:w-[40%] 2xl:w-[37%] lg:sticky lg:top-[144px] lg:h-[calc(100vh-164px)] hidden lg:flex flex-col">
            <POSCheckoutCart
              customer={customer}
              onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
              onHoldSale={handleHoldSale}
              onOpenHeldOrders={() => setIsHeldOrdersOpen(true)}
              heldCount={heldOrders.length}
              onCompleteSale={handleCompleteSale}
            />
          </aside>
        </div>
      </main>

      {/* 3. POS Thermal Receipt Modal */}
      <POSReceiptModal
        sale={completedSale}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onNewSale={handleNewSale}
      />

      {/* 4. POS Held Orders Management Modal */}
      <POSHeldOrdersModal
        isOpen={isHeldOrdersOpen}
        onClose={() => setIsHeldOrdersOpen(false)}
        heldOrders={heldOrders}
        onRecallOrder={handleRecallOrder}
        onDiscardOrder={handleDiscardOrder}
      />

      {/* 5. POS Quick Custom Line Item Modal */}
      <POSCustomItemModal
        isOpen={isCustomItemOpen}
        onClose={() => setIsCustomItemOpen(false)}
        onAddItem={handleAddCustomItem}
      />

      {/* 6. POS Customer Assignment Modal */}
      <POSCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customer={customer}
        onSaveCustomer={(c) => setCustomer(c)}
      />

      {/* 7. Product Quick View Modal (Full screen on mobile with floating bottom add button) */}
      <AnimatePresence>
        {selectedQuickViewProduct && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 lg:p-6 overflow-hidden">
            <GoogleMerchantSchema product={selectedQuickViewProduct} currency={currentCountry.currency} />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseQuickView}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 25 }}
              className="relative w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-4xl bg-white rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row z-10 shadow-2xl border-0 md:border md:border-slate-100"
            >
              {/* Mobile Top Navigation Bar */}
              <div className="md:hidden sticky top-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
                <button 
                  type="button"
                  onClick={handleCloseQuickView}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-transform active:scale-90"
                  aria-label="Close product preview"
                >
                  <X size={18} />
                </button>
                <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-[#08047D] bg-[#08047D]/10 px-2.5 py-0.5 rounded-full truncate">
                    {selectedQuickViewProduct.category || 'Product Preview'}
                  </span>
                </div>
                <div className="text-sm font-black text-[#08047D] font-mono">
                  {formatPrice(selectedQuickViewProduct.price)}
                </div>
              </div>

              {/* Desktop Close Button */}
              <button 
                type="button"
                onClick={handleCloseQuickView}
                className="hidden md:flex absolute top-3 right-3 sm:top-4 sm:right-4 z-[60] w-9 h-9 bg-white/90 border border-slate-200 rounded-full items-center justify-center text-slate-800 hover:text-[#08047D] shadow-md transition-colors"
                aria-label="Close product preview"
              >
                <X size={18} />
              </button>

              {/* Main Scrollable Content Area for Mobile & Desktop */}
              <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col md:flex-row min-h-0 pb-24 md:pb-0">
                {/* Product Gallery Section with Zoom and Multi-Image Carousel */}
                <div className="w-full md:w-1/2 bg-slate-50 p-4 sm:p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
                  <ImageZoomViewer 
                    src={selectedQuickViewProduct.imageUrl || ''} 
                    alt={selectedQuickViewProduct.name}
                    imageUrls={selectedQuickViewProduct.imageUrls}
                    badge={selectedQuickViewProduct.badge}
                    onAddImage={() => setIsAddImageModalOpen(true)}
                    aspectRatio="aspect-square max-h-[30vh] md:max-h-[38vh] max-w-[280px] sm:max-w-[320px] mx-auto"
                  />
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddImageModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-[#FA9411]/50 hover:border-[#FA9411] text-[#08047D] hover:bg-amber-50 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Plus size={13} className="text-[#FA9411]" />
                      <span>+ Add More Images</span>
                    </button>
                    <span className="text-slate-300">•</span>
                    <div className="text-slate-400 text-[10px] font-bold">
                      Ref #{selectedQuickViewProduct.id?.slice(0, 8).toUpperCase()}
                    </div>
                  </div>
                  <AddProductImageModal
                    isOpen={isAddImageModalOpen}
                    onClose={() => setIsAddImageModalOpen(false)}
                    product={selectedQuickViewProduct}
                    onImagesUpdated={(newUrls, primary) => {
                      // Handle update
                      setIsAddImageModalOpen(false);
                    }}
                  />
                </div>

                {/* Product Details Section */}
                <div className="w-full md:w-1/2 p-5 sm:p-7 flex flex-col justify-between overflow-y-visible md:overflow-y-auto">
                  <div className="space-y-3.5">
                    <div className="hidden md:flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-md bg-[#08047D]/10 text-[#08047D] text-[10px] font-black uppercase tracking-wider">
                        {selectedQuickViewProduct.category}
                      </span>
                      {selectedQuickViewProduct.sizeCategory && (
                        <span className="px-2 py-0.5 rounded-md bg-[#FA9411]/15 text-[#FA9411] text-[10px] font-black uppercase">
                          Size: {selectedQuickViewProduct.sizeCategory.toUpperCase()} ({selectedQuickViewProduct.typicalSizes || 'Standard'})
                        </span>
                      )}
                      {selectedQuickViewProduct.gender && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {selectedQuickViewProduct.gender}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      {selectedQuickViewProduct.name}
                    </h3>

                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-black text-[#08047D]">
                        {formatPrice(selectedQuickViewProduct.price)}
                      </div>
                      {selectedQuickViewProduct.marketHighKES && (
                        <span className="text-xs text-slate-400 line-through">
                          Market: {formatPrice(selectedQuickViewProduct.marketHighKES)}
                        </span>
                      )}
                    </div>

                    {/* Kenya Market Intelligence Benchmark */}
                    {selectedQuickViewProduct.marketLowKES && selectedQuickViewProduct.marketHighKES && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs space-y-1.5">
                        <div className="font-bold text-amber-950 flex items-center justify-between">
                          <span>Uhuru Market Direct Benchmark:</span>
                          <span className="text-[#08047D] font-mono text-[11px] font-black">
                            KES {selectedQuickViewProduct.marketLowKES} - {selectedQuickViewProduct.marketHighKES}
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-900 flex items-center justify-between">
                          <span>Suggested Wholesale (10+ pcs):</span>
                          <strong className="text-emerald-700">KES {selectedQuickViewProduct.suggestedWholesaleKES || selectedQuickViewProduct.price}</strong>
                        </div>
                        {selectedQuickViewProduct.skuPrefix && (
                          <div className="text-[10px] text-slate-500 font-mono pt-0.5">
                            SKU Prefix: {selectedQuickViewProduct.skuPrefix} · Min Reorder: {selectedQuickViewProduct.reorderLevel || 10} units
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedQuickViewProduct.description || "Tailored institutional garment engineered for durability, colorfastness, and comfort under high daily usage."}
                    </p>

                    {/* Size breakdown selection */}
                    {selectedQuickViewProduct.sizeBreakdown && selectedQuickViewProduct.sizeBreakdown.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Select Size ({selectedQuickViewProduct.typicalSizes || 'All Sizes'}):
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsSizingGuideOpen(true)}
                            className="text-[10.5px] font-bold text-[#08047D] hover:underline"
                          >
                            Size Matrix Guide
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedQuickViewProduct.sizeBreakdown.map((sz: string, idx: number) => {
                            const isPicked = (selectedVariants['Size'] || selectedQuickViewProduct.sizeBreakdown[0]) === sz;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedVariants(prev => ({ ...prev, Size: sz }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  isPicked
                                    ? 'bg-[#08047D] text-white border-[#08047D] shadow-sm'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedQuickViewProduct.notes && (
                      <div className="text-[10px] text-slate-400 italic">
                        Note: {selectedQuickViewProduct.notes}
                      </div>
                    )}
                  </div>

                  {/* Desktop Add to ticket action button row */}
                  <div className="hidden md:flex pt-6 border-t border-slate-100 mt-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        appExperience.triggerFeedback('cart_add');
                        const chosenSize = selectedVariants['Size'] || (selectedQuickViewProduct.sizeBreakdown ? selectedQuickViewProduct.sizeBreakdown[0] : 'Standard');
                        addToCart({
                          id: selectedQuickViewProduct.id,
                          name: selectedQuickViewProduct.name,
                          price: selectedQuickViewProduct.price,
                          imageUrl: selectedQuickViewProduct.imageUrl,
                          category: selectedQuickViewProduct.category,
                          selectedVariants: { Size: chosenSize }
                        }, 1);
                        handleCloseQuickView();
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#08047D] hover:bg-[#050259] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Plus size={16} />
                      <span>Add to POS Ticket</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseQuickView}
                      className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Floating Bottom Action Bar with Add Button */}
              <div className="md:hidden fixed bottom-0 inset-x-0 p-3.5 pb-safe bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] z-50 flex items-center gap-3">
                <div className="flex flex-col min-w-[85px] shrink-0">
                  <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">Price</span>
                  <span className="text-lg font-black text-[#08047D] font-mono leading-tight">
                    {formatPrice(selectedQuickViewProduct.price)}
                  </span>
                  {selectedVariants['Size'] && (
                    <span className="text-[9px] text-[#FA9411] font-black truncate">
                      Size: {selectedVariants['Size']}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    appExperience.triggerFeedback('cart_add');
                    const chosenSize = selectedVariants['Size'] || (selectedQuickViewProduct.sizeBreakdown ? selectedQuickViewProduct.sizeBreakdown[0] : 'Standard');
                    addToCart({
                      id: selectedQuickViewProduct.id,
                      name: selectedQuickViewProduct.name,
                      price: selectedQuickViewProduct.price,
                      imageUrl: selectedQuickViewProduct.imageUrl,
                      category: selectedQuickViewProduct.category,
                      selectedVariants: { Size: chosenSize }
                    }, 1);
                    handleCloseQuickView();
                  }}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#08047D] to-[#04024E] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/25 active:scale-95 transition-all"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  <span>Add to Ticket</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <KenyaSizingMatrixModal
        isOpen={isSizingGuideOpen}
        onClose={() => setIsSizingGuideOpen(false)}
        onSelectCategory={(catId) => setActiveSizeCategory(catId)}
      />

      {/* Add & Manage Product Images Modal */}
      <AddProductImageModal
        isOpen={isAddImageModalOpen}
        onClose={() => setIsAddImageModalOpen(false)}
        product={selectedQuickViewProduct}
        onImagesUpdated={(newUrls, primaryUrl) => {
          setSelectedQuickViewProduct((prev: any) => prev ? { ...prev, imageUrls: newUrls, imageUrl: primaryUrl } : null);
          setProducts(prev => prev.map(p => p.id === selectedQuickViewProduct?.id ? { ...p, imageUrls: newUrls, imageUrl: primaryUrl } : p));
        }}
      />
    </div>
  );
}
