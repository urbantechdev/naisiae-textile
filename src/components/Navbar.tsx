import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Menu, 
  ChevronRight,
  Megaphone,
  GitCompare,
  Package,
  Search,
  X,
  Phone,
  User as UserIcon,
  Plus,
  Zap,
  Filter,
  Home,
  MessageSquare
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { collection, onSnapshot, doc, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/firebase';
import { useCart } from '../context/CartContext';
import { SEED_URLS } from '../constants/seedData';

const DEFAULT_MEGA_MENUS = [
  { 
    id: 'products',
    name: 'Products', 
    featured: { title: 'New Arrival: Premium Gabardine', image: SEED_URLS[0] || "https://images.unsplash.com/photo-1544717305-27a734ef1904?auto=format&fit=crop&q=80&w=600", link: '/products' },
    categories: [
      { name: 'Sectors', items: ['Primary Schools', 'Secondary Schools', 'Institutional', 'Hospitality'], link: '/products' },
      { name: 'Apparel', items: ['Blazers', 'Trousers', 'Skirts', 'Shirts', 'Sweaters'], link: '/products' }
    ]
  },
  { 
    id: 'services',
    name: 'Services', 
    featured: { title: 'Institutional Branding', image: SEED_URLS[1] || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=600&auto=format&fit=crop", link: '/services' },
    categories: [
      { name: 'Manufacturing', items: ['Bulk Production', 'Custom Designing', 'Wholesale Supply'], link: '/services' }
    ]
  },
  { 
    id: 'categories',
    name: 'Categories', 
    featured: { title: 'Explore Industry Standards', image: SEED_URLS[2] || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop", link: '/categories' },
    categories: [
      { name: 'Shop By Type', items: ['Woolen Wear', 'Cotton Blends', 'Synthetic Tissues'], link: '/categories' }
    ]
  }
];

interface NavbarProps {
  wishlistCount: number;
  compareCount?: number;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  setIsWishlistOpen?: (open: boolean) => void;
  setIsQuoteModalOpen?: (open: boolean) => void;
  setIsCompareModalOpen?: (open: boolean) => void;
  setSelectedQuickViewProduct?: (product: any) => void;
}

export function Navbar({ 
  wishlistCount,
  compareCount = 0,
  isMenuOpen,
  setIsMenuOpen,
  setIsCompareModalOpen,
  setSelectedQuickViewProduct
}: NavbarProps) {
  const { cartCount, setIsCartOpen, setIsWishlistOpen, setIsQuoteModalOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [megaMenus, setMegaMenus] = useState<any[]>([]);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [hoveredProductItem, setHoveredProductItem] = useState<string | null>(null);
  const [hoveredCategoryItem, setHoveredCategoryItem] = useState<string | null>(null);
  const [dbPortfolio, setDbPortfolio] = useState<any[]>([]);
  const [hoveredPortfolioItem, setHoveredPortfolioItem] = useState<any | null>(null);

  useEffect(() => {
    setHoveredProductItem(null);
    setHoveredCategoryItem(null);
    setHoveredPortfolioItem(null);
  }, [activeMegaMenu]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [chatSettings, setChatSettings] = useState<any>(null);
  const [isTrendingDrawerOpen, setIsTrendingDrawerOpen] = useState(false);
  const [isTrayMinimized, setIsTrayMinimized] = useState(() => {
    try {
      return localStorage.getItem('sourcing_picks_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const handleMinimize = (min: boolean) => {
    setIsTrayMinimized(min);
    try {
      localStorage.setItem('sourcing_picks_minimized', String(min));
    } catch (e) {
      console.warn(e);
    }
  };

  const seasonalPicks = React.useMemo(() => {
    const wholesale = products.filter(p => 
      p.tags?.some((t: string) => ['wholesale', 'bulk', 'corporate', 'popular', 'hot', 'featured'].includes(t.toLowerCase()))
    );
    return (wholesale.length >= 3 ? wholesale : products).slice(0, 5);
  }, [products]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Fetch products for global search
    const qProducts = query(collection(db, 'products'), where('active', '==', true));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch services for global search
    const unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch categories for mega menu mapping
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setDbCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch portfolio for mega menu mapping
    const unsubPortfolio = onSnapshot(collection(db, 'portfolio'), (snapshot) => {
      setDbPortfolio(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMenus = onSnapshot(collection(db, 'mega_menus'), (snapshot) => {
      if (!snapshot.empty) {
        const dbMenus = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const merged = DEFAULT_MEGA_MENUS.map(def => {
          const found = dbMenus.find(m => m.id?.toLowerCase() === def.id.toLowerCase());
          return found ? found : def;
        });
        setMegaMenus(merged);
      } else {
        setMegaMenus(DEFAULT_MEGA_MENUS);
      }
    });
    
    const unsubSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSiteSettings(snapshot.data());
      } else {
        setSiteSettings({
          siteName: 'NAISIAE TEXTILES',
          siteTagline: 'Uhuru Market Uniforms',
          siteLogo: null
        });
      }
    });

    const qPromos = query(collection(db, 'promotions'), where('active', '==', true));
    const unsubPromos = onSnapshot(qPromos, (snapshot) => {
      setPromotions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubChat = onSnapshot(doc(db, 'settings', 'chat'), (snapshot) => {
      if (snapshot.exists()) {
        setChatSettings(snapshot.data());
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubSettings();
      unsubPromos();
      unsubChat();
      unsubProducts();
      unsubServices();
      unsubCategories();
      unsubPortfolio();
      unsubMenus();
    };
  }, []);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    
    const prodResults = products.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.category?.toLowerCase().includes(q) ||
      p.tags?.some((t: string) => t.toLowerCase().includes(q))
    ).slice(0, 4).map(p => ({ ...p, type: 'product', icon: <Package size={14} className="text-[#C8961A]" /> }));

    const serviceResults = services.filter(s => 
      s.title?.toLowerCase().includes(q) || 
      s.description?.toLowerCase().includes(q)
    ).slice(0, 2).map(s => ({ ...s, name: s.title, type: 'service', icon: <Zap size={14} className="text-[#C8961A]" /> }));

    const categories = Array.from(new Set(products.map(p => p.category))).filter((c): c is string => !!c);
    const catResults = categories.filter(c => 
      c.toLowerCase().includes(q)
    ).slice(0, 2).map(c => ({ id: c, name: c, type: 'category', icon: <Filter size={14} className="text-[#C8961A]" /> }));

    return [...prodResults, ...catResults, ...serviceResults];
  }, [searchQuery, products, services]);

  // Dynamically extract categories and subcategories from active products & DB categories
  const categoriesWithSubs = React.useMemo(() => {
    const catMap = new Map<string, { subs: Set<string>, thumbnail?: string, subImages: Record<string, string> }>();
    
    // Helper to find a product image
    const getProductImage = (cat: string, sub?: string) => {
      let match;
      if (sub) {
        match = products.find(p => p.category === cat && p.subCategory === sub && p.imageUrl);
      } else {
        match = products.find(p => p.category === cat && p.imageUrl);
      }
      return match?.imageUrl || null;
    };

    // First, pre-populate with default items
    // First, pre-populate with default items from both 'categories' and 'products' to guarantee a rich fallback of titles
    DEFAULT_MEGA_MENUS.forEach(menu => {
      if ((menu.id === 'categories' || menu.id === 'products') && menu.categories) {
        menu.categories.forEach(cat => {
          if (!catMap.has(cat.name)) {
            catMap.set(cat.name, { subs: new Set(), subImages: {} });
          }
          cat.items.forEach(itm => {
            catMap.get(cat.name)!.subs.add(itm);
          });
        });
      }
    });

    const defaultCatMenu = DEFAULT_MEGA_MENUS.find(m => m.id === 'categories');
    if (false && defaultCatMenu && defaultCatMenu.categories) {
       defaultCatMenu.categories.forEach(cat => {
         if (!catMap.has(cat.name)) {
           catMap.set(cat.name, { subs: new Set(), subImages: {} });
         }
         cat.items.forEach(itm => {
           catMap.get(cat.name)!.subs.add(itm);
         });
       });
    }

    // Map actual product categories and subcategories
    products.forEach(p => {
       if (p.category) {
         if (!catMap.has(p.category)) {
           catMap.set(p.category, { subs: new Set(), subImages: {} });
         }
         const entry = catMap.get(p.category)!;
         if (p.subCategory) {
           entry.subs.add(p.subCategory);
           if (p.imageUrl && !entry.subImages[p.subCategory]) {
             entry.subImages[p.subCategory] = p.imageUrl;
           }
         }
         if (p.imageUrl && !entry.thumbnail) {
           entry.thumbnail = p.imageUrl;
         }
       }
     });

     return Array.from(catMap.entries()).map(([name, data]) => ({
       name,
       thumbnail: data.thumbnail || SEED_URLS[0],
       items: Array.from(data.subs).filter(Boolean).map(sub => ({
         name: sub,
         image: data.subImages[sub] || data.thumbnail || SEED_URLS[0]
       })),
       link: `/products?category=${encodeURIComponent(name)}`
     }));
  }, [products, dbCategories]);

  // Handle active featured products dynamically based on hovered category or subcategory
  const activeFeaturedProducts = React.useMemo(() => {
    // Collect products that are marked as featured or tagged featured
    let baseFeatured = products.filter(p => p.featured === true || p.tags?.some((t: string) => ['featured', 'popular', 'hot'].includes(t.toLowerCase())));
    
    // Fallback if no specific featured elements exist
    if (baseFeatured.length === 0) {
      baseFeatured = products.slice(0, 3);
    }

    const hoverQuery = hoveredProductItem || hoveredCategoryItem;
    if (hoverQuery) {
      const queryLower = hoverQuery.toLowerCase();
      
      // Prioritize exact subcategory matches for better precision on hover
      const subMatching = products.filter(p => p.subCategory?.toLowerCase() === queryLower);
      if (subMatching.length > 0) return subMatching.slice(0, 3);
      
      // Fallback to category matches
      const catMatching = products.filter(p => p.category?.toLowerCase() === queryLower);
      if (catMatching.length > 0) return catMatching.slice(0, 3);

      // Final fallback to general search
      const matching = products.filter(p => 
        p.name?.toLowerCase().includes(queryLower) ||
        p.tags?.some((t: string) => t.toLowerCase() === queryLower)
      );
      if (matching.length > 0) return matching.slice(0, 3);
    }
    
    return baseFeatured.slice(0, 3);
  }, [products, hoveredProductItem, hoveredCategoryItem]);

  const combinedProjects = React.useMemo(() => {
    return dbPortfolio.length > 0 ? dbPortfolio : [
      {
        title: 'Loreto Schools Kenya',
        tag: 'Education',
        image: 'https://images.unsplash.com/photo-1544717305-27a734ef1904?auto=format&fit=crop&q=80',
        description: 'Full custom uniform engineering including bespoke blazers, sweaters with school patterns, and performance sports kits.'
      },
      {
        title: 'Safaricom Sports Day',
        tag: 'Events',
        image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80',
        description: 'Bulk production of 5000+ branded moisture-wicking t-shirts and caps for corporate athletics event.'
      },
      {
        title: 'Nairobi Hospital',
        tag: 'Healthcare',
        image: 'https://images.unsplash.com/photo-1576091160550-217359f42f8c?auto=format&fit=crop&q=80',
        description: 'Durable, anti-microbial scrubs and lab coats designed for medical professionals in high-traffic environments.'
      },
      {
        title: 'KCB Bank Corporate',
        tag: 'Corporate',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80',
        description: 'Custom embroidered cardigans and v-neck sweaters for regional staff, maintaining strict brand identity.'
      },
      {
        title: 'St. Mary\'s Academy',
        tag: 'Wholesale',
        image: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&q=80',
        description: 'End-to-end supply of primary and secondary uniforms with local Uhuru Market distribution points.'
      },
      {
        title: 'Standard Chartered',
        tag: 'Marketing',
        image: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&q=80',
        description: 'Branded promotional items and uniform caps for the Nairobi Marathon series.'
      }
    ];
  }, [dbPortfolio]);

  const portfolioColumns = React.useMemo(() => {
    const col1 = combinedProjects.filter(p => ['education', 'wholesale'].includes(p.tag?.toLowerCase() || ''));
    const col2 = combinedProjects.filter(p => ['events', 'corporate'].includes(p.tag?.toLowerCase() || ''));
    const col3 = combinedProjects.filter(p => !['education', 'wholesale', 'events', 'corporate'].includes(p.tag?.toLowerCase() || ''));
    
    return [
      { name: 'Institutional & Wholesale', items: col1 },
      { name: 'Corporate & Sports Events', items: col2 },
      { name: 'Healthcare & Marketing', items: col3 }
    ];
  }, [combinedProjects]);

  const navItems = [
    { name: 'Home', id: 'home', link: '/' },
    { name: 'Products', id: 'products', link: '/products' },
    { name: 'Services', id: 'services', link: '/services' },
    { name: 'Portfolio', id: 'portfolio', link: '/portfolio' },
    { name: 'Categories', id: 'categories', link: '/categories' }
  ];

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-700"
    >
      <AnimatePresence>
        {promotions.filter(p => p.type === 'top-bar').map(promo => (
          <motion.div 
            key={promo.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-[#C8102E] via-[#E94C36] to-[#C8961A] text-white overflow-hidden relative z-[110] border-b border-white/10"
          >
            <div className="max-w-[1440px] mx-auto px-6 py-2.5 flex items-center justify-between gap-6 text-[9px] font-black tracking-[3px] uppercase">
              <div className="flex items-center gap-4 font-sans">
                <Megaphone size={12} className="shrink-0 animate-bounce" />
                <span className="hidden lg:inline">{promo.title}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white/80 lowercase tracking-widest italic">{promo.subtitle || 'Exclusive Offer'}</span>
                {promo.buttonLink && (
                  <Link to={promo.buttonLink} className="bg-white text-[#C8102E] px-4 py-1 rounded-full hover:bg-neutral-100 transition-all font-black text-[8px] tracking-wider uppercase shadow-md animate-pulse">
                    {promo.buttonText || 'Discover'}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <header 
        className={`w-full relative transition-all duration-700 border-b border-white/5 ${
          isScrolled 
            ? 'bg-[#0E121C]/95 backdrop-blur-2xl py-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
            : 'bg-[#0E121C] py-0'
        }`}
      >
        {/* Signature Branding Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#C8102E] via-[#E94C36] to-[#C8961A] z-20"></div>

        <div className={`max-w-[1440px] mx-auto px-4 md:px-6 lg:px-20 flex items-center justify-between gap-4 md:gap-12 transition-all duration-700 ${isScrolled ? 'h-20 md:h-24' : 'h-24 md:h-32'}`}>
          {/* Brand Identity with Canva Gradient Theme */}
          <Link to="/" className="group flex items-center gap-3 md:gap-4 shrink-0">
            <div className={`relative transition-all duration-700 ${isScrolled ? 'w-12 h-12 md:w-14 md:h-14' : 'w-16 h-16 md:w-20 md:h-20'}`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#C8102E] to-[#C8961A] blur-[12px] md:blur-[16px] opacity-65 group-hover:opacity-100 transition-opacity rounded-full"></div>
              {siteSettings?.siteLogo ? (
                <img src={siteSettings.siteLogo} alt="Logo" className="w-full h-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-base md:text-xl lg:text-2xl text-white bg-gradient-to-tr from-[#C8102E] via-[#E94C36] to-[#C8961A] rounded-2xl relative z-10 shadow-xl overflow-hidden font-black transition-all border border-white/20 group-hover:border-[#C8961A]/50 group-hover:shadow-[0_0_20px_rgba(200,150,26,0.3)]">
                  <span className="relative z-10 select-none tracking-tight">NT</span>
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#C8961A_0%,transparent_60%)] opacity-35 mix-blend-overlay"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display text-xl md:text-2xl lg:text-3xl font-black tracking-tight transition-all duration-700 leading-none bg-gradient-to-r from-[#C8102E] via-[#E94C36] to-[#C8961A] bg-clip-text text-transparent group-hover:brightness-110">
                  {siteSettings?.siteName || 'Naisiae'}
                </span>
              </div>
              <span className="text-[8px] md:text-[9.5px] tracking-[2px] text-[#C8961A] uppercase font-black mt-1.5 group-hover:translate-x-1 transition-transform">
                {siteSettings?.siteTagline || 'Uhuru Market Uniforms'}
              </span>
            </div>
          </Link>

          {/* Centered Navigation */}
          <nav className="hidden xl:flex items-center gap-12 flex-1 justify-center h-full self-stretch">
            {navItems.map((item) => {
              const isActive = location.pathname === item.link;
              return (
                <div 
                  key={item.id} 
                  className="relative h-full flex items-center"
                >
                  <Link 
                    to={item.link} 
                    className={`text-[10px] font-black uppercase tracking-[4px] transition-all duration-550 relative group py-2 px-1 ${
                      isScrolled ? 'text-white/70' : 'text-white'
                    } hover:text-[#C8961A]`}
                  >
                    <span className="relative z-10">{item.name}</span>
                    <span className={`absolute -bottom-1 left-0 h-[2px] bg-[#C8961A] transition-all duration-700 ${
                      isActive ? 'w-full' : 'w-0'
                    } group-hover:w-full`}></span>
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Action Hub */}
          <div className="flex items-center gap-4 lg:gap-8">
             <div className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl border border-white/10 hidden sm:flex">
               <button onClick={() => setIsWishlistOpen(true)} aria-label="Open Wishlist" className="p-1.5 md:p-2 text-white/50 hover:text-[#FF4F5A] transition-colors relative group">
                 <Heart size={18} className={wishlistCount > 0 ? "fill-[#FF4F5A] text-[#FF4F5A]" : "group-hover:scale-110 transition-transform md:w-5 md:h-5"} />
                 {wishlistCount > 0 && (
                   <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF4F5A] rounded-full animate-ping"></span>
                 )}
               </button>
               <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
               <button onClick={() => setIsCompareModalOpen?.(true)} aria-label="Open Comparison" className="p-1.5 md:p-2 text-white/50 hover:text-[#00C4CC] transition-colors relative group">
                 <GitCompare size={18} className="group-hover:rotate-45 transition-transform md:w-5 md:h-5" />
               </button>
            </div>

            <button 
              onClick={() => setIsCartOpen(true)}
              aria-label="Open Shopping Cart"
              className="group relative p-3 md:p-4 bg-[#8B3DFF] text-white hover:bg-[#7D2AE8] hover:shadow-[0_0_20px_rgba(139,61,255,0.4)] transition-all duration-550 rounded-xl md:rounded-2xl shadow-xl active:scale-90"
            >
              <ShoppingBag size={20} className="relative z-10 md:w-5.5 md:h-5.5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-5 h-5 md:w-6 md:h-6 bg-[#FF4F5A] text-white text-[9px] md:text-[10px] font-black flex items-center justify-center rounded-full border-[2px] md:border-[3px] border-[#0E121C] shadow-lg animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => setIsQuoteModalOpen(true)}
              className="hidden lg:flex items-center gap-3 bg-gradient-to-r from-[#C8102E] to-[#C8961A] text-white hover:shadow-[0_4px_25px_rgba(200,16,46,0.4)] hover:-translate-y-0.5 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] transition-all duration-500 active:scale-95 shadow-[0_12px_40px_rgba(200,16,46,0.2)]"
            >
              <Package size={18} /> Enquire
            </button>

            <button 
              onClick={() => setIsMenuOpen(true)} 
              className="xl:hidden p-3 md:p-4 text-white hover:bg-white/10 rounded-xl md:rounded-2xl transition-colors"
            >
              <Menu size={24} className="md:w-7 md:h-7" />
            </button>
          </div>
        </div>


      </header>

      {/* Mobile Menu & Search Portal */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-[#0E121C]/80 backdrop-blur-md lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-full max-w-[320px] bg-[#0E121C] flex flex-col border-r border-[#C8961A]/10 shadow-[20px_0_100px_rgba(0,0,0,0.5)]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="font-display text-xl tracking-[4px] text-white">NAISIAE</div>
                  <div className="text-[7px] tracking-[3px] text-[#C8961A] font-black uppercase">Textiles Limited</div>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  aria-label="Close Mobile Menu"
                  className="p-3 text-white/50 hover:text-[#FF4F5A] bg-white/5 rounded-2xl hover:bg-[#FF4F5A]/10 transition-all border border-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Enhanced Mobile Search */}
              <div className="p-6 border-b border-white/5 bg-[#0E121C]/40">
                <div className="relative group">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchQuery ? 'text-[#C8961A]' : 'text-white/30 group-focus-within:text-[#C8961A]'}`} size={16} />
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearching(true)}
                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-[#C8961A]/30 focus:border-[#C8961A]/50 transition-all font-medium"
                  />
                  {searchQuery && (
                    <button 
                       onClick={() => setSearchQuery('')}
                       aria-label="Clear Search"
                       className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Dropdown Results for Mobile Search */}
                <AnimatePresence>
                  {searchQuery && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="mt-4 bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
                    >
                      {searchResults.length > 0 ? (
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                          {searchResults.map((item, idx) => (
                            <div 
                              key={`${item.type}-${item.id || idx}`}
                              onClick={() => {
                                if (item.type === 'product' && setSelectedQuickViewProduct) {
                                  setSelectedQuickViewProduct(item);
                                } else {
                                  const target = item.type === 'product' ? '/products' : item.type === 'service' ? '/services' : '/categories';
                                  navigate(target);
                                }
                                setIsMenuOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-3 p-4 hover:bg-white/5 border-b border-white/5 last:border-0 group transition-all cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-[#00C4CC]/30">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} className="w-full h-full object-cover object-top rounded-lg" alt={item.name} />
                                ) : item.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white group-hover:text-[#00C4CC] transition-colors truncate">{item.name}</p>
                                <span className="text-[8px] font-black uppercase text-[#00C4CC]/50 tracking-[1px]">{item.type}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-[10px] text-white/30 uppercase tracking-[2px] font-bold">
                          No matches found
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {[
                  { name: 'Home', link: '/', icon: <ShoppingBag size={18} /> },
                  { name: 'Products', link: '/products', icon: <Package size={18} /> },
                  { name: 'Services', link: '/services', icon: <Zap size={18} /> },
                  { name: 'Portfolio', link: '/portfolio', icon: <ChevronRight size={18} /> },
                  { name: 'Enquire', onClick: () => { setIsMenuOpen(false); setIsQuoteModalOpen(true); }, icon: <Plus size={18} />, highlight: true },
                ].map((item, idx) => (
                  <button 
                    key={`${item.name}-${idx}`}
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      else setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                      item.highlight 
                        ? 'bg-gradient-to-r from-[#C8102E] to-[#C8961A] text-white hover:brightness-110 shadow-lg' 
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.link ? (
                      <Link to={item.link} className="flex items-center gap-4 w-full">
                        <span className={`${item.highlight ? 'text-white' : 'text-[#C8961A]/50 group-hover:text-[#C8961A]'} transition-colors`}>{item.icon}</span>
                        <span className="text-sm font-bold tracking-wide uppercase">{item.name}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-4 w-full text-left">
                        <span className={`${item.highlight ? 'text-white' : 'text-[#C8961A]/50 group-hover:text-[#C8961A]'} transition-colors`}>{item.icon}</span>
                        <span className="text-sm font-bold tracking-wide uppercase">{item.name}</span>
                      </div>
                    )}
                    <ChevronRight size={14} className={item.highlight ? 'opacity-50 text-white' : 'text-white/10 group-hover:text-[#C8961A]'} />
                  </button>
                ))}
              </div>

              {/* Footer Branding */}
              <div className="p-6 mt-auto border-t border-white/5">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <div className="text-[8px] font-black text-[#C8961A] uppercase tracking-[3px] mb-2">Request Assistance</div>
                  <div className="text-white font-bold text-xs flex items-center justify-center gap-2">
                    <Phone size={14} className="text-[#C8961A]" />
                    +254 792 021 795
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile & Desktop Sourcing Highlights - Enhanced visual structure */}
      {seasonalPicks.length >= 2 && (
        <>
          {/* Desktop Floating Trending Drawer Trigger - Fixed on the right margin */}
          <div className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-[100]">
            <button
              onClick={() => setIsTrendingDrawerOpen(true)}
              className="bg-gradient-to-l from-[#0E121C]/95 to-[#0E121C] border-y border-l border-white/10 text-[#C8961A] hover:text-white px-3 py-6 rounded-l-3xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex flex-col items-center gap-3 active:scale-95 transition-all group cursor-pointer hover:border-[#C8961A]/30 hover:pl-4.5 font-sans"
            >
              <span className="w-2 h-2 rounded-full bg-[#FF4F5A] animate-pulse"></span>
              <span className="text-[9px] font-black tracking-[4px] uppercase [writing-mode:vertical-lr] select-none text-slate-300 group-hover:text-[#C8961A] transition-colors">Trending</span>
              <ChevronRight size={14} className="rotate-180 text-[#C8961A] group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Desktop Right Sidebar Drawer for Trending & Hot-Sourced Goods */}
          <AnimatePresence>
            {isTrendingDrawerOpen && (
              <>
                {/* Backdrop with elegant blur */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsTrendingDrawerOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
                />

                {/* Sidebar drawer content */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                  className="fixed right-0 top-0 bottom-0 w-[420px] bg-[#0E121C] border-l border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] z-[120] flex flex-col p-8 overflow-hidden font-sans"
                >
                  {/* Decorative neon top border */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#C21A30] via-[#E94C36] to-[#C8961A]" />

                  {/* Header */}
                  <div className="flex items-center justify-between mb-8 mt-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-[#C8961A] animate-ping"></span>
                        <span className="text-[10px] font-black text-[#C8961A] tracking-[3px] uppercase">Live Sourcing</span>
                      </div>
                      <h3 className="font-display text-2xl font-black text-white tracking-tight">Trending Collections</h3>
                    </div>
                    <button
                      onClick={() => setIsTrendingDrawerOpen(false)}
                      className="p-3 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/5 active:scale-90 transition-all cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Info alert banner */}
                  <div className="p-4 bg-[#C8961A]/10 rounded-2xl border border-[#C8961A]/20 mb-6 flex gap-3 items-center">
                    <span className="text-xl">🔥</span>
                    <div>
                      <p className="text-[10px] font-black text-white/90 uppercase tracking-[1.5px]">High-Volume Sourcing</p>
                      <p className="text-slate-400 text-[11px] font-bold">These high-grade items hold current production priority.</p>
                    </div>
                  </div>

                  {/* Sourced List */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                    {seasonalPicks.map((p, idx) => {
                      const popularityScore = 90 + (p.name ? (p.name.length % 10) : idx);
                      return (
                        <div 
                          key={`trending-drawer-${p.id}`}
                          className="group p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 hover:border-[#C8961A]/30 transition-all duration-300 flex items-center gap-4 relative overflow-hidden"
                        >
                          {/* Popularity indicator overlay */}
                          <div className="absolute top-3 right-4 flex items-center gap-1.5 bg-[#FF4F5A]/10 text-[#FF4F5A] px-2 py-0.5 rounded-full border border-[#FF4F5A]/20">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4F5A] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF4F5A]"></span>
                            </span>
                            <span className="text-[7.5px] font-black tracking-wide">{popularityScore}% DEMAND</span>
                          </div>

                          {/* Rank Index */}
                          <div className="text-2xl font-black italic select-none bg-gradient-to-br from-white/30 to-white/5 bg-clip-text text-transparent w-8 text-center">
                            0{idx + 1}
                          </div>

                          {/* Image Thumbnail */}
                          <div className="w-16 h-16 rounded-xl bg-white overflow-hidden shrink-0 border border-white/10 relative">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover object-top p-0.5" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                <Package size={16} className="text-white/20" />
                              </div>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white truncate group-hover:text-[#C8961A] transition-colors uppercase tracking-wide leading-snug">{p.name}</p>
                            <p className="text-[10px] text-[#C8961A] font-black tracking-widest mt-1">
                              {p.price ? `Ksh ${p.price.toLocaleString()}/-` : 'Bulk Price'}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => {
                                  if (setSelectedQuickViewProduct) setSelectedQuickViewProduct(p);
                                  setIsTrendingDrawerOpen(false);
                                }}
                                className="text-[9px] font-black text-slate-300 hover:text-white uppercase tracking-wider bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md border border-white/5 transition-all text-left"
                              >
                                Quick View
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Quote CTA */}
                  <div className="mt-auto pt-6 border-t border-white/5">
                    <button
                      onClick={() => {
                        setIsTrendingDrawerOpen(false);
                        if (setIsQuoteModalOpen) setIsQuoteModalOpen(true);
                      }}
                      className="w-full py-4 text-center text-white bg-gradient-to-r from-[#C21A30] to-[#C8961A] hover:brightness-110 active:scale-[0.98] rounded-2xl text-[10px] font-black uppercase tracking-[3px] shadow-[0_10px_30px_rgba(200,16,46,0.3)] transition-all cursor-pointer"
                    >
                      Request Sourcing Quote
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Mobile Sliding Sourcing Highlights - Utilizing empty bottom space */}
          <div className="lg:hidden fixed bottom-[68px] left-3 right-3 z-50">
            <AnimatePresence>
              {!isTrayMinimized ? (
                <motion.div 
                   initial={{ opacity: 0, y: 15 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 15 }}
                   className="bg-[#0E121C]/95 backdrop-blur-md rounded-2xl border border-white/10 p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden"
                >
                  {/* Decorative neon subtle top border line */}
                  <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#C8961A]/50 to-transparent"></div>

                  {/* Header */}
                  <div className="flex items-center justify-between mb-2 pl-1 relative z-10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8961A] animate-pulse"></span>
                      <span className="text-[9px] font-black text-[#C8961A] tracking-[1.5px] uppercase">Trending ({seasonalPicks.length})</span>
                    </div>
                    <button 
                      onClick={() => handleMinimize(true)}
                      className="text-white/40 hover:text-white text-[8px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-all active:scale-95 border border-white/5"
                    >
                      Hide
                    </button>
                  </div>

                  {/* Sliding Products Row (Horizontal swipeable carousel with calibrated medium card layout) */}
                  <div className="flex overflow-x-auto gap-2 py-1 px-0.5 scrollbar-hide snap-x focus:outline-none scroll-smooth relative z-10">
                    {seasonalPicks.map((p, idx) => (
                      <button 
                        key={p.id}
                        onClick={() => {
                          if (setSelectedQuickViewProduct) {
                            setSelectedQuickViewProduct(p);
                          } else {
                            navigate('/products');
                          }
                        }}
                        className="flex-shrink-0 snap-start w-[140px] bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 hover:border-[#C8961A]/30 rounded-xl p-1.5 flex items-center gap-2 transition-all text-left active:scale-95 relative group overflow-hidden"
                      >
                        {/* Rank Badge overlay on Mobile */}
                        <div className="absolute -top-1.5 -left-1.5 bg-[#FF4F5A] text-white text-[5.5px] font-black px-1.5 py-0.5 rounded-md scale-90 z-20 shadow-sm">
                          #{idx + 1}
                        </div>

                        {/* Calibrated premium visual container */}
                        <div className="w-9 h-9 rounded bg-white overflow-hidden shrink-0 border border-white/10 relative">
                          {p.imageUrl ? (
                            <img 
                              src={p.imageUrl} 
                              alt={p.name} 
                              className="w-full h-full object-cover object-top p-0.5 bg-slate-50" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800">
                              <Package size={12} className="text-white/20" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold text-white truncate max-w-[85px] leading-tight group-hover:text-[#C8961A] transition-colors">{p.name}</p>
                          <p className="text-[7.5px] text-[#C8961A] font-black tracking-wide mt-0.5">
                            {p.price ? `${p.price.toLocaleString()}/-` : 'Bulk Quote'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-end"
                >
                  <button 
                    onClick={() => handleMinimize(false)}
                    className="bg-[#0E121C]/95 backdrop-blur-md border border-[#C8961A]/30 text-[#C8961A] hover:bg-[#C8961A] hover:text-[#0E121C] font-bold text-[8px] uppercase tracking-widest px-2.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8961A] inline-block animate-pulse"></span>
                    Trending ({seasonalPicks.length})
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation - Shared across all pages */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-[#0E121C]/95 backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-between px-2 py-1.5 pb-safe shadow-[0_-10px_35px_rgba(0,0,0,0.5)]">
        {/* Top visual brand line divider */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C8102E] via-[#E94C36] to-[#C8961A]" />

        <Link to="/" className={`flex-1 flex flex-col items-center py-1 gap-1 relative transition-all duration-300 ${location.pathname === '/' ? 'text-[#C8961A]' : 'text-white/45'}`}>
          <Home size={20} className={location.pathname === '/' ? 'scale-110 drop-shadow-[0_0_6px_rgba(200,150,26,0.5)]' : 'opacity-80'} />
          <span className={`text-[9px] font-bold tracking-tighter uppercase ${location.pathname === '/' ? 'text-[#C8961A]' : 'text-white/50'}`}>Home</span>
          {location.pathname === '/' && (
            <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-[#C8961A] shadow-[0_0_8px_#C8961A]" />
          )}
        </Link>

        <Link to="/products" className={`flex-1 flex flex-col items-center py-1 gap-1 relative transition-all duration-300 ${location.pathname.startsWith('/products') ? 'text-[#C8961A]' : 'text-white/45'}`}>
          <Package size={20} className={location.pathname.startsWith('/products') ? 'scale-110 drop-shadow-[0_0_6px_rgba(200,150,26,0.5)]' : 'opacity-80'} />
          <span className={`text-[9px] font-bold tracking-tighter uppercase ${location.pathname.startsWith('/products') ? 'text-[#C8961A]' : 'text-white/50'}`}>Product</span>
          {location.pathname.startsWith('/products') && (
            <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-[#C8961A] shadow-[0_0_8px_#C8961A]" />
          )}
        </Link>

        <div className="flex-1 -mt-7 flex flex-col items-center relative z-[70]">
          <button 
            onClick={() => setIsQuoteModalOpen(true)}
            className="w-13 h-13 bg-gradient-to-r from-[#C8102E] via-[#E94C36] to-[#C8961A] rounded-full border-[3px] border-[#0E121C] flex items-center justify-center text-white shadow-[0_6px_20px_rgba(200,16,46,0.4)] active:scale-90 transition-transform relative group/quote"
          >
            {/* Soft backdrop pulsating glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#C8102E] via-[#E94C36] to-[#C8961A] -z-10 blur-[8px] opacity-70 group-hover:opacity-100 transition-opacity animate-pulse"></div>
            <Plus size={26} className="text-white font-extrabold drop-shadow" />
          </button>
          <span className="text-[9px] font-black tracking-tighter uppercase text-[#C8961A] mt-1 drop-shadow-sm font-sans">Get Quote</span>
        </div>

        <a 
          href={`https://wa.me/${(chatSettings?.whatsapp || '254792021795').replace(/\+/g, '')}?text=${encodeURIComponent(chatSettings?.message || 'Hello! I need assistance.')}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center py-1 gap-1 text-white/45 active:text-[#C8961A] active:scale-95 transition-all text-center"
        >
          <MessageSquare size={20} className="opacity-80" />
          <span className="text-[9px] font-bold tracking-tighter uppercase text-white/50">Chat</span>
        </a>

        <a 
          href="tel:+254792021795"
          className="flex-1 flex flex-col items-center py-1 gap-1 text-white/45 active:text-[#C8961A] active:scale-95 transition-all text-center"
        >
          <Phone size={20} className="opacity-80" />
          <span className="text-[9px] font-bold tracking-tighter uppercase text-white/50">Call</span>
        </a>
      </div>
    </div>
  );
}

