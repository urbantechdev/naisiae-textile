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
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ImageZoomViewer } from '../components/ImageZoomViewer';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, doc, setDoc, increment } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import { useLocalization } from '../context/LocalizationContext';
import { appExperience } from '../utils/haptics';
import { GoogleMerchantSchema } from '../components/GoogleMerchantSchema';

// POS Components
import { POSHeader } from '../components/pos/POSHeader';
import { POSMobileAppHeader } from '../components/pos/POSMobileAppHeader';
import { MobileAppDock } from '../components/pos/MobileAppDock';
import { MobileCartFloatingBar } from '../components/pos/MobileCartFloatingBar';
import { MobileAppDrawer } from '../components/pos/MobileAppDrawer';
import { MobileInstallPrompt } from '../components/MobileInstallPrompt';
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

  // Mobile View Switcher (between catalog and cart on screens < 1024px)
  const [mobileView, setMobileView] = useState<'catalog' | 'cart'>('catalog');

  // POS Catalog states
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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

  // Compute Categories with Item Counts
  const categoryTabs = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const list = [
      { id: 'all', name: 'All Products', count: products.length }
    ];

    if (categories.length > 0) {
      categories.forEach(c => {
        const title = c.title || c.name;
        list.push({
          id: title,
          name: title,
          count: counts[title] || 0
        });
      });
    } else {
      Object.keys(counts).forEach(cat => {
        list.push({
          id: cat,
          name: cat,
          count: counts[cat]
        });
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
          .filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase())
          .map(p => p.subCategory)
          .filter(Boolean)
      )
    );
  }, [products, activeCategory]);

  // Filtered Products for POS Display with Size Categories, Sectors, and Gender
  const filteredProducts = useMemo(() => {
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
        p.category?.toLowerCase() === activeCategory.toLowerCase();

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
      {/* 1. Desktop Navbar (hidden on mobile) */}
      <div className="hidden lg:block">
        <Navbar 
          wishlistCount={wishlistCount}
          setIsWishlistOpen={setIsWishlistOpen}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          setIsQuoteModalOpen={setIsQuoteModalOpen}
          setIsCompareModalOpen={setIsCompareModalOpen}
          setSelectedQuickViewProduct={setSelectedQuickViewProduct}
        />
      </div>

      {/* 2. Dedicated Native Mobile App Header (< lg screens) */}
      <POSMobileAppHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSimulateBarcodeScan={handleSimulateBarcodeScan}
        onOpenCustomItem={() => setIsCustomItemOpen(true)}
        onOpenHeldOrders={() => setIsHeldOrdersOpen(true)}
        heldCount={heldOrders.length}
        customer={customer}
        onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
        totalProductsCount={products.length}
      />

      {/* 3. Main POS Workspace with responsive safe offset */}
      <main className="flex-1 max-w-[1780px] w-full mx-auto px-2.5 sm:px-4 lg:px-6 pt-24 sm:pt-28 lg:pt-52 pb-safe-dock lg:pb-8 flex flex-col">
        {/* Desktop POS Action Toolbar */}
        <div className="hidden lg:block">
          <POSHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenCustomItem={() => setIsCustomItemOpen(true)}
            onOpenHeldOrders={() => setIsHeldOrdersOpen(true)}
            heldCount={heldOrders.length}
            onSimulateBarcodeScan={handleSimulateBarcodeScan}
            viewMode={viewMode}
            onToggleViewMode={setViewMode}
            totalProductsCount={products.length}
          />
        </div>

        {/* Mobile View: Back to catalog bar if viewing cart */}
        {mobileView === 'cart' && (
          <div className="lg:hidden mb-3 bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                appExperience.triggerFeedback('tap');
                setMobileView('catalog');
              }}
              className="flex items-center gap-1.5 text-xs font-black text-[#08047D] hover:underline"
            >
              <ArrowRight size={14} className="rotate-180 text-[#FA9411]" />
              <span>Back to Uniform Catalog</span>
            </button>
            <span className="text-[11px] font-black uppercase text-slate-500">
              Active Ticket ({cart.length})
            </span>
          </div>
        )}

        {/* POS 2-Column Split: Left = Catalog (66%), Right = Checkout Cart (34%) */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-5 items-start">
          
          {/* Left Column: POS Category Filters & Products */}
          <section className={`w-full lg:w-[58%] xl:w-[60%] 2xl:w-[63%] flex flex-col ${
            mobileView === 'cart' ? 'hidden lg:flex' : 'flex'
          }`}>
            {/* Fast Category Pills & Subcategories */}
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

            {/* Products Grid / Dense List */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-12 text-center my-auto shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <Search size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No products matched your search</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try checking your spelling or clear filters to view all Uhuru Market uniforms.
                </p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); setActiveSubCategory(null); }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#08047D] text-white text-xs font-bold hover:bg-[#050259] transition-all shadow-xs"
                >
                  Reset Catalog Filters
                </button>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-2">
                {(isCatalogExpanded ? filteredProducts : filteredProducts.slice(0, 12)).map(product => (
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
                {(isCatalogExpanded ? filteredProducts : filteredProducts.slice(0, 12)).map(product => (
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

            {filteredProducts.length > 12 && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    appExperience.triggerFeedback('tap');
                    setIsCatalogExpanded(!isCatalogExpanded);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>{isCatalogExpanded ? 'Collapse Rows (Show Less)' : `Show More Products (${filteredProducts.length - 12} more)`}</span>
                </button>
              </div>
            )}
          </section>

          {/* Right Column: Dedicated Sticky POS Checkout Cart */}
          <aside className={`w-full lg:w-[42%] xl:w-[40%] 2xl:w-[37%] lg:sticky lg:top-[144px] lg:h-[calc(100vh-164px)] flex flex-col ${
            mobileView === 'catalog' ? 'hidden lg:flex' : 'flex'
          }`}>
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

      {/* 7. Product Quick View Modal (For deep inspection / embroidery preview) */}
      <AnimatePresence>
        {selectedQuickViewProduct && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-hidden">
            <GoogleMerchantSchema product={selectedQuickViewProduct} currency={currentCountry.currency} />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseQuickView}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] z-10 shadow-2xl border border-slate-100"
            >
              {/* Close Button */}
              <button 
                onClick={handleCloseQuickView}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[60] w-9 h-9 bg-white/90 border border-slate-200 rounded-full flex items-center justify-center text-slate-800 hover:text-[#08047D] shadow-md"
              >
                <X size={18} />
              </button>

              {/* Product Gallery Section */}
              <div className="w-full md:w-1/2 bg-slate-50 p-4 sm:p-6 flex items-center justify-center border-r border-slate-100">
                <div className="w-full max-w-[320px] aspect-square rounded-2xl bg-white p-2 border border-slate-200 shadow-inner flex items-center justify-center overflow-hidden">
                  {selectedQuickViewProduct.imageUrl ? (
                    <img 
                      src={selectedQuickViewProduct.imageUrl} 
                      alt={selectedQuickViewProduct.name}
                      className="w-full h-full object-cover object-top rounded-xl"
                    />
                  ) : (
                    <ShoppingBag size={48} className="text-slate-300" />
                  )}
                </div>
              </div>

              {/* Product Details Section */}
              <div className="w-full md:w-1/2 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
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

                  <h3 className="text-xl font-black text-slate-900 leading-tight">
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
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs space-y-1">
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
                      <div className="flex items-center justify-between mb-1">
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
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                isPicked
                                  ? 'bg-[#08047D] text-white border-[#08047D]'
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

                {/* Add to ticket action */}
                <div className="pt-6 border-t border-slate-100 mt-4 flex gap-2">
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
                    className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Kenya Uniform Sizing & Measurement Guide Modal */}
      <KenyaSizingMatrixModal
        isOpen={isSizingGuideOpen}
        onClose={() => setIsSizingGuideOpen(false)}
        onSelectCategory={(catId) => setActiveSizeCategory(catId)}
      />

      {/* 9. Floating Mobile Cart Summary Bar (When in catalog on mobile) */}
      <MobileCartFloatingBar
        isVisible={mobileView === 'catalog'}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => {
          appExperience.triggerFeedback('tap');
          setMobileView('cart');
        }}
      />

      {/* 10. Native Mobile Bottom Navigation Dock */}
      <MobileAppDock
        activeView={mobileView}
        onSwitchView={setMobileView}
        cartCount={cartCount}
        cartTotal={cartTotal}
        heldCount={heldOrders.length}
        onOpenAppDrawer={() => setIsMobileDrawerOpen(true)}
        onOpenHeldOrders={() => setIsHeldOrdersOpen(true)}
        onTriggerScan={handleSimulateBarcodeScan}
      />

      {/* 11. Native Mobile App Drawer (Sheet) */}
      <MobileAppDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onOpenSizingGuide={() => setIsSizingGuideOpen(true)}
      />

      {/* 12. PWA Mobile App Installation Prompt */}
      <MobileInstallPrompt />
    </div>
  );
}
