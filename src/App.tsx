/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState, lazy, Suspense } from 'react';
import { auth, db } from './services/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Lazy loaded pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const WholesalePage = lazy(() => import('./pages/WholesalePage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const ShippingPage = lazy(() => import('./pages/ShippingPage'));
const ReturnsPage = lazy(() => import('./pages/ReturnsPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));

import { InactivityHandler } from './components/InactivityHandler';

// Dynamic SEO Engine to enforce branding permanently across all routes
function DynamicSEOEngine() {
  useEffect(() => {
    const updateSEO = () => {
      const path = window.location.pathname;
      let title = "UHURU MARKET UNIFORMS | Naisiae Textiles Nairobi";
      let description = "Official website for UHURU MARKET UNIFORMS by Naisiae Textiles. Premium school, corporate, and hospital uniform manufacturing based in Uhuru Market, Nairobi.";

      if (path === '/products') {
        title = "Our Uniform Products | UHURU MARKET UNIFORMS";
        description = "Browse our full catalog of custom-tailored garments. High-quality primary & secondary school uniforms, games kits, and specialized corporate wear.";
      } else if (path === '/categories') {
        title = "Uniform Categories & Options | UHURU MARKET UNIFORMS";
        description = "Explore our uniform manufacturing categories including Education, Hospitality, Medical, Security, and Corporate branding solutions in Nairobi.";
      } else if (path === '/services') {
        title = "Bulk Manufacturing & Branding Services | UHURU MARKET UNIFORMS";
        description = "From heavy-duty industrial stitching to custom embroidery and screen printing. Discover our mass-scale textile production capabilities.";
      } else if (path === '/portfolio') {
        title = "Our Work & Past Projects | UHURU MARKET UNIFORMS";
        description = "See examples of bulk uniform orders we have successfully delivered across Kenya. Check out our design quality and finished tailoring work.";
      } else if (path === '/contact') {
        title = "Contact Us | UHURU MARKET UNIFORMS";
        description = "Get in touch with UHURU MARKET UNIFORMS by Naisiae Textiles. Call +254792021795 or visit our workshop at Uhuru Market, KCB Lane, Nairobi.";
      }

      // Force apply changes securely to the DOM
      document.title = title;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      }
    };

    // Run immediately on page render
    updateSEO();

    // Listen for inner routing navigation events
    window.addEventListener('popstate', updateSEO);
    return () => window.removeEventListener('popstate', updateSEO);
  }, []);

  return null;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);

  useEffect(() => {
    // Initial load from localStorage
    const savedCart = localStorage.getItem('nt_cart');
    const savedWishlist = localStorage.getItem('nt_wishlist');
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
  }, []);

  useEffect(() => {
    localStorage.setItem('nt_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('nt_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        if (user.email === 'naisiaetext@gmail.com' || user.email === 'support@naisiaetextile.com') {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        if (user.emailVerified) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1628]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C8961A]"></div>
      </div>
    );
  }

  return (
    <Router>
      <DynamicSEOEngine /> {/* Injected right here to capture and control all route shifts */}
      <InactivityHandler>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#0A1628]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C8961A]"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<HomePage cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="/about" element={<AboutPage cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="/wholesale" element={<WholesalePage cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="/contact" element={<ContactPage cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="/privacy" element={<PrivacyPage cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="/terms" element={<TermsPage cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="/shipping" element={<ShippingPage cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="/returns" element={<ReturnsPage cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} />} />
            
            {/* New Routes */}
            <Route path="/services" element={<ServicesPage cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="/products" element={<ProductsPage cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="/portfolio" element={<PortfolioPage cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="/categories" element={<CategoriesPage cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} />} />
            
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/admin/*" 
              element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </InactivityHandler>
    </Router>
  );
}
