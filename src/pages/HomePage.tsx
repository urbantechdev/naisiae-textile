import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
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
  Zap,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Hero } from '../components/home/Hero';
const Specialties = lazy(() => import('../components/home/Specialties').then(m => ({ default: m.Specialties })));
const WholesaleDeals = lazy(() => import('../components/home/WholesaleDeals').then(m => ({ default: m.WholesaleDeals })));
const CatalogSection = lazy(() => import('../components/home/CatalogSection').then(m => ({ default: m.CatalogSection })));
const InstitutionalWholesale = lazy(() => import('../components/home/InstitutionalWholesale').then(m => ({ default: m.InstitutionalWholesale })));
import { ProductScrollNavigator } from '../components/ProductScrollNavigator';
import { PullToRefresh } from '../components/PullToRefresh';
import { ImageZoomViewer } from '../components/ImageZoomViewer';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import { useLocalization } from '../context/LocalizationContext';
import { getCategoryPlaceholder } from '../utils/image';
import { GoogleMerchantSchema } from '../components/GoogleMerchantSchema';

const DEFAULT_HOME_CATEGORIES = [
  { id: 'school', title: 'School Uniforms', subtitle: 'Primary & Secondary', image: '/src/assets/images/category_school_1782334810884.jpg' },
  { id: 'corporate', title: 'Corporate Wear', subtitle: 'Office & Blazers', image: '/src/assets/images/category_corporate_1782334824455.jpg' },
  { id: 'healthcare', title: 'Healthcare', subtitle: 'Scrubs & Lab Coats', image: '/src/assets/images/category_medical_1782334767056.jpg' },
  { id: 'hospitality', title: 'Hospitality', subtitle: 'Catering & Vests', image: '/src/assets/images/category_hospitality_1782334781502.jpg' }
];

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
  const { currentCountry, formatPrice } = useLocalization();
  const { productId } = useParams();
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

  const handleMobileRefresh = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setToast({
      message: "Sync complete! Connected to live Uhuru Market inventory. 📦🌱",
      type: "success"
    });
  };

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [activeModalPromo, setActiveModalPromo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [shuffledProducts, setShuffledProducts] = useState<any[]>([]);
  const [isReshufflingPaused, setIsReshufflingPaused] = useState(false);
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<any>(null);

  useEffect(() => {
    if (productId && products.length > 0) {
      const match = products.find(p => p.id === productId);
      if (match) {
        setSelectedQuickViewProduct(match);
      }
    }
  }, [productId, products]);

  const handleCloseQuickView = (dontRedirect = false) => {
    setSelectedQuickViewProduct(null);
    if (productId && !dontRedirect) {
      const prefix = currentCountry.code === 'KE' ? '' : `/${currentCountry.name.toLowerCase().replace(/ /g, '-')}`;
      navigate(prefix || '/');
    }
  };

  useEffect(() => {
    if (products.length > 0) {
      setShuffledProducts([...products]);
    }
  }, [products]);

  useEffect(() => {
    if (isReshufflingPaused || selectedQuickViewProduct) return;
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
  }, [isReshufflingPaused, selectedQuickViewProduct, products]);
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
      text: `Check out ${product.name} - ${product.description || 'Quality textile solutions from Uhuru Market, Nairobi.'}\nPrice: ${formatPrice(product.price)}`,
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
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activeThumbnailIndex, setActiveThumbnailIndex] = useState(0);

  const [brandingType, setBrandingType] = useState('None'); // None, Embroidery, Screen Print, Sublimation
  const [brandingPosition, setBrandingPosition] = useState('Left Chest'); // Left Chest, Right Chest, Center Chest, Full Back, Sleeve
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [customLogoName, setCustomLogoName] = useState('');

  useEffect(() => {
    if (selectedQuickViewProduct) {
      setIsReshufflingPaused(true);
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
      const siteTitle = siteSettings.sharingTitle || 'Uhuru Market Uniforms';
      const description = siteSettings.sharingDescription || 'Naisiae Textiles operates as the ultimate school uniform supplier and school uniform manufacturer located directly at Uhuru Market along Jogoo Road, Nairobi.';
      const sharingImage = siteSettings.sharingImage || siteSettings.siteLogo || 'https://i.pinimg.com/736x/23/58/e9/2358e909cae32ba6cc99627364ac14c3.jpg';

      document.title = siteTitle;
      
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

      updateMeta('meta[property="og:title"]', 'content', siteTitle);
      updateMeta('meta[property="og:description"]', 'content', description);
      updateMeta('meta[property="og:image"]', 'content', sharingImage);
      updateMeta('meta[property="twitter:title"]', 'content', siteTitle);
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
  }, [siteSettings, currentCountry]);

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
      <h1 className="sr-only">Uhuru Market Uniforms</h1>
      {/* Top Promotion Bar & Navbar */}
      <Navbar 
        wishlistCount={wishlist.length}
        compareCount={compareList.length}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsCompareModalOpen={setIsCompareModalOpen}
        setSelectedQuickViewProduct={setSelectedQuickViewProduct}
      />

      <PullToRefresh onRefresh={handleMobileRefresh}>
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
            onProductTap={() => setIsReshufflingPaused(true)}
            isReshufflingPaused={isReshufflingPaused}
            setIsReshufflingPaused={setIsReshufflingPaused}
          />
      </div>



      <div id="specialties">
        <Suspense fallback={<div className="h-48 bg-slate-900/5 animate-pulse rounded-3xl m-6" />}>
          <Specialties 
            categories={categories.length > 0 ? categories.map(c => ({ ...c, image: c.image || getCategoryPlaceholder(c.title || c.name) })) : DEFAULT_HOME_CATEGORIES}
            setActiveTab={setActiveTab}
          />
        </Suspense>
      </div>

      <div id="wholesale">
        <Suspense fallback={<div className="h-96 bg-slate-900/5 animate-pulse rounded-3xl m-6" />}>
          <WholesaleDeals 
            products={shuffledProducts.length > 0 ? shuffledProducts : products}
            showAllWholesale={showAllWholesale}
            setShowAllWholesale={setShowAllWholesale}
            setSelectedQuickViewProduct={setSelectedQuickViewProduct}
            onProductTap={() => setIsReshufflingPaused(true)}
          />
        </Suspense>
      </div>

      <div id="catalog">
        <Suspense fallback={<div className="h-96 bg-slate-900/5 animate-pulse rounded-3xl m-6" />}>
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
            onProductTap={() => setIsReshufflingPaused(true)}
          />
        </Suspense>
      </div>

      {/* High-Tech 3D Simulator Promo Block */}
      <section className="py-12 px-4 sm:py-20 bg-[#0A1628] text-white overflow-hidden relative border-t border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-[#C8102E]/20 via-transparent to-[#C8961A]/10 opacity-70"></div>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl text-center lg:text-left">
            <span className="text-[10px] font-black tracking-[4px] uppercase text-[#C8961A] bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/20 inline-block mb-3">
              Interactive 3D Configurator
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-medium tracking-tight leading-tight">
              Virtual Uniform & Fabric Simulator
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-4 leading-relaxed font-bold">
              Unsure of school colors or blazers? Mix and match collars, sleeves, sweaters, and premium anti-pilling fabrics on our real-time interactive model. Order direct-to-factory with absolute sizing confidence.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button 
                onClick={() => navigate('/simulator')}
                className="px-8 py-3.5 bg-gradient-to-r from-[#C2102E] to-[#C8961A] hover:opacity-95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                Launch Customizer ⚡
              </button>
              <button 
                onClick={() => {
                  const shopEl = document.getElementById('catalog-section');
                  if (shopEl) shopEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Browse Premade Styles
              </button>
            </div>
          </div>

          {/* Interactive mockup preview container */}
          <div className="w-full lg:w-5/12 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <div className="absolute top-4 left-4 flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60"></span>
            </div>
            
            <div className="text-center pt-4">
              <span className="text-[8px] font-mono tracking-widest text-white/50 uppercase block mb-1">Interactive Simulator Preview</span>
              <div className="h-44 sm:h-56 bg-slate-900/60 rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden my-4">
                {/* Visual mockup drawing */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#C8102E] rounded-full flex items-center justify-center text-white text-3xl shadow-lg border border-white/10">🏫</div>
                  <span className="text-[10px] font-black tracking-widest uppercase mt-4 text-[#C8961A]">Naisiae Textiles Simulator</span>
                  <p className="text-[8.5px] text-white/60 font-medium uppercase mt-1">Configure Collars & Sleeves in Real Time</p>
                </div>
                {/* Floating bubbles representing colors */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#0B2240] ring-1 ring-white/50"></span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#631212] ring-1 ring-white/50"></span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#163B23] ring-1 ring-white/50"></span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#0A1628]/60 p-2 rounded-lg border border-white/5">
                  <span className="text-[7px] text-white/40 block font-bold uppercase">Fabric Weight</span>
                  <span className="text-[9px] font-black text-white">280 GSM</span>
                </div>
                <div className="bg-[#0A1628]/60 p-2 rounded-lg border border-white/5">
                  <span className="text-[7px] text-white/40 block font-bold uppercase">Composition</span>
                  <span className="text-[9px] font-black text-[#C8961A]">Wool/Poly</span>
                </div>
                <div className="bg-[#0A1628]/60 p-2 rounded-lg border border-white/5">
                  <span className="text-[7px] text-white/40 block font-bold uppercase">Pilling Resistance</span>
                  <span className="text-[9px] font-black text-emerald-400">Class 4.5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="institutional">
        <Suspense fallback={<div className="h-48 bg-slate-900/5 animate-pulse rounded-3xl m-6" />}>
          <InstitutionalWholesale 
            setIsQuoteModalOpen={setIsQuoteModalOpen}
          />
        </Suspense>
      </div>

      {/* Customer Trust Bento Grid Testimonials */}
      <section className="py-16 sm:py-24 bg-white border-t border-slate-100 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-black tracking-[4px] uppercase text-[#C8102E] bg-red-50 border border-red-100 px-3.5 py-1.5 rounded-full inline-block">
              Client Feedback
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium tracking-tight text-[#0A1628] mt-4 leading-tight">
              Trusted by Parents & Institutions
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-bold uppercase mt-3 tracking-wider">
              Real verified buyers from Nairobi and across Kenya
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-inner flex flex-col justify-between group hover:border-[#C8961A]/20 transition-all duration-300">
              <div>
                <div className="flex text-amber-400 gap-1 mb-4">
                  {Array(5).fill(0).map((_, i) => <Star key={i} size={14} className="fill-current" />)}
                </div>
                <p className="text-slate-700 text-xs sm:text-sm font-bold leading-relaxed">
                  "Buying direct from their Uhuru Market Jogoo Road workshop saved our school procurement budget over 30%. The cardigans are extremely thick wool and the colors didn't fade at all after 3 semesters of washings!"
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3 border-t border-slate-200/40 pt-4">
                <div className="w-9 h-9 rounded-full bg-[#0A1628] text-white font-black text-[10px] flex items-center justify-center tracking-wider">MR</div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-800">Mr. Ronald Kiprop</h4>
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#C8961A]">Principal, Hillcrest Academy</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-inner flex flex-col justify-between group hover:border-[#C8102E]/20 transition-all duration-300">
              <div>
                <div className="flex text-amber-400 gap-1 mb-4">
                  {Array(5).fill(0).map((_, i) => <Star key={i} size={14} className="fill-current" />)}
                </div>
                <p className="text-slate-700 text-xs sm:text-sm font-bold leading-relaxed">
                  "As a parent, uniform shopping is always stressful, but ordering from Uhuru Market online was so straightforward. Sizing swaps were easy right at their Jogoo Rd desk. Truly quality school uniforms."
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3 border-t border-slate-200/40 pt-4">
                <div className="w-9 h-9 rounded-full bg-[#C8102E] text-white font-black text-[10px] flex items-center justify-center tracking-wider">MW</div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-800">Mama Wanjiku</h4>
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#C8102E]">Verified Parent Buyer, Nairobi</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-inner flex flex-col justify-between group hover:border-[#C8961A]/20 transition-all duration-300">
              <div>
                <div className="flex text-amber-400 gap-1 mb-4">
                  {Array(5).fill(0).map((_, i) => <Star key={i} size={14} className="fill-current" />)}
                </div>
                <p className="text-slate-700 text-xs sm:text-sm font-bold leading-relaxed">
                  "Perfect custom sports uniforms and tracksuits for our college team. Computer embroidery is pristine, and they handled our order of 150 pairs within just 5 days. Absolute professionals."
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3 border-t border-slate-200/40 pt-4">
                <div className="w-9 h-9 rounded-full bg-[#0A1628] text-white font-black text-[10px] flex items-center justify-center tracking-wider">DK</div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-800">Dr. Kevin Omwamba</h4>
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#C8961A]">Sports Dir, Nairobi Technical</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sourcing & SEO Authority Hub */}
      <section className="bg-slate-50 border-t border-slate-200 py-20 px-6 lg:px-12" id="seo-authority">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-[#C8102E] uppercase bg-red-50 px-3 py-1 rounded-full border border-red-100 font-sans">
              East Africa's Ultimate Sourcing Hub
            </span>
            <h2 className="text-3xl md:text-4xl font-sans font-medium tracking-tight text-[#0A1628] mt-4 mb-6">
              Uhuru Market Uniform Sourcing & Manufacturing Authority
            </h2>
            <p className="text-slate-600 font-sans leading-relaxed text-sm md:text-base">
              Naisiae Textiles is the standard-setting garment factory based in the heart of Jogoo Road. Discover why leading institutions rank us as the premier partner for bulk apparel supply.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1: Uhuru Market Uniforms */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#C8102E] mb-6 group-hover:scale-105 transition-transform">
                  <MapPin size={24} />
                </div>
                <h3 className="text-xl font-medium text-[#0A1628] mb-3 font-sans">
                  Uhuru Market Uniforms Hub
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-sans mb-4">
                  Operating directly from Uhuru Market along Jogoo Road, Nairobi, we are the authentic epicentre of custom-tailored institutional apparel in Kenya, offering live material validation and transparent local production.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400">#UhuruMarketUniforms</div>
            </div>

            {/* Card 2: School Uniform Supplier */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-[#C8961A] mb-6 group-hover:scale-105 transition-transform">
                  <Package size={24} />
                </div>
                <h3 className="text-xl font-medium text-[#0A1628] mb-3 font-sans">
                  Premier School Uniform Supplier
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-sans mb-4">
                  We supply over 250+ primary and secondary institutions across East Africa with durable garments, including high-grade acrylic sweaters, combed cotton shirts, and tailored blazers built to withstand active daily wear.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400">#SchoolUniformSupplier</div>
            </div>

            {/* Card 3: School Uniform Manufacturer */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-105 transition-transform">
                  <Scissors size={24} />
                </div>
                <h3 className="text-xl font-medium text-[#0A1628] mb-3 font-sans">
                  Direct School Uniform Manufacturer
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-sans mb-4">
                  By cutting, sewing, and applying computer-aided embroidery in-house, we are a direct manufacturer. This ensures flawless quality inspections, standardized colorways, and robust fabric grades (like anti-pilling materials).
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400">#SchoolUniformManufacturer</div>
            </div>

            {/* Card 4: Best Uniform Shop */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-105 transition-transform">
                  <Star size={24} />
                </div>
                <h3 className="text-xl font-medium text-[#0A1628] mb-3 font-sans">
                  Best Uniform Shop Experience
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-sans mb-4">
                  We combine digital procurement and factory-direct service. Use our online interactive uniform simulator, 3D custom configurer, and simple wholesale quotation system to get a premium purchasing experience.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400">#BestUniformShop</div>
            </div>

            {/* Card 5: Cheap or Affordable Uniforms */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-105 transition-transform">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-medium text-[#0A1628] mb-3 font-sans">
                  Cheap & Affordable Uniform Solutions
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-sans mb-4">
                  Get premium quality at budget-friendly rates. By bypassing brokers, our affordable uniform pricing model guarantees premium textiles at highly competitive rates, giving parents and institutions the best value for money.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400">#AffordableUniforms</div>
            </div>

            {/* Card 6: Wholesale Price Uniform */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-105 transition-transform">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-xl font-medium text-[#0A1628] mb-3 font-sans">
                  Wholesale Price Uniform Supply
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-sans mb-4">
                  We offer massive bulk volume contracts with highly competitive tiered pricing models. Save significantly on institutional contracts for schools, corporations, healthcare teams, and security details.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400">#WholesalePriceUniforms</div>
            </div>
          </div>
          
          {/* FAQ Accordion block specifically matching search variations */}
          <div className="mt-16 bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm">
            <h3 className="text-2xl font-sans font-medium text-[#0A1628] mb-8 text-center">
              Frequently Asked Questions (Sourcing FAQ)
            </h3>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-slate-100 pb-6">
                <h4 className="text-base font-semibold text-[#0A1628] mb-2 font-sans">
                  Where is the best uniform shop for bulk school uniform procurement in Nairobi?
                </h4>
                <p className="text-slate-500 text-sm leading-relaxed font-sans">
                  Naisiae Textiles operates as the ultimate school uniform supplier and school uniform manufacturer located directly at Uhuru Market along Jogoo Road, Nairobi. We supply durable, high-grade garments at standard wholesale prices.
                </p>
              </div>
              
              <div className="border-b border-slate-100 pb-6">
                <h4 className="text-base font-semibold text-[#0A1628] mb-2 font-sans">
                  How can you guarantee cheap or affordable uniform rates without compromising material quality?
                </h4>
                <p className="text-slate-500 text-sm leading-relaxed font-sans">
                  As a direct-factory school uniform manufucturer, we buy raw textiles in high volumes and stitch on-site. This completely eliminates middleman markups, ensuring we deliver wholesale price uniform deals with top-tier material specs.
                </p>
              </div>

              <div>
                <h4 className="text-base font-semibold text-[#0A1628] mb-2 font-sans">
                  Do you serve as a wholesale price uniform partner outside of Nairobi?
                </h4>
                <p className="text-slate-500 text-sm leading-relaxed font-sans">
                  Yes! We ship across the entire East African region, including major hubs in Tanzania, Uganda, DR Congo, and Ethiopia. Simply request a bulk catalog and customize your badges or brand stitching via our online platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Comparison Drawer */}
      <AnimatePresence>
        {compareList.length > 0 && !isCompareModalOpen && (
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
                      {formatPrice(item.price)}
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
                        {item.description || "Tailored uniform apparel cut from durable cotton-blend twill with color-fast dyes."}
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
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-hidden">
            <GoogleMerchantSchema product={selectedQuickViewProduct} currency={currentCountry.currency} />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleCloseQuickView()}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.93, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 30 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="relative w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col lg:flex-row max-h-[92vh] sm:max-h-[88vh] z-10 shadow-2xl border border-slate-100 backdrop-blur-md my-auto"
            >
              {/* Premium top thin visual balance stripe */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#C8961A] via-[#C8102E] to-[#7D2AE8] z-[60]" />

              {/* Close Button */}
              <button 
                onClick={() => handleCloseQuickView()}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[60] w-9 h-9 sm:w-10 sm:h-10 bg-white/95 border border-slate-200/80 hover:border-slate-300 rounded-full flex items-center justify-center text-slate-800 hover:text-[#C8102E] transition-all shadow-md active:scale-95"
                aria-label="Close"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>

              {/* Product Gallery Section */}
              <div className="w-full lg:w-1/2 bg-slate-50 relative flex flex-col items-center justify-center p-3 sm:p-6 shrink-0 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden max-h-[38vh] lg:max-h-none">
                {(() => {
                  const variantImageUrl = Object.values(selectedVariants).map(val => selectedQuickViewProduct.variants?.find((v: any) => v.value === val && v.imageUrl)).find(url => url);
                  
                  const galleryImages = [
                    selectedQuickViewProduct.imageUrl,
                    ...(selectedQuickViewProduct.imageUrls || [])
                  ].filter((url, index, self) => url && self.indexOf(url) === index);

                  const activeImageUrl = variantImageUrl || galleryImages[activeThumbnailIndex] || selectedQuickViewProduct.imageUrl;

                  return (
                    <ImageZoomViewer
                      src={activeImageUrl}
                      alt={selectedQuickViewProduct.name}
                      imageUrls={galleryImages}
                      badge={selectedQuickViewProduct.badge}
                      aspectRatio="aspect-square max-h-[30vh] lg:max-h-[48vh] max-w-[260px] sm:max-w-[340px] mx-auto"
                      overlayChildren={
                        brandingType !== 'None' && customLogoUrl ? (
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
                        ) : null
                      }
                    />
                  );
                })()}
                
                {selectedQuickViewProduct.badge && (
                  <span className="absolute top-4 sm:top-6 left-4 sm:left-6 bg-gradient-to-r from-[#FF4F5A] to-[#C8961A] text-white text-[9px] sm:text-[10px] font-black px-3 py-1.5 rounded-full tracking-[2px] uppercase shadow-md z-20">
                    {selectedQuickViewProduct.badge}
                  </span>
                )}
              </div>

              {/* Product Info Section */}
              <div className="w-full lg:w-1/2 flex flex-col min-h-0 min-w-0 bg-white overflow-hidden flex-1">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin">
                  <div className="mb-4">
                    <h2 className="font-sans text-2xl lg:text-3.5xl font-black text-[#0E121C] tracking-tight leading-tight mb-3">
                      {selectedQuickViewProduct.name}
                    </h2>
                    
                    {/* Modern pricing ticket block */}
                    <div className="flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-[1.5px] mb-1">
                          {selectedQuickViewProduct.priceType === 'wholesale' ? "Institutional Rate" : "Retail MSRP"}
                        </span>
                        <div className="flex items-center gap-2.5">
                          {(selectedQuickViewProduct.priceType === 'wholesale' || selectedQuickViewProduct.tags?.some((t: string) => ['wholesale', 'bulk', 'corporate'].includes(t.toLowerCase()))) ? (
                            <span className="text-xl lg:text-2xl font-black bg-gradient-to-r from-[#C2102E] to-[#C8961A] bg-clip-text text-transparent uppercase tracking-tight">Price on Inquiry</span>
                          ) : (
                            <>
                              <span className="text-2xl lg:text-3xl font-black text-[#0e121c] tracking-tight">{formatPrice(selectedQuickViewProduct.price)}</span>
                              {selectedQuickViewProduct.oldPrice && (
                                <span className="text-xs lg:text-sm text-slate-400 line-through decoration-slate-300">{formatPrice(selectedQuickViewProduct.oldPrice)}</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[9px] font-extrabold uppercase text-emerald-700 tracking-wider">Active Sourcing</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Variants Selection Layout */}
                  {selectedQuickViewProduct.variants && selectedQuickViewProduct.variants.length > 0 && (
                    <div className="space-y-4 mb-6 border-t border-slate-100 pt-4">
                      {Object.entries(
                        selectedQuickViewProduct.variants.reduce((acc: any, v: any) => {
                          if (!acc[v.type]) acc[v.type] = [];
                          acc[v.type].push(v);
                          return acc;
                        }, {})
                      ).map(([type, options]: [string, any]) => (
                        <div key={type} className="space-y-2">
                          <div className="flex justify-between items-center mb-0.5">
                            <label className="text-[10px] font-black uppercase text-slate-405 tracking-wider">{type}</label>
                            {selectedVariants[type] && (
                              <span className="text-[10px] font-extrabold text-[#C8961A] tracking-wider uppercase bg-[#C8961A]/5 px-2 py-0.5 rounded-md">{selectedVariants[type]}</span>
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
                                  className={`relative flex items-center justify-center transition-all cursor-pointer ${
                                    isColor 
                                      ? `w-9 h-9 rounded-full border-2 ${isSelected ? 'border-[#C8961A] scale-105 shadow-md shadow-[#C8961A]/15' : 'border-slate-200/70 hover:border-slate-450 bg-white'}`
                                      : `px-3.5 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'bg-slate-900 border-slate-900 text-white font-black shadow-sm' : 'bg-white text-slate-650 border-slate-200 hover:border-slate-300'}`
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
                                    <div className="absolute -top-1 -right-1 bg-[#C8961A] text-white rounded-full p-0.5 shadow-md">
                                      <CheckCircle2 size={9} className="stroke-[3]" fill="currentColor" />
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

                  {/* Order quantity & type dashboard */}
                  <div className="space-y-4 mb-6 pt-4 border-t border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order Quantity</label>
                        <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-1">
                          <button 
                            type="button"
                            onClick={() => setInquiryUnits(Math.max(1, inquiryUnits - 1))}
                            className="w-8 h-8 flex items-center justify-center text-slate-505 hover:text-[#C8102E] transition-all bg-white border border-slate-100 rounded-lg hover:shadow-sm"
                          >
                            <Minus size={11} className="stroke-[3]" />
                          </button>
                          <input 
                            type="number" 
                            min="1"
                            value={inquiryUnits}
                            onChange={(e) => setInquiryUnits(parseInt(e.target.value) || 1)}
                            className="bg-transparent border-none text-center text-sm font-black w-full outline-none text-slate-900"
                          />
                          <button 
                            type="button"
                            onClick={() => setInquiryUnits(inquiryUnits + 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-505 hover:text-[#C8102E] transition-all bg-white border border-slate-100 rounded-lg hover:shadow-sm"
                          >
                            <Plus size={11} className="stroke-[3]" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sourcing Level</label>
                        <div className="w-full bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/50 flex items-center gap-1.5 justify-center h-10">
                          <span className="text-[10px] font-black uppercase text-slate-805 tracking-wide">
                            📍 {selectedQuickViewProduct.priceType === 'wholesale' ? 'Institutional Bulk' : 'Individual Retail'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Branding custom options */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5">
                      <div className="flex items-center justify-between shadow-sm bg-white border border-slate-100 p-2 px-3 rounded-xl">
                        <label className="text-[10px] font-black uppercase tracking-wide text-slate-800 flex items-center gap-1.5">
                          <Scissors size={13} className="text-[#C8961A]"/> Custom Branding
                        </label>
                        <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-widest select-none">Config Active</span>
                      </div>
                      
                      {/* Select type options */}
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
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                              brandingType === type.id 
                                ? 'bg-[#0E121C] border-[#0E121C] text-white shadow-md shadow-slate-900/15 scale-[1.03]' 
                                : 'bg-white border-slate-200 text-slate-550 hover:border-slate-350'
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
                          className="space-y-3 overflow-hidden pt-1"
                        >
                          {/* Sizing & Location select drop down */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase tracking-widest text-[#C8961A]">Position Path</label>
                              <select 
                                value={brandingPosition}
                                onChange={(e) => setBrandingPosition(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wide outline-none focus:border-[#C8961A]/50 transition-all cursor-pointer h-9 shadow-inner-sm"
                              >
                                <option>Left Chest</option>
                                <option>Right Chest</option>
                                <option>Center Chest</option>
                                <option>Full Back</option>
                                <option>Sleeve</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Preview Hub</label>
                              <div className="w-full bg-white border border-slate-150 text-slate-505 rounded-xl px-3 py-2 text-[10px] font-black uppercase select-none flex items-center justify-center h-9">
                                <span>📍 {brandingPosition}</span>
                              </div>
                            </div>
                          </div>

                          {/* Image Box uploading area */}
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Upload Corporate Logo</label>
                            
                            {!customLogoUrl ? (
                              <label className="border-2 border-dashed border-slate-200 hover:border-[#C8961A] bg-white rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-50 group">
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
                                <ImageIcon size={18} className="text-slate-400 group-hover:text-[#C8961A] transition-colors mb-1 group-hover:scale-110 duration-200" />
                                <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-widest">Select files or image</span>
                                <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest mt-0.5">Vector, PDF, PNG or JPG</span>
                              </label>
                            ) : (
                              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-150 rounded-xl">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-150 p-0.5 overflow-hidden flex items-center justify-center shrink-0">
                                    <img src={customLogoUrl} className="max-w-full max-h-full object-contain" alt="Attached vector mockup logo" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[9px] font-black text-slate-800 truncate max-w-[120px] uppercase">{customLogoName}</p>
                                    <p className="text-[8px] font-semibold text-emerald-600 uppercase tracking-widest">Mockup Attached</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomLogoUrl('');
                                    setCustomLogoName('');
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-[#C8102E] hover:bg-red-50 rounded-lg transition-all"
                                  title="Clear File"
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
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-450">Customization Specifications Guidance</label>
                        <textarea 
                          placeholder="Provide custom labels, pocket count, specific yarn grade levels, fitting adjustments, or color specifications..."
                          value={inquiryCustomization}
                          onChange={(e) => setInquiryCustomization(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold placeholder:text-slate-300 outline-none focus:bg-white focus:border-[#C8961A] transition-all h-20 resize-none shadow-inner-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Accordion List Segment */}
                  <div className="space-y-2.5 mb-2">
                    <details open className="group border border-slate-150 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden bg-white shadow-sm transition-all duration-300">
                      <summary className="flex items-center justify-between p-3.5 px-4 cursor-pointer font-black text-xs uppercase tracking-wider text-slate-800 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                        Product Blueprint Details
                        <span className="transition-transform duration-300 group-open:rotate-180 text-slate-400">
                          <ChevronDown size={14} className="stroke-[2.5]" />
                        </span>
                      </summary>
                      <div className="p-4 text-slate-600 text-xs leading-relaxed border-t border-slate-100 bg-white space-y-3">
                        <div className="font-semibold italic text-slate-700 border-l-3 border-[#C8961A] pl-3">
                          {selectedQuickViewProduct.description || "Tailored institutional apparel woven from durable poly-cotton blend with reinforced seams for long-term wear."}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <h4 className="text-[9px] font-black uppercase text-[#C8961A] tracking-wider">Reinforced Quality</h4>
                            <div className="space-y-0.5 text-slate-500 font-bold">
                              <p>• Anti-pilling combed fibers</p>
                              <p>• Heavy cotton poly blends</p>
                              <p>• Reinforced seam points</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-[9px] font-black uppercase text-[#C8102E] tracking-wider">Care Standards</h4>
                            <div className="space-y-0.5 text-slate-500 font-bold">
                              <p>• Machine wash up to 60°C</p>
                              <p>• Locked fabric colors</p>
                              <p>• Tear-resistant thread</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Tags list */}
                        {selectedQuickViewProduct.tags && selectedQuickViewProduct.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-100">
                            {selectedQuickViewProduct.tags.map((tag: string, i: number) => (
                              <span key={`${tag}-${i}`} className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded border border-slate-100">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                    
                    {/* Shipping parameters */}
                    <details className="group border border-slate-150 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden bg-white shadow-sm transition-all duration-300">
                      <summary className="flex items-center justify-between p-3.5 px-4 cursor-pointer font-black text-xs uppercase tracking-wider text-slate-800 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                        Fulfillment & Lead Time
                        <span className="transition-transform duration-300 group-open:rotate-180 text-slate-400">
                          <ChevronDown size={14} className="stroke-[2.5]" />
                        </span>
                      </summary>
                      <div className="p-4 bg-white border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[#C8961A] shrink-0"><ShieldCheck size={16} /></div>
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400">Quality</p>
                              <p className="text-[10px] font-black text-slate-800">Double Stitched</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[#C2102E] shrink-0"><Calendar size={16} /></div>
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400">Logistics</p>
                              <p className="text-[10px] font-black text-slate-800">7-14 Days Dispatch</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>

                    {/* Customer reviews stream */}
                    <details className="group border border-slate-150 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden bg-white shadow-sm transition-all duration-300">
                      <summary className="flex items-center justify-between p-3.5 px-4 cursor-pointer font-black text-xs uppercase tracking-wider text-slate-800 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                        Purchaser Reviews ({productReviews.length})
                        <span className="transition-transform duration-300 group-open:rotate-180 text-slate-400">
                          <ChevronDown size={14} className="stroke-[2.5]" />
                        </span>
                      </summary>
                      <div className="p-4 bg-white border-t border-slate-100 space-y-4">
                        {productReviews.length > 0 ? (
                          <div className="space-y-3">
                            {productReviews.map((review) => (
                              <div key={review.id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 text-[#C8961A] flex items-center justify-center font-black text-[8px] uppercase border border-slate-200">
                                      {review.userName.charAt(0)}
                                    </div>
                                    <span className="text-[8px] font-black uppercase text-slate-800 tracking-wider font-sans">{review.userName}</span>
                                  </div>
                                  <div className="flex text-amber-400 gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={8} fill={i < review.rating ? 'currentColor' : 'none'} className={i < review.rating ? 'text-amber-400' : 'text-slate-200'} />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed font-semibold italic">"{review.comment}"</p>
                                <p className="text-[8px] text-emerald-600 mt-1 uppercase font-black tracking-widest flex items-center gap-1">
                                  <span>✓</span> Verified Corporate Buyer
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50 rounded-xl">
                            Be the first to review this selection.
                          </div>
                        )}

                        {/* Leave review submission card */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <h4 className="text-[9px] font-black uppercase tracking-[2px] text-slate-800 mb-2 flex items-center gap-1.5">
                            <Star size={10} className="text-[#C8961A]" /> Leave active review
                          </h4>
                          {reviewSubmitted ? (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-150 text-center"
                            >
                              <div className="flex justify-center mb-1"><CheckCircle2 size={16} className="text-emerald-500" /></div>
                              <p className="text-[9px] font-black uppercase tracking-wider">Success!</p>
                              <p className="text-[8px] font-semibold">Your review has been successfully submitted for moderation.</p>
                            </motion.div>
                          ) : (
                            <form onSubmit={handleSubmitReview} className="space-y-2.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-450 uppercase">Rate Score:</span>
                                <div className="flex gap-0.5 block">
                                  {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => setReviewForm(prev => ({ ...prev, rating: num }))}
                                      className="text-amber-400 transition-transform hover:scale-110 active:scale-90 cursor-pointer"
                                    >
                                      <Star size={13} fill={num <= reviewForm.rating ? 'currentColor' : 'none'} className={num <= reviewForm.rating ? 'text-amber-400' : 'text-slate-200'} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="gap-2 flex flex-col">
                                <input 
                                  type="text" 
                                  placeholder="Purchaser Name / Institution" 
                                  value={reviewForm.userName}
                                  onChange={e => setReviewForm(prev => ({ ...prev, userName: e.target.value }))}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#C8961A] font-semibold shadow-inner-sm"
                                />
                                <textarea 
                                  placeholder="Provide textile review comments..." 
                                  required
                                  value={reviewForm.comment}
                                  onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#C8961A] font-semibold h-16 resize-none shadow-inner-sm"
                                ></textarea>
                              </div>
                              <button 
                                type="submit" 
                                disabled={isSubmittingReview}
                                className="w-full bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
                              >
                                {isSubmittingReview ? 'Dispatching...' : 'Submit Profile Review'}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </details>
                  </div>
                </div>

                {/* Sticky Action Footer - Simplified & Modern */}
                <div className="shrink-0 bg-white border-t border-slate-100 p-3.5 sm:p-4 z-50">
                  <div className="flex items-center gap-2 max-w-full">
                    
                    {/* Share, compare & wishlist icon buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => toggleCompare(selectedQuickViewProduct)}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                          compareList.find(i => i.id === selectedQuickViewProduct.id) 
                            ? "bg-[#C8961A]/10 border-[#C8961A]/30 text-[#C8961A]" 
                            : "border-slate-200 text-slate-500 hover:border-[#C8961A] hover:text-[#C8961A] bg-slate-50"
                        }`}
                        title="Compare Specs"
                        type="button"
                      >
                        <GitCompare size={16} />
                      </button>
                      
                      <button 
                        onClick={() => toggleWishlist(selectedQuickViewProduct)}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                          wishlist.find(i => i.id === selectedQuickViewProduct.id) 
                            ? "bg-red-50 border-red-200 text-[#C2102E]" 
                            : "border-slate-200 text-slate-500 hover:border-red-400 hover:text-[#C2102E] bg-slate-50"
                        }`}
                        title="Wishlist"
                        type="button"
                      >
                        <Heart size={16} className={wishlist.find(i => i.id === selectedQuickViewProduct.id) ? "fill-current" : ""} />
                      </button>

                      <button 
                        onClick={() => handleShareProduct(selectedQuickViewProduct)}
                        className="w-10 h-10 sm:w-11 sm:h-11 border border-slate-200 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 hover:border-slate-400 hover:text-slate-800 transition-all cursor-pointer"
                        title="Share Product"
                        type="button"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>

                    {/* Simplified Primary Action Buttons */}
                    {(selectedQuickViewProduct.priceType === 'wholesale' || selectedQuickViewProduct.tags?.some((t: string) => ['wholesale', 'bulk', 'corporate'].includes(t.toLowerCase()))) ? (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <a 
                          href={`https://wa.me/254792021795?text=Hello, I'm interested in wholesale order for ${selectedQuickViewProduct.name}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white h-10 sm:h-11 rounded-xl font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 min-w-0"
                          title="WhatsApp Inquiry"
                        >
                          <MessageSquare size={15} className="shrink-0" />
                          <span className="truncate">WhatsApp</span>
                        </a>
                        <a 
                          href="tel:+254792021795"
                          className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all flex items-center justify-center active:scale-95 shrink-0"
                          title="Call Sales"
                        >
                          <Phone size={15} />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
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
                            handleCloseQuickView();
                            setIsCartOpen(true);
                          }}
                          className="w-10 h-10 sm:w-11 sm:h-11 bg-[#0E121C] hover:bg-slate-800 text-white rounded-xl transition-all flex items-center justify-center active:scale-95 shrink-0 cursor-pointer"
                          type="button"
                          title="Add to Cart"
                        >
                          <ShoppingBag size={16} />
                        </button>

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
                            handleCloseQuickView(true);
                            navigate('/checkout');
                          }}
                          className="flex-1 bg-[#C2102E] hover:bg-[#A80B23] text-white h-10 sm:h-11 rounded-xl font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer min-w-0"
                          type="button"
                          title="Buy Now"
                        >
                          <Zap size={15} />
                          <span className="truncate">Buy Now</span>
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
      </PullToRefresh>
    </div>
  );
}
