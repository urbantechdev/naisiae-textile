import { useState, useEffect, useRef } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [activeModalPromo, setActiveModalPromo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const lastWishlistRef = useRef<string>('');

  const handleShareProduct = async (product: any) => {
    const shareUrl = `${window.location.host === 'localhost:3000' ? 'http://localhost:3000' : 'https://' + window.location.host}/product/${product.id}`;
    const shareData = {
      title: `${product.name} | Naisiae Textile`,
      text: `Check out ${product.name} - ${product.description || 'Premium custom uniforms and branding.'}\nPrice: KES ${product.price?.toLocaleString()}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Product link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<any>(null);
  const [quoteForm, setQuoteForm] = useState({ name: '', email: '', phone: '', service: 'General Enquiry', details: '' });

  useEffect(() => {
    const q = query(collection(db, 'products'), where('active', '==', true), orderBy('sortOrder', 'asc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    const qPromos = query(collection(db, 'promotions'), where('active', '==', true));
    const unsubscribePromos = onSnapshot(qPromos, (snapshot) => {
      setPromotions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Site Settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSiteSettings(snapshot.data());
      }
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
          const remoteItems = doc.data().items || [];
          setWishlist(remoteItems);
          lastWishlistRef.current = JSON.stringify(remoteItems); // Update ref to avoid reflecting back
        }
      });
    }

    // Record Analytics View
    const recordView = async () => {
      const today = new Date().toISOString().split('T')[0];
      const viewRef = doc(db, 'analytics', today);
      try {
        await setDoc(viewRef, { 
          views: (await getDoc(viewRef)).data()?.views + 1 || 1,
          date: today,
          updatedAt: serverTimestamp() 
        }, { merge: true });
      } catch (e) {
        console.error("Analytics error:", e);
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
      if (unsubscribeWishlist) unsubscribeWishlist();
    };
  }, []);

  useEffect(() => {
    const filtered = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = !activeTag || p.tags?.includes(activeTag);
      const matchesTab = activeTab === 'all' || p.category.toLowerCase() === activeTab.toLowerCase();
      const matchesSubCategory = !activeSubCategory || p.subCategory === activeSubCategory;
      
      return matchesSearch && matchesTag && matchesTab && matchesSubCategory;
    });
    setSearchResults(filtered);
    setShowSearchSuggestions(searchQuery.trim().length > 1);
  }, [searchQuery, products, activeTag, activeTab, activeSubCategory]);

  const allTags = Array.from(new Set(products.flatMap(p => p.tags || []))).slice(0, 10);
  const uniformSubCategories = Array.from(new Set(products.filter(p => p.category === 'School Uniforms' && p.subCategory).map(p => p.subCategory))).sort();

  const displayProducts = products.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesTag = !activeTag || p.tags?.includes(activeTag);
    const matchesTab = activeTab === 'all' || p.category.toLowerCase() === activeTab.toLowerCase();
    const matchesSubCategory = !activeSubCategory || p.subCategory === activeSubCategory;
    
    return matchesSearch && matchesTag && matchesTab && matchesSubCategory;
  });

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
      document.title = siteSettings.siteName ? `${siteSettings.siteName} | ${siteSettings.siteTagline || 'Uhuru Market'}` : 'Naisiae Textile | Uhuru Market';
      
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

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

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
      {/* Top Promotion Bar */}
      {promotions.filter(p => p.type === 'top-bar').map(promo => (
        <div key={promo.id} className="bg-[#1C3560] text-white py-2 px-4 text-center text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-4 animate-in fade-in slide-in-from-top duration-500 z-[60] relative">
          <Megaphone size={12} className="text-[#C8961A]" />
          <span>{promo.title} — {promo.subtitle}</span>
          {promo.buttonLink && (
            <Link to={promo.buttonLink} className="underline hover:text-[#C8961A] transition-colors ml-2 font-black">{promo.buttonText}</Link>
          )}
        </div>
      ))}

      {/* Top Bar */}
      <div className="hidden lg:flex bg-[#0A1628] text-white/50 text-[11.5px] py-2 border-b border-white/5">
        <div className="max-w-[1440px] mx-auto w-full px-8 flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <span className="flex items-center gap-1.5"><Phone size={12} /> <a href="tel:+254792021795" className="hover:text-[#C8961A]">+254 792 021 795</a></span>
            <div className="w-px h-3.5 bg-white/20"></div>
            <span className="flex items-center gap-1.5"><Mail size={12} /> <a href="mailto:info@naisiaetextile.com" className="hover:text-[#C8961A]">info@naisiaetextile.com</a></span>
          </div>
          <div className="flex gap-4 items-center">
            <span>Mon–Sat: 8am–6pm</span>
            <div className="w-px h-3.5 bg-white/20"></div>
            <span>7–14 Day Turnaround</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-gradient-to-b from-[#0A1628] to-[#15284A] shadow-xl">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 flex items-center h-[68px] justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-white p-0.5 rounded-full shadow-md overflow-hidden">
              {siteSettings?.siteLogo ? (
                <img src={siteSettings.siteLogo} alt="Logo" className="w-11 h-11 object-contain" />
              ) : (
                <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center font-bold text-xl text-[#C8102E]">NT</div>
              )}
            </div>
            <div className="leading-tight">
              <div className="font-['Bebas_Neue'] text-2xl tracking-[4px] text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#FCD34D] to-[#D97706]">
                {siteSettings?.sharingTitle || 'NAISIAE TEXTILE'}
              </div>
              <div className="text-[8px] tracking-[3px] text-[#F59E0B]/70 uppercase font-bold">
                {siteSettings?.siteTagline || 'Uhuru Market Uniforms'}
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-10">
            {[
              { 
                name: 'School Uniforms', 
                mega: {
                  featured: {
                    title: 'New Term Collection',
                    image: 'https://images.unsplash.com/photo-1544717305-27a734ef1904?auto=format&fit=crop&q=80',
                    link: '#'
                  },
                  categories: [
                    { name: 'Primary Schools', items: ['Sweaters', 'Shirts', 'Shorts', 'Dresses', 'Socks'] },
                    { name: 'Secondary Schools', items: ['Blazers', 'Trousers', 'Skirts', 'Ties', 'Tracksuits'] },
                    { name: 'Kindergarten', items: ['Pinafores', 'T-shirts', 'Tunics', 'Hats'] }
                  ]
                }
              },
              { 
                name: 'Knitting', 
                mega: {
                  featured: {
                    title: 'Custom Patterns',
                    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80',
                    link: '#'
                  },
                  categories: [
                    { name: 'Pullovers', items: ['V-Neck', 'Round Neck', 'Sleeveless', 'Cardigans'] },
                    { name: 'Accessories', items: ['Scarves', 'Beanies', 'Gloves', 'Leg Warmers'] },
                    { name: 'Corporate', items: ['Branded Vests', 'Logo Embroidery', 'Bulk Orders'] }
                  ]
                }
              },
              { 
                name: 'Branding', 
                mega: {
                  featured: {
                    title: 'Corporate Identity',
                    image: 'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?auto=format&fit=crop&q=80',
                    link: '#'
                  },
                  categories: [
                    { name: 'Screen Printing', items: ['T-Shirts', 'Hoodies', 'Caps', 'Tote Bags'] },
                    { name: 'Signage', items: ['Roll-up Banners', 'Vinyl Stickers', 'Posters'] },
                    { name: 'Events', items: ['Lanyards', 'Wristbands', 'ID Cards'] }
                  ]
                }
              },
              { name: 'About Us', link: '#' },
            ].map((item) => (
              <div key={item.name} className="group relative">
                <Link 
                  to={item.link || '#'} 
                  className="text-white/90 hover:text-[#C8961A] font-['Bebas_Neue'] text-lg tracking-[2px] h-[68px] flex items-center transition-colors"
                >
                  {item.name}
                </Link>
                
                {item.mega && (
                  <div className="absolute top-[68px] left-1/2 -translate-x-1/2 w-[800px] bg-white shadow-2xl rounded-b-2xl p-8 opacity-0 invisible translate-y-4 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-[100] border border-slate-100 flex gap-10">
                    <div className="flex-1 grid grid-cols-3 gap-8">
                      {item.mega.categories.map((cat) => (
                        <div key={cat.name}>
                          <h4 className="font-['Bebas_Neue'] text-[#0A1628] text-xl tracking-[1px] mb-4 border-b border-slate-100 pb-2">{cat.name}</h4>
                          <ul className="space-y-2">
                            {cat.items.map((sub) => (
                              <li key={sub}>
                                <a href="#" className="text-[11px] text-[#64748B] hover:text-[#C8102E] font-bold flex items-center justify-between group transition-colors uppercase tracking-wider">
                                  {sub}
                                  <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="w-[280px] shrink-0 border-l border-slate-100 pl-10">
                      <div className="relative h-full rounded-xl overflow-hidden group/feat">
                        <img src={item.mega.featured.image} className="w-full h-full object-cover transition-transform duration-700 group-hover/feat:scale-110" alt={item.mega.featured.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-[10px] text-[#C8961A] font-black uppercase tracking-[3px] mb-1">Featured</p>
                          <h5 className="text-white font-['Bebas_Neue'] text-2xl leading-none">{item.mega.featured.title}</h5>
                          <Link to={item.mega.featured.link} className="mt-3 text-[10px] text-white/70 hover:text-white flex items-center gap-1 transition-colors uppercase font-bold tracking-widest">
                            Shop Collection <ChevronRight size={10} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsWishlistOpen(true)}
              className="p-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors relative"
            >
              <Heart size={20} className={wishlist.length > 0 ? "fill-[#F0A500] text-[#F0A500]" : ""} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#F0A500] text-[#0A1628] text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#15284A]">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors relative"
            >
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#C8102E] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#15284A]">
                  {cart.length}
                </span>
              )}
            </button>
            <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 text-white/80 hover:bg-white/10 rounded-lg">
              <Menu size={24} />
            </button>
    <Link to="/contact" 
      onClick={(e) => { e.preventDefault(); setIsQuoteModalOpen(true); }}
      className="hidden lg:flex bg-[#C8102E] hover:bg-[#8B0000] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-[#B91C1C]/30"
    >
      Get Quote
    </Link>
          </div>
        </div>
      </nav>

      {/* Dynamic Hero Slider Section */}
      <section className="relative h-[85vh] min-h-[700px] flex items-center justify-center overflow-hidden bg-[#0A1628]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            {/* Background Split Layout */}
            <div className="absolute inset-y-0 right-0 w-full lg:w-[60%] z-0">
              <img 
                src={siteSettings?.heroImages?.[currentSlide]?.url || "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=2670&auto=format&fit=crop"} 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Prevent infinite loops
                  target.src = "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=2670&auto=format&fit=crop";
                }}
                className="w-full h-full object-cover opacity-80"
                alt="Hero Slide"
              />
              {/* Sharp Gradient Separation */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628] via-[#0A1628]/40 to-transparent"></div>
            </div>

            {/* Content Container (Maintains center position) */}
            <div className="relative z-20 h-full max-w-[1440px] mx-auto px-8 flex flex-col items-center justify-center text-center">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-12"
              >
                <span className="inline-block px-4 py-1.5 bg-[#C8961A] text-white text-[10px] font-black uppercase tracking-[4px] rounded-full mb-6">
                  {siteSettings?.siteTagline || "Official Uhuru Market Supplier"}
                </span>
                <h1 className="font-['Bebas_Neue'] text-7xl md:text-8xl lg:text-[10rem] text-white tracking-[2px] leading-none mb-6">
                  {siteSettings?.heroImages?.[currentSlide]?.title || "WEAR THE FUTURE"}
                </h1>
                <p className="text-white/70 max-w-2xl mx-auto text-sm md:text-base leading-relaxed tracking-widest font-bold uppercase opacity-80 mb-10">
                  {siteSettings?.heroImages?.[currentSlide]?.subtitle || "Quality textiles, custom engineered for Kenya's leading institutions."}
                </p>

                {siteSettings?.heroImages?.[currentSlide]?.link && (
                  <motion.a
                    href={siteSettings.heroImages[currentSlide].link}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center gap-3 px-10 py-4 bg-[#C8102E] text-white text-[10px] font-black uppercase tracking-[3px] rounded-2xl hover:bg-white hover:text-[#C8102E] transition-all duration-300 shadow-2xl active:scale-95"
                  >
                    Discover Collection <ChevronRight size={14} />
                  </motion.a>
                )}
              </motion.div>

              {/* Search Bar with Autofill Integrated into Hero */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-3xl relative"
              >
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Search className="text-white/40 group-focus-within:text-[#C8961A] transition-colors" size={24} />
                  </div>
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                    onFocus={() => searchQuery.length > 1 && setShowSearchSuggestions(true)}
                    placeholder="Search uniforms, sports kits, or corporate branding..."
                    className="w-full bg-white/10 backdrop-blur-3xl border-2 border-white/20 rounded-3xl pl-16 pr-8 py-6 text-white text-lg outline-none focus:bg-white focus:text-[#0A1628] focus:border-[#C8961A] focus:ring-8 focus:ring-[#C8961A]/10 transition-all shadow-2xl placeholder:text-white/30 font-medium"
                  />
                  <button className="absolute right-3 top-3 bottom-3 bg-[#C8102E] hover:bg-[#8B0000] text-white px-8 rounded-2xl font-black text-xs tracking-[2px] uppercase transition-all shadow-xl active:scale-95">
                    Find Products
                  </button>
                </div>

                {/* Autocomplete Suggestions */}
                <AnimatePresence>
                  {showSearchSuggestions && searchResults.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-4 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50 overflow-y-auto max-h-[450px]"
                    >
                      {searchResults.map((product) => (
                        <div 
                          key={product.id}
                          id={`search-item-${product.id}`}
                          onClick={() => {
                            const el = document.getElementById(`product-${product.id}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                            setSearchQuery('');
                          }}
                          className="p-5 hover:bg-slate-50 cursor-pointer flex items-center gap-5 transition-colors group text-left"
                        >
                          <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                            <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-[#1E293B] group-hover:text-[#C8102E] transition-colors uppercase tracking-wider truncate">{product.name}</p>
                            <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">{product.category}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-[#C8102E]">KES {product.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Indicators */}
        {siteSettings?.heroImages?.length > 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {siteSettings.heroImages.map((_: any, idx: number) => (
              <button 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-12 bg-[#C8961A]' : 'w-4 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="py-20 max-w-[1440px] mx-auto px-8">
        <div className="flex flex-col lg:flex-row justify-between lg:items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2.5 text-[#C8961A] text-[10px] font-extrabold tracking-[5px] uppercase mb-2">
              <div className="w-7 h-0.5 bg-[#C8961A]"></div> Featured Products
            </div>
            <h2 className="font-['Bebas_Neue'] text-5xl tracking-tight leading-none text-[#0A1628]">Top Flash Deals</h2>
            
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
              <div className="relative aspect-[4/3] overflow-hidden bg-[#FDFAF4] cursor-pointer" onClick={() => setSelectedQuickViewProduct(product)}>
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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

      {/* Footer */}
      <footer className="bg-[#0A1628] pt-16 pb-8 text-gray-400 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              {siteSettings?.siteLogo ? (
                <img src={siteSettings.siteLogo} alt={siteSettings?.siteName || 'Naisiae'} className="h-10 w-auto" />
              ) : (
                <h3 className="font-['Bebas_Neue'] text-3xl tracking-[4px] text-white">NAISIAE TEXTILE</h3>
              )}
            </div>
            <div className="text-[10px] tracking-[2px] text-[#C8961A] uppercase font-bold mb-6">
              {siteSettings?.siteTagline || 'Uhuru Market Uniforms'}
            </div>
            <p className="text-sm leading-relaxed mb-6">Your trusted partner for quality school uniforms, custom knitwear and professional branding services across Kenya.</p>
          </div>
          <div>
            <h4 className="font-['Bebas_Neue'] text-xl tracking-[2px] text-white border-b-2 border-[#C8102E] pb-2 mb-6">Uniforms</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Primary School Uniforms</a></li>
              <li><a href="#" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Junior Secondary</a></li>
              <li><a href="#" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Corporate Uniforms</a></li>
              <li><a href="#" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Sports Kits</a></li>
            </ul>
          </div>
          <div>
             <h4 className="font-['Bebas_Neue'] text-xl tracking-[2px] text-white border-b-2 border-[#C8102E] pb-2 mb-6">Services</h4>
             <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Knitting Services</a></li>
              <li><a href="#" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Embroidery</a></li>
              <li><a href="#" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Screen Printing</a></li>
              <li><a href="#" className="hover:text-[#C8961A] transition-colors flex items-center gap-2">Design & Mockup</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-['Bebas_Neue'] text-xl tracking-[2px] text-white border-b-2 border-[#C8102E] pb-2 mb-6">Contact</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#C8961A]"><Phone size={18} /></div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-white/50">Phone</div>
                  <div className="text-white font-bold">+254 792 021 795</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#C8961A]"><Mail size={18} /></div>
                <div>
                 <div className="text-[10px] font-bold uppercase text-white/50">Email</div>
                 <div className="text-white font-bold">info@naisiaetextile.com</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs">
          <div className="flex items-center gap-3">
            <span>© 2026 Naisiae Textile. All rights reserved.</span>
            <Link to="/admin" className="text-white/5 hover:text-[#C8961A]/20 transition-colors" title="Management">
              <ShieldCheck size={10} />
            </Link>
          </div>
          <div className="mt-4 md:mt-0 flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Product Quick View Modal */}
      <AnimatePresence>
        {selectedQuickViewProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedQuickViewProduct(null)}
              className="absolute inset-0 bg-[#0A1628]/90 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-5xl bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-auto max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedQuickViewProduct(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-800 hover:text-red-500 transition-colors shadow-lg"
              >
                <X size={24} />
              </button>

              {/* Product Gallery Section */}
              <div className="lg:w-1/2 bg-slate-50 relative overflow-hidden flex items-center justify-center p-8 lg:p-12">
                <motion.img 
                  layoutId={`product-img-${selectedQuickViewProduct.id}`}
                  src={selectedQuickViewProduct.imageUrl} 
                  className="w-full h-auto max-h-[60vh] object-contain rounded-2xl drop-shadow-2xl"
                  alt={selectedQuickViewProduct.name}
                />
                
                {selectedQuickViewProduct.badge && (
                  <span className="absolute top-8 left-8 bg-[#C8102E] text-white text-[12px] font-black px-4 py-1.5 rounded-full tracking-[2px] uppercase shadow-lg">
                    {selectedQuickViewProduct.badge}
                  </span>
                )}
              </div>

              {/* Product Info Section */}
              <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col">
                <div className="mb-8">
                  <div className="text-[12px] text-[#C8961A] font-black tracking-[4px] uppercase mb-4 flex items-center gap-3">
                    <span className="w-8 h-[2px] bg-[#C8961A]"></span>
                    {selectedQuickViewProduct.category}
                  </div>
                  <h2 className="font-['Bebas_Neue'] text-5xl lg:text-6xl text-[#0A1628] leading-[0.9] mb-4">
                    {selectedQuickViewProduct.name}
                  </h2>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-3xl font-black text-[#C8102E]">KES {selectedQuickViewProduct.price.toLocaleString()}</span>
                    {selectedQuickViewProduct.oldPrice && (
                      <span className="text-lg text-slate-300 line-through">KES {selectedQuickViewProduct.oldPrice.toLocaleString()}</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8">
                    {selectedQuickViewProduct.description || "Premium quality custom engineered textile specifically curated for our institutions with durability and style in mind."}
                  </p>
                  
                  {/* Tags */}
                  {selectedQuickViewProduct.tags && selectedQuickViewProduct.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {selectedQuickViewProduct.tags.map((tag: string) => (
                        <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Feature Highlights */}
                  <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                      <div className="text-[#C8961A]"><ShieldCheck size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">Quality</p>
                        <p className="text-[11px] font-bold text-slate-800">Double Stitched</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                      <div className="text-[#C8961A]"><Calendar size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">Lead Time</p>
                        <p className="text-[11px] font-bold text-slate-800">7-14 Work Days</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => { addToCart(selectedQuickViewProduct); setSelectedQuickViewProduct(null); }}
                    className="flex-1 bg-[#0A1628] hover:bg-[#C8102E] text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-[3px] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                  >
                    <ShoppingBag size={18} /> Add to Order
                  </button>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => toggleWishlist(selectedQuickViewProduct)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all group ${
                        wishlist.find(i => i.id === selectedQuickViewProduct.id) 
                          ? "bg-red-50 border-red-100 text-red-500" 
                          : "border-slate-100 text-slate-400 hover:border-red-200 hover:text-red-400"
                      }`}
                    >
                      <Heart size={24} className={wishlist.find(i => i.id === selectedQuickViewProduct.id) ? "fill-current scale-110" : "group-hover:scale-110 transition-transform"} />
                    </button>
                    <button 
                      onClick={() => handleShareProduct(selectedQuickViewProduct)}
                      className="w-14 h-14 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all group"
                    >
                      <Share2 size={24} className="group-hover:scale-110 transition-transform" />
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
                <div className="font-['Bebas_Neue'] text-2xl tracking-[4px] text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#FCD34D] to-[#D97706]">NAISIAE</div>
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
                    className="py-4 px-2 border-b border-white/5 text-white/90 font-['Bebas_Neue'] text-xl tracking-[2px] hover:text-[#C8961A] transition-colors flex justify-between items-center group text-left"
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
                  <h2 className="font-['Bebas_Neue'] text-2xl text-[#0A1628] leading-none mb-1">
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
                    <div key={item.id} className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-[#0A1628]">{item.name}</h4>
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
                      <div className="text-2xl font-black text-[#0A1628]">KES {cartTotal.toLocaleString()}</div>
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
                  <h2 className="font-['Bebas_Neue'] text-3xl text-[#0A1628] leading-none mb-1">Get Custom Quote</h2>
                  <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">Expert branding & uniform consultations</p>
                </div>
                <button onClick={() => setIsQuoteModalOpen(false)} className="text-slate-400 p-2"><X size={20} /></button>
              </div>

              <form 
                onSubmit={async (e) => { 
                  e.preventDefault();
                  try {
                    await addDoc(collection(db, 'quotes'), { ...quoteForm, status: 'new', createdAt: serverTimestamp(), uid: auth.currentUser?.uid || 'guest' });
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
                <h3 className="font-['Bebas_Neue'] text-5xl lg:text-6xl text-[#0A1628] tracking-wider leading-none mb-6">
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
    </div>
  );
}
