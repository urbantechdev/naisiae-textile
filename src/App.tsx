/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState, lazy, Suspense } from 'react';
import { auth, db } from './services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';

// Direct static import of HomePage for instant initial paint
import HomePage from './pages/HomePage';

// Route-Based Lazy Loading (React.lazy()) to optimize initial bundle size on mobile
const AboutPage = lazy(() => import('./pages/AboutPage'));
const WholesalePage = lazy(() => import('./pages/WholesalePage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const ShippingPage = lazy(() => import('./pages/ShippingPage'));
const ReturnsPage = lazy(() => import('./pages/ReturnsPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const FabricGalleryPage = lazy(() => import('./pages/FabricGalleryPage'));
const UniformSimulatorPage = lazy(() => import('./pages/UniformSimulatorPage'));

// Code-split heavy pages to optimize initial bundle payload and improve Core Web Vitals
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

import { ErrorBoundary } from './components/ErrorBoundary';
import { InactivityHandler } from './components/InactivityHandler';
import { CartProvider, useCart } from './context/CartContext';
import { LocalizationProvider, useLocalization } from './context/LocalizationContext';

const CartModal = lazy(() => import('./components/CartModal').then(module => ({ default: module.CartModal })));
const WishlistModal = lazy(() => import('./components/WishlistModal').then(module => ({ default: module.WishlistModal })));
const QuoteModal = lazy(() => import('./components/QuoteModal').then(module => ({ default: module.QuoteModal })));
const CatalogueModal = lazy(() => import('./components/CatalogueModal').then(module => ({ default: module.CatalogueModal })));
const FloatingChat = lazy(() => import('./components/FloatingChat').then(module => ({ default: module.FloatingChat })));
const GlobalToast = lazy(() => import('./components/GlobalToast').then(module => ({ default: module.GlobalToast })));

// Dynamic SEO Engine to enforce branding permanently across all routes
function DynamicSEOEngine() {
  const location = useLocation();
  const { currentCountry } = useLocalization();

  useEffect(() => {
    const updateSEO = () => {
      const path = location.pathname;
      const countrySuffix = currentCountry.code === 'KE' ? ' - Nairobi, DRC, TZ, UG, ETH' : ` in ${currentCountry.name}`;
      const countryDescriptionSuffix = currentCountry.code === 'KE' ? ', In Nairobi, DRC, TZ, UG, ETH' : ` in ${currentCountry.name}`;
      
      let title = `Uhuru Market Uniforms${countrySuffix} | Naisiae Textiles`;
      let description = `Official Uhuru Market Uniforms by Naisiae Textiles. School uniforms, corporate wear, and industrial branding${countryDescriptionSuffix}.`;

      // Adapt description based on country to maximize regional textile SEO searches
      if (currentCountry.code === 'TZ') {
        description = "Sare za shule na mavazi ya viwandani nchini Tanzania kutoka Naisiae Textiles. Sweta na magwanda ya ubora wa juu kwa bei ya jumla Dar es Salaam.";
      } else if (currentCountry.code === 'CD') {
        description = "Naisiae Textiles, votre partenaire de confiance pour les uniformes scolaires, vêtements de travail et blouses médicales en RDC (Kinshasa) au meilleur prix.";
      } else if (currentCountry.code === 'ET') {
        description = "ናይሲያ ጨርቃጨርቅ (Naisiae Textiles) በኢትዮጵያ ውስጥ ከፍተኛ ጥራት ያላቸውን የትምህርት ቤት ዩኒፎርሞች፣ የህክምና እና የኮርፖሬት አልባሳትን በጅምላ ዋጋ ያቀርባል።";
      } else if (currentCountry.code === 'UG') {
        description = "Premium school uniforms and corporate apparel in Uganda by Naisiae Textiles. High-density embroidery and durable fabrics at wholesale rates in Kampala.";
      }

      if (path.includes('/products') || path.includes('/product')) {
        title = `Uhuru Market Uniforms | Our Uniform Products${countrySuffix}`;
        description = `Browse our full catalog of custom-tailored garments${countryDescriptionSuffix}. High-quality school uniforms, corporate wear, and specialized protective gear.`;
      } else if (path.includes('/categories')) {
        title = `Uhuru Market Uniforms | Uniform Categories & Options${countrySuffix}`;
        description = `Explore our uniform manufacturing categories${countryDescriptionSuffix} including Education, Hospitality, Medical, Security, and Corporate branding.`;
      } else if (path.includes('/services')) {
        title = `Uhuru Market Uniforms | Bulk Manufacturing & Branding Services${countrySuffix}`;
        description = `From heavy-duty industrial stitching to custom embroidery and screen printing${countryDescriptionSuffix}. Discover our mass-scale production.`;
      } else if (path.includes('/portfolio')) {
        title = `Uhuru Market Uniforms | Our Work & Delivered Projects${countrySuffix}`;
        description = `See examples of bulk uniform orders we have successfully delivered across East Africa${countryDescriptionSuffix}. Inspect our design quality.`;
      } else if (path.includes('/contact')) {
        title = `Uhuru Market Uniforms | Contact Us & Visit Workshop${countrySuffix}`;
        description = `Get a custom apparel supply quote. Contact our local support at ${currentCountry.phone} or visit our localized service center${countryDescriptionSuffix}.`;
      } else if (path.includes('/about')) {
        title = `Uhuru Market Uniforms | Our Story & Manufacturing Heritage${countrySuffix}`;
        description = `Learn about Naisiae Textiles' premium uniform craftsmanship, raw material grading & regional community-driven production${countryDescriptionSuffix}.`;
      } else if (path.includes('/wholesale')) {
        title = `Uhuru Market Uniforms | Institutional Bulk Orders & Wholesale Request${countrySuffix}`;
        description = `Request contract pricing on high-volume uniform supply for schools, hospitals, security agencies, and hospitality brands${countryDescriptionSuffix}.`;
      } else if (path.includes('/checkout')) {
        title = `Uhuru Market Uniforms | Review Bulk Sourcing & Checkout${countrySuffix}`;
        description = `Verify your wholesale inquiries, customizable branding preferences, and secure client profile syncing${countryDescriptionSuffix}.`;
      } else if (path.includes('/privacy') || path.includes('/policy')) {
        title = `Uhuru Market Uniforms | Privacy Policy${countrySuffix}`;
        description = `We safeguard our clients' organizational and personal details under local data protection regulations${countryDescriptionSuffix}.`;
      } else if (path.includes('/terms')) {
        title = `Uhuru Market Uniforms | Terms of Service & Manufacturing Contracts${countrySuffix}`;
        description = `Understand bulk order production terms, factory SLA timelines, and contract invoicing procedures${countryDescriptionSuffix}.`;
      } else if (path.includes('/shipping')) {
        title = `Uhuru Market Uniforms | Shipping, Nationwide Logistics & Pickup${countrySuffix}`;
        description = `Find shipping estimates, prompt direct courier networks, and convenient localized delivery across ${currentCountry.name}${countryDescriptionSuffix === `, In Nairobi, DRC, TZ, UG, ETH` ? countryDescriptionSuffix : ''}.`;
      } else if (path.includes('/returns')) {
        title = `Uhuru Market Uniforms | Returns Policy & Quality Guarantee${countrySuffix}`;
        description = `Read our terms for size corrections, fitting alterations, and manufacturing defect policies${countryDescriptionSuffix}.`;
      } else if (path.includes('/blog')) {
        title = `Uhuru Market Uniforms | Industry Guides & Sourcing Logbook${countrySuffix}`;
        description = `Expert advice and detailed logbooks on uniform fabrics, embroidery quality parameters, and factory procurement${countryDescriptionSuffix}.`;
      } else if (path.includes('/faq')) {
        title = `Uhuru Market Uniforms | Frequently Asked Questions${countrySuffix}`;
        description = `Read answers about minimum order quantities (MOQs), fabric choices, corporate customization, and regional supply queries${countryDescriptionSuffix}.`;
      } else if (path.includes('/careers')) {
        title = `Uhuru Market Uniforms | Careers & Tailoring Opportunities${countrySuffix}`;
        description = `Join our production team. Inspect open sewing, embroidery machine operations, and quality inspection roles${countryDescriptionSuffix}.`;
      } else if (path.includes('/fabric-gallery') || path.includes('/textiles')) {
        title = `Uhuru Market Uniforms | Interactive Textile & Fabric Gallery${countrySuffix}`;
        description = `Browse and filter our premium school uniform and corporate apparel textile samples${countryDescriptionSuffix}. Inspect material specs.`;
      } else if (path.includes('/uniform-simulator')) {
        title = `Uhuru Market Uniforms | Interactive 3D School Uniform Simulator${countrySuffix}`;
        description = `Configure sweaters, shirts, blazers, and ties in standard institutional colorways${countryDescriptionSuffix}. Preview custom combinations.`;
      }

      // Force apply changes securely to the DOM
      document.title = title;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      }

      // Set meta keywords dynamically for regional textile searches
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', currentCountry.keywords);

      // Dynamic robots meta policy to prevent indexing checkout, login, or admin pathways
      let robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement('meta');
        robots.setAttribute('name', 'robots');
        document.head.appendChild(robots);
      }
      const isPrivatePath = path === '/checkout' || path === '/login' || path.startsWith('/admin');
      if (isPrivatePath) {
        robots.setAttribute('content', 'noindex, nofollow, noarchive');
      } else {
        robots.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
      }

      // Sync Social Open Graph and Twitter tags dynamically for crawler previews
      const setMetaProperty = (selector: string, attrName: string, value: string) => {
        let metaEl = document.querySelector(selector);
        if (!metaEl) {
          metaEl = document.createElement('meta');
          const pair = selector.includes('property') ? ['property', selector.match(/"([^"]+)"/)?.[1] || ''] : ['name', selector.match(/"([^"]+)"/)?.[1] || ''];
          metaEl.setAttribute(pair[0], pair[1]);
          document.head.appendChild(metaEl);
        }
        metaEl.setAttribute(attrName, value);
      };

      let canonicalPath = path;
      if (!canonicalPath.endsWith('/')) {
        canonicalPath += '/';
      }
      const canonicalUrl = `https://naisiaetextiles.com${canonicalPath}`;

      setMetaProperty('meta[property="og:title"]', 'content', title);
      setMetaProperty('meta[property="og:description"]', 'content', description);
      setMetaProperty('meta[property="og:url"]', 'content', canonicalUrl);
      setMetaProperty('meta[name="twitter:title"]', 'content', title);
      setMetaProperty('meta[name="twitter:description"]', 'content', description);
      setMetaProperty('meta[name="twitter:url"]', 'content', canonicalUrl);

      // Ensure all canonical URLs use the trailing slash version consistently across every page
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', canonicalUrl);

      // Manage Rich Schema.org Structured Data dynamically for Rich Snippets
      const schemaScriptId = 'dynamic-jsonld-seo';
      let schemaScript = document.getElementById(schemaScriptId);
      if (schemaScript) {
        schemaScript.remove();
      }

      const schemasList: any[] = [];

      // 1. WebPage Schema for all pages
      const webPageSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        "url": canonicalUrl,
        "name": title,
        "description": description,
        "isPartOf": {
          "@type": "WebSite",
          "@id": "https://naisiaetextiles.com/#website",
          "name": `Uhuru Market Uniforms (Naisiae Textiles ${currentCountry.name})`,
          "url": "https://naisiaetextiles.com/"
        }
      };
      schemasList.push(webPageSchema);

      // 2. BreadcrumbList Schema for all pages
      const breadcrumbs = [
        { name: "Home", item: "https://naisiaetextiles.com/" }
      ];

      if (path !== '/') {
        const segments = path.split('/').filter(Boolean);
        let currPath = '';
        segments.forEach((seg) => {
          currPath += `/${seg}`;
          let formattedName = seg.charAt(0).toUpperCase() + seg.slice(1);
          if (seg === 'faq') formattedName = "FAQ";
          if (seg === 'wholesale') formattedName = "Bulk Wholesale";
          breadcrumbs.push({
            name: formattedName,
            item: `https://naisiaetextiles.com${currPath}/`
          });
        });
      }

      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((b, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": b.name,
          "item": b.item
        }))
      };
      schemasList.push(breadcrumbSchema);

      // 3. LocalBusiness Schema localized per country
      const businessSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `Uhuru Market Uniforms (Naisiae Textiles ${currentCountry.name})`,
        "image": "https://naisiaetextiles.com/logo.png",
        "telephone": currentCountry.phone,
        "email": currentCountry.email,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": currentCountry.address,
          "addressLocality": currentCountry.city,
          "addressCountry": currentCountry.code
        },
        "priceRange": "$$"
      };
      schemasList.push(businessSchema);

      const newScript = document.createElement('script');
      newScript.id = schemaScriptId;
      newScript.type = 'application/ld+json';
      newScript.innerHTML = JSON.stringify(schemasList.length === 1 ? schemasList[0] : schemasList);
      document.head.appendChild(newScript);

      // Clean prefix and dynamically inject localized hreflang alternates in page head
      let cleanSubpath = path;
      const prefixes = ['tanzania', 'dr-congo', 'uganda', 'ethiopia'];
      for (const prefix of prefixes) {
        if (cleanSubpath.startsWith(`/${prefix}/`)) {
          cleanSubpath = cleanSubpath.slice(prefix.length + 1);
          break;
        } else if (cleanSubpath === `/${prefix}`) {
          cleanSubpath = '/';
          break;
        }
      }
      
      if (!cleanSubpath.endsWith('/')) {
        cleanSubpath += '/';
      }

      // Clear out any old dynamic hreflang links to prevent duplication
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

      const alternates = [
        { hreflang: 'en-KE', url: `https://naisiaetextiles.com${cleanSubpath}` },
        { hreflang: 'sw-TZ', url: `https://naisiaetextiles.com/tanzania${cleanSubpath}` },
        { hreflang: 'fr-CD', url: `https://naisiaetextiles.com/dr-congo${cleanSubpath}` },
        { hreflang: 'en-UG', url: `https://naisiaetextiles.com/uganda${cleanSubpath}` },
        { hreflang: 'am-ET', url: `https://naisiaetextiles.com/ethiopia${cleanSubpath}` },
        { hreflang: 'x-default', url: `https://naisiaetextiles.com${cleanSubpath}` }
      ];

      alternates.forEach(alt => {
        const link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', alt.hreflang);
        const cleanUrl = alt.url.replace(/([^:]\/)\/+/g, "$1");
        link.setAttribute('href', cleanUrl);
        document.head.appendChild(link);
      });
    };

    updateSEO();
  }, [location.pathname, currentCountry]);

  return null;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      const adminEmails = [
        'naisiaetext@gmail.com',
        'Kirigommk@gmail.com',
        'Kgeokom@gmail.com',
        'naisiaetextile@gmail.com'
      ];
      if (user && user.email && adminEmails.includes(user.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <LocalizationProvider>
          <CartProvider>
            <DynamicSEOEngine />
            <AppContent isAdmin={isAdmin} loading={loading} />
          </CartProvider>
        </LocalizationProvider>
      </Router>
    </ErrorBoundary>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function AppContent({ isAdmin, loading }: any) {
  const { isCartOpen, setIsCartOpen, isWishlistOpen, setIsWishlistOpen } = useCart();

  return (
    <InactivityHandler>
      <Suspense fallback={null}>
        <PageTransition>
          <Routes>
            {/* Base routes without prefix (defaults to Kenya or previous user selection) */}
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/product/:productId" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/wholesale" element={<WholesalePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/policy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/shipping" element={<ShippingPage />} />
            <Route path="/returns" element={<ReturnsPage />} />
            
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product" element={<ProductsPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/fabric-gallery" element={<FabricGalleryPage />} />
            <Route path="/textiles" element={<FabricGalleryPage />} />
            <Route path="/uniform-simulator" element={<UniformSimulatorPage />} />
            
            {/* Country-prefixed routes for Kenya, Tanzania, DRC, Uganda, and Ethiopia */}
            {['ke', 'kenya', 'tz', 'tanzania', 'cd', 'drc', 'congo', 'ug', 'uganda', 'et', 'ethiopia'].map((prefix) => (
              <Route key={prefix} path={`/${prefix}`}>
                <Route index element={<HomePage />} />
                <Route path="home" element={<HomePage />} />
                <Route path="product/:productId" element={<HomePage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="wholesale" element={<WholesalePage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="policy" element={<PrivacyPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="shipping" element={<ShippingPage />} />
                <Route path="returns" element={<ReturnsPage />} />
                
                <Route path="services" element={<ServicesPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="product" element={<ProductsPage />} />
                <Route path="portfolio" element={<PortfolioPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                
                <Route path="blog" element={<BlogPage />} />
                <Route path="faq" element={<FAQPage />} />
                <Route path="careers" element={<CareersPage />} />
                <Route path="fabric-gallery" element={<FabricGalleryPage />} />
                <Route path="textiles" element={<FabricGalleryPage />} />
                <Route path="uniform-simulator" element={<UniformSimulatorPage />} />
              </Route>
            ))}
            
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/admin/*" 
              element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageTransition>
        <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <WishlistModal isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
        <QuoteModal />
        <CatalogueModal />
        <FloatingChat />
        <GlobalToast />
      </Suspense>
    </InactivityHandler>
  );
}
