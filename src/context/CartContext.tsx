import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { onSnapshot, doc, setDoc, serverTimestamp, query, collection, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  selectedVariants?: Record<string, string>; // Flexible variant support (Size, Color, Material, etc.)
  category?: string;
  subCategory?: string;
  priceType?: 'fixed' | 'wholesale';
  customization?: string;
  brandingType?: string;
  brandingPosition?: string;
  customLogoUrl?: string;
  customLogoName?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: string, variants?: Record<string, string>) => void;
  updateQuantity: (id: string, quantity: number, variants?: Record<string, string>) => void;
  clearCart: () => void;
  isInCart: (id: string, variants?: Record<string, string>) => boolean;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  discountAmount: number;
  appliedPromo: { code: string; discount: number } | null;
  lastAddedItem: CartItem | null;
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isWishlistOpen: boolean;
  setIsWishlistOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isQuoteModalOpen: boolean;
  setIsQuoteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCatalogueModalOpen: boolean;
  setIsCatalogueModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Wishlist Logic
  wishlist: any[];
  toggleWishlist: (product: any) => void;
  isInWishlist: (id: string) => boolean;
  wishlistCount: number;
  siteSettings: any;
  promotions: any[];
  // Centralized Toast Notifications
  toast: { message: string; type: 'success' | 'warning' | 'error' | 'info' } | null;
  setToast: React.Dispatch<React.SetStateAction<{ message: string; type: 'success' | 'warning' | 'error' | 'info' } | null>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to compare variants safely
const areVariantsEqual = (v1?: Record<string, string>, v2?: Record<string, string>) => {
  if (!v1 && !v2) return true;
  if (!v1 || !v2) return false;
  const keys1 = Object.keys(v1);
  const keys2 = Object.keys(v2);
  if (keys1.length !== keys2.length) return false;
  return keys1.every(key => v1[key] === v2[key]);
};

// Hardcoded promos for initial experience (could be moved to Firestore later)
const PROMO_CODES: Record<string, number> = {
  'UHURU10': 0.1,    // 10% off
  'NAISIAE20': 0.2, // 20% off
  'WELCOME': 500,   // /- 500 fixed off
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('naisiae_cart_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse cart from storage', e);
      return [];
    }
  });

  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const lastWishlistRef = useRef<string>('');
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isCatalogueModalOpen, setIsCatalogueModalOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<any>(() => {
    if (typeof window !== 'undefined' && (window as any).__PRELOADED_SETTINGS__) {
      return (window as any).__PRELOADED_SETTINGS__;
    }
    return {
      siteName: 'Naisiae Textiles Limited',
      siteTagline: 'School Uniforms & Branding',
      heroImages: [
        {
          url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1920&auto=format&fit=crop',
          title: 'CRAFTING',
          subtitle: 'Engineered textiles for the modern institution. Quality guaranteed for generations.'
        }
      ]
    };
  });
  const [promotions, setPromotions] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('naisiae_wishlist_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse wishlist from storage', e);
      return [];
    }
  });

  // Persistence and Cross-Tab Sync
  useEffect(() => {
    localStorage.setItem('naisiae_cart_v2', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('naisiae_wishlist_v1', JSON.stringify(wishlist));
    
    // Sync to Firebase if logged in AND data has actually changed
    const currentWishlistStr = JSON.stringify(wishlist);
    if (auth.currentUser && currentWishlistStr !== lastWishlistRef.current) {
      lastWishlistRef.current = currentWishlistStr;
      setDoc(doc(db, 'wishlists', auth.currentUser.uid), { 
        items: wishlist, 
        email: auth.currentUser?.email, 
        displayName: auth.currentUser?.displayName,
        updatedAt: serverTimestamp() 
      }, { merge: true }).catch(error => {
        handleFirestoreError(error, OperationType.WRITE, `wishlists/${auth.currentUser?.uid}`);
      });
    }
  }, [wishlist]);

  // Firebase auth state and wishlist sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const wishlistRef = doc(db, 'wishlists', user.uid);
        const unsubscribeWishlist = onSnapshot(wishlistRef, (docSnap) => {
          if (docSnap.exists()) {
            const remoteItems = (docSnap.data() as any).items || [];
            const remoteStr = JSON.stringify(remoteItems);
            if (remoteStr !== JSON.stringify(wishlist)) {
              setWishlist(remoteItems);
              lastWishlistRef.current = remoteStr;
            }
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `wishlists/${user.uid}`);
        });
        return () => unsubscribeWishlist();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch Site Settings and Promotions globally
  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) setSiteSettings(snapshot.data());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/site');
    });

    const qPromos = query(collection(db, 'promotions'), where('active', '==', true));
    const unsubscribePromos = onSnapshot(qPromos, (snapshot) => {
      setPromotions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'promotions');
    });
    
    return () => {
      unsubscribeSettings();
      unsubscribePromos();
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'naisiae_cart_v2' && e.newValue) {
        setCart(JSON.parse(e.newValue));
      }
      if (e.key === 'naisiae_wishlist_v1' && e.newValue) {
        setWishlist(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleWishlist = useCallback((product: any) => {
    let existed = false;
    setWishlist((prev) => {
      existed = prev.some((p) => p.id === product.id);
      if (existed) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
    setToast({
      message: existed 
        ? `Removed "${product.name || 'item'}" from your saved designs.` 
        : `Successfully saved "${product.name || 'item'}" to your designs!`,
      type: existed ? 'warning' : 'success'
    });
  }, []);

  const isInWishlist = useCallback((id: string) => {
    return wishlist.some((p) => p.id === id);
  }, [wishlist]);

  const wishlistCount = useMemo(() => wishlist.length, [wishlist]);

  const addToCart = useCallback((newItem: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => 
          item.id === newItem.id && 
          areVariantsEqual(item.selectedVariants, newItem.selectedVariants) &&
          item.customization === newItem.customization
      );

      const addedItem = { ...newItem, quantity };
      setLastAddedItem(addedItem as CartItem);
      setIsCartOpen(true); // Open cart immediately when item is added
      
      // Clear last added after a delay so UI can react
      setTimeout(() => setLastAddedItem(null), 3000);

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, addedItem];
    });
  }, []);

  const removeFromCart = useCallback((id: string, variants?: Record<string, string>) => {
    setCart((prev) => prev.filter((item) => !(item.id === id && areVariantsEqual(item.selectedVariants, variants))));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number, variants?: Record<string, string>) => {
    if (quantity <= 0) {
      removeFromCart(id, variants);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === id && areVariantsEqual(item.selectedVariants, variants) ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedPromo(null);
  }, []);

  const isInCart = useCallback((id: string, variants?: Record<string, string>) => {
    return cart.some(item => item.id === id && areVariantsEqual(item.selectedVariants, variants));
  }, [cart]);

  const applyPromoCode = useCallback((code: string) => {
    const upperCode = code.toUpperCase();
    const discount = PROMO_CODES[upperCode];
    
    if (discount !== undefined) {
      setAppliedPromo({ code: upperCode, discount });
      return { success: true, message: `Applied ${upperCode} successfully!` };
    }
    return { success: false, message: 'Invalid promo code.' };
  }, []);

  const removePromoCode = useCallback(() => {
    setAppliedPromo(null);
  }, []);

  // Derived Values
  const cartCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((total, item) => total + item.price * item.quantity, 0), [cart]);
  
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.discount <= 1) {
      return cartSubtotal * appliedPromo.discount;
    }
    return appliedPromo.discount;
  }, [cartSubtotal, appliedPromo]);

  const cartTotal = useMemo(() => Math.max(cartSubtotal - discountAmount, 0), [cartSubtotal, discountAmount]);
  const cartTax = useMemo(() => cartTotal * (16/116), [cartTotal]);

  const value = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    applyPromoCode,
    removePromoCode,
    cartCount,
    cartSubtotal,
    cartTax,
    cartTotal,
    discountAmount,
    appliedPromo,
    lastAddedItem,
    isCartOpen,
    setIsCartOpen,
    isWishlistOpen,
    setIsWishlistOpen,
    isQuoteModalOpen,
    setIsQuoteModalOpen,
    isCatalogueModalOpen,
    setIsCatalogueModalOpen,
    wishlist,
    toggleWishlist,
    isInWishlist,
    wishlistCount,
    siteSettings,
    promotions,
    toast,
    setToast
  }), [
    cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    isInCart, 
    applyPromoCode,
    removePromoCode,
    cartCount, 
    cartSubtotal, 
    cartTax, 
    cartTotal, 
    discountAmount,
    appliedPromo,
    lastAddedItem,
    isCartOpen,
    setIsCartOpen,
    isWishlistOpen,
    setIsWishlistOpen,
    isQuoteModalOpen,
    setIsQuoteModalOpen,
    isCatalogueModalOpen,
    setIsCatalogueModalOpen,
    wishlist,
    toggleWishlist,
    isInWishlist,
    wishlistCount,
    siteSettings,
    promotions,
    toast,
    setToast
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
