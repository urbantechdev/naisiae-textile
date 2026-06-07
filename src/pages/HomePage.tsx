import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Heart, 
  Menu, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight, 
  X, 
  User as UserIcon, 
  ShieldCheck,
  Home,
  MessageSquare,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Megaphone,
  Calendar,
  Share2,
  ExternalLink,
  GitCompare,
  Star,
  Package,
  Scissors,
  ChevronDown,
  ArrowRight,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Hero } from '../components/home/Hero';
import { Specialties } from '../components/home/Specialties';
import { WholesaleDeals } from '../components/home/WholesaleDeals';
import { CatalogSection } from '../components/home/CatalogSection';
import { InstitutionalWholesale } from '../components/home/InstitutionalWholesale';
import { ProductScrollNavigator } from '../components/ProductScrollNavigator';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { useCart } from '../context/CartContext';

export default function HomePage() {
  const { 
    cart, 
    addToCart, 
    isCartOpen, 
    setIsCartOpen, 
    isWishlistOpen,
    setIsWishlistOpen,
    wishlist, 
    toggleWishlist: toggleWishlistGlobal, 
    isInWishlist,
    clearCart,
    cartTotal,
    isQuoteModalOpen,
    setIsQuoteModalOpen,
    siteSettings,
    promotions,
    setToast
  } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [showAllWholesale, setShowAllWholesale] = useState(false);
  const [showAllFeatured, setShowAllFeatured] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const subParam = params.get('sub');
    const actionParam = params.get('action');
    
    if (tabParam) {
      setActiveTab(tabParam);
      if (subParam) {
        setActiveSubCategory(subParam);
      } else {
        setActiveSubCategory(null);
      }
      setTimeout(() => {
        const shopEl = document.getElementById('shop');
        if (shopEl) {
          shopEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }

    if (actionParam) {
      if (actionParam === 'cart') setIsCartOpen(true);
      if (actionParam === 'wishlist') setIsWishlistOpen(true);
      if (actionParam === 'compare') setIsCompareModalOpen(true);
      if (actionParam === 'menu') setIsMenuOpen(true);
      
      // Clean up the URL
      window.history.replaceState({}, '', '/');
    }
  }, [location.search]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [activeModalPromo, setActiveModalPromo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [shuffledProducts, setShuffledProducts] = useState<any[]>([]);

  useEffect(() => {
    if (products.length > 0) {
      setShuffledProducts([...products]);
    }
  }, [products]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShuffledProducts(prevProducts => {
        if (prevProducts.length <= 1) return prevProducts;
        const arr = [...prevProducts];
        // Fisher-Yates shuffle algorithm
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      });
    }, 7000);
    return () => clearInterval(interval);
  }, []);
  const [categories, setCategories] = useState<any[]>([]);
  const [megaMenus, setMegaMenus] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const lower = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.category.toLowerCase().includes(lower) ||
      p.tags?.some((t: string) => t.toLowerCase().includes(lower))
    ).slice(0, 8);
  }, [searchQuery, products]);

  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [compareList, setCompareList] = useState<any[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [discountRules, setDiscountRules] = useState<any[]>([]);
  const lastWishlistRef = useRef<string>('');

  const handleShareProduct = async (product: any) => {
    const shareUrl = `${window.location.host === 'localhost:3000' ? 'http://localhost:3000' : 'https://' + window.location.host}/product/${product.id}`;
    const shareData = {
      title: `${product.name} | Uhuru Market Uniforms`,
      text: `Check out ${product.name} - ${product.description || 'Quality textile solutions from Uhuru Market, Nairobi.'}\nPrice: ${product.price?.toLocaleString()}/-`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setToast({ message: 'Product link copied to clipboard!', type: 'success' });
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const toggleCompare = (product: any) => {
    if (compareList.find(p => p.id === product.id)) {
      setCompareList(prev => prev.filter(p => p.id !== product.id));
    } else {
      if (compareList.length >= 4) {
        setToast({ message: "You can compare up to 4 products at a time.", type: 'warning' });
        return;
      }
      setCompareList(prev => [...prev, product]);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return;
    
    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: selectedQuickViewProduct.id,
        productName: selectedQuickViewProduct.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        userName: reviewForm.userName || 'Anonymous',
        userId: auth.currentUser?.uid || null,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setReviewForm({ rating: 5, comment: '', userName: '' });
      setReviewSubmitted(true);
      setTimeout(() => setReviewSubmitted(false), 5000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    } finally {
      setIsSubmittingReview(false);
    }
  };
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<any>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activeThumbnailIndex, setActiveThumbnailIndex] = useState(0);

  const [brandingType, setBrandingType] = useState('None'); // None, Embroidery, Screen Print, Sublimation
  const [brandingPosition, setBrandingPosition] = useState('Left Chest'); // Left Chest, Right Chest, Center Chest, Full Back, Sleeve
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [customLogoName, setCustomLogoName] = useState('');

  useEffect(() => {
    if (selectedQuickViewProduct) {
      // Reset selected variants when product changes
      const initialVariants: Record<string, string> = {};
      const variantsByType = selectedQuickViewProduct.variants?.reduce((acc: any, v: any) => {
        if (!acc[v.type]) acc[v.type] = [];
        acc[v.type].push(v);
        return acc;
      }, {}) || {};
      
      Object.keys(variantsByType).forEach(type => {
        initialVariants[type] = variantsByType[type][0].value;
      });
      setSelectedVariants(initialVariants);
      setInquiryUnits(selectedQuickViewProduct.priceType === 'wholesale' ? 50 : 1);
      setInquiryCustomization('');
      setActiveThumbnailIndex(0);
      
      // Reset branding options
      setBrandingType('None');
      setBrandingPosition('Left Chest');
      setCustomLogoUrl('');
      setCustomLogoName('');
    }
  }, [selectedQuickViewProduct]);

  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', userName: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [inquiryUnits, setInquiryUnits] = useState(50);
  const [inquiryCustomization, setInquiryCustomization] = useState('');

  useEffect(() => {
    if (selectedQuickViewProduct) {
      // Track product view analytic
      const trackProductView = async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          await addDoc(collection(db, 'analytics'), {
            type: 'view',
            productId: selectedQuickViewProduct.id,
            productName: selectedQuickViewProduct.name,
            category: selectedQuickViewProduct.category,
            userId: auth.currentUser?.uid || null,
            date: today,
            createdAt: serverTimestamp()
          });
        } catch (e) {
          console.error("Product analytic tracking failed:", e);
        }
      };
      trackProductView();
    }
  }, [selectedQuickViewProduct]);

  useEffect(() => {
    if (!selectedQuickViewProduct) {
      setProductReviews([]);
      return;
    }

    const q = query(
      collection(db, 'reviews'), 
      where('productId', '==', selectedQuickViewProduct.id),
      where('status', '==', 'approved')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sortedReviews = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProductReviews(sortedReviews);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `reviews_for_${selectedQuickViewProduct.id}`);
    });

    return () => unsubscribe();
  }, [selectedQuickViewProduct]);

  useEffect(() => {
    // Simplified query to avoid index requirements for combined where/orderBy
    const q = query(collection(db, 'products'), where('active', '==', true), limit(500));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory to avoid index requirements
      setProducts(items.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    // Fetch Categories
    const qCats = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
    const unsubscribeCats = onSnapshot(qCats, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    // Fetch Discount Rules
    const qDiscountRules = query(collection(db, 'discountRules'), where('active', '==', true));
    const unsubscribeDiscountRules = onSnapshot(qDiscountRules, (snapshot) => {
      setDiscountRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'discountRules');
    });

    // Fetch Mega Menus
    const unsubscribeMegaMenus = onSnapshot(collection(db, 'mega_menus'), (snapshot) => {
      setMegaMenus(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'mega_menus');
    });

    // Record Analytics View
    const recordView = async () => {
      const today = new Date().toISOString().split('T')[0];
      const viewRef = doc(db, 'analytics', today);
      try {
        await setDoc(viewRef, { 
          views: increment(1),
          date: today,
          updatedAt: serverTimestamp() 
        }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `analytics/${today}`);
      }
    };
    
    // Only record once per browser session per day
    if (!sessionStorage.getItem('nt_view_recorded')) {
      recordView();
      sessionStorage.setItem('nt_view_recorded', 'true');
    }

    return () => {
      unsubscribe();
      unsubscribeCats();
      unsubscribeDiscountRules();
      unsubscribeMegaMenus();
    };
  }, []);

  const displayProducts = useMemo(() => {
    const dataSource = shuffledProducts.length > 0 ? shuffledProducts : products;
    return dataSource.filter(p => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchLower) || 
        p.category.toLowerCase().includes(searchLower) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(searchLower));
        
      const matchesTag = !activeTag || p.tags?.includes(activeTag);
      const matchesTab = activeTab === 'all' || p.category.toLowerCase() === activeTab.toLowerCase();
      const matchesSubCategory = !activeSubCategory || p.subCategory === activeSubCategory;
      
      return matchesSearch && matchesTag && matchesTab && matchesSubCategory;
    });
  }, [products, shuffledProducts, searchQuery, activeTag, activeTab, activeSubCategory]);

  useEffect(() => {
    setShowSearchSuggestions(searchQuery.trim().length > 1);
  }, [searchQuery]);

  const allTags = useMemo(() => 
    Array.from(new Set(products.flatMap(p => p.tags || []))).slice(0, 10)
  , [products]);

  const uniformSubCategories = useMemo(() => 
    Array.from(new Set(products.filter(p => p.category === 'School Uniforms' && p.subCategory).map(p => p.subCategory))).sort()
  , [products]);

  useEffect(() => {
    const heroCount = siteSettings?.heroImages?.length || 1;
    if (heroCount > 1) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % heroCount);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [siteSettings]);

  useEffect(() => {
    localStorage.setItem('nt_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (siteSettings) {
      const siteName = siteSettings.siteName || 'Uhuru Market Uniforms';
      const tagline = siteSettings.siteTagline || 'Naisiae Textiles Nairobi';
      const description = siteSettings.sharingDescription || 'Official Uhuru Market Uniforms by Naisiae Textiles. Premium school uniforms, corporate wear & institutional branding in Nairobi. Buy direct & save.';
      const sharingImage = siteSettings.sharingImage || siteSettings.siteLogo || 'https://i.pinimg.com/736x/9e/53/87/9e53875a7be529b36555f7cdb2f56c92.jpg';

      document.title = `${siteName} | ${tagline}`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }

      // Update OG tags
      const updateMeta = (selector: string, attr: string, value: string) => {
        const el = document.querySelector(selector);
        if (el) el.setAttribute(attr, value);
      };

      updateMeta('meta[property="og:title"]', 'content', `${siteName} | ${tagline}`);
      updateMeta('meta[property="og:description"]', 'content', description);
      updateMeta('meta[property="og:image"]', 'content', sharingImage);
      updateMeta('meta[property="twitter:title"]', 'content', `${siteName} | ${tagline}`);
      updateMeta('meta[property="twitter:description"]', 'content', description);
      updateMeta('meta[property="twitter:image"]', 'content', sharingImage);

      if (siteSettings.favicon) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = siteSettings.favicon;
      }
    }
  }, [siteSettings]);

  useEffect(() => {
    const modalPromo = promotions.find(p => p.type === 'modal');
    if (modalPromo && !sessionStorage.getItem(`promo_${modalPromo.id}`)) {
      setActiveModalPromo(modalPromo);
      setTimeout(() => setShowPromoModal(true), 1500); // Trigger after 1.5s
    }
  }, [promotions]);

  const toggleWishlist = (product: any) => {
    toggleWishlistGlobal(product);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const activeDiscount = discountRules
    .filter(rule => rule.active)
    .find(rule => {
      if (rule.type === 'quantity') return totalItems >= rule.threshold;
      if (rule.type === 'order_value') return subtotal >= rule.threshold;
      return false;
    });
  const discountAmount = activeDiscount ? Math.round(subtotal * (activeDiscount.discountPercentage / 100)) : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const quoteData = {
      name: auth.currentUser?.displayName || 'Guest User',
      email: auth.currentUser?.email || 'guest@example.com',
      phone: '+254...', // In real app, prompt for this
      service: 'Wholesale Order',
      items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
      total: cartTotal,
      status: 'new',
      uid: auth.currentUser?.uid || 'guest',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'quotes'), quoteData);
      setOrderSuccess(true);
      clearCart();
      setTimeout(() => {
        setOrderSuccess(false);
        setIsCartOpen(false);
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'quotes');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#0A1628]">
      {/* Screen Reader and Crawler SEO Identifier */}
      <h1 className="sr-only">Naisiae Textiles is the Premier Manufacturer of Uhuru Market Uniforms, School Uniforms & Corporate Branding Apparel in Nairobi, Kenya</h1>
      {/* Top Promotion Bar & Navbar */}
      <Navbar 
        wishlistCount={wishlist.length}
        compareCount={compareList.length}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsCompareModalOpen={setIsCompareModalOpen}
        setSelectedQuickViewProduct={setSelectedQuickViewProduct}
      />

      {/* High-End Cinematic Hero Slider Section */}
      <div id="intro">
        <Hero 
          siteSettings={siteSettings}
          currentSlide={currentSlide}
          setCurrentSlide={setCurrentSlide}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showSearchSuggestions={showSearchSuggestions}
          setShowSearchSuggestions={setShowSearchSuggestions}
          searchResults={searchResults}
          setSelectedQuickViewProduct={setSelectedQuickViewProduct}
          setIsQuoteModalOpen={setIsQuoteModalOpen}
          products={products}
        />
      </div>

      <div id="specialties">
        <Specialties 
          categories={categories}
          setActiveTab={setActiveTab}
        />
      </div>

      <div id="wholesale">
        <WholesaleDeals 
          products={shuffledProducts.length > 0 ? shuffledProducts : products}
          showAllWholesale={showAllWholesale}
          setShowAllWholesale={setShowAllWholesale}
          setSelectedQuickViewProduct={setSelectedQuickViewProduct}
        />
      </div>

      <div id="catalog">
        <CatalogSection 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeTag={activeTag}
          setActiveTag={setActiveTag}
          activeSubCategory={activeSubCategory}
          setActiveSubCategory={setActiveSubCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          allTags={allTags}
          uniformSubCategories={uniformSubCategories}
          displayProducts={displayProducts}
          showAllFeatured={showAllFeatured}
          setShowAllFeatured={setShowAllFeatured}
          setSelectedQuickViewProduct={setSelectedQuickViewProduct}
          toggleWishlist={toggleWishlist}
          addToCart={addToCart}
          wishlist={wishlist}
        />
      </div>

      <div id="institutional">
        <InstitutionalWholesale 
          setIsQuoteModalOpen={setIsQuoteModalOpen}
        />
      </div>

      <ProductScrollNavigator 
        sections={[
          { id: 'intro', label: 'Welcome Portal' },
          { id: 'specialties', label: 'Aesthetic Sectors' },
          { id: 'wholesale', label: 'Wholesale Tenders' },
          { id: 'catalog', label: 'Apparel Catalog' },
          { id: 'institutional', label: 'Industrial Sourcing' }
        ]}
      />

      <Footer />

      {/* Comparison Drawer */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4"
          >
            <div className="bg-[#0A1628] rounded-3xl p-4 shadow-2xl border border-white/10 flex items-center justify-between gap-6 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#C8961A] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#C8961A]/20">
                  <GitCompare size={24} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm leading-tight">Comparison Tray</h4>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{compareList.length} of 4 items selected</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {compareList.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="relative group/compare-item flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} className="w-12 h-12 rounded-xl object-cover object-top bg-white border-2 border-white/10" alt={item.name} />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/10 border-2 border-white/5 flex items-center justify-center">
                        <Package size={16} className="text-white/20" />
                      </div>
                    )}
                    <button 
                      onClick={() => toggleCompare(item)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center scale-0 group-hover/compare-item:scale-100 transition-transform"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsCompareModalOpen(true)}
                  className="bg-white text-[#0A1628] px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#C8961A] hover:text-white transition-all shadow-xl active:scale-95"
                >
                  Compare Now
                </button>
                <button onClick={() => setCompareList([])} className="text-white/20 hover:text-red-500 transition-colors p-2">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Comparison Bar */}
      <AnimatePresence>
        {compareList.length > 0 && !isCompareModalOpen && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[110] bg-[#0A1628] text-white px-6 py-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-8 backdrop-blur-xl w-[95%] sm:w-auto"
          >
            <div className="flex items-center gap-4">
              <div className="flex -space-x-4">
                {compareList.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="w-10 h-10 rounded-full border-2 border-[#0A1628] overflow-hidden bg-white shadow-lg flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} className="w-full h-full object-cover object-top p-0.5 bg-white" alt={item.name} />
                    ) : (
                      <Package size={14} className="text-[#0A1628]/20" />
                    )}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[2px] leading-tight text-[#C8961A]">{compareList.length} Products</p>
                <p className="text-[11px] font-bold text-white/60">Selected for comparison</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCompareList([])}
                className="text-[10px] font-bold text-white/40 hover:text-red-400 p-2 uppercase tracking-widest transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={() => setIsCompareModalOpen(true)}
                className="bg-[#C8961A] hover:bg-white hover:text-[#0A1628] text-[#0A1628] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-2 shadow-xl shadow-[#C8961A]/20 active:scale-95"
              >
                Compare Now <GitCompare size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Modal */}
      <AnimatePresence>
        {isCompareModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 lg:p-12 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCompareModalOpen(false)}
              className="absolute inset-0 bg-[#0A1628]/95 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-7xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 lg:p-12 border-b flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 text-[#C8961A] text-[9px] lg:text-[10px] font-black tracking-[4px] uppercase mb-2">
                    <GitCompare size={14} className="lg:w-4 lg:h-4" /> Technical Analysis
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl text-[#0A1628] tracking-tight leading-none">Side-by-Side Comparison</h2>
                </div>
                <button 
                  onClick={() => setIsCompareModalOpen(false)}
                  className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-800 hover:text-red-500 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} className="lg:w-6 lg:h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-x-auto p-8 lg:p-12">
                <div className="min-w-[1000px] grid grid-cols-[200px_repeat(4,1fr)] gap-8">
                  {/* Row: Main Header */}
                  <div className="flex flex-col justify-end pb-12">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[3px]">Specifications</p>
                  </div>
                  {compareList.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="text-center">
                      <div className="aspect-square rounded-3xl bg-slate-50 border border-slate-100 p-6 mb-6 overflow-hidden flex items-center justify-center shadow-inner">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} className="w-full h-full object-cover object-top" alt={item.name} />
                        ) : (
                          <Package size={48} className="text-slate-200" />
                        )}
                      </div>
                      <h4 className="font-bold text-lg text-[#0A1628] mb-2 leading-tight px-2">{item.name}</h4>
                      <div className="text-[10px] font-black text-[#C8961A] uppercase tracking-widest mb-4">{item.category}</div>
                    </div>
                  ))}

                  {/* Row: Sub-Category */}
                  <div className="py-8 border-t border-slate-100 flex items-center text-[10px] font-black text-[#64748B] uppercase tracking-widest">
                    Sub-Category
                  </div>
                  {compareList.map((item, idx) => (
                    <div key={`${item.id}-sub-${idx}`} className="py-8 border-t border-slate-100 text-center font-bold text-xs text-slate-600">
                      {item.subCategory || "-"}
                    </div>
                  ))}

                  {/* Row: Price */}
                  <div className="py-8 border-t border-slate-100 flex items-center text-[10px] font-black text-[#64748B] uppercase tracking-widest">
                    Unit Price
                  </div>
                  {compareList.map((item, idx) => (
                    <div key={`${item.id}-price-${idx}`} className="py-8 border-t border-slate-100 text-center font-black text-2xl text-[#C8102E]">
                      {item.price.toLocaleString()}/-
                    </div>
                  ))}

                  {/* Row: Variants */}
                  <div className="py-8 border-t border-slate-100 flex items-center text-[10px] font-black text-[#64748B] uppercase tracking-widest">
                    Available Sizes/Colors
                  </div>
                  {compareList.map((item, idx) => (
                    <div key={`${item.id}-variants-${idx}`} className="py-8 border-t border-slate-100 text-center">
                      <div className="flex flex-wrap justify-center gap-2 px-4">
                        {item.variants?.length > 0 ? (
                          item.variants.slice(0, 5).map((v: any, vIdx: number) => (
                            <span key={`${v.id}-${vIdx}`} className="px-2 py-1 bg-slate-100 text-[9px] font-bold text-slate-500 rounded border border-slate-200">
                              {v.value}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">One-size / Standard</span>
                        )}
                        {item.variants?.length > 5 && <span className="text-[9px] font-bold text-slate-300">+{item.variants.length - 5} more</span>}
                      </div>
                    </div>
                  ))}

                  {/* Row: Description */}
                  <div className="py-8 border-t border-slate-100 flex items-center text-[10px] font-black text-[#64748B] uppercase tracking-widest leading-relaxed pr-8">
                    Product Description
                  </div>
                  {compareList.map((item, idx) => (
                    <div key={`${item.id}-desc-${idx}`} className="py-8 border-t border-slate-100 text-center">
                      <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto px-2">
                        {item.description || "School Uniforms engineered textile with institutional-grade durability."}
                      </p>
                    </div>
                  ))}

                  {/* Row: Action */}
                  <div className="pt-12"></div>
                  {compareList.map((item, idx) => (
                    <div key={`${item.id}-action-${idx}`} className="pt-12 text-center">
                      <button 
                        onClick={() => { addToCart(item); setIsCompareModalOpen(false); }}
                        className="w-full max-w-[180px] bg-[#0A1628] hover:bg-[#C8102E] text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[2px] transition-all"
                      >
                        Add to Cart
                      </button>
                      <button 
                        onClick={() => toggleCompare(item)}
                        className="mt-4 text-[9px] font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest"
                      >
                        Remove from tray
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Quick View Modal */}
      <AnimatePresence>
        {selectedQuickViewProduct && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedQuickViewProduct(null)}
              className="absolute inset-0 bg-[#0A1628]/95 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl bg-white rounded-3xl lg:rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row h-auto max-h-[90vh] lg:max-h-[85vh] z-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-[#8B3DFF]/15"
            >
              {/* Canva Signature Top Gradient Stripe */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#00C4CC] via-[#7D2AE8] to-[#FF4F5A] z-40" />

              <button 
                onClick={() => setSelectedQuickViewProduct(null)}
                className="absolute top-5 right-5 lg:top-8 lg:right-8 z-50 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-800 hover:text-[#FF4F5A] transition-all shadow-xl hover:scale-110 border border-slate-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              {/* Product Gallery Section */}
              <div className="w-full lg:w-1/2 bg-slate-50 relative flex flex-col items-center justify-center p-4 lg:p-12 shrink-0 h-auto bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                <AnimatePresence mode="wait">
                  {(() => {
                    const variantImageUrl = Object.values(selectedVariants).map(val => selectedQuickViewProduct.variants?.find((v: any) => v.value === val && v.imageUrl)).find(url => url);
                    
                    const galleryImages = [
                      selectedQuickViewProduct.imageUrl,
                      ...(selectedQuickViewProduct.imageUrls || [])
                    ].filter((url, index, self) => url && self.indexOf(url) === index);

                    const activeImageUrl = variantImageUrl || galleryImages[activeThumbnailIndex] || selectedQuickViewProduct.imageUrl;
                    
                    return activeImageUrl ? (
                      <div className="relative group/zoom w-full h-[30vh] sm:h-[40vh] lg:h-[60vh] flex items-center justify-center cursor-zoom-in bg-slate-50/50 rounded-3xl overflow-hidden shadow-inner">
                        <motion.img 
                          key={activeImageUrl}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          src={activeImageUrl} 
                          className="w-full h-full object-contain mix-blend-multiply transition-transform duration-1000 group-hover/zoom:scale-125"
                          alt={selectedQuickViewProduct.name}
                        />

                        {/* Dynamic Client Logo Visualizer Overlay */}
                        {brandingType !== 'None' && customLogoUrl && (
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`absolute z-30 flex items-center justify-center p-1 bg-white/95 backdrop-blur-[2px] rounded-xl border-2 border-dashed border-[#C8961A]/50 shadow-xl transition-all duration-500 hover:scale-110 pointer-events-auto ${
                              brandingPosition === 'Left Chest' ? 'top-[35%] left-[33%] w-10 h-10' :
                              brandingPosition === 'Right Chest' ? 'top-[35%] right-[33%] w-10 h-10' :
                              brandingPosition === 'Center Chest' ? 'top-[42%] left-[48%] -translate-x-1/2 w-14 h-14' :
                              brandingPosition === 'Full Back' ? 'top-[30%] left-[48%] -translate-x-1/2 w-24 h-24 bg-white/80' :
                              'top-[40%] left-[23%] w-9 h-9' // Sleeve
                            }`}
                          >
                            <img 
                              src={customLogoUrl} 
                              alt="Logo mockup preview" 
                              className={`w-full h-full object-contain ${
                                brandingType === 'Embroidery' ? 'contrast-[1.05] brightness-[1.02] [filter:drop-shadow(0_1.5px_1.5px_rgba(0,0,0,0.15))] font-serif outline-transparent' : 'mix-blend-multiply'
                              }`} 
                            />
                            <div className="absolute -top-2.5 -right-2 bg-[#C8961A] text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                              {brandingType === 'Embroidery' ? 'Stitch' : 'Print'}
                            </div>
                          </motion.div>
                        )}
                        
                        {/* High-End Information Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-8 flex justify-between items-end bg-gradient-to-t from-slate-200/50 to-transparent opacity-0 group-hover/zoom:opacity-100 transition-opacity pointer-events-none">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[3px] text-[#0E121C]">Precision Detail</p>
                                <p className="text-[11px] font-bold text-slate-400">100% Genuine Textile Analysis</p>
                            </div>
                            <div className="bg-[#0E121C] text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Search size={14} /> Full View Mode
                            </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-[40vh] flex items-center justify-center text-slate-200">
                        <ImageIcon size={100} />
                      </div>
                    );
                  })()}
                </AnimatePresence>

                {/* Thumbnails Gallery */}
                {(() => {
                  const galleryImages = [
                    selectedQuickViewProduct.imageUrl,
                    ...(selectedQuickViewProduct.imageUrls || [])
                  ].filter((url, index, self) => url && self.indexOf(url) === index);

                  if (galleryImages.length <= 1) return null;

                  return (
                    <div className="flex gap-3 mt-6 lg:mt-8 pb-2 max-w-full overflow-x-auto scrollbar-hide px-2">
                      {galleryImages.map((url, idx) => (
                        <button
                          key={`${url}-${idx}`}
                          onClick={() => setActiveThumbnailIndex(idx)}
                          className={`relative w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                            activeThumbnailIndex === idx 
                              ? 'border-[#8B3DFF] scale-105 shadow-md' 
                              : 'border-white hover:border-slate-200'
                          }`}
                        >
                          <img src={url} className="w-full h-full object-cover" alt={`view ${idx + 1}`} />
                          {activeThumbnailIndex === idx && (
                            <div className="absolute inset-0 bg-[#8B3DFF]/5" />
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })()}
                
                {selectedQuickViewProduct.badge && (
                  <span className="absolute top-6 lg:top-10 left-6 lg:left-10 bg-gradient-to-r from-[#FF4F5A] to-[#7D2AE8] text-white text-[9px] lg:text-[11px] font-black px-4 py-2 rounded-full tracking-[2px] uppercase shadow-[0_4px_12px_rgba(125,42,232,0.3)] z-20 animate-pulse">
                    {selectedQuickViewProduct.badge}
                  </span>
                )}
              </div>

              {/* Product Info Section */}
              <div className="w-full lg:w-1/2 flex flex-col flex-1 overflow-hidden h-full">
                <div className="flex-1 overflow-y-auto px-6 py-6 lg:p-12">
                  <div className="mb-6 lg:mb-8">
                    <div className="text-[9px] lg:text-[12px] text-[#00C4CC] font-black tracking-[4px] uppercase mb-4 flex items-center gap-3">
                      <span className="w-6 lg:w-8 h-[2px] bg-[#00C4CC]"></span>
                      {selectedQuickViewProduct.category}
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl lg:leading-[1.1] text-[#0E121C] leading-[1.1] mb-2 lg:mb-3">
                      {selectedQuickViewProduct.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 lg:gap-6 mb-6 lg:mb-8 bg-slate-50/80 backdrop-blur-sm p-4 lg:p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 tracking-[2px] mb-1">
                          {selectedQuickViewProduct.priceType === 'wholesale' ? "Bulk Sourcing" : "MSRP Price"}
                        </span>
                        <div className="flex items-center gap-3">
                          {(selectedQuickViewProduct.priceType === 'wholesale' || selectedQuickViewProduct.tags?.some((t: string) => ['wholesale', 'bulk', 'corporate'].includes(t.toLowerCase()))) ? (
                            <span className="text-2xl lg:text-3xl font-black text-[#0E121C] leading-none uppercase tracking-tight bg-gradient-to-r from-[#7D2AE8] to-[#FF4F5A] bg-clip-text text-transparent">Price on Inquiry</span>
                          ) : (
                            <>
                              <span className="text-2xl lg:text-4xl font-black bg-gradient-to-r from-[#7D2AE8] to-[#FF4F5A] bg-clip-text text-transparent tracking-tight">{selectedQuickViewProduct.price.toLocaleString()}/-</span>
                              {selectedQuickViewProduct.oldPrice && (
                                <span className="text-sm lg:text-lg text-slate-400 line-through decoration-[#FF4F5A]/20">{selectedQuickViewProduct.oldPrice.toLocaleString()}/-</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[9px] font-black uppercase text-green-700 tracking-wider">In Stock & Ready</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Variants Selection */}
                  {selectedQuickViewProduct.variants && selectedQuickViewProduct.variants.length > 0 && (
                    <div className="space-y-6 mb-8 pt-2">
                      {Object.entries(
                        selectedQuickViewProduct.variants.reduce((acc: any, v: any) => {
                          if (!acc[v.type]) acc[v.type] = [];
                          acc[v.type].push(v);
                          return acc;
                        }, {})
                      ).map(([type, options]: [string, any]) => (
                        <div key={type} className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[2px]">{type}</label>
                            {selectedVariants[type] && (
                              <span className="text-[10px] font-bold text-[#1C3560] bg-[#1C3560]/5 px-2 py-0.5 rounded-lg">{selectedVariants[type]}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {options.map((opt: any, idx: number) => {
                              const isColor = type.toLowerCase() === 'color';
                              const isSelected = selectedVariants[type] === opt.value;
                              
                              return (
                                <button
                                  key={`${type}-${opt.id || opt.value || idx}`}
                                  onClick={() => setSelectedVariants(prev => ({ ...prev, [type]: opt.value }))}
                                  className={`relative flex items-center justify-center transition-all ${
                                    isColor 
                                      ? `w-10 h-10 rounded-full border-2 ${isSelected ? 'border-[#FF4F5A] scale-110 shadow-lg' : 'border-slate-100 hover:border-slate-300'}`
                                      : `px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider ${isSelected ? 'bg-gradient-to-r from-[#7D2AE8] to-[#FF4F5A] text-white border-transparent shadow-[#8B3DFF]/20 scale-105' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`
                                  }`}
                                >
                                  {isColor ? (
                                    <div 
                                      className="w-full h-full rounded-full border-2 border-white shadow-inner" 
                                      style={{ backgroundColor: opt.value.toLowerCase() }}
                                      title={opt.value}
                                    />
                                  ) : (
                                    opt.value
                                  )}
                                  {isSelected && isColor && (
                                    <div className="absolute -top-1 -right-1 bg-[#FF4F5A] text-white rounded-full p-0.5 shadow-sm">
                                      <CheckCircle2 size={10} />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sourcing Quantity & Customization */}
                  <div className="space-y-6 mb-8 pt-4 border-t border-slate-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 ml-1">Order Quantity Units</label>
                        <div className="flex items-center bg-slate-50 rounded-xl border border-slate-100 p-1">
                          <button 
                            type="button"
                            onClick={() => setInquiryUnits(Math.max(1, inquiryUnits - 1))}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-[#FF4F5A] transition-all"
                          >
                            <Minus size={14} />
                          </button>
                          <input 
                            type="number" 
                            min="1"
                            value={inquiryUnits}
                            onChange={(e) => setInquiryUnits(parseInt(e.target.value) || 1)}
                            className="bg-transparent border-none text-center text-sm font-black w-full outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => setInquiryUnits(inquiryUnits + 1)}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-[#FF4F5A] transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 ml-1">Sourcing Type</label>
                        <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-[#0E121C]">
                          {selectedQuickViewProduct.priceType === 'wholesale' ? 'Institutional Bulk' : 'Individual Retail'}
                        </div>
                      </div>
                    </div>

                    {/* Custom Logo Upload & Branding Section */}
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black uppercase tracking-[2px] text-[#0E121C]">Custom Apparel Branding</label>
                        <span className="text-[8.5px] font-black bg-[#C8961A]/10 text-[#C8961A] border border-[#C8961A]/20 px-2.5 py-1 rounded-full uppercase tracking-widest select-none">Setup Free</span>
                      </div>
                      
                      {/* Select Branding Type */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'None', label: 'None', icon: '🚫' },
                          { id: 'Embroidery', label: 'Stitch', icon: '🪡' },
                          { id: 'Screen Print', label: 'Print', icon: '🎨' },
                          { id: 'Sublimation', label: 'Subli', icon: '🔥' }
                        ].map(type => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setBrandingType(type.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              brandingType === type.id 
                                ? 'bg-[#0E121C] border-transparent text-white shadow-md active:scale-95 shadow-[#C8961A]/20' 
                                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                            }`}
                          >
                            <span className="text-sm mb-1">{type.icon}</span>
                            <span>{type.label}</span>
                          </button>
                        ))}
                      </div>

                      {brandingType !== 'None' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-4 overflow-hidden pt-1"
                        >
                          {/* Sizing & Position Option */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Position</label>
                              <select 
                                value={brandingPosition}
                                onChange={(e) => setBrandingPosition(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wide outline-none focus:border-[#C8961A]/30 transition-all"
                              >
                                <option>Left Chest</option>
                                <option>Right Chest</option>
                                <option>Center Chest</option>
                                <option>Full Back</option>
                                <option>Sleeve</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Mockup Area</label>
                              <div className="w-full bg-white border border-slate-100 text-slate-400 rounded-xl px-3 py-2 text-[10px] font-bold uppercase select-none flex items-center gap-1.5 h-9">
                                <span>📍 {brandingPosition}</span>
                              </div>
                            </div>
                          </div>

                          {/* Logo Upload Box */}
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Logo Attachment File</label>
                            
                            {!customLogoUrl ? (
                              <label className="border-2 border-dashed border-slate-200 hover:border-[#C8961A]/40 bg-white rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-50/50 group">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setCustomLogoName(file.name);
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        if (event.target?.result) {
                                          setCustomLogoUrl(event.target.result as string);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                                <ImageIcon size={22} className="text-slate-300 group-hover:text-[#C8961A] transition-colors mb-1.5" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Logo File</span>
                                <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest mt-0.5">PNG, JPG, SVG up to 5MB</span>
                              </label>
                            ) : (
                              <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 p-0.5 overflow-hidden flex items-center justify-center shrink-0">
                                    <img src={customLogoUrl} className="max-w-full max-h-full object-contain" alt="Selected company logo" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-700 truncate max-w-[140px] uppercase">{customLogoName}</p>
                                    <p className="text-[8px] font-bold text-green-500 uppercase tracking-widest">Ready to Mockup</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomLogoUrl('');
                                    setCustomLogoName('');
                                  }}
                                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  title="Clear Image"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {selectedQuickViewProduct.priceType === 'wholesale' && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 ml-1">Branding & Customization Details</label>
                        <textarea 
                          placeholder="Logo embroidery, Screen printing, Custom sizing, Specific fabric weight requirements..."
                          value={inquiryCustomization}
                          onChange={(e) => setInquiryCustomization(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium placeholder:text-slate-300 outline-none focus:bg-white focus:border-[#8B3DFF]/30 transition-all h-24 resize-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Accordion Group */}
                  <div className="space-y-3 mb-4">
                    {/* Description & Tags Accordion */}
                    <details open className="group border border-slate-100 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden bg-white shadow-sm transition-all duration-300">
                      <summary className="flex items-center justify-between p-5 cursor-pointer font-black text-xs uppercase tracking-widest text-[#0E121C] bg-slate-50 hover:bg-slate-100 transition-colors">
                        Product Details
                        <span className="transition-transform duration-300 group-open:rotate-180 text-slate-400">
                          <ChevronDown size={18} />
                        </span>
                      </summary>
                      <div className="p-5 text-slate-500 text-sm leading-relaxed border-t border-slate-50 bg-white">
                        <div className="mb-8 font-medium italic text-slate-600 border-l-2 border-[#00C4CC] pl-4">{selectedQuickViewProduct.description || "School Uniforms quality custom engineered textile specifically curated for our institutions with durability and style in mind."}</div>
                        
                        <div className="grid grid-cols-2 gap-6 mb-8">
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-[#FF4F5A] tracking-widest">Fabric Specs</h4>
                            <div className="space-y-2">
                              <div className="text-[11px] font-bold text-[#0E121C] flex items-center gap-2">
                                 <div className="w-1 h-1 rounded-full bg-slate-200"></div> Anti-Pilling Tech
                              </div>
                              <div className="text-[11px] font-bold text-[#0E121C] flex items-center gap-2">
                                 <div className="w-1 h-1 rounded-full bg-slate-200"></div> Color-Lock Weave
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-[#FF4F5A] tracking-widest">Durability</h4>
                            <div className="space-y-2">
                              <div className="text-[11px] font-bold text-[#0E121C] flex items-center gap-2">
                                 <div className="w-1 h-1 rounded-full bg-slate-200"></div> 100+ Wash Cycle
                              </div>
                              <div className="text-[11px] font-bold text-[#0E121C] flex items-center gap-2">
                                 <div className="w-1 h-1 rounded-full bg-slate-200"></div> Institutional Grade
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Tags */}
                        {selectedQuickViewProduct.tags && selectedQuickViewProduct.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
                            {selectedQuickViewProduct.tags.map((tag: string, i: number) => (
                              <span key={`${tag}-${i}`} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-100">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                    
                    {/* Features & Lead Time Accordion */}
                    <details className="group border border-slate-100 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden bg-white shadow-sm transition-all duration-300">
                      <summary className="flex items-center justify-between p-5 cursor-pointer font-black text-xs uppercase tracking-widest text-[#0E121C] bg-slate-50 hover:bg-slate-100 transition-colors">
                        Features & Lead Time
                        <span className="transition-transform duration-300 group-open:rotate-180 text-slate-400">
                          <ChevronDown size={18} />
                        </span>
                      </summary>
                      <div className="p-5 bg-white border-t border-slate-50">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                            <div className="text-[#00C4CC] shrink-0"><ShieldCheck size={20} /></div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-400">Quality</p>
                              <p className="text-[11px] font-bold text-slate-800">Double Stitched</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                            <div className="text-[#00C4CC] shrink-0"><Calendar size={20} /></div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-400">Lead Time</p>
                              <p className="text-[11px] font-bold text-slate-800">7-14 Work Days</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>

                    {/* Customer Reviews Accordion */}
                    <details className="group border border-slate-100 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden bg-white shadow-sm transition-all duration-300">
                      <summary className="flex items-center justify-between p-5 cursor-pointer font-black text-xs uppercase tracking-widest text-[#0E121C] bg-slate-50 hover:bg-slate-100 transition-colors">
                        Customer Reviews ({productReviews.length})
                        <span className="transition-transform duration-300 group-open:rotate-180 text-slate-400">
                          <ChevronDown size={18} />
                        </span>
                      </summary>
                      <div className="p-5 bg-white border-t border-slate-50">
                        {productReviews.length > 0 ? (
                          <div className="space-y-6 mb-8">
                            {productReviews.map((review) => (
                              <div key={review.id} className="pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black uppercase text-[#0E121C] tracking-wider">{review.userName}</span>
                                  <div className="flex text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={10} fill={i < review.rating ? 'currentColor' : 'none'} className={i < review.rating ? 'text-amber-400' : 'text-slate-200'} />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed italic">"{review.comment}"</p>
                                <p className="text-[8px] text-slate-300 mt-2 uppercase font-bold">Verified Institution Purchaser</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 border-b border-slate-50 mb-6">
                            <p className="text-xs text-slate-400 font-medium">Be the first to review this product.</p>
                          </div>
                        )}

                        {/* Review Form */}
                        <div className="bg-slate-50 rounded-2xl p-4 lg:p-6">
                          <h4 className="text-[10px] font-black uppercase tracking-[2px] text-[#0E121C] mb-4">Submit a Review</h4>
                          {reviewSubmitted ? (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 text-center"
                            >
                              <div className="flex justify-center mb-2"><CheckCircle2 size={24} /></div>
                              <p className="text-xs font-bold uppercase tracking-wider">Thank you!</p>
                              <p className="text-[10px]">Your review has been submitted and is pending moderation.</p>
                            </motion.div>
                          ) : (
                            <form onSubmit={handleSubmitReview} className="space-y-4">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Rating:</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => setReviewForm(prev => ({ ...prev, rating: num }))}
                                      className="text-amber-400 transition-transform hover:scale-110 active:scale-95"
                                    >
                                      <Star size={16} fill={num <= reviewForm.rating ? 'currentColor' : 'none'} className={num <= reviewForm.rating ? 'text-amber-400' : 'text-slate-200'} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="gap-4 grid grid-cols-1">
                                <input 
                                  type="text" 
                                  placeholder="Your Name (Optional)" 
                                  value={reviewForm.userName}
                                  onChange={e => setReviewForm(prev => ({ ...prev, userName: e.target.value }))}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#FF4F5A] transition-colors"
                                />
                                <textarea 
                                  placeholder="Share your experience with this product..." 
                                  required
                                  value={reviewForm.comment}
                                  onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-[#FF4F5A] transition-colors h-24 resize-none"
                                ></textarea>
                              </div>
                              <button 
                                type="submit" 
                                disabled={isSubmittingReview}
                                className="w-full bg-[#0E121C] hover:bg-[#FF4F5A] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg hover:shadow-[#FF4F5A]/20"
                              >
                                {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </details>
                  </div>
                </div>

                <div className="shrink-0 bg-white/95 backdrop-blur-xl z-20 p-4 lg:p-8 border-t border-slate-100 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.08)]">
                  <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 max-w-full">
                    
                    {/* Secondary Actions (Compare, Wishlist, Share) positioned at the bottom on mobile, side-by-side on desktop */}
                    <div className="order-2 lg:order-1 flex gap-2 lg:gap-3 w-full lg:w-auto">
                      <button 
                        onClick={() => toggleCompare(selectedQuickViewProduct)}
                        className={`flex-1 lg:w-14 h-12 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center gap-2 lg:gap-0 border-2 transition-all duration-300 group cursor-pointer ${
                          compareList.find(i => i.id === selectedQuickViewProduct.id) 
                            ? "bg-[#00C4CC]/10 border-[#00C4CC]/30 text-[#008F94]" 
                            : "border-slate-100 text-slate-400 hover:border-[#00C4CC] hover:text-[#00C4CC] bg-slate-50/50"
                        }`}
                        title="Compare"
                      >
                        <GitCompare size={17} className={compareList.find(i => i.id === selectedQuickViewProduct.id) ? "scale-110" : "group-hover:scale-110 transition-transform"} />
                        <span className="lg:hidden text-[9px] font-black uppercase tracking-widest">{compareList.find(i => i.id === selectedQuickViewProduct.id) ? "Linked" : "Compare"}</span>
                      </button>
                      <button 
                        onClick={() => toggleWishlist(selectedQuickViewProduct)}
                        className={`flex-1 lg:w-14 h-12 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center gap-2 lg:gap-0 border-2 transition-all duration-300 group cursor-pointer ${
                          wishlist.find(i => i.id === selectedQuickViewProduct.id) 
                            ? "bg-[#FF4F5A]/10 border-[#FF4F5A]/30 text-[#FF4F5A]" 
                            : "border-slate-100 text-slate-400 hover:border-[#FF4F5A] hover:text-[#FF4F5A] bg-slate-50/50"
                        }`}
                        title="Wishlist"
                      >
                        <Heart size={17} className={wishlist.find(i => i.id === selectedQuickViewProduct.id) ? "fill-current scale-110" : "group-hover:scale-110 transition-transform"} />
                        <span className="lg:hidden text-[9px] font-black uppercase tracking-widest">{wishlist.find(i => i.id === selectedQuickViewProduct.id) ? "Saved" : "Wishlist"}</span>
                      </button>
                      <button 
                        onClick={() => handleShareProduct(selectedQuickViewProduct)}
                        className="flex-1 lg:w-14 h-12 lg:h-14 rounded-xl lg:rounded-2xl border-2 border-slate-100 flex items-center justify-center gap-2 lg:gap-0 text-slate-400 hover:border-[#00C4CC] hover:text-[#00C4CC] transition-all duration-300 bg-slate-50/50 group cursor-pointer"
                        title="Share"
                      >
                        <Share2 size={17} className="group-hover:scale-110 transition-transform" />
                        <span className="lg:hidden text-[9px] font-black uppercase tracking-widest">Share</span>
                      </button>
                    </div>

                    {/* Primary Actions (WhatsApp Inquiry / Phone Call or Add to Collection) positioned at the top on mobile */}
                    {(selectedQuickViewProduct.priceType === 'wholesale' || selectedQuickViewProduct.tags?.some((t: string) => ['wholesale', 'bulk', 'corporate'].includes(t.toLowerCase()))) ? (
                      <div className="order-1 lg:order-2 flex flex-col sm:flex-row gap-2.5 w-full lg:flex-1">
                        <a 
                          href={`https://wa.me/254792021795?text=Hello, I'm interested in wholesale order for ${selectedQuickViewProduct.name}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white h-12 lg:h-14 rounded-xl lg:rounded-2xl font-black text-[10px] sm:text-xs lg:text-[13px] uppercase tracking-[1.5px] lg:tracking-[2px] transition-all flex items-center justify-center gap-2.5 shadow-xl hover:shadow-[#25D366]/10 active:scale-[0.98]"
                        >
                          <MessageSquare size={18} className="shrink-0" />
                          <span className="truncate">Enquire on WhatsApp</span>
                        </a>
                        <a 
                          href="tel:+254792021795"
                          className="flex-1 bg-[#FF4F5A] hover:bg-[#E03B46] text-white h-12 lg:h-14 rounded-xl lg:rounded-2xl font-black text-[10px] sm:text-xs lg:text-[13px] uppercase tracking-[1.5px] lg:tracking-[2px] transition-all flex items-center justify-center gap-2.5 shadow-xl hover:shadow-[#FF4F5A]/10 active:scale-[0.98]"
                        >
                          <Phone size={18} className="shrink-0" />
                          <span>Call Now</span>
                        </a>
                      </div>
                    ) : (
                      <div className="order-1 lg:order-2 flex flex-col sm:flex-row gap-3 w-full lg:flex-1">
                        {/* High-contrast Add to Cart Button */}
                        <button 
                          onClick={() => {
                            const basePrice = selectedQuickViewProduct.priceType === 'wholesale' ? 0 : selectedQuickViewProduct.price;
                            const finalPrice = basePrice + Object.entries(selectedVariants).reduce((sum, [type, val]) => {
                              const variant = selectedQuickViewProduct.variants?.find((v: any) => v.type === type && v.value === val);
                              return sum + (variant?.price || 0);
                            }, 0);

                            const cartItem = {
                              ...selectedQuickViewProduct,
                              price: finalPrice,
                              selectedVariants: { ...selectedVariants },
                              quantity: inquiryUnits,
                              customization: inquiryCustomization,
                              priceType: selectedQuickViewProduct.priceType || 'fixed',
                              brandingType: brandingType !== 'None' ? brandingType : undefined,
                              brandingPosition: brandingType !== 'None' ? brandingPosition : undefined,
                              customLogoUrl: brandingType !== 'None' && customLogoUrl ? customLogoUrl : undefined,
                              customLogoName: brandingType !== 'None' && customLogoName ? customLogoName : undefined
                            };
                            
                            addToCart(cartItem, inquiryUnits);
                            setSelectedQuickViewProduct(null);
                            setIsCartOpen(true);
                          }}
                          className="relative overflow-hidden w-full sm:w-1/2 bg-[#0E121C] hover:bg-slate-800 text-white h-12 lg:h-14 rounded-xl lg:rounded-2xl font-black text-[11px] lg:text-[13px] uppercase tracking-[1.5px] lg:tracking-[2px] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] cursor-pointer group"
                        >
                          <ShoppingBag size={17} className="group-hover:scale-110 transition-transform text-[#00C4CC]" />
                          <span>Add to Cart 🛒</span>
                        </button>

                        {/* Premium Buy Now & Instant Checkout Button */}
                        <button 
                          onClick={() => {
                            const basePrice = selectedQuickViewProduct.priceType === 'wholesale' ? 0 : selectedQuickViewProduct.price;
                            const finalPrice = basePrice + Object.entries(selectedVariants).reduce((sum, [type, val]) => {
                              const variant = selectedQuickViewProduct.variants?.find((v: any) => v.type === type && v.value === val);
                              return sum + (variant?.price || 0);
                            }, 0);

                            const cartItem = {
                              ...selectedQuickViewProduct,
                              price: finalPrice,
                              selectedVariants: { ...selectedVariants },
                              quantity: inquiryUnits,
                              customization: inquiryCustomization,
                              priceType: selectedQuickViewProduct.priceType || 'fixed',
                              brandingType: brandingType !== 'None' ? brandingType : undefined,
                              brandingPosition: brandingType !== 'None' ? brandingPosition : undefined,
                              customLogoUrl: brandingType !== 'None' && customLogoUrl ? customLogoUrl : undefined,
                              customLogoName: brandingType !== 'None' && customLogoName ? customLogoName : undefined
                            };
                            
                            addToCart(cartItem, inquiryUnits);
                            setSelectedQuickViewProduct(null);
                            navigate('/checkout');
                          }}
                          className="relative overflow-hidden w-full sm:w-1/2 bg-gradient-to-r from-[#C2102E] via-[#7D2AE8] to-[#FF4F5A] text-white h-12 lg:h-14 rounded-xl lg:rounded-2xl font-black text-[11px] lg:text-[13px] uppercase tracking-[1.5px] lg:tracking-[2px] transition-all flex items-center justify-center shadow-xl hover:shadow-[#7D2AE8]/20 active:scale-[0.98] group cursor-pointer"
                        >
                          {/* Shimmer Sheen effect */}
                          <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] ease-in-out"></div>
                          <div className="relative flex items-center justify-center gap-2 px-1">
                            <span>Buy Now ⚡</span>
                            <span className="bg-white/15 text-white text-[9px] px-2 py-0.5 rounded-lg border border-white/10 font-mono tracking-tight shrink-0">
                              Ksh {(( (selectedQuickViewProduct.price + Object.entries(selectedVariants).reduce((sum, [type, val]) => {
                                const variant = selectedQuickViewProduct.variants?.find((v: any) => v.type === type && v.value === val);
                                return sum + (variant?.price || 0);
                              }, 0)) * inquiryUnits )).toLocaleString()}/-
                            </span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Handled by Navbar */}
      
      {/* Promotion Modal Overlay */}
      <AnimatePresence>
        {showPromoModal && activeModalPromo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowPromoModal(false);
                sessionStorage.setItem(`promo_${activeModalPromo.id}`, 'true');
              }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto max-h-[90vh] md:min-h-[500px]"
            >
              <button 
                onClick={() => {
                  setShowPromoModal(false);
                  sessionStorage.setItem(`promo_${activeModalPromo.id}`, 'true');
                }}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-30 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-[#0A1628] hover:bg-white/40 transition-all flex items-center justify-center shadow-lg md:shadow-none"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="w-full md:w-1/2 relative h-[25vh] sm:h-[30vh] md:h-auto scroll-hide">
                {activeModalPromo.imageUrl ? (
                  <img src={activeModalPromo.imageUrl} className="w-full h-full object-cover" alt={activeModalPromo.title} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0A1628] to-[#1C3560] flex items-center justify-center">
                    <Megaphone size={60} className="text-[#C8961A]/20 md:w-20 md:h-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
              </div>

              <div className="w-full md:w-1/2 p-6 sm:p-8 lg:p-14 flex flex-col justify-center bg-white overflow-y-auto scroll-hide">
                <div className="flex items-center gap-3 text-[#C8961A] text-[9px] lg:text-[10px] font-black tracking-[4px] uppercase mb-4 md:mb-6">
                  <Megaphone size={12} className="md:w-[14px]" /> Seasonal Offer
                </div>
                <h3 className="font-display text-3xl sm:text-4xl lg:text-6xl text-[#0A1628] tracking-wider leading-none mb-4 md:mb-6">
                  {activeModalPromo.title}
                </h3>
                <p className="text-slate-500 text-base lg:text-lg mb-6 md:mb-10 leading-relaxed font-medium">
                  {activeModalPromo.subtitle}
                </p>
                <div className="flex flex-col gap-3 md:gap-4">
                  <Link 
                    to={activeModalPromo.buttonLink || '/shop'} 
                    onClick={() => {
                      setShowPromoModal(false);
                      sessionStorage.setItem(`promo_${activeModalPromo.id}`, 'true');
                    }}
                    className="bg-[#C8102E] hover:bg-[#8B0000] text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-[2px] md:tracking-[3px] transition-all transform hover:scale-105 shadow-xl shadow-[#C8102E]/20 text-center"
                  >
                    {activeModalPromo.buttonText}
                  </Link>
                  <button 
                    onClick={() => {
                      setShowPromoModal(false);
                      sessionStorage.setItem(`promo_${activeModalPromo.id}`, 'true');
                    }}
                    className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors py-2"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
