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
import { Link, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, doc, getDoc, setDoc, increment } from 'firebase/firestore';

interface PageProps {
  cart: any[];
  setCart: React.Dispatch<React.SetStateAction<any[]>>;
  wishlist: any[];
  setWishlist: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function HomePage({ cart, setCart, wishlist, setWishlist }: PageProps) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);

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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [activeModalPromo, setActiveModalPromo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [megaMenus, setMegaMenus] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [compareList, setCompareList] = useState<any[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [discountRules, setDiscountRules] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const lastWishlistRef = useRef<string>('');

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleShareProduct = async (product: any) => {
    const shareUrl = `${window.location.host === 'localhost:3000' ? 'http://localhost:3000' : 'https://' + window.location.host}/product/${product.id}`;
    const shareData = {
      title: `${product.name} | Naisiae Textiles Limited`,
      text: `Check out ${product.name} - ${product.description || 'Premium custom uniforms and branding.'}\nPrice: KES ${product.price?.toLocaleString()}`,
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
    }
  }, [selectedQuickViewProduct]);

  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', userName: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ name: '', email: '', phone: '', service: 'General Enquiry', details: '' });

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

    const qPromos = query(collection(db, 'promotions'), where('active', '==', true));
    const unsubscribePromos = onSnapshot(qPromos, (snapshot) => {
      setPromotions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'promotions');
    });

    // Fetch Categories
    const qCats = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
    const unsubscribeCats = onSnapshot(qCats, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    // Fetch Site Settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSiteSettings(snapshot.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/site');
    });

    // Fetch Discount Rules
    const unsubscribeDiscountRules = onSnapshot(collection(db, 'discountRules'), (snapshot) => {
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

    // Local storage persistence
    const savedCart = localStorage.getItem('nt_cart');
    const savedWishlist = localStorage.getItem('nt_wishlist');
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

    // Firebase Wishlist Sync
    let unsubscribeWishlist: any;
    if (auth.currentUser) {
      const wishlistRef = doc(db, 'wishlists', auth.currentUser.uid);
      unsubscribeWishlist = onSnapshot(wishlistRef, (doc) => {
        if (doc.exists()) {
          const remoteItems = (doc.data() as any).items || [];
          setWishlist(remoteItems);
          lastWishlistRef.current = JSON.stringify(remoteItems); // Update ref to avoid reflecting back
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `wishlists/${auth.currentUser?.uid}`);
      });
    }

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
      unsubscribePromos();
      unsubscribeSettings();
      unsubscribeDiscountRules();
      unsubscribeMegaMenus();
      if (unsubscribeWishlist) unsubscribeWishlist();
    };
  }, []);

  const displayProducts = useMemo(() => {
    return products.filter(p => {
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
  }, [products, searchQuery, activeTag, activeTab, activeSubCategory]);

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
    const currentWishlistStr = JSON.stringify(wishlist);
    localStorage.setItem('nt_wishlist', currentWishlistStr);
    
    // Sync to Firebase if logged in AND data has actually changed
    if (auth.currentUser && currentWishlistStr !== lastWishlistRef.current) {
      lastWishlistRef.current = currentWishlistStr;
      setDoc(doc(db, 'wishlists', auth.currentUser.uid), { 
        items: wishlist, 
        email: auth.currentUser?.email, 
        displayName: auth.currentUser?.displayName,
        updatedAt: serverTimestamp() 
      }, { merge: true });
    }
  }, [wishlist]);

  useEffect(() => {
    if (siteSettings) {
      const siteName = siteSettings.siteName || 'Uhuru Market Uniforms';
      const tagline = siteSettings.siteTagline || 'Premium Uniforms & Branding';
      const description = siteSettings.sharingDescription || 'Premium uniform manufacturing and textile solutions in Nairobi. Custom branding, bulk orders, and quality fabrics.';
      const sharingImage = siteSettings.sharingImage || siteSettings.siteLogo || 'https://naisiaetextile.com/og-image.jpg';

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

  const addToCart = (product: any) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const toggleWishlist = (product: any) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.filter(item => item.id !== product.id);
      return [...prev, product];
    });
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
  const cartTotal = subtotal - discountAmount;

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
      setCart([]);
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
      {/* Top Promotion Bar & Navbar */}
      <Navbar 
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        compareCount={compareList.length}
        setIsCartOpen={setIsCartOpen}
        setIsWishlistOpen={setIsWishlistOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
        setIsCompareModalOpen={setIsCompareModalOpen}
      />

      {/* High-End Cinematic Hero Slider Section */}
      <section className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden bg-[#0A1628]">
        {/* Living Background Image Layer with Ken Burns effect */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.15, filter: 'blur(10px)' }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                filter: 'blur(0px)',
                transition: { duration: 2.5, ease: [0.22, 1, 0.36, 1] }
              }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)', transition: { duration: 1.8 } }}
              className="absolute inset-0"
            >
              <img 
                src={siteSettings?.heroImages?.[currentSlide]?.url || "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=1920&auto=format&fit=crop"} 
                className="w-full h-full object-cover object-center"
                alt={siteSettings?.heroImages?.[currentSlide]?.title || 'Hero'}
                loading="eager"
                referrerPolicy="no-referrer"
                fetchPriority="high"
              />
              {/* Complex Cinematic Lighting System */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628] via-[#0A1628]/40 to-transparent"></div>
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(200,150,26,0.1),_transparent_70%)]"></div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Brand Content Intersection */}
        <div className="relative z-20 w-full h-full max-w-[1440px] mx-auto px-6 lg:px-24 flex items-center">
          <div className="max-w-5xl">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentSlide}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="space-y-12"
              >
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-4 px-6 py-2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8961A] animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-[5px] text-white">
                    {siteSettings?.siteTagline || "EST. 1994 • NAIROBI, KENYA"}
                  </span>
                </motion.div>

                <div className="space-y-6">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="font-display font-medium text-6xl md:text-8xl lg:text-[120px] text-white leading-[0.85] tracking-[-0.04em] text-shadow-2xl"
                  >
                    {siteSettings?.heroImages?.[currentSlide]?.title || "CRAFTING"} <br/>
                    <span className="text-[#C8961A] italic">{siteSettings?.heroImages?.[currentSlide]?.subtitle ? 'PRECELLENCE' : 'LEGACY'}</span>
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-white/60 max-w-2xl text-lg md:text-2xl leading-relaxed font-light tracking-wide italic border-l-2 border-[#C8961A] pl-8"
                  >
                    {siteSettings?.heroImages?.[currentSlide]?.subtitle || "Engineered textiles for the modern institution. Quality guaranteed for generations."}
                  </motion.p>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex flex-wrap gap-6 pt-6"
                >
                  <Link
                    to={siteSettings?.heroImages?.[currentSlide]?.link || "/products"}
                    className="group relative px-12 py-6 bg-[#C8102E] text-white rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(200,16,46,0.4)]"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    <span className="relative z-10 text-[11px] font-black uppercase tracking-[4px] flex items-center gap-4">
                      Explore Inventory <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                    </span>
                  </Link>
                  <button
                    onClick={() => setIsQuoteModalOpen(true)}
                    className="px-12 py-6 bg-white/5 backdrop-blur-2xl border border-white/20 text-white rounded-2xl transition-all duration-500 hover:bg-white hover:text-[#0A1628] shadow-2xl"
                  >
                    <span className="text-[11px] font-black uppercase tracking-[4px] flex items-center gap-4">
                      Custom Quotation <Scissors size={18} />
                    </span>
                  </button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* High-End Cinematic Hero Content Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="w-full h-full max-w-[1440px] mx-auto px-6 lg:px-24 flex items-center">
            <div className="max-w-5xl pointer-events-auto">
              {/* ... (Existing hero content is already above this in my logic? Wait, I need to be careful) */}
            </div>
          </div>
        </div>

        {/* Luxurious Slider Pagination & Social Indicators */}
        <div className="absolute bottom-12 right-12 z-30 flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-6 pr-8 border-r border-white/10 uppercase tracking-[4px] text-[8px] font-black text-white/40">
            <span>Follow Our Journey</span>
            <div className="flex gap-4">
              <Link to="#" className="hover:text-[#C8961A] transition-colors">FB</Link>
              <Link to="#" className="hover:text-[#C8961A] transition-colors">IG</Link>
              <Link to="#" className="hover:text-[#C8961A] transition-colors">LI</Link>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {siteSettings?.heroImages?.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className="group relative flex flex-col items-center gap-4 py-2"
              >
                <span className={`text-[10px] font-black transition-all ${currentSlide === idx ? 'text-[#C8961A] translate-y-0 opacity-100' : 'text-white/20 translate-y-2 opacity-0'}`}>
                  0{idx + 1}
                </span>
                <div className="relative w-12 h-[2px] bg-white/10 overflow-hidden rounded-full">
                  <motion.div 
                    initial={false}
                    animate={{ 
                      scaleX: currentSlide === idx ? 1 : 0,
                      opacity: currentSlide === idx ? 1 : 0
                    }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 bg-[#C8961A] origin-left"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cinematic Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3 opacity-30 hover:opacity-100 transition-opacity cursor-pointer group"
          onClick={() => document.getElementById('specialties')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white to-transparent group-hover:via-[#C8961A] transition-colors"></div>
          <span className="text-[7px] font-black uppercase tracking-[5px] text-white group-hover:text-[#C8961A] transition-colors">Explore Cabinet</span>
        </motion.div>

        {/* Static Float Search Bar Overlay (Refined Glass) */}
        <div className="absolute inset-x-0 bottom-24 z-30 pointer-events-none flex justify-center px-6 lg:px-0">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="w-full max-w-2xl pointer-events-auto"
          >
            <div className="relative group">
              <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                <Search className="text-white/20 group-focus-within:text-[#C8961A] transition-all" size={24} />
              </div>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length > 0 && setShowSearchSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                placeholder="Search collection..."
                className="w-full bg-white/5 backdrop-blur-[40px] border border-white/10 rounded-full pl-20 pr-10 py-7 text-white text-xl outline-none focus:bg-white focus:text-[#0A1628] focus:ring-[15px] focus:ring-[#C8961A]/10 transition-all shadow-[0_30px_100px_rgba(0,0,0,0.5)] placeholder:text-white/20"
              />
              <AnimatePresence>
                {showSearchSuggestions && searchResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    className="absolute bottom-full left-0 right-0 mb-8 bg-white/95 backdrop-blur-3xl rounded-[3rem] shadow-4xl border border-white/20 overflow-hidden max-h-[500px] overflow-y-auto"
                  >
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center px-8">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Match Results</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#C8961A]">{searchResults.length} Products Found</span>
                    </div>
                    {searchResults.map((product) => (
                      <div 
                        key={product.id}
                        onClick={() => {
                          const el = document.getElementById(`product-${product.id}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                          setSearchQuery('');
                        }}
                        className="p-6 hover:bg-[#C8961A]/5 cursor-pointer flex items-center gap-6 transition-colors group"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 group-hover:border-[#C8961A]/30">
                          <img src={product.imageUrl} className="w-full h-full object-contain p-2" alt="" loading="lazy" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-[#0A1628] uppercase tracking-wide truncate">{product.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-[#C8102E]">KES {product.price.toLocaleString()}</p>
                          <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">Available</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Categories (Connected to Admin) */}
      <section id="specialties" className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <div className="flex items-center gap-3 text-[#C8102E] text-[10px] font-black tracking-[4px] uppercase mb-4">
                <div className="w-8 h-[2px] bg-[#C8102E]"></div> Our Specialties
              </div>
              <h2 className="text-4xl lg:text-5xl font-display text-[#0A1628] leading-none mb-4">
                Featured Categories
              </h2>
            </div>
            <Link to="/products" className="hidden sm:flex text-sm font-bold text-[#0A1628] hover:text-[#C8102E] transition-colors items-center gap-2">
              Explore Catalog <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
            {categories.length > 0 ? (
              categories.slice(0, 4).map((cat, idx) => (
                <motion.div 
                  key={cat.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="group relative h-[350px] rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer"
                  onClick={() => {
                    setActiveTab(cat.title);
                    const shopEl = document.getElementById('shop');
                    if (shopEl) shopEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <div className="absolute inset-0">
                    {cat.image ? (
                      <img src={cat.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={cat.title} loading="lazy" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center"><Package size={40} className="text-slate-200" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="absolute bottom-8 left-8 right-8">
                    {cat.subtitle && <p className="text-[10px] text-[#C8961A] font-black uppercase tracking-[2px] mb-2">{cat.subtitle}</p>}
                    <h3 className="text-xl font-bold text-white mb-4 line-clamp-2">{cat.title}</h3>
                    <div className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">
                      Shop Now <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-[350px] bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center animate-pulse">
                  <Package className="text-slate-200 mb-4" size={40} />
                  <div className="w-1/2 h-2 bg-slate-200 rounded mb-2"></div>
                  <div className="w-1/3 h-2 bg-slate-200 rounded"></div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Wholesale Excellence Block */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className="bg-[#0A1628] rounded-[2rem] lg:rounded-[3.5rem] overflow-hidden relative group shadow-2xl">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#C8961A] via-transparent to-transparent"></div>
            </div>
            
            <div className="flex flex-col lg:flex-row items-center">
              <div className="lg:w-1/2 p-8 lg:p-20 relative z-10">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-3 text-[#C8961A] text-[10px] font-black tracking-[4px] uppercase mb-4">
                    <div className="w-8 h-[2px] bg-[#C8961A]"></div> Wholesale Excellence
                  </div>
                  <h2 className="font-display text-5xl lg:text-8xl text-white leading-[0.85] mb-8">
                    Bulk Orders & <br/> <span className="text-[#C8961A]">Wholesale Deals</span>
                  </h2>
                  <p className="text-white/60 text-sm lg:text-base leading-relaxed mb-12 max-w-lg font-medium">
                    Naisiae Textiles Limited specializes in high-volume production for schools, distributors, and corporate institutions. Our wholesale program offers the most competitive rates in Kenya with guaranteed turnaround times.
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => setIsQuoteModalOpen(true)}
                      className="px-8 lg:px-12 py-5 bg-[#C8102E] text-white text-[11px] font-black uppercase tracking-[3px] rounded-2xl hover:bg-white hover:text-[#C8102E] transition-all shadow-xl shadow-black/40 active:scale-95"
                    >
                      Request Bulk Pricing
                    </button>
                    <button 
                      onClick={() => {
                          const el = document.getElementById('wholesale-deals');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="px-8 lg:px-12 py-5 bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase tracking-[3px] rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                    >
                      Shop Wholesale
                    </button>
                  </div>

                  <div className="mt-12 grid grid-cols-3 gap-6 lg:gap-10 border-t border-white/5 pt-10">
                    <div>
                      <div className="text-[#C8961A] font-display text-3xl leading-none mb-1">KES 500k+</div>
                      <div className="text-[9px] text-white/40 uppercase font-black tracking-widest">Monthly Capacity</div>
                    </div>
                    <div>
                      <div className="text-[#C8961A] font-display text-3xl leading-none mb-1">100+</div>
                      <div className="text-[9px] text-white/40 uppercase font-black tracking-widest">Partner Schools</div>
                    </div>
                    <div>
                      <div className="text-[#C8961A] font-display text-3xl leading-none mb-1">48HR</div>
                      <div className="text-[9px] text-white/40 uppercase font-black tracking-widest">Quote Response</div>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              <div className="lg:w-1/2 w-full aspect-video lg:aspect-auto self-stretch relative overflow-hidden">
                <motion.img 
                  initial={{ scale: 1.2, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1.5 }}
                  viewport={{ once: true }}
                  src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1600&auto=format&fit=crop" 
                  className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
                  alt="Wholesale Textiles"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628] via-transparent to-transparent lg:via-[#0A1628]/20"></div>
                
                {/* Floating Discount Badge */}
                <motion.div 
                  initial={{ y: 20, rotate: 0 }}
                  whileInView={{ y: 0, rotate: 12 }}
                  transition={{ type: 'spring', delay: 0.5 }}
                  viewport={{ once: true }}
                  className="absolute top-10 right-10 bg-[#C8961A] text-white p-6 lg:p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center border-4 border-[#0A1628]"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none opacity-80 mb-1">Up To</span>
                  <span className="font-display text-6xl lg:text-8xl leading-none">40%</span>
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Off Bulk Orders</span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wholesale Deals Products */}
      <section id="wholesale-deals" className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <div className="flex items-center gap-2.5 text-[#C8102E] text-[10px] font-extrabold tracking-[5px] uppercase mb-2">
                <div className="w-7 h-0.5 bg-[#C8102E]"></div> Bulk Pricing Available
              </div>
              <h2 className="font-display text-5xl tracking-tight leading-none text-[#0A1628]">Wholesale Deals</h2>
            </div>
            <Link to="/wholesale" className="text-[12px] font-black uppercase tracking-wider text-[#1C3560] hover:text-[#C8102E] transition-colors border-b-2 border-transparent hover:border-[#C8102E] pb-1 flex items-center gap-2">
              View All Wholesale Items <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-8">
            {products
              .filter(p => p.tags?.some((t: string) => t.toLowerCase() === 'wholesale' || t.toLowerCase() === 'bulk' || t.toLowerCase() === 'corporate'))
              .slice(0, 5)
              .map(product => (
                <motion.div 
                  key={product.id}
                  whileHover={{ y: -6 }}
                  className="group bg-white border border-[#E4E8EF] rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#FDFAF4] cursor-pointer flex items-center justify-center p-2" onClick={() => setSelectedQuickViewProduct(product)}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105" loading="lazy" referrerPolicy="no-referrer" />
                    ) : (
                      <Package size={40} className="text-[#C8961A]/20" />
                    )}
                    <span className="absolute top-3 left-3 bg-[#C8961A] text-white text-[10px] font-bold px-2.5 py-1 rounded tracking-widest uppercase">Wholesale</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-[14px] mb-1 leading-tight line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[14px] font-black text-[#C8102E]">KES {product.price.toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => setSelectedQuickViewProduct(product)}
                      className="w-full py-2 bg-slate-50 hover:bg-[#1C3560] hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))
            }
            {products.filter(p => p.tags?.some((t: string) => t.toLowerCase() === 'wholesale' || t.toLowerCase() === 'bulk' || t.toLowerCase() === 'corporate')).length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Package className="mx-auto text-slate-300 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Wholesale Collection Launching Soon</p>
                <p className="text-[11px] text-slate-400 mt-2 font-medium">Contact us directly for bulk pricing on any catalog item.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="catalog-section" className="py-20 max-w-[1440px] mx-auto px-8">
        <div className="flex flex-col lg:flex-row justify-between lg:items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2.5 text-[#C8961A] text-[10px] font-extrabold tracking-[5px] uppercase mb-2">
              <div className="w-7 h-0.5 bg-[#C8961A]"></div> Featured Products
            </div>
            <h2 className="font-display text-5xl tracking-tight leading-none text-[#0A1628]">Top Flash Deals</h2>
            
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-4 mt-8">
              {['all', 'School Uniforms', 'College Wear', 'Corporate Wear', 'Sports Kits'].map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setActiveSubCategory(null);
                  }}
                  className={`text-[12px] font-black uppercase tracking-widest pb-2 transition-all border-b-2 ${
                    activeTab === tab 
                      ? 'text-[#C8102E] border-[#C8102E]' 
                      : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Sub-Category Filter for Uniforms */}
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
                {uniformSubCategories.map(subCat => (
                  <button
                    key={subCat}
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
            
            {/* Tag & Search Selection UI */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setActiveTag(null)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!activeTag ? 'bg-[#1C3560] text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  All items
                </button>
                {allTags.map(tag => (
                  <button 
                    key={tag}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.length > 0 ? displayProducts.map((product) => (
            <motion.div 
              key={product.id}
              whileHover={{ y: -6 }}
              className="group bg-white border border-[#E4E8EF] rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#FDFAF4] cursor-pointer flex items-center justify-center p-2" onClick={() => setSelectedQuickViewProduct(product)}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105" loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <Package size={40} className="text-[#C8961A]/20" />
                )}
                {product.badge && (
                  <span className="absolute top-3 left-3 bg-[#C8102E] text-white text-[10px] font-bold px-2.5 py-1 rounded tracking-widest uppercase">{product.badge}</span>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => toggleWishlist(product)}
                    className={`w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md transition-colors ${
                      wishlist.find(i => i.id === product.id) ? "text-[#C8102E]" : "hover:bg-[#C8102E] hover:text-white"
                    }`}
                  >
                    <Heart size={16} className={wishlist.find(i => i.id === product.id) ? "fill-current" : ""} />
                  </button>
                  <button 
                    onClick={() => handleShareProduct(product)}
                    className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#C8102E] hover:text-white transition-colors"
                  >
                    <Share2 size={16} />
                  </button>
                  <button 
                    onClick={() => setSelectedQuickViewProduct(product)}
                    className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#C8102E] hover:text-white transition-colors"
                  >
                    <Search size={16} />
                  </button>
                  <button 
                    onClick={() => toggleCompare(product)}
                    className={`w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md transition-all ${
                      compareList.find(i => i.id === product.id) 
                        ? "bg-[#C8961A] text-white scale-110" 
                        : "text-slate-400 hover:bg-[#C8961A] hover:text-white"
                    }`}
                    title="Compare Product"
                  >
                    <GitCompare size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4 cursor-pointer" onClick={() => setSelectedQuickViewProduct(product)}>
                <div className="text-[10px] text-[#15284A] font-bold tracking-widest uppercase mb-1">{product.category}</div>
                <h3 className="font-bold text-[15px] mb-1 leading-tight group-hover:text-[#C8102E] transition-colors">{product.name}</h3>
                <p className="text-[#6B7280] text-xs leading-relaxed mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-[#C8102E]">KES {product.price.toLocaleString()}</span>
                  {product.oldPrice && <span className="text-xs text-gray-400 line-through">KES {product.oldPrice.toLocaleString()}</span>}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                  className="mt-4 w-full bg-[#0A1628] hover:bg-[#C8102E] text-white py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-20 text-center text-gray-400">
              <p>No products found. Add some from the admin panel!</p>
            </div>
          )}
        </div>
      </section>

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
                {compareList.map(item => (
                  <div key={item.id} className="relative group/compare-item flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} className="w-12 h-12 rounded-xl object-contain bg-white border-2 border-white/10" />
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
                  <div key={item.id} className="w-10 h-10 rounded-full border-2 border-[#0A1628] overflow-hidden bg-white shadow-lg flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} className="w-full h-full object-contain p-0.5 bg-white" alt={item.name} />
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
              <div className="p-8 lg:p-12 border-b flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 text-[#C8961A] text-[10px] font-black tracking-[4px] uppercase mb-2">
                    <GitCompare size={16} /> Technical Analysis
                  </div>
                  <h2 className="font-display text-5xl text-[#0A1628] tracking-tight leading-none">Side-by-Side Comparison</h2>
                </div>
                <button 
                  onClick={() => setIsCompareModalOpen(false)}
                  className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-800 hover:text-red-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-x-auto p-8 lg:p-12">
                <div className="min-w-[1000px] grid grid-cols-[200px_repeat(4,1fr)] gap-8">
                  {/* Row: Main Header */}
                  <div className="flex flex-col justify-end pb-12">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[3px]">Specifications</p>
                  </div>
                  {compareList.map(item => (
                    <div key={item.id} className="text-center">
                      <div className="aspect-square rounded-3xl bg-slate-50 border border-slate-100 p-6 mb-6 overflow-hidden flex items-center justify-center shadow-inner">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} className="w-full h-full object-contain" alt={item.name} />
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
                  {compareList.map(item => (
                    <div key={item.id} className="py-8 border-t border-slate-100 text-center font-bold text-xs text-slate-600">
                      {item.subCategory || "-"}
                    </div>
                  ))}

                  {/* Row: Price */}
                  <div className="py-8 border-t border-slate-100 flex items-center text-[10px] font-black text-[#64748B] uppercase tracking-widest">
                    Unit Price
                  </div>
                  {compareList.map(item => (
                    <div key={item.id} className="py-8 border-t border-slate-100 text-center font-black text-2xl text-[#C8102E]">
                      KES {item.price.toLocaleString()}
                    </div>
                  ))}

                  {/* Row: Variants */}
                  <div className="py-8 border-t border-slate-100 flex items-center text-[10px] font-black text-[#64748B] uppercase tracking-widest">
                    Available Sizes/Colors
                  </div>
                  {compareList.map(item => (
                    <div key={item.id} className="py-8 border-t border-slate-100 text-center">
                      <div className="flex flex-wrap justify-center gap-2 px-4">
                        {item.variants?.length > 0 ? (
                          item.variants.slice(0, 5).map((v: any) => (
                            <span key={v.id} className="px-2 py-1 bg-slate-100 text-[9px] font-bold text-slate-500 rounded border border-slate-200">
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
                  {compareList.map(item => (
                    <div key={item.id} className="py-8 border-t border-slate-100 text-center">
                      <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto px-2">
                        {item.description || "Premium engineered textile with institutional-grade durability."}
                      </p>
                    </div>
                  ))}

                  {/* Row: Action */}
                  <div className="pt-12"></div>
                  {compareList.map(item => (
                    <div key={item.id} className="pt-12 text-center">
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
          <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-8 pt-16 lg:pt-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedQuickViewProduct(null)}
              className="absolute inset-0 bg-[#0A1628]/90 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full max-w-5xl bg-white lg:rounded-[2rem] rounded-t-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row h-[90vh] lg:h-auto lg:max-h-[85vh] mt-auto lg:mt-0"
            >
              <button 
                onClick={() => setSelectedQuickViewProduct(null)}
                className="absolute top-4 right-4 lg:top-6 lg:right-6 z-50 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-800 hover:text-red-500 transition-colors shadow-lg"
              >
                <X size={24} />
              </button>

              {/* Product Gallery Section */}
              <div className="w-full lg:w-1/2 bg-slate-50 relative flex items-center justify-center p-6 lg:p-12 shrink-0 h-[40vh] lg:h-auto">
                <AnimatePresence mode="wait">
                  {(() => {
                    const activeImageUrl = Object.values(selectedVariants).map(val => selectedQuickViewProduct.variants?.find((v: any) => v.value === val && v.imageUrl)).find(url => url) || selectedQuickViewProduct.imageUrl;
                    
                    return activeImageUrl ? (
                      <motion.img 
                        key={activeImageUrl}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        src={activeImageUrl} 
                        className="w-full h-full lg:h-auto lg:max-h-[60vh] object-contain rounded-2xl mix-blend-multiply"
                        alt={selectedQuickViewProduct.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <ImageIcon size={120} />
                      </div>
                    );
                  })()}
                </AnimatePresence>
                
                {selectedQuickViewProduct.badge && (
                  <span className="absolute top-4 lg:top-8 left-4 lg:left-8 bg-[#C8102E] text-white text-[10px] lg:text-[12px] font-black px-4 py-1.5 rounded-full tracking-[2px] uppercase shadow-lg z-10">
                    {selectedQuickViewProduct.badge}
                  </span>
                )}
              </div>

              {/* Product Info Section */}
              <div className="w-full lg:w-1/2 flex flex-col flex-1 overflow-hidden h-full">
                <div className="flex-1 overflow-y-auto px-6 py-6 lg:p-10">
                  <div className="mb-8">
                    <div className="text-[10px] lg:text-[12px] text-[#C8961A] font-black tracking-[4px] uppercase mb-4 flex items-center gap-3">
                      <span className="w-6 lg:w-8 h-[2px] bg-[#C8961A]"></span>
                      {selectedQuickViewProduct.category}
                    </div>
                    <h2 className="font-display text-3xl lg:text-5xl lg:leading-[1.1] text-[#0A1628] leading-[1] mb-3">
                      {selectedQuickViewProduct.name}
                    </h2>
                    <div className="flex items-center gap-3 lg:gap-4 mb-6">
                      <span className="text-2xl lg:text-3xl font-black text-[#C8102E]">KES {selectedQuickViewProduct.price.toLocaleString()}</span>
                      {selectedQuickViewProduct.oldPrice && (
                        <span className="text-sm lg:text-lg text-slate-400 line-through">KES {selectedQuickViewProduct.oldPrice.toLocaleString()}</span>
                      )}
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
                            {options.map((opt: any) => {
                              const isColor = type.toLowerCase() === 'color';
                              const isSelected = selectedVariants[type] === opt.value;
                              
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => setSelectedVariants(prev => ({ ...prev, [type]: opt.value }))}
                                  className={`relative flex items-center justify-center transition-all ${
                                    isColor 
                                      ? `w-10 h-10 rounded-full border-2 ${isSelected ? 'border-[#C8102E] scale-110 shadow-lg' : 'border-slate-100 hover:border-slate-300'}`
                                      : `px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider ${isSelected ? 'bg-[#0A1628] text-white border-[#0A1628] shadow-lg scale-105' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`
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
                                    <div className="absolute -top-1 -right-1 bg-[#C8102E] text-white rounded-full p-0.5 shadow-sm">
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

                  {/* Accordion Group */}
                  <div className="space-y-3 mb-4">
                    {/* Description & Tags Accordion */}
                    <details open className="group border border-slate-100 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden bg-white shadow-sm transition-all duration-300">
                      <summary className="flex items-center justify-between p-5 cursor-pointer font-black text-xs uppercase tracking-widest text-[#0A1628] bg-slate-50 hover:bg-slate-100 transition-colors">
                        Product Details
                        <span className="transition-transform duration-300 group-open:rotate-180 text-slate-400">
                          <ChevronDown size={18} />
                        </span>
                      </summary>
                      <div className="p-5 text-slate-500 text-sm leading-relaxed border-t border-slate-50 bg-white">
                        <p className="mb-4">{selectedQuickViewProduct.description || "Premium quality custom engineered textile specifically curated for our institutions with durability and style in mind."}</p>
                        
                        {/* Tags */}
                        {selectedQuickViewProduct.tags && selectedQuickViewProduct.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
                            {selectedQuickViewProduct.tags.map((tag: string) => (
                              <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-100">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                    
                    {/* Features & Lead Time Accordion */}
                    <details className="group border border-slate-100 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden bg-white shadow-sm transition-all duration-300">
                      <summary className="flex items-center justify-between p-5 cursor-pointer font-black text-xs uppercase tracking-widest text-[#0A1628] bg-slate-50 hover:bg-slate-100 transition-colors">
                        Features & Lead Time
                        <span className="transition-transform duration-300 group-open:rotate-180 text-slate-400">
                          <ChevronDown size={18} />
                        </span>
                      </summary>
                      <div className="p-5 bg-white border-t border-slate-50">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                            <div className="text-[#C8961A] shrink-0"><ShieldCheck size={20} /></div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-400">Quality</p>
                              <p className="text-[11px] font-bold text-slate-800">Double Stitched</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                            <div className="text-[#C8961A] shrink-0"><Calendar size={20} /></div>
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
                      <summary className="flex items-center justify-between p-5 cursor-pointer font-black text-xs uppercase tracking-widest text-[#0A1628] bg-slate-50 hover:bg-slate-100 transition-colors">
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
                                  <span className="text-[10px] font-black uppercase text-[#0A1628] tracking-wider">{review.userName}</span>
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
                          <h4 className="text-[10px] font-black uppercase tracking-[2px] text-[#0A1628] mb-4">Submit a Review</h4>
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
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#C8102E] transition-colors"
                                />
                                <textarea 
                                  placeholder="Share your experience with this product..." 
                                  required
                                  value={reviewForm.comment}
                                  onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-[#C8102E] transition-colors h-24 resize-none"
                                ></textarea>
                              </div>
                              <button 
                                type="submit" 
                                disabled={isSubmittingReview}
                                className="w-full bg-[#0A1628] hover:bg-[#C8102E] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg hover:shadow-[#C8102E]/20"
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

                <div className="shrink-0 bg-white/90 backdrop-blur-xl z-20 p-4 lg:p-8 border-t border-slate-100 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.1)]">
                  <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 max-w-full">
                    <div className="flex gap-2 lg:gap-3 w-full lg:w-auto">
                      <button 
                        onClick={() => toggleCompare(selectedQuickViewProduct)}
                        className={`flex-1 lg:w-14 h-12 lg:h-14 rounded-2xl flex items-center justify-center gap-2 border-2 transition-all group ${
                          compareList.find(i => i.id === selectedQuickViewProduct.id) 
                            ? "bg-[#C8961A]/10 border-[#C8961A]/30 text-[#C8961A]" 
                            : "border-slate-100 text-slate-400 hover:border-[#F59E0B] hover:text-[#F59E0B] bg-slate-50/50"
                        }`}
                        title="Compare"
                      >
                        <GitCompare size={18} className={compareList.find(i => i.id === selectedQuickViewProduct.id) ? "scale-110" : "group-hover:scale-110 transition-transform"} />
                        <span className="lg:hidden text-[9px] font-black uppercase tracking-widest">Compare</span>
                      </button>
                      <button 
                        onClick={() => toggleWishlist(selectedQuickViewProduct)}
                        className={`flex-1 lg:w-14 h-12 lg:h-14 rounded-2xl flex items-center justify-center gap-2 border-2 transition-all group ${
                          wishlist.find(i => i.id === selectedQuickViewProduct.id) 
                            ? "bg-red-50 border-red-100 text-red-500" 
                            : "border-slate-100 text-slate-400 hover:border-red-200 hover:text-red-400 bg-slate-50/50"
                        }`}
                        title="Wishlist"
                      >
                        <Heart size={18} className={wishlist.find(i => i.id === selectedQuickViewProduct.id) ? "fill-current scale-110" : "group-hover:scale-110 transition-transform"} />
                        <span className="lg:hidden text-[9px] font-black uppercase tracking-widest">Wishlist</span>
                      </button>
                      <button 
                        onClick={() => handleShareProduct(selectedQuickViewProduct)}
                        className="w-12 lg:w-14 shrink-0 h-12 lg:h-14 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all bg-slate-50/50 group"
                        title="Share"
                      >
                        <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </div>

                    <button 
                      onClick={() => {
                        const finalPrice = selectedQuickViewProduct.price + Object.entries(selectedVariants).reduce((sum, [type, val]) => {
                          const variant = selectedQuickViewProduct.variants?.find((v: any) => v.type === type && v.value === val);
                          return sum + (variant?.price || 0);
                        }, 0);

                        const cartItem = {
                          ...selectedQuickViewProduct,
                          price: finalPrice,
                          selectedVariants: { ...selectedVariants }
                        };
                        
                        addToCart(cartItem);
                        setSelectedQuickViewProduct(null);
                      }}
                      className="w-full flex-1 bg-[#0A1628] hover:bg-[#C8102E] text-white h-12 lg:h-14 rounded-2xl font-black text-[12px] lg:text-[14px] uppercase tracking-[2px] lg:tracking-[4px] transition-all flex items-center justify-center gap-3 lg:gap-4 shadow-xl hover:shadow-[#C8102E]/20 active:scale-[0.98]"
                    >
                      <div className="flex flex-col items-start mr-auto pl-4 lg:pl-6 border-r border-white/10 pr-4 lg:pr-6">
                        <span className="text-[7px] lg:text-[8px] opacity-60">Final Price</span>
                        <span className="text-xs lg:text-sm">KES {(selectedQuickViewProduct.price + Object.entries(selectedVariants).reduce((sum, [type, val]) => {
                          const variant = selectedQuickViewProduct.variants?.find((v: any) => v.type === type && v.value === val);
                          return sum + (variant?.price || 0);
                        }, 0)).toLocaleString()}</span>
                      </div>
                      <ShoppingBag size={18} className="shrink-0" />
                      <span className="flex-1 text-center pr-4 lg:pr-6">Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-[#0A1628] border-t border-white/10 flex items-center justify-between px-2 py-1 pb-safe shadow-2xl">
        <Link to="/" className="flex-1 flex flex-col items-center py-2 gap-1 text-[#C8961A]">
          <Home size={20} />
          <span className="text-[9px] font-bold tracking-tighter uppercase">Home</span>
        </Link>
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="flex-1 flex flex-col items-center py-2 gap-1 text-white/60"
        >
          <Search size={20} />
          <span className="text-[9px] font-bold tracking-tighter uppercase">Browse</span>
        </button>
        <div className="flex-1 -mt-8 flex flex-col items-center">
          <Link to="/contact" className="w-14 h-14 bg-gradient-to-tr from-[#C8102E] to-[#8B0000] rounded-full border-4 border-[#0A1628] flex items-center justify-center text-white shadow-xl">
            <Plus size={28} />
          </Link>
          <span className="text-[9px] font-black tracking-tighter uppercase text-[#F59E0B] mt-1">Get Quote</span>
        </div>
        <button 
          onClick={() => setIsWishlistOpen(true)}
          className={`flex-1 flex flex-col items-center py-2 gap-1 ${wishlist.length > 0 ? "text-[#C8961A]" : "text-white/60"}`}
        >
          <Heart size={20} className={wishlist.length > 0 ? "fill-current" : ""} />
          <span className="text-[9px] font-bold tracking-tighter uppercase">Saved</span>
        </button>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="flex-1 flex flex-col items-center py-2 gap-1 text-white/60 relative"
        >
          <ShoppingBag size={20} />
          {cart.length > 0 && <span className="absolute top-1.5 right-1/3 bg-[#C8102E] text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-[#0A1628]">{cart.length}</span>}
          <span className="text-[9px] font-bold tracking-tighter uppercase">Cart</span>
        </button>
      </div>

      <AnimatePresence>
        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-[300px] bg-[#0A1628] p-6 shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-10">
                <div className="font-display text-2xl tracking-[4px] text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#FCD34D] to-[#D97706]">NAISIAE</div>
                <button onClick={() => setIsMenuOpen(false)} className="text-white/60 hover:text-white p-2 bg-white/5 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-1 overflow-y-auto">
                {[
                  { name: 'School Uniforms', icon: <ShoppingBag size={18} /> },
                  { name: 'Knitting', icon: <ShoppingBag size={18} /> },
                  { name: 'Branding', icon: <ShoppingBag size={18} /> },
                  { name: 'About Us', icon: <UserIcon size={18} /> },
                  { name: 'Get Quote', icon: <Plus size={18} />, onClick: () => { setIsMenuOpen(false); setIsQuoteModalOpen(true); } },
                ].map((item) => (
                  <button 
                    key={item.name}
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      else setIsMenuOpen(false);
                    }}
                    className="py-4 px-2 border-b border-white/5 text-white/90 font-sans text-base font-semibold tracking-wide uppercase hover:text-[#C8961A] transition-colors flex justify-between items-center group text-left"
                  >
                    <span className="flex items-center gap-4">
                      <span className="text-[#F59E0B]/50 group-hover:text-[#F59E0B] transition-colors">{item.icon}</span>
                      {item.name}
                    </span>
                    <ChevronRight size={16} className="text-white/20 group-hover:text-[#C8961A] group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>

              <div className="mt-auto space-y-4 pt-10">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-[10px] font-bold text-[#C8961A] uppercase tracking-widest mb-1">Direct Line</div>
                  <div className="text-white font-bold flex items-center gap-2"><Phone size={14} /> +254 792 021 795</div>
                </div>
                <div className="text-center text-[10px] text-white/30 uppercase tracking-widest">
                  Uhuru Market, Nairobi, Kenya
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Cart Drawer */}
          {(isCartOpen || isWishlistOpen) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => { setIsCartOpen(false); setIsWishlistOpen(false); }}
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl text-[#0A1628] leading-none mb-1">
                    {isCartOpen ? 'Your Shopping Cart' : 'Your Wishlist'}
                  </h2>
                  <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">
                    {isCartOpen ? `${cart.length} Items Selected` : `${wishlist.length} Items Saved`}
                  </p>
                </div>
                <button 
                  onClick={() => { setIsCartOpen(false); setIsWishlistOpen(false); }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {(isCartOpen ? cart : wishlist).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <ShoppingBag size={40} className="mb-4" />
                    <p className="font-bold text-sm">Your {isCartOpen ? 'cart' : 'wishlist'} is empty</p>
                    <button 
                      onClick={() => { setIsCartOpen(false); setIsWishlistOpen(false); }}
                      className="mt-4 text-[#C8102E] text-xs font-bold border-b border-[#C8102E]"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  (isCartOpen ? cart : wishlist).map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 items-center">
                      <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Package size={24} className="text-slate-200" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-[#0A1628] leading-tight">{item.name}</h4>
                          {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {Object.entries(item.selectedVariants).map(([type, val]) => (
                                <span key={type} className="text-[8px] font-black uppercase text-[#C8961A] bg-[#C8961A]/10 px-1.5 py-0.5 rounded tracking-tighter">
                                  {type}: {val as string}
                                </span>
                              ))}
                            </div>
                          )}
                          <button 
                            onClick={() => isCartOpen ? removeFromCart(item.id) : toggleWishlist(item)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[#C8102E] font-black text-sm">KES {item.price.toLocaleString()}</span>
                          {isCartOpen && (
                            <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-md border border-slate-200">
                              <button 
                                onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, (i.quantity || 1) - 1) } : i))}
                                className="text-xs font-bold w-4 h-4 flex items-center justify-center hover:bg-slate-100 rounded"
                              >
                                -
                              </button>
                              <span className="text-xs font-black w-4 text-center">{item.quantity || 1}</span>
                              <button 
                                onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i))}
                                className="text-xs font-bold w-4 h-4 flex items-center justify-center hover:bg-slate-100 rounded"
                              >
                                +
                              </button>
                            </div>
                          )}
                          {!isCartOpen && (
                            <button 
                              onClick={() => { addToCart(item); toggleWishlist(item); }}
                              className="text-[10px] font-bold text-[#C8102E] uppercase"
                            >
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {isCartOpen && cart.length > 0 && (
                <div className="p-6 bg-slate-50 border-t">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-[2px]">Subtotal</div>
                      {activeDiscount ? (
                        <>
                          <div className="text-sm font-bold text-slate-400 line-through">KES {subtotal.toLocaleString()}</div>
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-black text-[#C8102E]">KES {cartTotal.toLocaleString()}</div>
                            <span className="text-[9px] font-black bg-[#C8102E] text-white px-2 py-0.5 rounded uppercase tracking-widest leading-none">
                              {activeDiscount.discountPercentage}% OFF
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-2xl font-black text-[#0A1628]">KES {cartTotal.toLocaleString()}</div>
                      )}
                    </div>
                    <div className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded">VAT Included</div>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={orderSuccess}
                    className="w-full bg-[#C8102E] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-[#C8102E]/20 flex items-center justify-center gap-2 hover:bg-[#8B0000] transition-all disabled:bg-green-600"
                  >
                    {orderSuccess ? (
                      <><CheckCircle2 size={18} /> Quote Sent!</>
                    ) : (
                      'Request Wholesale Quote'
                    )}
                  </button>
                  <p className="text-[10px] text-center text-[#64748B] mt-4 leading-relaxed">
                    Our team will review your cart and send a formal invoice/quote with bulk discounts to your email within 24 hours.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Quote Request Modal */}
        {isQuoteModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsQuoteModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b flex items-center justify-between bg-[#F8FAFC]">
                <div>
                  <h2 className="font-display text-3xl text-[#0A1628] leading-none mb-1">Get Custom Quote</h2>
                  <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">Expert branding & uniform consultations</p>
                </div>
                <button onClick={() => setIsQuoteModalOpen(false)} className="text-slate-400 p-2"><X size={20} /></button>
              </div>

              <form 
                onSubmit={async (e) => { 
                  e.preventDefault();
                  try {
                    await addDoc(collection(db, 'quotes'), { ...quoteForm, status: 'pending', createdAt: serverTimestamp(), uid: auth.currentUser?.uid || 'guest' });
                    setOrderSuccess(true);
                    setTimeout(() => { setOrderSuccess(false); setIsQuoteModalOpen(false); }, 2000);
                  } catch (err) {
                    handleFirestoreError(err, OperationType.WRITE, 'quotes');
                  }
                }}
                className="p-6 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Full Name</label>
                    <input required value={quoteForm.name} onChange={e => setQuoteForm({...quoteForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#C8102E]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Phone Number</label>
                    <input required value={quoteForm.phone} onChange={e => setQuoteForm({...quoteForm, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#C8102E]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Email Address</label>
                  <input required type="email" value={quoteForm.email} onChange={e => setQuoteForm({...quoteForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#C8102E]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Service Type</label>
                  <select value={quoteForm.service} onChange={e => setQuoteForm({...quoteForm, service: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#C8102E]">
                    <option>School Uniforms</option>
                    <option>Corporate Branding</option>
                    <option>Custom Knitwear</option>
                    <option>Screen Printing</option>
                    <option>General Enquiry</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Request Details</label>
                  <textarea rows={4} value={quoteForm.details} onChange={e => setQuoteForm({...quoteForm, details: e.target.value})} placeholder="Tell us what you need..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#C8102E] resize-none" />
                </div>
                
                <button 
                  disabled={orderSuccess}
                  className="w-full bg-[#0A1628] hover:bg-[#C8102E] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-xl shadow-black/10 disabled:bg-green-600"
                >
                  {orderSuccess ? 'Message Sent Successfully!' : 'Send Request'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]"
            >
              <button 
                onClick={() => {
                  setShowPromoModal(false);
                  sessionStorage.setItem(`promo_${activeModalPromo.id}`, 'true');
                }}
                className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-[#0A1628] hover:bg-white/40 transition-all flex items-center justify-center"
              >
                <X size={20} />
              </button>

              <div className="w-full md:w-1/2 relative min-h-[300px]">
                {activeModalPromo.imageUrl ? (
                  <img src={activeModalPromo.imageUrl} className="w-full h-full object-cover" alt={activeModalPromo.title} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0A1628] to-[#1C3560] flex items-center justify-center">
                    <Megaphone size={80} className="text-[#C8961A]/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
              </div>

              <div className="w-full md:w-1/2 p-10 lg:p-14 flex flex-col justify-center bg-white">
                <div className="flex items-center gap-3 text-[#C8961A] text-[10px] font-black tracking-[4px] uppercase mb-6">
                  <Megaphone size={14} /> Seasonal Offer
                </div>
                <h3 className="font-display text-5xl lg:text-6xl text-[#0A1628] tracking-wider leading-none mb-6">
                  {activeModalPromo.title}
                </h3>
                <p className="text-slate-500 text-lg mb-10 leading-relaxed font-medium">
                  {activeModalPromo.subtitle}
                </p>
                <div className="flex flex-col gap-4">
                  <Link 
                    to={activeModalPromo.buttonLink || '/shop'} 
                    onClick={() => {
                      setShowPromoModal(false);
                      sessionStorage.setItem(`promo_${activeModalPromo.id}`, 'true');
                    }}
                    className="bg-[#C8102E] hover:bg-[#8B0000] text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[3px] transition-all transform hover:scale-105 shadow-xl shadow-[#C8102E]/20 text-center"
                  >
                    {activeModalPromo.buttonText}
                  </Link>
                  <button 
                    onClick={() => {
                      setShowPromoModal(false);
                      sessionStorage.setItem(`promo_${activeModalPromo.id}`, 'true');
                    }}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors py-2"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 border border-white/20 min-w-[300px]"
            style={{ 
              backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 
                               toast.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                               toast.type === 'warning' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(30, 41, 59, 0.9)',
              color: 'white'
            }}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'error' && <X size={18} />}
            {toast.type === 'warning' && <Plus size={18} className="rotate-45" />}
            {toast.type === 'info' && <MessageSquare size={18} />}
            <span className="text-sm font-bold tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
