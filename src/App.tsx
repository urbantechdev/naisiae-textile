/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));

import { InactivityHandler } from './components/InactivityHandler';
import { CartProvider, useCart } from './context/CartContext';
import { CartModal } from './components/CartModal';
import { WishlistModal } from './components/WishlistModal';
import { QuoteModal } from './components/QuoteModal';
import { FloatingChat } from './components/FloatingChat';

// Dynamic SEO Engine to enforce branding permanently across all routes
function DynamicSEOEngine() {
  const location = useLocation();

  useEffect(() => {
    const updateSEO = () => {
      const path = location.pathname;
      let title = "UHURU MARKET UNIFORMS & Institutional Apparel | Naisiae Textiles Nairobi";
      let description = "Official website for UHURU MARKET UNIFORMS by Naisiae Textiles. Premium school, corporate, hospitality, and hospital uniform manufacturing based in Uhuru Market, Nairobi, Kenya.";

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
        title = "Contact Us & Visit Workshop | UHURU MARKET UNIFORMS";
        description = "Get a custom apparel supply quote today. Visit us at Uhuru Market Along Jogoo Road, Nairobi, or call us directly at +254792021795.";
      } else if (path === '/about') {
        title = "Our Story & Manufacturing Heritage | UHURU MARKET UNIFORMS";
        description = "Learn about Naisiae Textiles' high standards of apparel craftsmanship, raw material grading, and support for community-driven production at Uhuru Market, Nairobi.";
      } else if (path === '/wholesale') {
        title = "Institutional Bulk Orders & Wholesale Request | UHURU MARKET UNIFORMS";
        description = "Request contract pricing on high-volume uniform supply for schools, hospitals, security agencies, and hospitality brands across East Africa. Min. 50 units.";
      } else if (path === '/checkout') {
        title = "Review Bulk Sourcing & Checkout | UHURU MARKET UNIFORMS";
        description = "Step-by-step verification of your wholesale inquiries, customizable branding preferences, and secure client profile syncing.";
      } else if (path === '/privacy') {
        title = "Privacy Policy | UHURU MARKET UNIFORMS";
        description = "We respect and safeguard our clients' organizational and personal details under Kenyan data protection regulations.";
      } else if (path === '/terms') {
        title = "Terms of Service & Manufacturing Contracts | UHURU MARKET UNIFORMS";
        description = "Understand bulk order production terms, factory SLA timelines, quality inspection standards, and contract invoicing procedures.";
      } else if (path === '/shipping') {
        title = "Shipping, Nationwide Logistics & Pickup | UHURU MARKET UNIFORMS";
        description = "Find shipping estimates, prompt direct courier networks, and convenient self-pickup instructions at Uhuru Market, Jogoo Road-Nairobi.";
      } else if (path === '/returns') {
        title = "Returns Policy & Quality Guarantee | UHURU MARKET UNIFORMS";
        description = "Read our terms for size corrections, fitting alterations, and manufacturing defect policies under our comprehensive quality assurance program.";
      }

      // Force apply changes securely to the DOM
      document.title = title;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      }

      // Update Canonical Tag
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', `https://naisiaetextiles.com${path === '/' ? '' : path}`);

      // Manage Breadcrumb Structured Data dynamically for Rich Snippets
      const schemaScriptId = 'dynamic-jsonld-seo';
      let schemaScript = document.getElementById(schemaScriptId);
      if (schemaScript) {
        schemaScript.remove();
      }

      const breadcrumbs = [
        { name: "Home", item: "https://naisiaetextiles.com" }
      ];

      if (path !== '/') {
        const segments = path.split('/').filter(Boolean);
        let currPath = '';
        segments.forEach((seg) => {
          currPath += `/${seg}`;
          const formattedName = seg.charAt(0).toUpperCase() + seg.slice(1);
          breadcrumbs.push({
            name: title.split('|')[0].trim() || formattedName,
            item: `https://naisiaetextiles.com${currPath}`
          });
        });
      }

      const breadcrumbListSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((b, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": b.name,
          "item": b.item
        }))
      };

      const newScript = document.createElement('script');
      newScript.id = schemaScriptId;
      newScript.type = 'application/ld+json';
      newScript.innerHTML = JSON.stringify(breadcrumbListSchema);
      document.head.appendChild(newScript);
    };

    updateSEO();
  }, [location.pathname]);

  return null;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        if (user.email === 'naisiaetext@gmail.com' || user.email === 'support@naisiaetextiles.com') {
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

  return (
    <Router>
      <CartProvider>
        <DynamicSEOEngine />
        <AppContent isAdmin={isAdmin} loading={loading} />
      </CartProvider>
    </Router>
  );
}

function AppContent({ isAdmin, loading }: any) {
  const { isCartOpen, setIsCartOpen, isWishlistOpen, setIsWishlistOpen } = useCart();

  return (
    <InactivityHandler>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/wholesale" element={<WholesalePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/admin/*" 
            element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <WishlistModal isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
      <QuoteModal />
      <FloatingChat />
    </InactivityHandler>
  );
}
