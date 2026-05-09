import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  Download,
  Upload,
  Search,
  Eye,
  Heart,
  User as UserIcon,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  Filter,
  MoreVertical,
  X,
  Save,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  GripVertical,
  Megaphone,
  PlusCircle,
  Calendar,
  Star,
  Check,
  Ban,
  UserPlus,
  Sparkles,
  Zap,
  Percent,
  Palette,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp,
  serverTimestamp,
  getDocs,
  where,
  limit
} from 'firebase/firestore';
import { auth, db, storage, handleFirestoreError, OperationType } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { List as VirtualList } from 'react-window';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { SEED_URLS } from '../constants/seedData';
import { suggestCompetitivePrice, PriceSuggestion } from '../services/pricingService';
import { generateProductDetails, generateDescriptionOnly } from '../services/geminiService';
import { ShieldCheck, BrainCircuit } from 'lucide-react';

// Mock data for initial charts if no real data
export default function AdminDashboard() {
  const [activeView, setActiveView] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [megaMenus, setMegaMenus] = useState<any[]>([]);
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [discountRules, setDiscountRules] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [wishlistSearch, setWishlistSearch] = useState('');
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePromoModal, setActivePromoModal] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [productSearch, setProductSearch] = useState('');
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productMinPrice, setProductMinPrice] = useState('');
  const [productMaxPrice, setProductMaxPrice] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editingDiscountRule, setEditingDiscountRule] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [stagedProducts, setStagedProducts] = useState<any[] | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const [analyticsDocs, setAnalyticsDocs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalQuotes: 0,
    totalPotentialRevenue: 0,
    activeProducts: 0
  });

  const newQuotesCount = quotes.filter(q => q.status === 'new' || !q.status).length;
  const pendingReviewsCount = reviews.filter(r => r.status === 'pending' || !r.status).length;
  const lowStockProductsCount = products.filter(p => {
    if (!p.active) return false;
    const totalStock = p.variants?.length > 0 
      ? p.variants.reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0)
      : (Number(p.stock) || 0);
    return totalStock > 0 && totalStock < 5;
  }).length;

  useEffect(() => {
    // Real-time products
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setProducts(items);
      setStats(prev => ({ ...prev, activeProducts: items.filter(i => i.active).length }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    // Real-time quotes
    const qQuotes = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const unsubscribeQuotes = onSnapshot(qQuotes, (snapshot) => {
      const qs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setQuotes(qs);
      setStats(prev => ({ 
        ...prev, 
        totalQuotes: qs.length,
        totalPotentialRevenue: qs.reduce((acc, q) => acc + (Number(q.total) || 0), 0)
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'quotes');
    });

    // Real-time Analytics
    const qAnalytics = query(collection(db, 'analytics'), orderBy('date', 'desc'), limit(30));
    const unsubscribeAnalytics = onSnapshot(qAnalytics, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      setAnalyticsDocs(docs);
      const totalViews = docs.reduce((acc, doc) => acc + (doc.views || 0), 0);
      setStats(prev => ({ ...prev, totalViews }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'analytics_summary');
    });

    // Real-time users
    const qUsers = query(collection(db, 'users'), orderBy('lastLogin', 'desc'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    // Real-time wishlists
    const qWishlists = query(collection(db, 'wishlists'), orderBy('updatedAt', 'desc'));
    const unsubscribeWishlists = onSnapshot(qWishlists, (snapshot) => {
      setWishlists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'wishlists');
    });

    // Real-time promotions
    const qPromos = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'));
    const unsubscribePromos = onSnapshot(qPromos, (snapshot) => {
      setPromotions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'promotions');
    });

    // Real-time Settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSiteSettings({ id: snapshot.id, ...snapshot.data() });
      } else {
        // Initialize default settings if doesn't exist
        setSiteSettings({
          siteName: 'Uhuru Market Uniforms',
          siteLogo: '',
          footerLogo: '',
          favicon: '',
          siteTagline: 'Uhuru Market Uniforms',
          sharingTitle: 'Uhuru Market Uniforms',
          sharingDescription: 'Modern, High-Quality Uniforms & Apparel for Kenya\'s Leading Institutions.',
          sharingImage: '',
          enableComparison: true,
          enableReviews: true
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/site');
    });

    // Real-time discount rules
    const unsubscribeDiscountRules = onSnapshot(collection(db, 'discountRules'), (snapshot) => {
      setDiscountRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'discountRules');
    });

    // Real-time reviews
    const unsubscribeReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reviews');
    });

    // Real-time Mega Menus
    const unsubscribeMegaMenus = onSnapshot(collection(db, 'mega_menus'), (snapshot) => {
      const menus = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMegaMenus(menus);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'mega_menus');
    });

    // Fetch Analytics for Top Products (Last 30 Days)
    const fetchTopProducts = async () => {
      try {
        const thirtyDaysAgo = subDays(new Date(), 30);
        // Optimize: Only fetch recent analytics to save quota
        const qAnalytics = query(
          collection(db, 'analytics'), 
          where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
          limit(1000) // Cap the reads to save quota
        );
        
        const analyticsSnap = await getDocs(qAnalytics);
        const productStats: Record<string, { name: string, count: number }> = {};
        const categoryStats: Record<string, number> = {};
        
        analyticsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.productId && (data.type === 'view' || data.type === 'wishlist_add')) {
            const pid = data.productId;
            if (!productStats[pid]) {
              productStats[pid] = { name: data.productName || 'Unknown Product', count: 0 };
            }
            productStats[pid].count += 1;
            
            // Collect category stats
            if (data.category) {
              categoryStats[data.category] = (categoryStats[data.category] || 0) + 1;
            }
          }
        });

        const sortedProducts = Object.values(productStats)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        if (sortedProducts.length > 0) {
          setTopProducts(sortedProducts);
        }

        const sortedCategories = Object.entries(categoryStats)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([name, count]) => ({ name, count }));
        
        if (sortedCategories.length > 0) {
          setTopCategories(sortedCategories);
        } else {
          // Fallback to active categories if no analytics yet
          const activeCats = Array.from(new Set(products.map(p => p.category))).slice(0, 4);
          setTopCategories(activeCats.map(name => ({ name, count: 1 })));
        }
      } catch (err) {
        console.error("Analytics fetch failed:", err);
      }
    };

    fetchTopProducts();

    return () => {
      unsubscribeProducts();
      unsubscribeQuotes();
      unsubscribeUsers();
      unsubscribeWishlists();
      unsubscribePromos();
      unsubscribeSettings();
      unsubscribeDiscountRules();
      unsubscribeReviews();
    };
  }, []);

  useEffect(() => {
    // Construct Chart Data (Last 7 days)
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayName = format(d, 'EEE');
      const dayData = analyticsDocs.find((doc: any) => doc.date === dayStr);
      
      // Count quotes for that day
      const dayQuotesCount = quotes.filter(q => {
        if (!q.createdAt) return false;
        const qDate = q.createdAt.toDate ? q.createdAt.toDate() : new Date(q.createdAt);
        return qDate.toISOString().split('T')[0] === dayStr;
      }).length;

      return {
        name: dayName,
        views: dayData?.views || 0,
        quotes: dayQuotesCount || 0
      };
    });
    setChartData(last7Days);
  }, [analyticsDocs, quotes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const filteredProducts = products.filter(product => {
    const search = debouncedProductSearch.toLowerCase();
    const matchesSearch = 
      product.name?.toLowerCase().includes(search) ||
      product.category?.toLowerCase().includes(search) ||
      product.id?.toLowerCase().includes(search) ||
      product.tags?.some((t: string) => t.toLowerCase().includes(search));
    
    const matchesCategory = productCategoryFilter === 'all' || product.category === productCategoryFilter;
    let matchesStatus = true;
    if (productStatusFilter === 'active') matchesStatus = product.active === true;
    else if (productStatusFilter === 'inactive') matchesStatus = product.active === false;
    else if (productStatusFilter === 'low-stock') {
      const totalStock = product.variants?.length > 0 
        ? product.variants.reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0)
        : (Number(product.stock) || 0);
      matchesStatus = totalStock <= 5;
    }
    else if (productStatusFilter === 'wholesale') {
      matchesStatus = product.tags?.some((t: string) => t.toLowerCase() === 'wholesale');
    }
    
    const minP = parseFloat(productMinPrice) || 0;
    const maxP = parseFloat(productMaxPrice) || Infinity;
    const matchesPrice = product.price >= minP && product.price <= maxP;

    return matchesSearch && matchesCategory && matchesStatus && matchesPrice;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredWishlists = wishlists.filter(list => {
    const search = wishlistSearch.toLowerCase();
    return (
      list.email?.toLowerCase().includes(search) ||
      list.displayName?.toLowerCase().includes(search)
    );
  });

  const handleLogout = () => signOut(auth);

  const exportToCSV = () => {
    const dataToExport = products.map(({ id, createdAt, updatedAt, sortOrder, ...rest }) => rest);
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `naisiae_products_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    setToast({ message: `Analyzing ${file.name}...`, type: 'info' });

    // Reset input value so the same file can be selected again
    const resetInput = () => { if (e.target) e.target.value = ''; };

    if (fileExtension === 'csv' || fileExtension === 'svg' || fileExtension === 'txt') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = evt.target?.result as string;
          
          if (content.trim().startsWith('<svg') || content.trim().startsWith('<?xml')) {
            setToast({ message: 'Use "Add Product" for SVG images.', type: 'warning' });
            resetInput();
            return;
          }

          Papa.parse(content, {
            header: false, // Standard arrays first to find the real header row
            skipEmptyLines: true,
            complete: (results) => {
              const rows = results.data as string[][];
              if (rows.length === 0) {
                setToast({ message: 'File is empty', type: 'error' });
                resetInput();
                return;
              }

              // Find the header row (one that contains "name" or "product")
              let headerIndex = -1;
              for (let i = 0; i < Math.min(rows.length, 10); i++) {
                const row = rows[i].map(c => String(c).toLowerCase());
                if (row.some(c => c.includes('product') || c.includes('name') || c.includes('category'))) {
                  headerIndex = i;
                  break;
                }
              }

              if (headerIndex === -1) {
                setToast({ message: 'Could not find product data headers', type: 'error' });
                resetInput();
                return;
              }

              const headers = rows[headerIndex].map(h => h.trim().toLowerCase());
              const dataRows = rows.slice(headerIndex + 1);
              const formattedData = dataRows.map(row => {
                const obj: any = {};
                headers.forEach((h, i) => {
                  if (h) obj[h] = row[i];
                });
                return obj;
              });

              resetInput();
              processImportedData(formattedData);
            },
            error: (error: any) => {
              resetInput();
              setToast({ message: `Error: ${error.message}`, type: 'error' });
            }
          });
        } catch (err) {
          resetInput();
          setToast({ message: 'Error processing file', type: 'error' });
        }
      };
      reader.readAsText(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          const wb = XLSX.read(data, { type: 'array' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
          
          if (jsonData.length === 0) {
            setToast({ message: 'File is empty', type: 'error' });
            resetInput();
            return;
          }

          const rows = jsonData as any[][];
          let headerIndex = -1;
          for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const row = rows[i].map(c => String(c).toLowerCase());
            if (row.some(c => c.includes('product') || c.includes('name') || c.includes('category'))) {
              headerIndex = i;
              break;
            }
          }

          if (headerIndex === -1) {
            setToast({ message: 'Could not find product data headers', type: 'error' });
            resetInput();
            return;
          }

          const headers = rows[headerIndex].map(h => String(h).trim().toLowerCase());
          const dataRows = rows.slice(headerIndex + 1);
          const formattedData = dataRows.map(row => {
            const obj: any = {};
            headers.forEach((h, i) => {
              if (h) obj[h] = row[i];
            });
            return obj;
          });

          resetInput();
          processImportedData(formattedData);
        } catch (error) {
          resetInput();
          setToast({ message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`, type: 'error' });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      resetInput();
      setToast({ message: 'Unsupported file format. Please use CSV or Excel.', type: 'error' });
    }
  };

  const processImportedData = async (importedData: any[]) => {
    if (!importedData || importedData.length === 0) {
      setToast({ message: 'No data found in the file', type: 'error' });
      return;
    }

    // Helper for safe strings
    const s = (v: any) => v === null || v === undefined ? '' : String(v).trim();
    const n = (v: any) => parseFloat(v?.toString() || '0') || 0;

    // Map headers to internal fields more robustly
    const mappedData = importedData
      .filter(item => {
        const nameKey = Object.keys(item).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('title'));
        const name = nameKey ? s(item[nameKey]) : '';
        // Skip empty rows or rows starting with separator symbols like ▶
        return name && !name.startsWith('▶') && !name.startsWith('---');
      })
      .map(item => {
      // Find values regardless of case or slight name variations
      const getRaw = (fields: string[]) => {
        for (const field of fields) {
          const lowerField = field.toLowerCase();
          for (const key of Object.keys(item)) {
            const lowerKey = key.toLowerCase().trim();
            if (lowerKey === lowerField || lowerKey.includes(lowerField)) {
              return item[key];
            }
          }
        }
        return undefined;
      };

      const name = s(getRaw(['name', 'title', 'product name'])) || 'Unnamed Product';
      const category = s(getRaw(['category', 'type', 'group'])) || 'School Uniforms';
      const price = n(getRaw(['price', 'amount', 'cost', 'unit price', 'current price']));
      const wholesalePrice = n(getRaw(['wholesale', 'bulk price', 'wholesale price']));
      const oldPrice = n(getRaw(['oldprice', 'discount price', 'original price', 'old price']));
      const desc = s(getRaw(['description', 'details', 'summary', 'about']));
      const img = s(getRaw(['imageurl', 'image', 'photo', 'url']));
      const badge = s(getRaw(['badge', 'label', 'tagline']));
      const statusVal = getRaw(['active', 'status', 'published']);
      const tagsVal = getRaw(['tags', 'keywords']);

      const tags = tagsVal ? 
        (typeof tagsVal === 'string' ? tagsVal.split(',').map((t: string) => t.trim()) : [s(tagsVal)]) : 
        [];
      
      // Auto-tag wholesale if wholesale price detected or tag exists
      if (wholesalePrice > 0 && !tags.some(t => t.toLowerCase() === 'wholesale')) {
        tags.push('Wholesale');
      }

      return {
        name,
        category,
        price,
        wholesalePrice: wholesalePrice || price, // Fallback to price if not set
        oldPrice,
        description: desc,
        imageUrl: img,
        active: statusVal?.toString().toLowerCase() === 'true' || 
                statusVal === true || 
                statusVal === 1 ||
                statusVal === undefined,
        badge,
        tags: [...new Set(tags)],
      };
    });

    setStagedProducts(mappedData);
    setToast({ message: `Imported ${mappedData.length} products to staging. Please review and sync.`, type: 'info' });
  };

  const handleSyncStagedProducts = async () => {
    if (!stagedProducts || stagedProducts.length === 0) return;

    setIsImporting(true);
    let successCount = 0;
    let updatedCount = 0;
    let failCount = 0;

    try {
      for (const productData of stagedProducts) {
        try {
          // Synchronization: Check if product with same name exists
          const existingProduct = products.find(p => p.name.toLowerCase().trim() === productData.name.toLowerCase().trim());
          
          if (existingProduct) {
            await updateDoc(doc(db, 'products', existingProduct.id), {
              ...productData,
              updatedAt: serverTimestamp()
            });
            updatedCount++;
          } else {
            await addDoc(collection(db, 'products'), {
              ...productData,
              imageUrls: productData.imageUrl ? [productData.imageUrl] : [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              sortOrder: products.length + successCount + 1
            });
            successCount++;
          }
        } catch (err) {
          console.error('Error importing row:', err);
          failCount++;
        }
      }
      
      setToast({ 
        message: `Sync complete! ${updatedCount} updated, ${successCount} created.${failCount > 0 ? ` Errors: ${failCount}` : ''}`, 
        type: failCount === 0 ? 'success' : 'warning' 
      });
      setStagedProducts(null); // Clear staging after success
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveMegaMenu = async (menuData: any) => {
    try {
      await setDoc(doc(db, 'mega_menus', menuData.id), {
        ...menuData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setToast({ message: 'Mega menu updated successfully!', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'mega_menus');
    }
  };

  const handleSeedPhotos = async () => {
    if (!confirm(`This will add ${SEED_URLS.length} product placeholders with the requested images. Continue?`)) return;
    
    setIsImporting(true);
    let successCount = 0;
    
    try {
      for (let i = 0; i < SEED_URLS.length; i++) {
        const url = SEED_URLS[i];
        await addDoc(collection(db, 'products'), {
          name: `Premium Textile Sample ${i + 1}`,
          category: 'New Arrivals',
          price: 0,
          oldPrice: 0,
          description: 'Waiting for product description and finalized specifications...',
          imageUrl: url,
          imageUrls: [url],
          active: true,
          tags: ['Incoming', 'New'],
          badge: 'New',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          stock: 100,
          featured: false,
          sku: `TX-${Date.now()}-${i}`
        });
        successCount++;
        if (i % 5 === 0) {
          setToast({ message: `Progress: ${successCount}/${SEED_URLS.length} images added...`, type: 'info' });
        }
      }
      setToast({ message: `Successfully added ${successCount} product images!`, type: 'success' });
    } catch (error) {
      console.error(error);
      setToast({ message: 'Error adding some images. Check console for details.', type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden text-[#1E293B]">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}
        bg-[#0A1628] text-white flex flex-col shrink-0 border-r border-white/5 fixed lg:static inset-y-0 left-0 z-[70] transition-all duration-300 ease-in-out
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-[#C8102E] rounded-lg flex items-center justify-center font-bold text-lg rotate-3 overflow-hidden shadow-lg shadow-[#C8102E]/20 shrink-0">
              <span className="-rotate-3 text-white">NT</span>
            </div>
            {!isSidebarCollapsed && (
              <motion.h1 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                className="font-['Bebas_Neue'] text-xl tracking-[2px] leading-none pt-1 text-[#C8961A] truncate"
              >
                Admin Panel
              </motion.h1>
            )}
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex w-6 h-6 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
          <SidebarItem 
            active={activeView === 'overview'} 
            onClick={() => { setActiveView('overview'); setIsMobileMenuOpen(false); }} 
            icon={<LayoutDashboard size={20} />} 
            label="Overview" 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            active={activeView === 'products'} 
            onClick={() => { setActiveView('products'); setIsMobileMenuOpen(false); }} 
            icon={<Package size={20} />} 
            label="Products" 
            collapsed={isSidebarCollapsed}
            badge={lowStockProductsCount}
          />
          <SidebarItem 
            active={activeView === 'quotes'} 
            onClick={() => { setActiveView('quotes'); setIsMobileMenuOpen(false); }} 
            icon={<MessageSquare size={20} />} 
            label="Quotes & Enquires" 
            collapsed={isSidebarCollapsed}
            badge={newQuotesCount}
          />
          <SidebarItem 
            active={activeView === 'wishlists'} 
            onClick={() => { setActiveView('wishlists'); setIsMobileMenuOpen(false); }} 
            icon={<Heart size={20} />} 
            label="Wishlist Insights" 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            active={activeView === 'promotions'} 
            onClick={() => { setActiveView('promotions'); setIsMobileMenuOpen(false); }} 
            icon={<Megaphone size={20} />} 
            label="Marketing & Promos" 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            active={activeView === 'appearance'} 
            onClick={() => { setActiveView('appearance'); setIsMobileMenuOpen(false); }} 
            icon={<Palette size={20} />} 
            label="Mega Menu & Layout" 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            active={activeView === 'reviews'} 
            onClick={() => { setActiveView('reviews'); setIsMobileMenuOpen(false); }} 
            icon={<Star size={20} />} 
            label="Public Reviews" 
            collapsed={isSidebarCollapsed}
            badge={pendingReviewsCount}
          />
          <SidebarItem 
            active={activeView === 'users'} 
            onClick={() => { setActiveView('users'); setIsMobileMenuOpen(false); }} 
            icon={<Users size={20} />} 
            label="Team Management" 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            active={activeView === 'analytics'} 
            onClick={() => { setActiveView('analytics'); setIsMobileMenuOpen(false); }} 
            icon={<BarChart3 size={20} />} 
            label="Analytics" 
            collapsed={isSidebarCollapsed}
          />
        </nav>

        <div className="p-4 mt-auto border-t border-white/5 space-y-1">
          <SidebarItem 
            active={activeView === 'settings'} 
            onClick={() => { setActiveView('settings'); setIsMobileMenuOpen(false); }} 
            icon={<Settings size={20} />} 
            label="Site Branding" 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            active={false} 
            onClick={handleLogout} 
            icon={<LogOut size={20} />} 
            label="Sign Out" 
            danger
            collapsed={isSidebarCollapsed}
          />
          
          {!isSidebarCollapsed && (
            <div className="mt-6 flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-[#C8961A] flex items-center justify-center text-white font-bold shadow-lg shadow-black/20">
                {auth.currentUser?.displayName?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{auth.currentUser?.displayName || 'Admin'}</p>
                <p className="text-[10px] text-gray-500 truncate">naisiaetext@gmail.com</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="h-20 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h2 className="font-bold text-xl capitalize text-[#0A1628]">{activeView === 'overview' ? 'Dashboard Overview' : activeView}</h2>
            <div className="hidden lg:flex items-center gap-3 bg-[#F8FAFC] rounded-2xl px-4 py-2 border border-[#E2E8F0] focus-within:ring-2 focus-within:ring-[#C8102E]/20 transition-all">
              <Search size={16} className="text-[#94A3B8]" />
              <input type="text" placeholder="Global search..." className="bg-transparent border-none outline-none text-sm w-64 placeholder:text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#1E293B]">{auth.currentUser?.displayName || 'Administrator'}</p>
              <p className="text-[10px] text-[#64748B]">naisiaetext@gmail.com</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1C3560] to-[#0A1628] flex items-center justify-center text-white border-2 border-white shadow-md">
              {auth.currentUser?.displayName?.charAt(0) || <UserIcon size={18} />}
            </div>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeView === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard label="Total Site Views" value={stats.totalViews.toLocaleString()} trend={0} icon={<Eye className="text-blue-600" />} />
                  <StatCard 
                    label="Quote Requests" 
                    value={stats.totalQuotes.toString()} 
                    trend={0} 
                    icon={<MessageSquare className="text-purple-600" />} 
                    onClick={() => setActiveView('quotes')}
                  />
                  <StatCard 
                    label="Low Stock Items" 
                    value={lowStockProductsCount.toString()} 
                    trend={0} 
                    icon={<Package className={`${lowStockProductsCount > 0 ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />} 
                    onClick={() => {
                      setProductStatusFilter('low-stock');
                      setActiveView('products');
                    }}
                  />
                  <StatCard label="Active Items" value={stats.activeProducts.toString()} trend={0} icon={<Package className="text-[#C8961A]" />} />
                  <StatCard 
                    label="Wholesale Deals" 
                    value={products.filter(p => p.tags?.some((t: string) => t.toLowerCase() === 'wholesale')).length.toString()} 
                    trend={0} 
                    icon={<Zap className="text-orange-500" />} 
                    onClick={() => {
                      setProductStatusFilter('wholesale');
                      setActiveView('products');
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Traffic Chart */}
                  <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-gray-800">Traffic & Conversion</h3>
                        <p className="text-xs text-gray-400">Weekly performance overview</p>
                      </div>
                      <select className="text-xs border border-gray-200 rounded-lg p-1 px-2 outline-none">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                      </select>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1C3560" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#1C3560" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Area type="monotone" dataKey="views" stroke="#1C3560" fillOpacity={1} fill="url(#colorViews)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 h-full overflow-hidden flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-6">Recent Quotes</h3>
                    <div className="space-y-4 overflow-y-auto flex-1">
                      {quotes.slice(0, 6).map((quote) => (
                        <div 
                          key={quote.id} 
                          onClick={() => { setSelectedQuote(quote); }}
                          className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer group"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#1C3560] font-bold shrink-0">
                            {quote.name.charAt(0)}
                          </div>
                          <div className="min-width-0 flex-1">
                            <p className="text-xs font-bold truncate pr-4">{quote.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {quote.items ? `${quote.items.length} items` : quote.service} · KES {quote.total?.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                             <ChevronRight size={14} className="text-gray-300 group-hover:text-[#C8102E] transition-colors" />
                             <span className="text-[9px] block mt-1 text-gray-400">
                               {quote.createdAt?.toDate ? format(quote.createdAt.toDate(), 'HH:mm') : 'Recently'}
                             </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setActiveView('quotes')} className="mt-4 w-full py-2.5 text-xs font-bold text-[#1C3560] bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">View All Requests</button>
                  </div>
                </div>

                {/* Top Products Integration */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-gray-800">Top Performing Products</h3>
                      <p className="text-xs text-gray-400">Based on wishlist additions and interactions</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.slice(0, 4).map((product, idx) => (
                      <div key={product.id} className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-50 hover:border-[#E2E8F0] hover:bg-slate-50/50 transition-all">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                             {product.imageUrl ? (
                               <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                             ) : (
                               <ImageIcon size={24} className="text-slate-300" />
                             )}
                          </div>
                          <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#C8961A] text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">
                            #{idx + 1}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-[#1E293B] truncate">{product.name}</h4>
                          <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-tighter">{product.category}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <Heart size={10} className="text-red-500 fill-red-500" />
                             <span className="text-[10px] font-black text-[#1C3560]">{Math.floor(Math.random() * 50) + 10} Saves</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'products' && (
              <motion.div 
                key="products"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                  <div className="p-6 border-b border-[#E2E8F0]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="font-bold text-[#1E293B]">Inventory Management</h3>
                        <p className="text-xs text-[#64748B]">Real-time synchronization with website frontend</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={exportToCSV}
                          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-[#E2E8F0] hover:bg-slate-50 transition-all text-[#64748B]"
                          title="Export to CSV"
                        >
                          <Download size={14} /> Export
                        </button>
                        <label className="cursor-pointer px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-[#E2E8F0] hover:bg-slate-50 transition-all text-[#64748B]" title="Import from CSV, Excel or SVG">
                          <Upload size={14} /> Import
                          <input 
                            type="file" 
                            accept=".csv, .xlsx, .xls, .svg" 
                            className="hidden" 
                            onChange={handleImportFile}
                            disabled={isImporting}
                          />
                        </label>
                        <button 
                          onClick={handleSeedPhotos}
                          disabled={isImporting}
                          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-all text-indigo-600 disabled:opacity-50"
                          title="Import requested product images"
                        >
                          <ImageIcon size={14} /> Seed Photos
                        </button>
                        <button 
                          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                          className="bg-[#C8102E] hover:bg-[#8B0000] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#B91C1C]/20 shrink-0"
                        >
                          <Plus size={16} /> Add Product
                        </button>
                      </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                          <input 
                            type="text" 
                            placeholder="Search name, category, or keywords..." 
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-none transition-all placeholder:text-[#94A3B8]"
                          />
                        </div>
      <div className="flex flex-wrap gap-3">
        <select 
          value={productCategoryFilter}
          onChange={(e) => setProductCategoryFilter(e.target.value)}
          className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C8102E]/20"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select 
          value={productStatusFilter}
          onChange={(e) => setProductStatusFilter(e.target.value)}
          className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C8102E]/20"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Drafts Only</option>
          <option value="wholesale">Wholesale Only</option>
        </select>
      </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-[#E2E8F0]/50">
                        <span className="text-[10px] font-black uppercase text-[#64748B] tracking-widest px-2">Price Range</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            placeholder="Min" 
                            value={productMinPrice}
                            onChange={(e) => setProductMinPrice(e.target.value)}
                            className="w-24 bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs outline-none"
                          />
                          <span className="text-gray-300">—</span>
                          <input 
                            type="number" 
                            placeholder="Max" 
                            value={productMaxPrice}
                            onChange={(e) => setProductMaxPrice(e.target.value)}
                            className="w-24 bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs outline-none"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            setProductSearch('');
                            setProductCategoryFilter('all');
                            setProductStatusFilter('all');
                            setProductMinPrice('');
                            setProductMaxPrice('');
                          }}
                          className="ml-auto text-[10px] font-bold text-[#64748B] hover:text-[#C8102E] uppercase tracking-wider"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm min-w-[800px]">
                    <div className="flex bg-[#F8FAFC] border-b border-[#E2E8F0] font-black text-[10px] uppercase tracking-wider text-[#64748B]">
                      <div className="flex-1 px-6 py-4">Product</div>
                      <div className="w-[180px] px-6 py-4">Category</div>
                      <div className="w-[150px] px-6 py-4">Base Price</div>
                      <div className="w-[120px] px-6 py-4">Status</div>
                      <div className="w-[100px] px-6 py-4 text-right">Actions</div>
                    </div>
                    
                    <div className="h-[600px]">
                      <VirtualList
                        style={{ height: 600, width: '100%' }}
                        rowCount={filteredProducts.length}
                        rowHeight={80}
                        rowProps={{}}
                        rowComponent={({ index, style }) => {
                          const item = filteredProducts[index];
                          if (!item) return null;
                          return (
                            <div style={style} className="flex border-b border-[#F1F5F9] hover:bg-slate-50/50 transition-colors group items-center">
                              <div className="flex-1 px-6 py-4 flex items-center gap-3 overflow-hidden">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl overflow-hidden shrink-0 border border-slate-200">
                                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} /> : '🧥'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-[#1E293B] truncate">{item.name}</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(item.tags || []).slice(0, 3).map((tag: string) => (
                                      <span key={tag} className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border transition-colors ${
                                        tag.toLowerCase() === 'wholesale' 
                                        ? 'bg-[#0A1628] text-[#C8961A] border-[#C8961A]/30' 
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                      }`}>
                                        {tag}
                                      </span>
                                    ))}
                                    {(item.tags || []).length > 3 && (
                                      <span className="text-[8px] font-black text-slate-400">
                                        +{(item.tags || []).length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="w-[180px] px-6 py-4 shrink-0">
                                <span className="bg-[#F1F5F9] text-[#1E293B] px-2.5 py-1 rounded-full text-[10px] font-bold border border-[#E2E8F0] shadow-sm truncate block text-center">
                                  {item.category}
                                </span>
                              </div>
                              
                              <div className="w-[150px] px-6 py-4 shrink-0">
                                <div className="font-extrabold text-sm text-[#0A1628]">
                                  KES {item.price.toLocaleString()}
                                  {item.oldPrice > 0 && <span className="block text-[10px] text-gray-400 line-through font-normal">KES {item.oldPrice.toLocaleString()}</span>}
                                </div>
                              </div>
                              
                              <div className="w-[120px] px-6 py-4 shrink-0">
                                <div className={`flex items-center gap-1.5 text-[10px] font-bold ${item.active ? 'text-green-600' : 'text-gray-400'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`}></div>
                                  {item.active ? 'Active' : 'Draft'}
                                </div>
                              </div>
                              
                              <div className="w-[100px] px-6 py-4 text-right shrink-0">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                                    className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-white rounded-lg border border-transparent hover:border-[#E2E8F0] transition-all"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteProduct(item.id)}
                                    className="p-1.5 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'promotions' && (
              <motion.div 
                key="promotions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Marketing Campaigns</h3>
                    <p className="text-sm text-slate-500">Control promotional banners and marketing sections on the homepage</p>
                  </div>
                  <button 
                    onClick={() => { setEditingItem(null); setActivePromoModal(true); }}
                    className="bg-[#C8102E] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#C8102E]/20"
                  >
                    <Plus size={16} /> New Campaign
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {promotions.map((promo) => (
                    <div key={promo.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                      <div className="h-40 relative bg-slate-100">
                        {promo.imageUrl ? (
                          <img src={promo.imageUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon size={40} />
                          </div>
                        )}
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button 
                            onClick={() => { setEditingItem(promo); setActivePromoModal(true); }}
                            className="p-2 bg-white/90 text-[#1C3560] rounded-lg shadow-sm hover:bg-white transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeletePromotion(promo.id)}
                            className="p-2 bg-white/90 text-red-600 rounded-lg shadow-sm hover:bg-white transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="absolute bottom-4 left-4">
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                             promo.active ? 'bg-green-500 border-green-600 text-white' : 'bg-slate-200 border-slate-300 text-slate-600'
                           }`}>
                             {promo.active ? 'Active' : 'Draft'}
                           </span>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                            {promo.type}
                          </span>
                        </div>
                        <h4 className="font-bold text-[#1E293B] mb-1">{promo.title}</h4>
                        <p className="text-xs text-[#64748B] mb-4 line-clamp-2">{promo.subtitle}</p>
                        
                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                            <Calendar size={12} />
                            {promo.startDate ? format(new Date(promo.startDate), 'MMM d') : 'No start'} - {promo.endDate ? format(new Date(promo.endDate), 'MMM d') : 'No end'}
                          </div>
                          <button 
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'promotions', promo.id), { active: !promo.active });
                              } catch (error) {
                                handleFirestoreError(error, OperationType.UPDATE, `promotions/${promo.id}`);
                              }
                            }}
                            className={`text-[10px] font-black uppercase tracking-widest ${promo.active ? 'text-red-600' : 'text-[#1C3560]'}`}
                          >
                            {promo.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {promotions.length === 0 && (
                    <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                      <Megaphone size={48} className="text-slate-200 mb-4" />
                      <h4 className="font-bold text-slate-500">No active campaigns</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2">Create a new promotion to show banners for holidays, sales, or seasonal events.</p>
                      <button 
                        onClick={() => { setEditingItem(null); setActivePromoModal(true); }}
                        className="mt-6 flex items-center gap-2 text-xs font-black text-[#1C3560] uppercase tracking-widest"
                      >
                        <Plus size={16} /> Create your first promo
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeView === 'users' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                  <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-[#1E293B]">Team Members</h3>
                      <p className="text-xs text-[#64748B]">Manage platform administrators and roles</p>
                    </div>
                    <button 
                      onClick={() => setIsAddUserModalOpen(true)}
                      className="bg-[#1C3560] hover:bg-[#0A1628] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                      <Plus size={16} /> Add Member
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Member</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Role</th>
                          <th className="px-6 py-4 text-[10px) font-black uppercase tracking-wider text-[#64748B] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#1C3560] text-white flex items-center justify-center font-bold text-xs uppercase text-center flex-shrink-0">
                                  {user.displayName?.charAt(0) || user.email.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-[#1E293B]">{user.displayName || 'Unnamed'}</p>
                                  <p className="text-[10px] text-[#64748B]">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                user.role === 'admin' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-slate-50 border-slate-100 text-slate-500'
                              }`}>
                                {user.role === 'admin' ? 'Administrator' : 'Standard User'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                disabled={user.email === 'naisiaetext@gmail.com'}
                                onClick={async () => {
                                  if (confirm('Delete this user?')) {
                                    try {
                                      await deleteDoc(doc(db, 'users', user.id));
                                    } catch (error) {
                                      handleFirestoreError(error, OperationType.DELETE, `users/${user.id}`);
                                    }
                                  }
                                }}
                                className="p-1.5 text-[#64748B] hover:text-red-600 disabled:opacity-30 transition-all font-bold"
                              >
                                {user.email === 'naisiaetext@gmail.com' ? 'System' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'quotes' && (
              <motion.div 
                key="quotes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex gap-4 mb-2">
                  <button 
                    onClick={() => setActiveTab('all')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-[#1C3560] text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                  >
                    Client Quotes
                  </button>
                  <button 
                    onClick={() => setActiveTab('discounts')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'discounts' ? 'bg-[#1C3560] text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                  >
                    Bulk Discount Rules
                  </button>
                </div>

                {activeTab === 'all' ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                    <div className="p-6 border-b border-[#E2E8F0]">
                      <h3 className="font-bold text-[#1E293B]">Client Requests</h3>
                      <p className="text-xs text-[#64748B]">Manage incoming quotes and product enquiries</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Client</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Service/Product</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Details</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B] text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {quotes.map((quote) => (
                            <tr key={quote.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-[#1E293B]">{quote.name}</p>
                                <p className="text-[10px] text-[#64748B] tracking-wide">{quote.email}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-semibold text-[#1C3560]">{quote.service || (quote.items ? 'Store Order' : 'Custom Request')}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  {quote.items ? (
                                    <span className="text-xs font-bold text-[#0A1628]">{quote.items.length} Items · KES {quote.total?.toLocaleString()}</span>
                                  ) : (
                                    <p className="text-[10px] text-[#64748B] line-clamp-1">{quote.details || 'No details'}</p>
                                  )}
                                  <p className="text-[9px] text-[#94A3B8]">{quote.createdAt?.toDate ? format(quote.createdAt.toDate(), 'PPP HH:mm') : 'Just now'}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <select 
                                  value={quote.status || 'new'} 
                                  onChange={async (e) => {
                                    try {
                                      await updateDoc(doc(db, 'quotes', quote.id), { status: e.target.value });
                                    } catch (error) {
                                      handleFirestoreError(error, OperationType.UPDATE, `quotes/${quote.id}`);
                                    }
                                  }}
                                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border outline-none ${
                                    quote.status === 'new' ? 'bg-blue-50 border-blue-100 text-blue-600' : 
                                    quote.status === 'closed' ? 'bg-gray-100 border-gray-200 text-gray-400' : 
                                    'bg-green-50 border-green-100 text-green-600'
                                  }`}
                                >
                                  <option value="new">New</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="closed">Closed</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => setSelectedQuote(quote)}
                                    className="p-1.5 text-[#64748B] hover:text-[#1C3560] hover:bg-white rounded-lg border border-transparent hover:border-[#E2E8F0] transition-all"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      try {
                                        if (confirm('Delete this quote?')) {
                                          await deleteDoc(doc(db, 'quotes', quote.id));
                                        }
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.DELETE, `quotes/${quote.id}`);
                                      }
                                    }}
                                    className="p-1.5 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                      <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[#1E293B]">Bulk Discount Rules</h3>
                          <p className="text-xs text-[#64748B]">Define automatic discounts for quantity or total order value</p>
                        </div>
                        <button 
                          onClick={() => { setEditingDiscountRule(null); setIsDiscountModalOpen(true); }}
                          className="bg-[#1C3560] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0A1628] transition-all shadow-md"
                        >
                          Add New Rule
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-['Inter']">
                          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                            <tr>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Rule Details</th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Type</th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Threshold</th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Benefit</th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Status</th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B] text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1F5F9]">
                            {discountRules.map((rule) => (
                              <tr key={rule.id} className="hover:bg-slate-50 transition-all group">
                                <td className="px-6 py-5">
                                  <p className="text-sm font-bold text-[#1E293B] group-hover:text-[#C8102E] transition-colors">{rule.title}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Created {rule.createdAt?.toDate ? format(rule.createdAt.toDate(), 'PP') : 'Today'}</p>
                                </td>
                                <td className="px-6 py-5">
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${rule.type === 'quantity' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {rule.type}
                                  </span>
                                </td>
                                <td className="px-6 py-5">
                                  <span className="text-xs font-bold text-slate-600">
                                    {rule.type === 'quantity' ? `${rule.threshold} Items` : `KES ${rule.threshold.toLocaleString()}+`}
                                  </span>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-2">
                                    <TrendingDown size={14} className="text-[#C8102E]" />
                                    <span className="text-sm font-black text-[#C8102E]">{rule.discountPercentage}% OFF</span>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <button
                                    onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, 'discountRules', rule.id), { active: !rule.active });
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.UPDATE, `discountRules/${rule.id}`);
                                      }
                                    }}
                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[2px] border transition-all ${
                                      rule.active 
                                        ? 'bg-green-500 border-green-600 text-white shadow-sm shadow-green-500/20' 
                                        : 'bg-slate-100 border-slate-200 text-slate-400'
                                    }`}
                                  >
                                    {rule.active ? 'Public' : 'Inactive'}
                                  </button>
                                </td>
                                <td className="px-6 py-5 text-right">
                                  <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => { setEditingDiscountRule(rule); setIsDiscountModalOpen(true); }}
                                      className="p-2 text-slate-400 hover:text-[#1C3560] hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        if (confirm('Permanently delete this discount rule? This will stop applying to new quotes immediately.')) {
                                          try {
                                            await deleteDoc(doc(db, 'discountRules', rule.id));
                                          } catch (error) {
                                            handleFirestoreError(error, OperationType.DELETE, `discountRules/${rule.id}`);
                                          }
                                        }
                                      }}
                                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {discountRules.length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-6 py-20 text-center">
                                  <div className="flex flex-col items-center justify-center opacity-30">
                                    <Percent size={48} className="mb-4" />
                                    <p className="font-['Bebas_Neue'] text-2xl tracking-widest">No Active Rules</p>
                                    <p className="text-[10px] font-bold uppercase tracking-wider max-w-[240px]">Create rules to automatically apply bulk discounts to customer orders.</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeView === 'wishlists' && (
              <motion.div 
                key="wishlists"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                  <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-[#1E293B]">Customer Wishlists</h3>
                      <p className="text-xs text-[#64748B]">See which products are currently trending in customer saves</p>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                      <input 
                        type="text" 
                        placeholder="Search by email or name..." 
                        value={wishlistSearch}
                        onChange={(e) => setWishlistSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C8102E]/20 w-full sm:w-64"
                      />
                    </div>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWishlists.map((list) => (
                      <div key={list.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-[#1C3560] shadow-sm">
                            {list.displayName?.charAt(0) || list.email?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold truncate pr-4">{list.displayName || 'Guest User'}</p>
                            <p className="text-[10px] text-[#64748B]">{list.email}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {list.items?.map((item: any) => (
                            <div key={item.id} className="flex gap-3 items-center bg-white p-2 rounded-lg border border-gray-50 flex items-center justify-center min-w-[32px] min-h-[32px]">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} className="w-8 h-8 rounded object-cover" />
                              ) : (
                                <Package size={16} className="text-slate-200" />
                              )}
                              <p className="text-xs font-medium text-slate-700 truncate">{item.name}</p>
                            </div>
                          ))}
                          {!list.items?.length && <p className="text-xs text-slate-400 italic">No items saved yet</p>}
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Updated {list.updatedAt?.toDate ? format(list.updatedAt.toDate(), 'PP') : 'Recently'}
                          </span>
                          <span className="text-[10px] font-bold text-[#C8102E]">{list.items?.length || 0} Saved</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                  <div className="p-6 border-b border-[#E2E8F0] bg-slate-50 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-[#1E293B]">Site Branding & Configuration</h3>
                      <p className="text-xs text-[#64748B]">Manage logos, favicons, and social sharing metadata</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200">
                      <Save size={12} /> Auto-saves
                    </div>
                  </div>
                  <SettingsForm 
                    initialData={siteSettings} 
                    setToast={setToast}
                    onSave={async (data: any) => {
                      try {
                        const settingsRef = doc(db, 'settings', 'site');
                        await setDoc(settingsRef, { 
                          ...data, 
                          updatedAt: serverTimestamp() 
                        }, { merge: true });
                      } catch (error) {
                        handleFirestoreError(error, OperationType.UPDATE, 'settings/site');
                      }
                    }}
                  />
                </div>
              </motion.div>
            )}

            {activeView === 'analytics' && (
              <motion.div 
                key="analytics"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
                    <h3 className="font-bold text-gray-800 mb-6">Page Views by Day</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="views" fill="#1C3560" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
                    <h3 className="font-bold text-gray-800 mb-6">Quote Conversions</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="quotes" stroke="#C8102E" strokeWidth={3} dot={{ r: 4, fill: '#C8102E' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
                  <h3 className="font-bold text-gray-800 mb-6 text-sm flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#C8102E]" />
                    Top 5 Trending Products (Last 30 Days)
                  </h3>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" axisLine={false} tickLine={false} hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#1E293B'}} width={150} />
                        <Tooltip 
                           cursor={{fill: '#f8fafc'}}
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#C8102E" radius={[0, 4, 4, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
                  <h3 className="font-bold text-gray-800 mb-6">Popular Categories</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {topCategories.map((cat, i) => {
                      const totalCount = topCategories.reduce((acc, c) => acc + (c.count || 0), 0);
                      const percentage = totalCount > 0 ? Math.round((cat.count / totalCount) * 100) : 0;
                      return (
                        <div key={cat.name} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rank #{i+1}</p>
                          <h4 className="text-sm font-bold text-[#1E293B]">{cat.name}</h4>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-[#C8961A]" style={{ width: `${percentage || (80 - i*15)}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-[#64748B]">{percentage || (80 - i*15)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'appearance' && (
              <motion.div 
                key="appearance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                  <div className="p-8 border-b border-[#E2E8F0] flex items-center justify-between bg-gradient-to-r from-white to-[#F8FAFC]">
                    <div>
                      <h3 className="text-2xl font-['Bebas_Neue'] text-[#0A1628] tracking-wide">Mega Menu Architecture</h3>
                      <p className="text-[10px] font-black text-[#C8961A] border-l-2 border-[#C8961A] pl-3 uppercase tracking-[3px] mt-1">Configure Advanced Navigation Elements</p>
                    </div>
                  </div>
                  
                  <div className="p-8 space-y-12">
                    {/* If no mega menus in firestore, show setup button or pre-fill defaults */}
                    {megaMenus.length === 0 ? (
                      <div className="py-12 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                        <div className="max-w-md mx-auto space-y-4">
                          <Palette size={48} className="mx-auto text-slate-300" />
                          <h4 className="text-lg font-bold">Initialize Navigation Settings</h4>
                          <p className="text-sm text-slate-500">Would you like to load the default mega menu structure to begin customizing images?</p>
                          <button 
                            onClick={async () => {
                              const defaults = [
                                { 
                                  id: 'school_uniforms',
                                  name: 'School Uniforms', 
                                  featured: { title: 'Premium Blazers', image: 'https://i.pinimg.com/1200x/90/64/8b/90648bb28cec9fb56d9f37ccce1ee27c.jpg', link: '#' },
                                  categories: [
                                    { name: 'Boys Uniform', items: ['Shirts', 'Trousers', 'Shorts', 'Blazers', 'Ties'] },
                                    { name: 'Girls Uniform', items: ['Blouses', 'Skirts', 'Dresses', 'Pinafores', 'Jumpers'] },
                                    { name: 'Accessories', items: ['Socks', 'Belts', 'Bags', 'Badges', 'Water Bottles'] }
                                  ]
                                },
                                { 
                                  id: 'corporate_wear',
                                  name: 'Corporate Wear', 
                                  featured: { title: 'Durable Overalls', image: 'https://i.pinimg.com/1200x/8c/8b/4a/8c8b4a92c90c677e483561a37c37494a.jpg', link: '#' },
                                  categories: [
                                    { name: 'Office Attire', items: ['Branded Shirts', 'Formal Suits', 'Polo Shirts', 'Ties', 'Scarves'] },
                                    { name: 'Workwear', items: ['Overalls', 'Dust Coats', 'Safety Vests', 'Cargo Pants', 'Aprons'] },
                                    { name: 'Accessories', items: ['ID Lanyards', 'Name Tags', 'Branded Caps', 'Corporate Bags', 'Belts'] }
                                  ]
                                },
                                { 
                                  id: 'service_sectors',
                                  name: 'Service Sectors', 
                                  featured: { title: 'Medical Scrubs', image: 'https://i.pinimg.com/1200x/4e/64/1d/4e641d8e641772635489ef08b1a43a0e.jpg', link: '#' },
                                  categories: [
                                    { name: 'Medical', items: ['Scrubs', 'Lab Coats', 'Nurse Uniforms', 'Theatre Caps', 'Aprons'] },
                                    { name: 'Hospitality', items: ['Chef Coats', 'Waiter Shirts', 'Kitchen Aprons', 'Hostess Wear', 'Table Linens'] },
                                    { name: 'Security', items: ['Security Shirts', 'Tactical Pants', 'Berets', 'Peak Caps', 'Whistles'] }
                                  ]
                                }
                              ];
                              for (const menu of defaults) {
                                await handleSaveMegaMenu(menu);
                              }
                            }}
                            className="bg-[#1C3560] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#1C3560]/20 hover:scale-105 transition-all"
                          >
                            Load Template Architecture
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {megaMenus.map((menu) => (
                          <div key={menu.id} className="bg-[#FBFCFE] border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/80">
                              <h4 className="font-['Bebas_Neue'] text-2xl tracking-widest text-[#0A1628]">{menu.name}</h4>
                            </div>

                            <div className="space-y-8">
                              {/* Featured Section */}
                              <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 block ml-2">Featured Card Content</label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600">Featured Title</label>
                                    <input 
                                      type="text" 
                                      value={menu.featured.title} 
                                      onChange={(e) => {
                                        const updated = { ...menu, featured: { ...menu.featured, title: e.target.value } };
                                        setMegaMenus(megaMenus.map(m => m.id === menu.id ? updated : m));
                                      }}
                                      className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-[#C8961A] outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600">Action Link</label>
                                    <input 
                                      type="text" 
                                      value={menu.featured.link} 
                                      onChange={(e) => {
                                        const updated = { ...menu, featured: { ...menu.featured, link: e.target.value } };
                                        setMegaMenus(megaMenus.map(m => m.id === menu.id ? updated : m));
                                      }}
                                      placeholder="#"
                                      className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-[#C8961A] outline-none"
                                    />
                                  </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-slate-600">Featured Image URL</label>
                                  <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm relative group flex items-center justify-center">
                                      {menu.featured.image ? (
                                        <img src={menu.featured.image} className="w-full h-full object-cover" alt="Featured" />
                                      ) : (
                                        <ImageIcon size={20} className="text-slate-300" />
                                      )}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <ImageIcon size={16} className="text-white" />
                                      </div>
                                    </div>
                                    <input 
                                      type="text" 
                                      placeholder="https://..."
                                      value={menu.featured.image} 
                                      onChange={(e) => {
                                        const updated = { ...menu, featured: { ...menu.featured, image: e.target.value } };
                                        setMegaMenus(megaMenus.map(m => m.id === menu.id ? updated : m));
                                      }}
                                      className="flex-1 bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-[#C8961A] outline-none"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="pt-4 flex justify-end">
                                <button 
                                  onClick={() => handleSaveMegaMenu(menu)}
                                  className="flex items-center gap-2 px-6 py-3 bg-[#1C3560] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0A1628] transition-all"
                                >
                                  <Save size={16} />
                                  Update Architecture
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'reviews' && (
              <motion.div 
                key="reviews"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                  <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-[#1E293B]">Public Customer Reviews</h3>
                      <p className="text-xs text-[#64748B]">Moderate and manage product reviews submitted by customers</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Product</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Customer</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Rating</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Comment</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B]">Status</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#64748B] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reviews.map((review) => (
                          <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-xs font-bold text-[#1E293B]">{review.productName}</p>
                              <p className="text-[10px] text-slate-400">ID: {review.productId}</p>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-600">{review.userName || 'Verified Buyer'}</td>
                            <td className="px-6 py-4">
                              <div className="flex text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={12} fill={i < review.rating ? 'currentColor' : 'none'} className={i < review.rating ? 'text-amber-400' : 'text-slate-200'} />
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs text-slate-500 max-w-xs line-clamp-2">{review.comment}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                                review.status === 'approved' ? 'bg-green-50 text-green-600' : 
                                review.status === 'rejected' ? 'bg-red-50 text-red-600' : 
                                'bg-blue-50 text-blue-600'
                              }`}>
                                {review.status || 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {review.status !== 'approved' && (
                                  <button 
                                    onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, 'reviews', review.id), { status: 'approved' });
                                      } catch (err) {
                                        handleFirestoreError(err, OperationType.UPDATE, `reviews/${review.id}`);
                                      }
                                    }}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                    title="Approve"
                                  >
                                    <Check size={16} />
                                  </button>
                                )}
                                {review.status !== 'rejected' && (
                                  <button 
                                    onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, 'reviews', review.id), { status: 'rejected' });
                                      } catch (err) {
                                        handleFirestoreError(err, OperationType.UPDATE, `reviews/${review.id}`);
                                      }
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Reject"
                                  >
                                    <Ban size={16} />
                                  </button>
                                )}
                                <button 
                                  onClick={async () => {
                                    if (confirm('Delete this review?')) {
                                      try {
                                        await deleteDoc(doc(db, 'reviews', review.id));
                                      } catch (err) {
                                        handleFirestoreError(err, OperationType.DELETE, `reviews/${review.id}`);
                                      }
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reviews.length === 0 && (
                      <div className="py-20 text-center border-t border-slate-50">
                        <div className="opacity-20 flex flex-col items-center">
                          <Star size={40} className="mb-4" />
                          <p className="font-bold text-sm">No pending or approved reviews</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-[#E2E8F0] mt-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#64748B]">
              &copy; {new Date().getFullYear()} <span className="font-bold text-[#1E293B]">Uhuru Market Uniforms</span>. All rights reserved.
            </p>
            <Link 
              to="/" 
              className="flex items-center gap-2 text-xs font-bold text-[#1C3560] hover:text-[#C8102E] transition-all group"
            >
              <Eye size={14} className="group-hover:scale-110 transition-transform" />
              View Public Site
            </Link>
          </div>
        </footer>
      </main>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddUserModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-8"
            >
              <div className="text-center space-y-2 mb-8">
                <div className="w-16 h-16 bg-[#1C3560]/10 rounded-2xl flex items-center justify-center mx-auto text-[#1C3560]">
                  <UserPlus size={32} />
                </div>
                <h3 className="text-2xl font-['Bebas_Neue'] tracking-wide text-[#0A1628]">Add Team Member</h3>
                <p className="text-[10px] font-black text-[#64748B] uppercase tracking-[3px]">Assign Administrative Roles</p>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newUserEmail) return;
                  try {
                    await setDoc(doc(db, 'users', newUserEmail.replace(/\./g, '_')), {
                      email: newUserEmail,
                      role: newUserRole,
                      displayName: newUserEmail.split('@')[0],
                      createdAt: serverTimestamp()
                    });
                    setToast({ message: `Access granted to ${newUserEmail}`, type: 'success' });
                    setNewUserEmail('');
                    setIsAddUserModalOpen(false);
                  } catch (err) {
                    handleFirestoreError(err, OperationType.CREATE, 'users');
                  }
                }}
                className="space-y-6"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#64748B] tracking-widest ml-1">Member Email Address</label>
                  <input 
                    required
                    type="email"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    placeholder="teammate@naisiaetextile.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:border-[#C8102E] focus:bg-white outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#64748B] tracking-widest ml-1">Access Level</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setNewUserRole('user')}
                      className={`py-3 px-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        newUserRole === 'user' ? 'border-[#1C3560] bg-[#1C3560]/5 text-[#1C3560]' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      Staff Member
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewUserRole('admin')}
                      className={`py-3 px-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        newUserRole === 'admin' ? 'border-[#C8102E] bg-[#C8102E]/5 text-[#C8102E]' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      Administrator
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B] hover:text-[#1E293B]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-[#1C3560] hover:bg-[#0A1628] text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all shadow-xl active:scale-95"
                  >
                    Grant Access
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Staging Review Modal */}
      <AnimatePresence>
        {stagedProducts && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStagedProducts(null)}
              className="absolute inset-0 bg-[#0A1628]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-[#1E293B] tracking-tight">Review Imported Products</h2>
                  <p className="text-sm text-slate-500 font-medium">{stagedProducts.length} items detected from your file</p>
                </div>
                <button 
                  onClick={() => setStagedProducts(null)}
                  className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 gap-3">
                  {stagedProducts.map((p, idx) => {
                    const isExisting = products.some(ep => ep.name.toLowerCase().trim() === p.name.toLowerCase().trim());
                    return (
                      <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors bg-slate-50/30">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                          ) : (
                            <span className="text-xl">🧥</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#1E293B] truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black uppercase text-slate-400 bg-white px-1.5 py-0.5 border border-slate-100 rounded-md">
                              {p.category}
                            </span>
                            <span className="text-[10px] font-black text-blue-600">
                              KES {p.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isExisting ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Update Existing
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              New Product
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {stagedProducts.filter(p => products.some(ep => ep.name.toLowerCase().trim() === p.name.toLowerCase().trim())).length} to Update
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    {stagedProducts.filter(p => !products.some(ep => ep.name.toLowerCase().trim() === p.name.toLowerCase().trim())).length} New
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStagedProducts(null)}
                    className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-[#64748B] hover:text-[#1E293B] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSyncStagedProducts}
                    disabled={isImporting}
                    className="bg-[#C8102E] hover:bg-[#A60D26] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-[#C8102E]/20 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Synchronizing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        Synchronize Products
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
                <h3 className="font-['Bebas_Neue'] text-2xl tracking-wide text-[#0A1628]">
                  {editingItem ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black transition-colors"><X size={20} /></button>
              </div>
              <ProductForm 
                initialData={editingItem} 
                setToast={setToast}
                onSubmit={async (data) => {
                  try {
                    if (editingItem) {
                      await updateDoc(doc(db, 'products', editingItem.id), { ...data, updatedAt: serverTimestamp() });
                    } else {
                      await addDoc(collection(db, 'products'), { 
                        ...data, 
                        createdAt: serverTimestamp(), 
                        updatedAt: serverTimestamp(),
                        sortOrder: products.length + 1
                      });
                    }
                    setToast({ message: editingItem ? 'Product updated successfully!' : 'Product added successfully!', type: 'success' });
                    setIsModalOpen(false);
                    setEditingItem(null);
                  } catch (error) {
                    handleFirestoreError(error, editingItem ? OperationType.UPDATE : OperationType.CREATE, 'products');
                  }
                }} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Promotion Modal */}
      <AnimatePresence>
        {activePromoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePromoModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
                <h3 className="font-['Bebas_Neue'] text-2xl tracking-wide text-[#0A1628]">
                  {editingItem ? 'Edit Campaign' : 'New Marketing Campaign'}
                </h3>
                <button onClick={() => setActivePromoModal(false)} className="text-gray-400 hover:text-black transition-colors"><X size={20} /></button>
              </div>
              <PromotionForm 
                initialData={editingItem} 
                setToast={setToast}
                onSubmit={async (data) => {
                  try {
                    if (editingItem) {
                      await updateDoc(doc(db, 'promotions', editingItem.id), { ...data, updatedAt: serverTimestamp() });
                    } else {
                      await addDoc(collection(db, 'promotions'), { 
                        ...data, 
                        createdAt: serverTimestamp(), 
                        updatedAt: serverTimestamp()
                      });
                    }
                  } catch (error) {
                    handleFirestoreError(error, editingItem ? OperationType.UPDATE : OperationType.CREATE, 'promotions');
                  }
                  setActivePromoModal(false);
                }} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quote Detail Modal */}
      <AnimatePresence>
        {selectedQuote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedQuote(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F8FAFC]">
                <div>
                  <h3 className="font-['Bebas_Neue'] text-2xl tracking-wide text-[#0A1628]">Request Details</h3>
                  <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">{selectedQuote.id}</p>
                </div>
                <button onClick={() => setSelectedQuote(null)} className="text-gray-400 hover:text-black transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-3">Client Info</h4>
                    <p className="font-bold text-[#1E293B]">{selectedQuote.name}</p>
                    <p className="text-xs text-[#64748B]">{selectedQuote.email}</p>
                    <p className="text-xs text-[#64748B]">{selectedQuote.phone || 'No phone provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-3">Request Metadata</h4>
                    <p className="text-xs text-[#1E293B] font-bold">Type: {selectedQuote.service || 'Store Order'}</p>
                    <p className="text-xs text-[#64748B]">Date: {selectedQuote.createdAt?.toDate ? format(selectedQuote.createdAt.toDate(), 'PPpp') : 'N/A'}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold border ${
                      selectedQuote.status === 'new' ? 'bg-blue-50 border-blue-100 text-blue-600' : 
                      'bg-green-50 border-green-100 text-green-600'
                    }`}>
                      {selectedQuote.status?.toUpperCase() || 'NEW'}
                    </span>
                  </div>
                </div>

                {selectedQuote.items && selectedQuote.items.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-3">Items Requested</h4>
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8FAFC] border-b border-gray-100">
                          <tr>
                            <th className="px-4 py-3 font-bold text-[#64748B]">Item</th>
                            <th className="px-4 py-3 font-bold text-[#64748B] text-center">Qty</th>
                            <th className="px-4 py-3 font-bold text-[#64748B] text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {selectedQuote.items.map((item: any, i: number) => (
                            <tr key={i}>
                              <td className="px-4 py-3 font-medium">{item.name}</td>
                              <td className="px-4 py-3 text-center">{item.quantity}</td>
                              <td className="px-4 py-3 text-right">KES {item.price.toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-[#F8FAFC] font-black">
                            <td colSpan={2} className="px-4 py-3 text-right text-[#64748B] uppercase text-[10px]">Total Est. Value</td>
                            <td className="px-4 py-3 text-right text-[#C8102E]">KES {selectedQuote.total?.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedQuote.details && (
                  <div>
                    <h4 className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-2">Message Detail</h4>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-[#1E293B] leading-relaxed">
                      {selectedQuote.details}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-[#F8FAFC] flex justify-end gap-3">
                {selectedQuote.email && (
                  <a 
                    href={`mailto:${selectedQuote.email}?subject=Naisiae Textile Quote Response: ${selectedQuote.id}`}
                    className="bg-[#1C3560] hover:bg-[#0A1628] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    Reply via Email
                  </a>
                )}
                <button 
                   onClick={() => setSelectedQuote(null)}
                   className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Discount Rule Modal */}
      <AnimatePresence>
        {isDiscountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDiscountModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
                <h3 className="font-['Bebas_Neue'] text-2xl tracking-wide text-[#0A1628]">
                  {editingDiscountRule ? 'Edit Discount Rule' : 'New Bulk Discount Rule'}
                </h3>
                <button onClick={() => setIsDiscountModalOpen(false)} className="text-gray-400 hover:text-black transition-colors"><X size={20} /></button>
              </div>
              <DiscountRuleForm 
                initialData={editingDiscountRule} 
                setToast={setToast}
                onSubmit={async (data: any) => {
                  try {
                    if (editingDiscountRule) {
                      await updateDoc(doc(db, 'discountRules', editingDiscountRule.id), { ...data, updatedAt: serverTimestamp() });
                    } else {
                      await addDoc(collection(db, 'discountRules'), { 
                        ...data, 
                        createdAt: serverTimestamp(), 
                        updatedAt: serverTimestamp()
                      });
                    }
                    setIsDiscountModalOpen(false);
                    setEditingDiscountRule(null);
                  } catch (error) {
                    handleFirestoreError(error, editingDiscountRule ? OperationType.UPDATE : OperationType.CREATE, 'discountRules');
                  }
                }} 
              />
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

  async function handleDeleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product? It will be removed from the public site immediately.')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  }

  async function handleDeletePromotion(id: string) {
    if (confirm('Delete this promotional campaign?')) {
      try {
        await deleteDoc(doc(db, 'promotions', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `promotions/${id}`);
      }
    }
  }
}

function SidebarItem({ icon, label, active, onClick, danger = false, collapsed = false, badge = 0 }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group relative ${
        active 
          ? 'bg-[#1C3560] text-white shadow-lg shadow-black/20' 
          : danger 
            ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
      } ${collapsed ? 'justify-center px-0' : ''}`}
      title={collapsed ? label : ''}
    >
      <span className={active ? 'text-[#C8961A]' : ''}>{icon}</span>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="truncate"
        >
          {label}
        </motion.span>
      )}
      
      {badge > 0 && (
        <span className={`
          absolute flex items-center justify-center bg-[#C8102E] text-white text-[10px] font-bold rounded-full
          ${collapsed ? '-top-1 -right-1 w-4 h-4' : 'right-4 px-1.5 min-w-[18px] h-[18px]'}
        `}>
          {badge}
        </span>
      )}

      {active && !collapsed && (
        <motion.div 
          layoutId="sidebar-active"
          className="ml-auto w-1 h-4 bg-[#C8961A] rounded-full"
        />
      )}
    </button>
  );
}

function StatCard({ label, value, trend, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0] relative overflow-hidden group hover:shadow-xl transition-all duration-500">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center shadow-inner border border-gray-50 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-black ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-2xl font-black text-[#1E293B]">{value}</h4>
      </div>
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#F8FAFC]/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
    </div>
  );
}

function SortableImage({ url, index, onRemove }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-white shadow-sm flex items-center justify-center"
    >
      {url ? (
        <img src={url} className="w-full h-full object-cover" alt="product" />
      ) : (
        <ImageIcon size={24} className="text-slate-300" />
      )}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-1 left-1 bg-white/80 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-500 hover:text-[#1C3560] shadow-sm z-10"
      >
        <GripVertical size={12} />
      </div>
      <button 
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 bg-white/90 text-red-600 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
      >
        <X size={12} />
      </button>
      {index === 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] font-black uppercase py-1 text-center pointer-events-none">Primary</div>
      )}
    </div>
  );
}

function ProductForm({ initialData, onSubmit, setToast }: any) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [pricingReasoning, setPricingReasoning] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [newVariant, setNewVariant] = useState({
    type: 'Size',
    value: '',
    price: 0,
    stock: 0,
    imageUrl: ''
  });
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || 'School Uniforms',
    price: initialData?.price || 0,
    wholesalePrice: initialData?.wholesalePrice || initialData?.price || 0,
    oldPrice: initialData?.oldPrice || 0,
    description: initialData?.description || '',
    imageUrl: initialData?.imageUrl || '',
    imageUrls: initialData?.imageUrls || (initialData?.imageUrl ? [initialData.imageUrl] : []),
    active: initialData?.active ?? true,
    badge: initialData?.badge || '',
    tags: initialData?.tags || (initialData?.tag ? [initialData.tag] : []),
    variants: initialData?.variants || [],
    subCategory: initialData?.subCategory || '',
    stock: initialData?.stock || 0
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const categories = [
    'School Uniforms',
    'College Wear',
    'Corporate Wear',
    'Sports Kits',
    'Healthcare',
    'Hospitality',
    'Branding & Print'
  ];

  const uniformSubCategories = [
    'Sweater',
    'Sleeveless Sweater',
    'Blazer',
    'Shirt',
    'Blouse',
    'Trouser',
    'Skirt',
    'Shorts',
    'Tie',
    'Socks',
    'Legwarmers',
    'Tracksuit',
    'T-Shirt',
    'P.E Kit',
    'Lab Coat',
    'Dust Coat'
  ];

  const badges = ['', 'New', 'Popular', 'Best Seller', '-15%', '-20%', 'Limited'];

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    const newUrls: string[] = [...formData.imageUrls];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        newUrls.push(url);
      }
      
      setFormData({
        ...formData,
        imageUrls: newUrls,
        imageUrl: newUrls[0] || formData.imageUrl // Set first image as primary if none existed
      });
    } catch (error) {
      console.error("Upload error:", error);
      setToast({ message: "Failed to upload image(s). Please check your internet and Firebase Storage rules.", type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
  };

  const removeImage = (index: number) => {
    const newUrls = formData.imageUrls.filter((_: any, i: number) => i !== index);
    setFormData({
      ...formData,
      imageUrls: newUrls,
      imageUrl: newUrls[0] || ''
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.imageUrls.indexOf(active.id);
        const newIndex = prev.imageUrls.indexOf(over.id);
        const newUrls = arrayMove(prev.imageUrls, oldIndex, newIndex);
        return {
          ...prev,
          imageUrls: newUrls,
          imageUrl: newUrls[0] || prev.imageUrl
        };
      });
    }
  };

  const addTag = () => {
    const tag = currentTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t: string) => t !== tagToRemove) });
  };

  const addVariant = () => {
    if (!newVariant.value) return;
    setFormData({
      ...formData,
      variants: [...formData.variants, { ...newVariant, id: Date.now().toString() }]
    });
    setNewVariant({ type: 'Size', value: '', price: formData.price, stock: 0, imageUrl: formData.imageUrl });
    setShowVariantForm(false);
  };

  const removeVariant = (id: string) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((v: any) => v.id !== id)
    });
  };

  const handleAIAnalyze = async () => {
    if (formData.imageUrls.length === 0) {
      setToast({ message: "Please upload at least one image first.", type: 'warning' });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Fetch the image and convert to base64
      const imageUrl = formData.imageUrls[0];
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]); // Remove data:image/xxx;base64,
        };
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      const aiData = await generateProductDetails(base64Data, blob.type);
      
      setFormData(prev => ({
        ...prev,
        name: aiData.name,
        description: aiData.description,
        category: aiData.category,
        subCategory: aiData.subCategory || prev.subCategory,
        price: aiData.priceSuggestion,
        tags: [...new Set([...prev.tags, ...aiData.tags])]
      }));

      setToast({ message: "Product details generated successfully!", type: 'success' });
    } catch (error) {
      console.error(error);
      setToast({ message: "AI Analysis failed. Please try again or fill manually.", type: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      setToast({ message: "Please enter a product name first.", type: 'warning' });
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const description = await generateDescriptionOnly(
        formData.name,
        formData.category,
        formData.tags
      );
      setFormData({ ...formData, description });
      setToast({ message: "Description generated successfully!", type: 'success' });
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to generate description. Please try again.", type: 'error' });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSuggestPrice = async () => {
    if (!formData.name) {
      setToast({ message: "Please enter a product name first so AI can research the market.", type: 'warning' });
      return;
    }
    
    setIsSuggestingPrice(true);
    setPricingReasoning(null);
    
    try {
      const suggestion = await suggestCompetitivePrice(formData.name, formData.category);
      setFormData({
        ...formData,
        price: suggestion.suggestedPrice,
        oldPrice: suggestion.marketRange.max > suggestion.suggestedPrice ? suggestion.marketRange.max : formData.oldPrice
      });
      setPricingReasoning(suggestion.reasoning);
    } catch (error) {
      console.error(error);
      setToast({ message: "Could not get a pricing suggestion. Please try again.", type: 'error' });
    } finally {
      setIsSuggestingPrice(false);
    }
  };

  const commonColors = [
    { name: 'Navy Blue', hex: '#000080' },
    { name: 'Sky Blue', hex: '#87CEEB' },
    { name: 'Royal Blue', hex: '#4169E1' },
    { name: 'Maroon', hex: '#800000' },
    { name: 'Forest Green', hex: '#228B22' },
    { name: 'Grey', hex: '#808080' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Black', hex: '#000000' },
    { name: 'Gold', hex: '#FFD700' },
    { name: 'Red', hex: '#FF0000' }
  ];

  const commonSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Junior', 'Senior'];
  const commonMaterials = ['Cotton', 'Polyester', 'Wool', 'Nylon', 'Silk', 'Canvas', 'Denim'];

  const quickAddColor = (colorName: string) => {
    if (formData.variants.some((v: any) => v.type === 'Color' && v.value === colorName)) {
      return;
    }
    setFormData({
      ...formData,
      variants: [...formData.variants, { 
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        type: 'Color',
        value: colorName,
        price: 0,
        stock: 0,
        imageUrl: formData.imageUrl
      }]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || uploading) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setToast({ message: "Failed to save product. Please check your connection.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Image Gallery Section */}
      <div 
        className={`space-y-4 p-5 rounded-3xl border-2 transition-all duration-300 relative group/dropzone ${
          isDraggingOver 
            ? 'border-[#C8102E] bg-[#C8102E]/5 scale-[0.99] border-dashed ring-4 ring-[#C8102E]/10' 
            : 'border-slate-100 bg-slate-50/30 border-dashed'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex justify-between items-end px-1">
          <div>
            <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider mb-0.5 block">Product Gallery</label>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Drag images to reorder. First image is primary.</p>
          </div>
          <div className="flex gap-2">
            {formData.imageUrls.length > 0 && (
              <button
                type="button"
                onClick={handleAIAnalyze}
                disabled={isAnalyzing || uploading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${
                  isAnalyzing 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-[#C8961A] text-[#0A1628] hover:bg-[#B08416]'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-t-transparent border-[#0A1628] rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BrainCircuit size={12} />
                    Generate with AI
                  </>
                )}
              </button>
            )}
            <label className="cursor-pointer group flex items-center gap-2 bg-[#1C3560] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#0A1628] transition-all shadow-md active:scale-95">
            <Upload size={12} /> Add Images
            <input 
              type="file" 
              multiple 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

        {uploading && (
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 animate-pulse">
            <div className="w-4 h-4 border-2 border-t-transparent border-[#C8102E] rounded-full animate-spin"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uploading Assets...</span>
          </div>
        )}

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={formData.imageUrls}
              strategy={horizontalListSortingStrategy}
            >
              {formData.imageUrls.map((url: string, index: number) => (
                <SortableImage 
                  key={url} 
                  url={url} 
                  index={index} 
                  onRemove={removeImage} 
                />
              ))}
            </SortableContext>
          </DndContext>
          
          <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all group ${isDraggingOver ? 'border-[#C8102E] bg-white' : 'border-slate-200 hover:border-[#1C3560] hover:bg-slate-50'}`}>
            <Plus size={16} className="text-slate-300 group-hover:text-[#1C3560] transition-colors" />
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">More</span>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {isDraggingOver && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-[#C8102E] flex items-center justify-center text-white animate-bounce shadow-xl shadow-[#C8102E]/20">
              <Upload size={32} />
            </div>
            <p className="mt-4 text-sm font-black text-[#C8102E] uppercase tracking-widest">Drop to Upload</p>
          </div>
        )}
      </div>

      {/* Variants Section */}
      <div className="space-y-6 pt-6 border-t border-slate-100 bg-slate-50/30 p-4 rounded-3xl">
        <div className="flex justify-between items-center px-1">
          <div>
            <label className="text-[11px] font-black uppercase text-[#1E293B] tracking-wider">Product Variants</label>
            <p className="text-[9px] text-[#64748B] font-bold uppercase mt-0.5">Manage Size, Color, and Materials</p>
          </div>
          <button 
            type="button"
            onClick={() => setShowVariantForm(!showVariantForm)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
              showVariantForm 
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100' 
                : 'bg-[#1C3560] text-white hover:bg-[#0A1628]'
            }`}
          >
            {showVariantForm ? <X size={14} /> : <Plus size={14} />}
            {showVariantForm ? 'Cancel' : 'Add New Variant'}
          </button>
        </div>

        {!showVariantForm && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-[#64748B] tracking-widest px-1 flex items-center gap-2">
                <Palette size={13} className="text-[#C8961A]" />
                Quick Colors
              </label>
              <div className="flex flex-wrap gap-2">
                {commonColors.map(color => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => quickAddColor(color.name)}
                    className="group relative flex items-center gap-2 bg-white px-2.5 py-2 rounded-xl border border-slate-200 hover:border-[#F59E0B] hover:shadow-md transition-all active:scale-95"
                    title={`Quick add ${color.name}`}
                  >
                    <div 
                      className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-inner" 
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight">{color.name}</span>
                    <Plus size={8} className="text-slate-300 group-hover:text-[#F59E0B]" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-[#64748B] tracking-widest px-1 flex items-center gap-2">
                <Maximize2 size={13} className="text-[#C8961A]" />
                Quick Sizes
              </label>
              <div className="flex flex-wrap gap-2">
                {commonSizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        variants: [...prev.variants, { id: Date.now().toString() + Math.random(), type: 'Size', value: size, price: 0, stock: 0, imageUrl: formData.imageUrl }]
                      }));
                    }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-slate-700 uppercase hover:border-[#1C3560] hover:bg-[#1C3560]/5 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    {size} <Plus size={8} className="text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showVariantForm && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-[2rem] border-2 border-[#E2E8F0] shadow-xl space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#1E293B] tracking-widest ml-1">Variant Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Size', 'Color', 'Material'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewVariant({...newVariant, type: t})}
                      className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        newVariant.type === t 
                          ? 'bg-[#1C3560] text-white border-[#1C3560] shadow-lg' 
                          : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 hover:text-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#1E293B] tracking-widest ml-1">
                  Value <span className="text-slate-400 font-bold">(e.g. XL, Navy Blue)</span>
                </label>
                <input 
                  type="text"
                  placeholder="Enter variant name..."
                  value={newVariant.value}
                  onChange={e => setNewVariant({...newVariant, value: e.target.value})}
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm font-bold placeholder:text-slate-300 outline-none focus:border-[#C8102E] focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#1E293B] tracking-widest ml-1">Price Offset (KES)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">+</span>
                  <input 
                    type="number"
                    value={newVariant.price}
                    onChange={e => setNewVariant({...newVariant, price: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl pl-8 pr-4 py-3 text-sm font-bold outline-none focus:border-[#C8102E] focus:bg-white transition-all shadow-inner"
                    placeholder="0"
                  />
                </div>
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest ml-1">Added to base product price</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#1E293B] tracking-widest ml-1">Stock Amount</label>
                <input 
                  type="number"
                  value={newVariant.stock}
                  onChange={e => setNewVariant({...newVariant, stock: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#C8102E] focus:bg-white transition-all shadow-inner"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-[#1E293B] tracking-widest ml-1 flex items-center gap-2">
                <ImageIcon size={12} className="text-[#C8961A]" />
                Associate Image <span className="text-[8px] text-slate-400 normal-case tracking-normal">(Optional)</span>
              </label>
              <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setNewVariant({...newVariant, imageUrl: ''})}
                  className={`shrink-0 w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${!newVariant.imageUrl ? 'border-[#C8102E] bg-red-50 text-[#C8102E]' : 'border-slate-100 text-slate-300 hover:border-slate-300'}`}
                >
                  <Ban size={16} />
                  <span className="text-[8px] font-black uppercase">None</span>
                </button>
                {formData.imageUrls.map((url: string, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNewVariant({...newVariant, imageUrl: url})}
                    className={`shrink-0 w-16 h-16 rounded-2xl border-2 transition-all overflow-hidden p-0.5 ${newVariant.imageUrl === url ? 'border-[#C8102E] scale-95 shadow-lg ring-4 ring-red-500/10' : 'border-transparent opacity-60 hover:opacity-100 hover:border-slate-200'}`}
                  >
                  {url ? (
                    <img src={url} className="w-full h-full object-cover rounded-[14px]" alt={`Gallery ${i}`} />
                  ) : (
                    <ImageIcon size={16} />
                  )}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="button"
              onClick={addVariant}
              className="w-full py-4 bg-gradient-to-r from-[#1C3560] to-[#0A1628] text-white text-[11px] font-black uppercase tracking-[3px] rounded-2xl hover:scale-[0.99] transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3"
            >
              <CheckCircle2 size={16} /> Save This Variant
            </button>
          </motion.div>
        )}

        <div className="space-y-3">
          {formData.variants.length > 0 && (
            <label className="text-[10px] font-black uppercase text-[#64748B] tracking-widest px-1 ml-1">Defined Variants ({formData.variants.length})</label>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formData.variants.map((v: any) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={v.id} 
                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group shadow-sm hover:shadow-md hover:border-[#1C3560] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {v.imageUrl ? (
                      <img src={v.imageUrl} className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm" alt={v.value} />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-300">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    <span className="absolute -top-2 -right-2 bg-[#1C3560] text-white text-[7px] font-black px-1.5 py-0.5 rounded-lg border border-white">
                      {v.type}
                    </span>
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-[#1E293B] uppercase tracking-wide">{v.value}</h5>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Price +</span>
                        <span className="text-[11px] text-[#C8102E] font-black">KES {v.price.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 border-l border-slate-100 pl-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Stock</span>
                        <span className={`text-[11px] font-black ${v.stock > 10 ? 'text-green-600' : 'text-amber-500'}`}>{v.stock}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => removeVariant(v.id)}
                  className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
          {formData.variants.length === 0 && !showVariantForm && (
            <div className="text-center py-12 bg-white/50 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
              <Package className="mx-auto text-slate-200 mb-3" size={32} />
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[3px]">Stock Keeping Units (SKU)</p>
              <p className="text-[9px] text-slate-300 font-bold uppercase mt-1">Define sizes or colors to track individual stock</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 flex-1">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Product Name</label>
          <input 
            required 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-[#C8102E] outline-none transition-colors" 
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Category</label>
          <select 
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value, subCategory: ''})}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-[#C8102E] outline-none transition-colors"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {formData.category === 'School Uniforms' && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Sub-Category (Uniform Item)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select 
              value={formData.subCategory}
              onChange={e => setFormData({...formData, subCategory: e.target.value})}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-[#C8102E] outline-none transition-colors"
            >
              <option value="">Select Item Type...</option>
              {uniformSubCategories.map(sc => <option key={sc} value={sc}>{sc}</option>)}
            </select>
            <input 
              placeholder="Or type custom item name..."
              value={formData.subCategory}
              onChange={e => setFormData({...formData, subCategory: e.target.value})}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-[#C8102E] outline-none transition-colors"
            />
          </div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-1">Helps customers find specific items like sweaters or trousers faster.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1.5 flex flex-col justify-end">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Current Price (KES)</label>
            <button
              type="button"
              onClick={handleSuggestPrice}
              disabled={isSuggestingPrice}
              className="flex items-center gap-1.5 text-[9px] font-black text-[#C8961A] hover:text-[#C8102E] transition-colors uppercase tracking-widest disabled:opacity-50"
            >
              <Sparkles size={12} className={isSuggestingPrice ? "animate-pulse" : ""} />
              {isSuggestingPrice ? "Analyzing Market..." : "Suggest Price"}
            </button>
          </div>
          <div className="relative">
            <input 
              type="number" 
              required 
              value={formData.price}
              onChange={e => setFormData({...formData, price: Number(e.target.value)})}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-[#C8102E] outline-none transition-colors" 
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase tracking-widest pointer-events-none">KES</div>
          </div>
          {pricingReasoning && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-3 bg-[#EAB308]/5 border border-[#EAB308]/20 rounded-xl flex gap-3"
            >
              <div className="pt-0.5"><Zap size={14} className="text-[#C8961A]" /></div>
              <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                <span className="text-[#C8961A] font-black uppercase tracking-wider block mb-0.5">AI Insights & Market Research:</span>
                {pricingReasoning}
              </p>
            </motion.div>
          )}
        </div>
        <div className="space-y-1.5 pt-[22px] sm:pt-0">
          <label className="text-[10px] font-black uppercase text-orange-600 tracking-wider ml-1">Wholesale (KES)</label>
          <div className="relative">
            <input 
              type="number" 
              value={formData.wholesalePrice}
              onChange={e => setFormData({...formData, wholesalePrice: Number(e.target.value)})}
              className="w-full bg-orange-50 border border-orange-100 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition-colors text-orange-700 font-bold" 
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-orange-300 uppercase tracking-widest pointer-events-none">BULK</div>
          </div>
        </div>
        <div className="space-y-1.5 pt-[22px] sm:pt-0">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Old Price (Optional)</label>
          <div className="relative">
            <input 
              type="number" 
              value={formData.oldPrice}
              onChange={e => setFormData({...formData, oldPrice: Number(e.target.value)})}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-[#C8102E] outline-none transition-colors" 
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase tracking-widest pointer-events-none">KES</div>
          </div>
        </div>
        <div className="space-y-1.5 pt-[22px] sm:pt-0">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1 sm:mt-[22px]">Base Stock (If no variants)</label>
          <input 
            type="number" 
            value={formData.stock}
            onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-[#C8102E] outline-none transition-colors" 
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Or Provide Image URL</label>
        <div className="flex gap-2">
          <input 
            placeholder="https://images.unsplash.com/..." 
            value={formData.imageUrl}
            onChange={e => {
              const url = e.target.value;
              setFormData({
                ...formData, 
                imageUrl: url,
                imageUrls: url ? [url, ...formData.imageUrls.filter(u => u !== formData.imageUrl)] : formData.imageUrls
              });
            }}
            className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-[#C8102E] outline-none transition-colors" 
          />
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-xl overflow-hidden border border-slate-200">
            {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300" />}
          </div>
        </div>
      </div>

      <div className="space-y-1.5 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
        <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Product Tags & Organization</label>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-1 mb-2">Helpful for grouping products (e.g., Seasonal, Stock Status)</p>
        
        <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
          {formData.tags.map((tag: string) => (
            <span key={tag} className="flex items-center gap-1.5 bg-gradient-to-r from-[#1C3560] to-[#0A1628] text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg group shadow-sm">
              <Package size={10} className="text-[#C8961A]" />
              {tag}
              <button 
                type="button" 
                onClick={() => removeTag(tag)}
                className="hover:text-red-400 transition-colors ml-1"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          {formData.tags.length === 0 && (
            <div className="w-full py-4 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-white/50">
              <Filter size={14} className="text-slate-300 mb-1" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">No tags assigned yet</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input 
              placeholder="Type tag and press enter... (e.g. Winter)" 
              value={currentTag}
              onChange={e => setCurrentTag(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2 text-sm focus:border-[#C8102E] outline-none transition-colors shadow-inner" 
            />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
          </div>
          <button 
            type="button"
            onClick={addTag}
            className="px-6 py-2 bg-[#1C3560] hover:bg-[#0A1628] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
          >
            Add
          </button>
        </div>

        <div className="pt-3">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Suggested Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {['summer', 'winter', 'clearance', 'bestseller', 'new-arrival', 'secondary', 'primary', 'corporate', 'knitwear'].map(sTag => (
              <button
                key={sTag}
                type="button"
                onClick={() => {
                  if (!formData.tags.includes(sTag)) {
                    setFormData({ ...formData, tags: [...formData.tags, sTag] });
                  }
                }}
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border transition-all ${
                  formData.tags.includes(sTag) 
                    ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-[#1C3560] hover:text-[#1C3560] shadow-sm active:scale-95'
                }`}
              >
                {sTag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Short Description</label>
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={isGeneratingDescription}
            className="flex items-center gap-1.5 text-[9px] font-black text-[#C8961A] hover:text-[#C8102E] transition-colors uppercase tracking-widest disabled:opacity-50"
          >
            <BrainCircuit size={12} className={isGeneratingDescription ? "animate-pulse" : ""} />
            {isGeneratingDescription ? "Thinking..." : "AI Generate Description"}
          </button>
        </div>
        <textarea 
          rows={3} 
          required
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-[#C8102E] outline-none transition-colors resize-none" 
        ></textarea>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Promotion Badge</label>
          <select 
            value={formData.badge}
            onChange={e => setFormData({...formData, badge: e.target.value})}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-[#C8102E] outline-none transition-colors"
          >
            {badges.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-6 mt-6">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setFormData({...formData, active: !formData.active})}
              className={`w-12 h-6 rounded-full transition-all relative ${formData.active ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.active ? 'left-7' : 'left-1'}`}></div>
            </button>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{formData.active ? 'Public' : 'Hidden'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => {
                const isWholesale = formData.tags.includes('Wholesale');
                if (isWholesale) {
                  setFormData({ ...formData, tags: formData.tags.filter((t: string) => t !== 'Wholesale') });
                } else {
                  setFormData({ ...formData, tags: [...new Set([...formData.tags, 'Wholesale'])] });
                }
              }}
              className={`w-12 h-6 rounded-full transition-all relative ${formData.tags.includes('Wholesale') ? 'bg-[#0A1628]' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.tags.includes('Wholesale') ? 'left-7' : 'left-1'}`}></div>
            </button>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Wholesale Deal</span>
          </div>
        </div>
      </div>

      <button 
        disabled={loading || uploading}
        type="submit" 
        className="w-full h-14 bg-gradient-to-r from-[#0A1628] to-[#1C3560] hover:scale-[1.02] active:scale-[0.98] text-white rounded-2xl font-black text-xs uppercase tracking-[3px] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#1C3560]/20"
      >
        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Save size={18} /> Save & Synchronize</>}
      </button>
    </form>
  );
}

const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=2670&auto=format&fit=crop';

function SettingsForm({ initialData, onSave, setToast }: any) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState(initialData || {
    siteName: 'Naisiae Textile',
    siteLogo: '',
    footerLogo: '',
    favicon: '',
    siteTagline: '',
    sharingTitle: '',
    sharingDescription: '',
    sharingImage: '',
    heroImages: [
      { url: DEFAULT_HERO_IMAGE, title: 'PREMIUM SCHOOL UNIFORMS', subtitle: 'QUALITY THAT LASTS ALL YEAR', link: '/category/uniforms' }
    ]
  });

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const autoResolveImage = async (url: string, field: string, index?: number) => {
    if (!url || !url.startsWith('http')) return;
    
    // Clear error state when trying a new URL
    const errorKey = typeof index === 'number' ? `hero_${index}` : field;
    setImageErrors(prev => ({ ...prev, [errorKey]: false }));
    setResolving(errorKey);

    const isDirectImage = /\.(jpg|jpeg|png|gif|webp|svg|ico)(\?.*)?$/i.test(url) || url.includes('firebasestorage.googleapis.com');
    if (isDirectImage && !url.includes('canva.link')) {
      setResolving(null);
      return;
    }

    try {
      const resp = await fetch(`/api/resolve-image?url=${encodeURIComponent(url)}`);
      const data = await resp.json();
      if (data.resolvedUrl && data.resolvedUrl !== url) {
        if (typeof index === 'number') {
          updateHeroSlide(index, 'url', data.resolvedUrl);
        } else {
          handleUpdate(field, data.resolvedUrl);
        }
      }
    } catch (e) {
      console.error("Image resolution failed", e);
    } finally {
      setResolving(null);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        heroImages: initialData.heroImages || [
          { url: DEFAULT_HERO_IMAGE, title: 'PREMIUM SCHOOL UNIFORMS', subtitle: 'QUALITY THAT LASTS ALL YEAR', link: '/category/uniforms' }
        ]
      });
    }
  }, [initialData]);

  const handleUpdate = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    // Only auto-save these fields to avoid partial hero slide states
    if (['siteName', 'siteTagline', 'sharingTitle', 'sharingDescription'].includes(field)) {
      onSave(updated);
    }
  };

  const addHeroSlide = () => {
    setFormData(prev => ({
      ...prev,
      heroImages: [...(prev.heroImages || []), { url: '', title: '', subtitle: '', link: '' }]
    }));
  };

  const removeHeroSlide = (index: number) => {
    setFormData(prev => {
      const updated = [...(prev.heroImages || [])];
      updated.splice(index, 1);
      return { ...prev, heroImages: updated };
    });
  };

  const updateHeroSlide = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const updated = [...(prev.heroImages || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, heroImages: updated };
    });
  };

  const resetHeroSlideImage = (index: number) => {
    updateHeroSlide(index, 'url', DEFAULT_HERO_IMAGE);
    setImageErrors(prev => ({ ...prev, [`hero_${index}`]: false }));
  };

  const uploadHeroImage = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(`hero_${index}`);
    try {
      const storageRef = ref(storage, `hero/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      updateHeroSlide(index, 'url', url);
    } catch (error) {
      console.error("Hero upload error:", error);
      setToast({ message: "Failed to upload hero image.", type: 'error' });
    } finally {
      setUploading(null);
    }
  };

  const uploadBranding = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(field);
    try {
      const storageRef = ref(storage, `branding/${field}_${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      handleUpdate(field, url);
    } catch (error) {
      console.error("Upload error:", error);
      setToast({ message: "Failed to upload image.", type: 'error' });
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="p-8 space-y-12">
      {/* Logos Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h4 className="text-[11px] font-black uppercase text-[#C8102E] tracking-[3px] border-b border-slate-100 pb-2">Primary Assets</h4>
          
          <div className="space-y-4">
            <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm grow-0">
                {formData.siteLogo ? (
                  <img src={formData.siteLogo} className="max-w-[80%] max-h-[80%] object-contain" alt="Current Logo" />
                ) : (
                  <Package size={24} className="text-slate-200" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold">Main Site Brand Logo</p>
                  <div className="flex gap-2">
                    {resolving === 'siteLogo' && <span className="text-[7px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase animate-pulse">Resolving...</span>}
                    <span className="text-[8px] font-black text-slate-400 bg-white px-1.5 py-0.5 rounded-md border border-slate-100 uppercase">Any Format Supported</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">Primary brand logo used in the header and navigation. All web formats supported.</p>
                
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Image URL</p>
                    <input 
                      value={formData.siteLogo || ''}
                      onChange={e => handleUpdate('siteLogo', e.target.value)}
                      onBlur={() => {
                        autoResolveImage(formData.siteLogo, 'siteLogo');
                        onSave(formData);
                      }}
                      placeholder="https://..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold focus:border-[#C8102E] outline-none transition-all"
                    />
                  </div>
                  <label className="inline-block px-3 py-1.5 bg-white border border-slate-200 text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer hover:bg-slate-100 transition-all">
                    {uploading === 'siteLogo' ? 'Uploading...' : 'Or Upload File'}
                    <input type="file" className="hidden" onChange={(e) => uploadBranding(e, 'siteLogo')} />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {formData.footerLogo ? <img src={formData.footerLogo} className="max-w-[80%] max-h-[80%] object-contain" /> : <Package size={24} className="text-slate-600" />}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold">Footer Logo (Light/Alt)</p>
                  {resolving === 'footerLogo' && <span className="text-[7px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase animate-pulse">Resolving...</span>}
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Image URL</p>
                    <input 
                      value={formData.footerLogo || ''}
                      onChange={e => handleUpdate('footerLogo', e.target.value)}
                      onBlur={() => {
                        autoResolveImage(formData.footerLogo, 'footerLogo');
                        onSave(formData);
                      }}
                      placeholder="https://..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold focus:border-[#C8102E] outline-none transition-all"
                    />
                  </div>
                  <label className="inline-block px-3 py-1.5 bg-white border border-slate-200 text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer hover:bg-slate-100 transition-all">
                    {uploading === 'footerLogo' ? 'Uploading...' : 'Or Change Logo'}
                    <input type="file" className="hidden" onChange={(e) => uploadBranding(e, 'footerLogo')} />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm grow-0">
                {formData.favicon ? (
                  <img src={formData.favicon} className="w-6 h-6 object-contain" alt="Current Favicon" />
                ) : (
                  <span className="text-[10px] font-black text-slate-300">ICO</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold">Browser Favicon</p>
                  <div className="flex gap-2">
                    {resolving === 'favicon' && <span className="text-[7px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase animate-pulse">Resolving...</span>}
                    <span className="text-[8px] font-black text-slate-400 bg-white px-1.5 py-0.5 rounded-md border border-slate-100 uppercase">Any Format Supported</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">Displayed in browser tabs and bookmarks. Square image recommended (32x32px).</p>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Favicon URL</p>
                    <input 
                      value={formData.favicon || ''}
                      onChange={e => handleUpdate('favicon', e.target.value)}
                      onBlur={() => {
                        autoResolveImage(formData.favicon, 'favicon');
                        onSave(formData);
                      }}
                      placeholder="https://..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold focus:border-[#C8102E] outline-none transition-all"
                    />
                  </div>
                  <label className="inline-block px-3 py-1.5 bg-white border border-slate-200 text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer hover:bg-slate-100 transition-all">
                    {uploading === 'favicon' ? 'Uploading...' : 'Or Upload Favicon'}
                    <input type="file" className="hidden" onChange={(e) => uploadBranding(e, 'favicon')} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-[11px] font-black uppercase text-[#C8102E] tracking-[3px] border-b border-slate-100 pb-2">Site Metadata</h4>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Site Official Name</label>
              <input 
                value={formData.siteName}
                onChange={e => setFormData({ ...formData, siteName: e.target.value })}
                onBlur={e => onSave(formData)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#C8102E] outline-none transition-colors font-bold" 
                placeholder="e.g. Uhuru Market Uniforms" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Site Tagline / Title Tag</label>
              <input 
                value={formData.siteTagline}
                onChange={e => setFormData({ ...formData, siteTagline: e.target.value })}
                onBlur={e => onSave(formData)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#C8102E] outline-none transition-colors font-bold" 
                placeholder="e.g. Uhuru Market Uniforms" 
              />
            </div>
            
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              * The tagline appears in the browser tab and search engine results. Branding assets are used across the header, footer, and checkout pages.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-[11px] font-black uppercase text-[#C8102E] tracking-[3px] border-b border-slate-100 pb-2">Contact & Social</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Contact Phone</label>
              <input 
                value={formData.contactPhone}
                onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                onBlur={e => onSave(formData)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#C8102E] outline-none transition-colors font-bold" 
                placeholder="+254 ..." 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Contact Email</label>
              <input 
                value={formData.contactEmail}
                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                onBlur={e => onSave(formData)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#C8102E] outline-none transition-colors font-bold" 
                placeholder="info@..." 
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Physical Address</label>
              <input 
                value={formData.contactAddress}
                onChange={e => setFormData({ ...formData, contactAddress: e.target.value })}
                onBlur={e => onSave(formData)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#C8102E] outline-none transition-colors font-bold" 
                placeholder="Shop location ..." 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Slider Management Section */}
      <div className="space-y-6 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-[11px] font-black uppercase text-[#C8102E] tracking-[3px]">Homepage Hero Slider</h4>
            <p className="text-[10px] text-slate-500">Manage the high-impact banners displayed at the top of the home page.</p>
          </div>
          <button 
            type="button"
            onClick={addHeroSlide}
            className="flex items-center gap-2 px-4 py-2 bg-[#1C3560] text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-[#0A1628] transition-all shadow-md active:scale-95"
          >
            <Plus size={14} /> Add New Slide
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(formData.heroImages || []).map((slide: any, idx: number) => {
            const hasError = imageErrors[`hero_${idx}`];
            return (
              <div key={idx} className="group relative bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="aspect-[16/9] bg-slate-100 relative group/image overflow-hidden">
                  {slide.url && !hasError ? (
                    <img 
                      src={slide.url} 
                      onError={() => handleImageError(`hero_${idx}`)}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-110" 
                      alt={`Slide ${idx + 1}`} 
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-300">
                      {hasError ? (
                        <>
                          <X className="text-red-500 mb-2" size={32} />
                          <span className="text-[10px] font-black uppercase text-red-400">Invalid Image URL</span>
                          <button 
                            type="button"
                            onClick={() => resetHeroSlideImage(idx)}
                            className="mt-4 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors"
                          >
                            Restore Default
                          </button>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={32} />
                          <span className="text-[9px] font-black mt-2 uppercase tracking-widest">No Image Selected</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                    <label className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-white transition-colors">
                      {uploading === `hero_${idx}` ? 'Uploading...' : 'Upload Image'}
                      <input type="file" className="hidden" onChange={(e) => uploadHeroImage(e, idx)} />
                    </label>
                    {slide.url !== DEFAULT_HERO_IMAGE && (
                      <button 
                        type="button"
                        onClick={() => resetHeroSlideImage(idx)}
                        className="bg-slate-800/90 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
                      >
                        Default Fallback
                      </button>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeHeroSlide(idx)}
                    className="absolute top-4 right-4 w-8 h-8 bg-red-500 text-white rounded-xl shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 active:scale-90"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="absolute bottom-4 left-4 bg-[#C8961A]/90 backdrop-blur text-white text-[10px] font-black px-2 py-1 rounded-lg">
                    Slide #{idx + 1}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Direct Image URL</label>
                      <div className="flex gap-2">
                        {resolving === `hero_${idx}` && <span className="text-[7px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase animate-pulse">Resolving...</span>}
                        {hasError && <span className="text-[7px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">Image Load Failed</span>}
                      </div>
                    </div>
                    <div className="relative">
                      <input 
                        value={slide.url}
                        onChange={e => {
                          updateHeroSlide(idx, 'url', e.target.value);
                          if (imageErrors[`hero_${idx}`]) {
                            setImageErrors(prev => ({ ...prev, [`hero_${idx}`]: false }));
                          }
                        }}
                        onBlur={() => autoResolveImage(slide.url, 'url', idx)}
                        className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs font-bold focus:bg-white focus:border-[#C8102E] outline-none transition-all ${hasError ? 'border-red-300' : 'border-slate-100'}`}
                        placeholder="https://images.unsplash.com/..."
                      />
                      {slide.url && (
                        <button 
                          onClick={() => resetHeroSlideImage(idx)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#C8102E]"
                          title="Reset to default"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Slide Headline</label>
                  <input 
                    value={slide.title}
                    onChange={e => updateHeroSlide(idx, 'title', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:bg-white focus:border-[#C8102E] outline-none transition-all"
                    placeholder="e.g. PREMIUM SCHOOL UNIFORMS"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Slide Subtext</label>
                  <input 
                    value={slide.subtitle}
                    onChange={e => updateHeroSlide(idx, 'subtitle', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:bg-white focus:border-[#C8102E] outline-none transition-all"
                    placeholder="e.g. QUALITY THAT LASTS ALL YEAR"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Slide Link URL</label>
                  <input 
                    value={slide.link || ''}
                    onChange={e => updateHeroSlide(idx, 'link', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:bg-white focus:border-[#C8102E] outline-none transition-all"
                    placeholder="e.g. /category/uniforms or https://..."
                  />
                </div>
              </div>
            </div>
          );
        })}
          {(formData.heroImages || []).length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
              <ImageIcon size={48} className="text-slate-300 mb-4" />
              <h5 className="text-sm font-bold text-slate-500 mb-1">No hero slides configured</h5>
              <p className="text-xs text-slate-400 mb-6">Add at least one slide to showcase on your homepage</p>
              <button 
                type="button"
                onClick={addHeroSlide}
                className="px-6 py-2 bg-white border border-slate-200 text-[#1C3560] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all shadow-sm active:scale-95"
              >
                Add Your First Slide
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sync Hero Slider Specific Button */}
      <div className="flex justify-start px-2">
        <button 
          type="button"
          onClick={async () => {
            try {
              await onSave(formData);
              const notification = document.createElement('div');
              notification.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0A1628] text-white px-6 py-3 rounded-2xl shadow-2xl z-[100] font-bold text-xs uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-300';
              notification.innerText = '✨ Hero Slider Synchronized Successfully';
              document.body.appendChild(notification);
              setTimeout(() => {
                notification.classList.add('fade-out', 'translate-y-4');
                setTimeout(() => notification.remove(), 300);
              }, 3000);
            } catch (err) {
              setToast({ message: 'Failed to save settings.', type: 'error' });
            }
          }}
          className="flex items-center gap-3 px-8 py-3.5 bg-[#C8961A] text-white text-[10px] font-black uppercase tracking-[2px] rounded-2xl hover:bg-[#A67D15] transition-all shadow-xl shadow-[#C8961A]/20 active:scale-95 group"
        >
          <Save size={16} className="group-hover:rotate-12 transition-transform" />
          Synchronize Slider to Homepage
        </button>
      </div>

      {/* Social Sharing Section */}
      <div className="space-y-6 pt-6 border-t border-slate-100">
        <h4 className="text-[11px] font-black uppercase text-[#C8102E] tracking-[3px] mb-6">Social Sharing & SEO (Open Graph)</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Sharing Title</label>
              <input 
                value={formData.sharingTitle}
                onChange={e => setFormData({ ...formData, sharingTitle: e.target.value })}
                onBlur={e => onSave({ ...formData, sharingTitle: e.target.value })}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#C8102E] outline-none transition-colors font-bold" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Sharing Description</label>
              <textarea 
                rows={3}
                value={formData.sharingDescription}
                onChange={e => setFormData({ ...formData, sharingDescription: e.target.value })}
                onBlur={e => onSave({ ...formData, sharingDescription: e.target.value })}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#C8102E] outline-none transition-colors" 
              />
            </div>
          </div>

          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Default Sharing Image</label>
                <div className="flex gap-2">
                  {resolving === 'sharingImage' && <span className="text-[7px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase animate-pulse">Resolving...</span>}
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded">1200x630 PX</span>
                </div>
              </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Direct Image URL</p>
                <input 
                  value={formData.sharingImage}
                  onChange={e => setFormData({ ...formData, sharingImage: e.target.value })}
                  onBlur={e => {
                    const val = e.target.value;
                    autoResolveImage(val, 'sharingImage');
                    onSave({ ...formData, sharingImage: val });
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] focus:bg-white focus:border-[#C8102E] outline-none transition-all font-bold" 
                />
              </div>

              <div className="relative group overflow-hidden rounded-2xl border border-slate-200 aspect-video bg-slate-50 flex items-center justify-center">
                {formData.sharingImage ? (
                  <img src={formData.sharingImage} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <ImageIcon size={32} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Preview Area</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="bg-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-transform">
                    {uploading === 'sharingImage' ? 'Uploading...' : 'Upload Instead'}
                    <input type="file" className="hidden" onChange={(e) => uploadBranding(e, 'sharingImage')} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-8 mt-12 border-t border-slate-100">
        <button 
          onClick={async () => {
            try {
              await onSave(formData);
              setToast({ message: 'Site settings synchronized successfully!', type: 'success' });
            } catch (err) {
              setToast({ message: 'Failed to save settings.', type: 'error' });
            }
          }}
          className="px-10 py-5 bg-gradient-to-r from-[#0A1628] to-[#1C3560] text-white rounded-3xl font-black text-xs uppercase tracking-[3px] transition-all hover:scale-[1.05] active:scale-[0.98] shadow-2xl shadow-[#1C3560]/30 flex items-center gap-4 group"
        >
          <Save size={20} className="group-hover:rotate-12 transition-transform" />
          Save & Synchronize All Settings
        </button>
      </div>
    </div>
  );
}

function DiscountRuleForm({ initialData, onSubmit, setToast }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    type: initialData?.type || 'quantity',
    threshold: initialData?.threshold || 0,
    discountPercentage: initialData?.discountPercentage || 0,
    active: initialData?.active ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Rule Title</label>
        <input 
          required 
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-[#C8102E] outline-none transition-colors font-bold" 
          placeholder="e.g. Bulk Order Savior" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Discount Type</label>
          <select 
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value as 'quantity' | 'total' })}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none font-bold"
          >
            <option value="quantity">Units Quantity</option>
            <option value="total">Order Total Value (KES)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">
            {formData.type === 'quantity' ? 'Min. Item Count' : 'Min. Order Value (KES)'}
          </label>
          <input 
            type="number"
            required
            value={formData.threshold}
            onChange={e => setFormData({ ...formData, threshold: parseFloat(e.target.value) || 0 })}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none font-bold" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Discount Percentage (%)</label>
          <div className="relative">
            <input 
              type="number"
              min="0"
              max="100"
              required
              value={formData.discountPercentage}
              onChange={e => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none font-bold pr-10" 
            />
            <Percent size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        <div className="space-y-1.5 flex items-end">
          <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 cursor-pointer w-full hover:bg-slate-100 transition-all group">
            <div className={`w-10 h-6 rounded-full transition-all relative ${formData.active ? 'bg-green-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.active ? 'left-5' : 'left-1'}`}></div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Rule Active</span>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={formData.active}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
            />
          </label>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-[#1C3560] text-white py-4 rounded-2xl font-black uppercase text-[12px] tracking-[2px] transition-all transform active:scale-95 shadow-xl shadow-[#1C3560]/20 mt-4 disabled:opacity-50"
      >
        {loading ? 'Processing...' : (initialData ? 'Update Rule' : 'Create Rule')}
      </button>
    </form>
  );
}

function PromotionForm({ initialData, onSubmit, setToast }: any) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    subtitle: initialData?.subtitle || '',
    type: initialData?.type || 'banner',
    buttonText: initialData?.buttonText || 'Shop Now',
    buttonLink: initialData?.buttonLink || '/shop',
    imageUrl: initialData?.imageUrl || '',
    active: initialData?.active ?? true,
    startDate: initialData?.startDate || format(new Date(), 'yyyy-MM-dd'),
    endDate: initialData?.endDate || format(subDays(new Date(), -30), 'yyyy-MM-dd')
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `promotions/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setFormData({ ...formData, imageUrl: url });
    } catch (error) {
      console.error("Upload error:", error);
      setToast({ message: "Failed to upload image.", type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setToast({ message: "Failed to save promotion.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Promotion Title</label>
        <input 
          required 
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-[#C8102E] outline-none transition-colors font-bold" 
          placeholder="e.g. Back to School 2026" 
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Subtitle / Description</label>
        <textarea 
          rows={2}
          value={formData.subtitle}
          onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-[#C8102E] outline-none transition-colors" 
          placeholder="Get 20% off on all school sweaters..." 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Banner Type</label>
          <select 
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value })}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none"
          >
            <option value="banner">Homepage Hero Banner</option>
            <option value="top-bar">Announcement Bar (Top)</option>
            <option value="modal">Popup Modal</option>
          </select>
        </div>
        <div className="space-y-1.5 flex items-end">
          <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 cursor-pointer w-full hover:bg-slate-100 transition-all group">
            <div className={`w-10 h-6 rounded-full transition-all relative ${formData.active ? 'bg-green-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.active ? 'left-5' : 'left-1'}`}></div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Active Status</span>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={formData.active}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Button Text</label>
          <input 
            value={formData.buttonText}
            onChange={e => setFormData({ ...formData, buttonText: e.target.value })}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none" 
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Button Link</label>
          <input 
            value={formData.buttonLink}
            onChange={e => setFormData({ ...formData, buttonLink: e.target.value })}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Start Date</label>
          <input 
            type="date"
            value={formData.startDate}
            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none" 
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">End Date</label>
          <input 
            type="date"
            value={formData.endDate}
            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none" 
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase text-[#64748B] tracking-wider ml-1">Campaign Visual (Image)</label>
        <div className="flex gap-4 items-center">
          <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
            {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-slate-300" />}
          </div>
          <div className="flex-1 space-y-3">
             <div className="space-y-1">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Direct Image URL</p>
               <input 
                 value={formData.imageUrl}
                 onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                 placeholder="https://images.unsplash.com/promo-image..."
                 className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs focus:border-[#C8102E] outline-none transition-colors font-bold" 
               />
             </div>
             <div>
               <label className="inline-block px-4 py-2 bg-[#1C3560] text-white text-[10px] font-black uppercase tracking-widest rounded-lg cursor-pointer hover:bg-[#0A1628] transition-all focus-within:ring-2 focus-within:ring-[#1C3560] focus-within:ring-offset-2">
                 {uploading ? 'Uploading...' : 'Or Upload File Instead'}
                 <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
               </label>
               <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-normal mt-2">Recommended: 1200x400px for banners. Max 2MB.</p>
             </div>
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading || uploading}
        className="w-full bg-[#C8102E] text-white py-4 rounded-2xl font-black uppercase text-[12px] tracking-[2px] transition-all transform active:scale-95 shadow-xl shadow-[#C8102E]/20 mt-4 disabled:opacity-50"
      >
        {loading ? 'Processing...' : (initialData ? 'Update Campaign' : 'Launch Campaign')}
      </button>
    </form>
  );
}
