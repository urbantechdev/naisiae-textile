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
  MessageSquare,
  Scissors,
  Sliders,
  Globe,
  Check,
  ChevronDown,
  Star
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { collection, onSnapshot, doc, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/firebase';
import { useCart } from '../context/CartContext';
import { SEED_URLS } from '../constants/seedData';
import { appExperience } from '../utils/haptics';
import { useLocalization, COUNTRIES } from '../context/LocalizationContext';
import { LazyImage } from './LazyImage';

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
  const { currentCountry, currentLanguage, changeCountry, changeLanguage, t, formatPrice } = useLocalization();
  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  const getLocalizedLink = (path: string) => {
    if (currentCountry.code === 'KE') return path;
    const prefix = `/${currentCountry.name.toLowerCase().replace(/ /g, '-')}`;
    return `${prefix}${path === '/' ? '' : path}`;
  };

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
          siteName: 'Uhuru Market Uniforms',
          siteTagline: 'Naisiae Textiles',
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

  const rawSiteName = siteSettings?.siteName || 'Uhuru Market Uniforms';
  const rawSiteTagline = siteSettings?.siteTagline || 'Naisiae Textiles';
  const isReversed = (
    (rawSiteName.toLowerCase().includes('naisiae') || rawSiteName.toLowerCase().includes('naisiate')) &&
    (rawSiteTagline.toLowerCase().includes('uhuru') || rawSiteTagline.toLowerCase().includes('market'))
  );
  const resolvedSiteName = isReversed ? rawSiteTagline.trim() : rawSiteName.trim();
  const resolvedSiteTagline = isReversed ? rawSiteName.trim() : rawSiteTagline.trim();

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
  }, [combinedProjects, currentLanguage]);

  const expansiveMegaMenuData = React.useMemo(() => {
    const schoolProducts: any[] = [];
    const casualProducts: any[] = [];
    const serviceProducts: any[] = [];

    products.forEach(p => {
      const nameLower = (p.name || '').toLowerCase();
      const catLower = (p.category || '').toLowerCase();
      const tagsLower = (p.tags || []).map((t: string) => t.toLowerCase());

      const isSchool = catLower.includes('school') || catLower.includes('kmtc') || nameLower.includes('school') || nameLower.includes('blazer') || nameLower.includes('trousers') || nameLower.includes('skirt') || tagsLower.includes('school') || tagsLower.includes('education');
      
      const isService = catLower.includes('workwear') || catLower.includes('chef') || catLower.includes('service') || nameLower.includes('scrub') || nameLower.includes('lab coat') || nameLower.includes('medical') || nameLower.includes('apron') || tagsLower.includes('service') || tagsLower.includes('workwear') || tagsLower.includes('corporate') || catLower.includes('corporate');

      if (isSchool) {
        schoolProducts.push(p);
      } else if (isService) {
        serviceProducts.push(p);
      } else {
        casualProducts.push(p);
      }
    });

    return {
      school: schoolProducts.slice(0, 6),
      casual: casualProducts.slice(0, 6),
      service: serviceProducts.slice(0, 6)
    };
  }, [products]);

  const navItems = [
    { name: t('Home'), id: 'home', link: '/home' },
    { name: t('Products'), id: 'products', link: '/product' },
    { name: t('Services'), id: 'services', link: '/services' },
    { name: t('Textiles'), id: 'fabric-gallery', link: '/textiles' }
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

        <div className={`max-w-[1440px] mx-auto px-2.5 sm:px-4 md:px-6 lg:px-20 flex items-center justify-between gap-2 md:gap-12 transition-all duration-700 ${isScrolled ? 'h-14 sm:h-20 md:h-24' : 'h-16 sm:h-24 md:h-32'}`}>
          {/* Brand Identity with Canva Gradient Theme */}
          <Link to="/" className="group flex items-center gap-2 md:gap-4 shrink-0">
            <div className={`relative transition-all duration-700 ${isScrolled ? 'w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14' : 'w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20'}`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#C8102E] to-[#C8961A] blur-[8px] md:blur-[16px] opacity-65 group-hover:opacity-100 transition-opacity rounded-full"></div>
              {siteSettings?.siteLogo ? (
                <img src={siteSettings.siteLogo} alt="Logo" className="w-full h-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-xs sm:text-base md:text-xl lg:text-2xl text-white bg-gradient-to-tr from-[#C8102E] via-[#E94C36] to-[#C8961A] rounded-lg sm:rounded-2xl relative z-10 shadow-xl overflow-hidden font-black transition-all border border-white/20 group-hover:border-[#C8961A]/50 group-hover:shadow-[0_0_20px_rgba(200,150,26,0.3)]">
                  <span className="relative z-10 select-none tracking-tight">NT</span>
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#C8961A_0%,transparent_60%)] opacity-35 mix-blend-overlay"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xs sm:text-xl md:text-2xl lg:text-3xl font-black tracking-tight transition-all duration-700 leading-none bg-gradient-to-r from-[#C8102E] via-[#E94C36] to-[#C8961A] bg-clip-text text-transparent group-hover:brightness-110">
                  {resolvedSiteName}
                </span>
              </div>
              <span className="text-[6px] sm:text-[8px] md:text-[9.5px] tracking-[1.5px] sm:tracking-[2px] text-[#C8961A] uppercase font-black mt-0.5 sm:mt-1.5 group-hover:translate-x-1 transition-transform">
                {resolvedSiteTagline}
              </span>
            </div>
          </Link>

          {/* Centered Navigation */}
          <nav className="hidden xl:flex items-center gap-12 flex-1 justify-center h-full self-stretch">
            {navItems.map((item) => {
              const localizedLink = getLocalizedLink(item.link);
              const isActive = location.pathname === item.link || location.pathname === localizedLink;
              return (
                <div 
                  key={item.id} 
                  className="relative h-full flex items-center"
                >
                  <Link 
                    to={localizedLink} 
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
             {/* Localization Selector Dropdown */}
             <div className="relative font-sans shrink-0 hidden sm:block">
               <button 
                 onClick={() => setIsLocDropdownOpen(!isLocDropdownOpen)}
                 className="flex items-center gap-1.5 px-1.5 py-1 sm:px-2.5 sm:py-1.5 md:px-3.5 md:py-2.5 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl md:rounded-2xl text-white hover:bg-white/10 hover:border-[#C8961A]/30 transition-all text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-md"
               >
                 <span className="text-xs sm:text-sm leading-none">{currentCountry.flag}</span>
                 <span className="hidden md:inline-block text-[9px] font-black tracking-widest text-slate-300">{currentCountry.currency}</span>
                 <ChevronDown size={10} className="text-[#C8961A]" />
               </button>
               <AnimatePresence>
                 {isLocDropdownOpen && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setIsLocDropdownOpen(false)} />
                     <motion.div 
                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: 5, scale: 0.95 }}
                       className="absolute right-0 mt-3 w-56 bg-[#0E121C] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-4 z-50 overflow-hidden"
                     >
                       <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-[#C8102E] to-[#C8961A]" />
                       <div className="text-[8px] font-black text-white/30 tracking-[1.5px] uppercase mb-2">
                         {t('Select Country')}
                       </div>
                       <div className="space-y-1 mb-4 max-h-[180px] overflow-y-auto scrollbar-thin">
                         {COUNTRIES.map((c) => (
                           <button
                             key={c.code}
                             onClick={() => {
                               changeCountry(c.code);
                               setIsLocDropdownOpen(false);
                             }}
                             className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                               currentCountry.code === c.code 
                                 ? 'bg-[#C8961A]/10 border border-[#C8961A]/30 text-white' 
                                 : 'hover:bg-white/5 text-white/70 hover:text-white border border-transparent'
                             }`}
                           >
                             <div className="flex items-center gap-2.5">
                               <span className="text-sm leading-none">{c.flag}</span>
                               <span className="text-[10px] font-bold tracking-wide uppercase">{c.name} ({c.currency})</span>
                             </div>
                             {currentCountry.code === c.code && <Check size={11} className="text-[#C8961A]" />}
                           </button>
                         ))}
                       </div>

                       <div className="text-[8px] font-black text-white/30 tracking-[1.5px] uppercase mb-2">
                         {t('Select Language')}
                       </div>
                       <div className="grid grid-cols-2 gap-1.5">
                         {currentCountry.languages.map((l) => (
                           <button
                             key={l.code}
                             onClick={() => {
                               changeLanguage(l.code);
                               setIsLocDropdownOpen(false);
                             }}
                             className={`py-1.5 rounded-lg text-[9px] font-black text-center transition-all border ${
                               currentLanguage === l.code 
                                 ? 'bg-[#C8961A] text-white border-[#C8961A] shadow-md' 
                                 : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/5'
                             }`}
                           >
                             {l.label}
                           </button>
                         ))}
                       </div>
                     </motion.div>
                   </>
                 )}
               </AnimatePresence>
             </div>

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
              className="group relative p-2 md:p-4 bg-[#C8961A] text-white hover:bg-[#B08011] hover:shadow-[0_0_20px_rgba(200,150,26,0.4)] transition-all duration-550 rounded-lg md:rounded-2xl shadow-xl active:scale-90"
            >
              <ShoppingBag size={16} className="relative z-10 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 md:-top-3 md:-right-3 w-4 h-4 md:w-6 md:h-6 bg-[#FF4F5A] text-white text-[8px] md:text-[10px] font-black flex items-center justify-center rounded-full border-[1.5px] md:border-[3px] border-[#0E121C] shadow-lg animate-pulse">
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
              onClick={() => {
                setIsMegaMenuOpen(true);
                appExperience.triggerFeedback('tap');
              }} 
              aria-label="Open Expansive Mega Menu"
              className="p-2 md:p-4 bg-white text-slate-800 hover:bg-slate-50 rounded-lg md:rounded-2xl transition-all border border-slate-200 hover:border-[#C8961A]/40 flex items-center justify-center cursor-pointer shadow-md hover:scale-105 active:scale-95"
            >
              <Menu size={18} className="sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#0E121C]" />
            </button>
          </div>
        </div>


      </header>

      {/* Expansive Mega Menu Drawer */}
      <AnimatePresence>
        {isMegaMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md"
            onClick={() => setIsMegaMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="absolute right-0 top-0 bottom-0 w-full lg:w-[1050px] bg-white border-l border-slate-200 shadow-[0_0_80px_rgba(0,0,0,0.15)] z-[210] flex flex-col overflow-hidden font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#C8102E] via-[#E94C36] to-[#C8961A] z-20"></div>

              {/* Header */}
              <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between mt-1 relative z-10">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C8961A] animate-pulse"></span>
                    <h3 className="text-xs font-black uppercase tracking-[3px] text-[#C8961A]">Expansive Sourcing Catalog</h3>
                  </div>
                  <h2 className="font-display text-xl md:text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">
                    {resolvedSiteName} Catalog
                  </h2>
                </div>

                {/* Navigation Links inside Mega Menu for convenience */}
                <div className="hidden md:flex items-center gap-6 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                  {navItems.map((item) => (
                    <Link
                      key={`mega-nav-${item.id}`}
                      to={getLocalizedLink(item.link)}
                      onClick={() => setIsMegaMenuOpen(false)}
                      className="text-[9px] font-black uppercase tracking-[2px] text-slate-600 hover:text-[#C8961A] transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                <button
                  onClick={() => setIsMegaMenuOpen(false)}
                  aria-label="Close Mega Menu"
                  className="p-3 text-slate-500 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-2xl border border-slate-200/50 transition-all active:scale-95 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Main Body - Split into Categories Grid */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin">
                
                {/* Search Bar within Mega Menu */}
                <div className="max-w-2xl mx-auto relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#C8961A] transition-colors" size={16} />
                  <input
                    type="text"
                    placeholder="Search catalog categories and real-time products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#C8961A]/30 focus:border-[#C8961A]/50 focus:bg-white transition-all font-semibold"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Mega Categories Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Category 1: School Wear */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏫</span>
                        <h4 className="text-[11px] font-black uppercase tracking-[2.5px] text-slate-900">School Wear</h4>
                      </div>
                      <span className="text-[7.5px] font-black text-[#C8961A] bg-[#C8961A]/10 border border-[#C8961A]/20 px-2 py-0.5 rounded uppercase tracking-wider">Premium Grade</span>
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-semibold leading-relaxed">
                      Custom institutional sweaters, blazers, trousers, skirts & sportswear.
                    </p>
                    
                    <div className="space-y-3">
                      {expansiveMegaMenuData.school.length > 0 ? (
                        (() => {
                          const filtered = expansiveMegaMenuData.school.filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()));
                          if (filtered.length === 0) return <div className="text-center py-4 text-[9px] text-slate-300 uppercase tracking-widest font-bold">No matching school items</div>;
                          return filtered.map(p => (
                            <div
                              key={`mega-school-${p.id}`}
                              onClick={() => {
                                if (setSelectedQuickViewProduct) {
                                  setSelectedQuickViewProduct(p);
                                } else {
                                  navigate(`/products?category=${encodeURIComponent(p.category)}`);
                                }
                                setIsMegaMenuOpen(false);
                              }}
                              className="group p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 hover:border-[#C8961A]/30 transition-all duration-300 flex items-center gap-3 cursor-pointer"
                            >
                              <div className="w-20 h-20 rounded-xl bg-white overflow-hidden shrink-0 border border-slate-100 relative shadow-sm">
                                {p.imageUrl ? (
                                  <LazyImage src={p.imageUrl} alt={p.name} className="w-full h-full object-cover object-top p-1 group-hover:scale-110 transition-transform duration-500" wrapperClassName="w-full h-full" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                    <Package size={20} className="text-slate-300" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-[10px] font-black text-slate-800 truncate uppercase tracking-wide group-hover:text-[#C8961A] transition-colors">{p.name}</h5>
                                <p className="text-[9px] text-[#C8961A] font-black mt-0.5">
                                  {p.price ? formatPrice(p.price) : 'Sourcing Price'}
                                </p>
                              </div>
                              <ChevronRight size={12} className="text-slate-400 group-hover:text-[#C8961A] group-hover:translate-x-0.5 transition-all" />
                            </div>
                          ));
                        })()
                      ) : (
                        <div className="text-center py-4 text-[9px] text-slate-300 uppercase tracking-widest font-bold">No school items</div>
                      )}
                    </div>
                  </div>

                  {/* Category 2: Casual Wear */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">👕</span>
                        <h4 className="text-[11px] font-black uppercase tracking-[2.5px] text-slate-900">Casual & Sports</h4>
                      </div>
                      <span className="text-[7.5px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase tracking-wider">Athleisure</span>
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-semibold leading-relaxed">
                      High-end cotton blends, t-shirts, caps, hoodies & sports uniform kits.
                    </p>

                    <div className="space-y-3">
                      {expansiveMegaMenuData.casual.length > 0 ? (
                        (() => {
                          const filtered = expansiveMegaMenuData.casual.filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()));
                          if (filtered.length === 0) return <div className="text-center py-4 text-[9px] text-slate-300 uppercase tracking-widest font-bold">No matching casual items</div>;
                          return filtered.map(p => (
                            <div
                              key={`mega-casual-${p.id}`}
                              onClick={() => {
                                if (setSelectedQuickViewProduct) {
                                  setSelectedQuickViewProduct(p);
                                } else {
                                  navigate(`/products?category=${encodeURIComponent(p.category)}`);
                                }
                                setIsMegaMenuOpen(false);
                              }}
                              className="group p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 hover:border-[#C8961A]/30 transition-all duration-300 flex items-center gap-3 cursor-pointer"
                            >
                              <div className="w-20 h-20 rounded-xl bg-white overflow-hidden shrink-0 border border-slate-100 relative shadow-sm">
                                {p.imageUrl ? (
                                  <LazyImage src={p.imageUrl} alt={p.name} className="w-full h-full object-cover object-top p-1 group-hover:scale-110 transition-transform duration-500" wrapperClassName="w-full h-full" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                    <Package size={20} className="text-slate-300" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-[10px] font-black text-slate-800 truncate uppercase tracking-wide group-hover:text-[#C8961A] transition-colors">{p.name}</h5>
                                <p className="text-[9px] text-[#C8961A] font-black mt-0.5">
                                  {p.price ? formatPrice(p.price) : 'Sourcing Price'}
                                </p>
                              </div>
                              <ChevronRight size={12} className="text-slate-400 group-hover:text-[#C8961A] group-hover:translate-x-0.5 transition-all" />
                            </div>
                          ));
                        })()
                      ) : (
                        <div className="text-center py-4 text-[9px] text-slate-300 uppercase tracking-widest font-bold">No casual items</div>
                      )}
                    </div>
                  </div>

                  {/* Category 3: Service Wear */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🥼</span>
                        <h4 className="text-[11px] font-black uppercase tracking-[2.5px] text-slate-900">Service Wear</h4>
                      </div>
                      <span className="text-[7.5px] font-black text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded uppercase tracking-wider">Industrial</span>
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-semibold leading-relaxed">
                      Medical scrubs, lab coats, chef jackets, corporate wear & protective suits.
                    </p>

                    <div className="space-y-3">
                      {expansiveMegaMenuData.service.length > 0 ? (
                        (() => {
                          const filtered = expansiveMegaMenuData.service.filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()));
                          if (filtered.length === 0) return <div className="text-center py-4 text-[9px] text-slate-300 uppercase tracking-widest font-bold">No matching service items</div>;
                          return filtered.map(p => (
                            <div
                              key={`mega-service-${p.id}`}
                              onClick={() => {
                                if (setSelectedQuickViewProduct) {
                                  setSelectedQuickViewProduct(p);
                                } else {
                                  navigate(`/products?category=${encodeURIComponent(p.category)}`);
                                }
                                setIsMegaMenuOpen(false);
                              }}
                              className="group p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 hover:border-[#C8961A]/30 transition-all duration-300 flex items-center gap-3 cursor-pointer"
                            >
                              <div className="w-20 h-20 rounded-xl bg-white overflow-hidden shrink-0 border border-slate-100 relative shadow-sm">
                                {p.imageUrl ? (
                                  <LazyImage src={p.imageUrl} alt={p.name} className="w-full h-full object-cover object-top p-1 group-hover:scale-110 transition-transform duration-500" wrapperClassName="w-full h-full" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                    <Package size={20} className="text-slate-300" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-[10px] font-black text-slate-800 truncate uppercase tracking-wide group-hover:text-[#C8961A] transition-colors">{p.name}</h5>
                                <p className="text-[9px] text-[#C8961A] font-black mt-0.5">
                                  {p.price ? formatPrice(p.price) : 'Sourcing Price'}
                                </p>
                              </div>
                              <ChevronRight size={12} className="text-slate-400 group-hover:text-[#C8961A] group-hover:translate-x-0.5 transition-all" />
                            </div>
                          ));
                        })()
                      ) : (
                        <div className="text-center py-4 text-[9px] text-slate-300 uppercase tracking-widest font-bold">No service items</div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Mobile Navigation Links inside Mega Menu */}
                <div className="md:hidden space-y-4 pt-6 border-t border-slate-100">
                  <div>
                    <div className="text-[8px] font-black text-slate-400 tracking-[1.5px] uppercase mb-2">Main Sections</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: t('Home'), link: '/home' },
                        { name: t('Products'), link: '/product' },
                        { name: t('Services'), link: '/services' },
                        { name: t('Textiles'), link: '/textiles' }
                      ].map((item, idx) => (
                        <Link
                          key={`mega-mobile-nav-${idx}`}
                          to={getLocalizedLink(item.link)}
                          onClick={() => setIsMegaMenuOpen(false)}
                          className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-center text-xs font-bold text-slate-800 border border-slate-100 transition-all"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Country/Language Selector inside Mega Menu */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 tracking-[1.5px] uppercase">
                      <span>🌐</span>
                      <span>Country & Region</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {COUNTRIES.map((c) => {
                        const isSelected = currentCountry.code === c.code;
                        return (
                          <button
                            key={`mobile-country-${c.code}`}
                            onClick={() => {
                              changeCountry(c.code);
                              appExperience.triggerFeedback('tap');
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl transition-all border text-left ${
                              isSelected
                                ? 'bg-[#C8961A]/10 border-[#C8961A] text-[#0A1628]'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-150'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg leading-none">{c.flag}</span>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-wide leading-tight">{c.name}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{c.currency}</span>
                              </div>
                            </div>
                            {isSelected && <Check size={12} className="text-[#C8961A] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Mobile Language Selector */}
                    <div className="pt-2">
                      <div className="text-[8px] font-black text-slate-400 tracking-[1.5px] uppercase mb-2">Preferred Language</div>
                      <div className="grid grid-cols-2 gap-2">
                        {currentCountry.languages.map((l) => {
                          const isSelected = currentLanguage === l.code;
                          return (
                            <button
                              key={`mobile-lang-${l.code}`}
                              onClick={() => {
                                changeLanguage(l.code);
                                appExperience.triggerFeedback('tap');
                              }}
                              className={`py-2 px-3 rounded-xl text-[9px] font-black tracking-wider uppercase text-center transition-all border ${
                                isSelected
                                  ? 'bg-[#0A1628] text-white border-[#0A1628] shadow-md'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-150'
                              }`}
                            >
                              {l.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Quote CTA */}
              <div className="mt-auto p-6 md:p-8 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setIsMegaMenuOpen(false);
                    if (setIsQuoteModalOpen) setIsQuoteModalOpen(true);
                  }}
                  className="w-full py-4 text-center text-white bg-gradient-to-r from-[#C21A30] to-[#C8961A] hover:brightness-110 active:scale-[0.98] rounded-2xl text-[10px] font-black uppercase tracking-[3px] shadow-[0_10px_30px_rgba(200,16,46,0.3)] transition-all cursor-pointer"
                >
                  Request Sourcing Quote
                </button>
                <a
                  href={`https://wa.me/${(chatSettings?.whatsapp || '254792021795').replace(/\+/g, '')}?text=${encodeURIComponent(chatSettings?.message || 'Hello! I need assistance.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setIsMegaMenuOpen(false);
                    appExperience.triggerFeedback('tap');
                  }}
                  className="w-full py-4 text-center text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 active:scale-[0.98] rounded-2xl text-[10px] font-black uppercase tracking-[3px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <MessageSquare size={14} className="text-[#C8961A]" />
                  Chat Sourcing Desk
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <div className="font-display text-base tracking-[2px] text-white uppercase font-black">
                    {resolvedSiteName}
                  </div>
                  <div className="text-[8px] tracking-[3px] text-[#C8961A] font-black uppercase mt-1">
                    {resolvedSiteTagline}
                  </div>
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
                  { name: t('Home'), link: '/home', icon: <ShoppingBag size={18} /> },
                  { name: t('Products'), link: '/product', icon: <Package size={18} /> },
                  { name: t('Services'), link: '/services', icon: <Zap size={18} /> },
                  { name: t('Textiles'), link: '/textiles', icon: <Scissors size={18} /> },
                  { name: t('Write a Review'), link: '/review', icon: <Star size={18} className="text-amber-400" /> },
                  { name: t('Enquire'), onClick: () => { setIsMenuOpen(false); setIsQuoteModalOpen(true); }, icon: <Plus size={18} />, highlight: true },
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
                      <Link to={getLocalizedLink(item.link)} className="flex items-center gap-4 w-full">
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
                              {p.price ? formatPrice(p.price) : 'Bulk Price'}
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


        </>
      )}

      {/* Mobile Bottom Navigation - Shared across all pages */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-[#0E121C]/95 backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-between px-2 py-1.5 pb-safe shadow-[0_-10px_35px_rgba(0,0,0,0.5)]">
        {/* Top visual brand line divider */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C8102E] via-[#E94C36] to-[#C8961A]" />

        <Link 
          to="/" 
          onClick={() => appExperience.triggerFeedback('tap')} 
          className={`flex-1 flex flex-col items-center py-1 gap-1 relative transition-all duration-300 ${location.pathname === '/' ? 'text-[#C8961A]' : 'text-white/45'}`}
        >
          <Home size={20} className={location.pathname === '/' ? 'scale-110 drop-shadow-[0_0_6px_rgba(200,150,26,0.5)]' : 'opacity-80'} />
          <span className={`text-[9px] font-bold tracking-tighter uppercase ${location.pathname === '/' ? 'text-[#C8961A]' : 'text-white/50'}`}>Home</span>
          {location.pathname === '/' && (
            <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-[#C8961A] shadow-[0_0_8px_#C8961A]" />
          )}
        </Link>

        <Link 
          to="/product" 
          onClick={() => appExperience.triggerFeedback('tap')} 
          className={`flex-1 flex flex-col items-center py-1 gap-1 relative transition-all duration-300 ${location.pathname.startsWith('/product') ? 'text-[#C8961A]' : 'text-white/45'}`}
        >
          <Package size={20} className={location.pathname.startsWith('/product') ? 'scale-110 drop-shadow-[0_0_6px_rgba(200,150,26,0.5)]' : 'opacity-80'} />
          <span className={`text-[9px] font-bold tracking-tighter uppercase ${location.pathname.startsWith('/product') ? 'text-[#C8961A]' : 'text-white/50'}`}>Product</span>
          {location.pathname.startsWith('/product') && (
            <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-[#C8961A] shadow-[0_0_8px_#C8961A]" />
          )}
        </Link>

        <div className="flex-1 -mt-7 flex flex-col items-center relative z-[70]">
          <button 
            onClick={() => {
              appExperience.triggerFeedback('success');
              setIsQuoteModalOpen(true);
            }}
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
          onClick={() => appExperience.triggerFeedback('tap')}
          className="flex-1 flex flex-col items-center py-1 gap-1 text-white/45 active:text-[#C8961A] active:scale-95 transition-all text-center"
        >
          <MessageSquare size={20} className="opacity-80" />
          <span className="text-[9px] font-bold tracking-tighter uppercase text-white/50">Chat</span>
        </a>

        <a 
          href="tel:+254792021795"
          onClick={() => appExperience.triggerFeedback('tap')}
          className="flex-1 flex flex-col items-center py-1 gap-1 text-white/45 active:text-[#C8961A] active:scale-95 transition-all text-center"
        >
          <Phone size={20} className="opacity-80" />
          <span className="text-[9px] font-bold tracking-tighter uppercase text-white/50">Call</span>
        </a>
      </div>
    </div>
  );
}

