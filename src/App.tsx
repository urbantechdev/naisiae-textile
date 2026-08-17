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
      const countrySuffix = currentCountry.code === 'KE' ? '' : ` in ${currentCountry.name}`;
      const countryDescriptionSuffix = currentCountry.code === 'KE' ? '' : ` in ${currentCountry.name}`;
      
      let title = "Uhuru Market Uniforms";
      let description = `Naisiae Textiles operates as the ultimate school uniform supplier and school uniform manufacturer located directly at Uhuru Market along Jogoo Road, Nairobi.`;

      // Adapt description based on country to maximize regional textile SEO searches
      if (currentCountry.code === 'TZ') {
        description = "Sare za shule na mavazi ya viwandani nchini Tanzania kutoka Uhuru Market Uniforms. Sweta na magwanda ya ubora wa juu kwa bei ya jumla Dar es Salaam.";
      } else if (currentCountry.code === 'CD') {
        description = "Uhuru Market Uniforms, votre partenaire de confiance pour les uniformes scolaires, vêtements de travail et blouses médicales en RDC (Kinshasa) au meilleur prix.";
      } else if (currentCountry.code === 'ET') {
        description = "የኡሁሩ ገበያ ዩኒፎርሞች (Uhuru Market Uniforms) በኢትዮጵያ ውስጥ ከፍተኛ ጥራት ያላቸውን የትምህርት ቤት ዩኒፎርሞች፣ የህክምና እና የኮርፖሬት አልባሳትን በጅምላ ዋጋ ያቀርባል።";
      } else if (currentCountry.code === 'UG') {
        description = "Quality school uniforms and corporate apparel in Uganda by Uhuru Market Uniforms. High-density embroidery and durable fabrics at wholesale rates in Kampala.";
      }

      if (path.includes('/products') || path.includes('/product')) {
        description = `Browse our full catalog of custom-tailored garments${countryDescriptionSuffix}. High-quality school uniforms, corporate wear, and specialized protective gear.`;
      } else if (path.includes('/categories')) {
        description = `Explore our uniform manufacturing categories${countryDescriptionSuffix} including Education, Hospitality, Medical, Security, and Corporate branding.`;
      } else if (path.includes('/services')) {
        description = `From heavy-duty industrial stitching to custom embroidery and screen printing${countryDescriptionSuffix}. Discover our mass-scale production.`;
      } else if (path.includes('/portfolio')) {
        description = `See examples of bulk uniform orders we have successfully delivered across East Africa${countryDescriptionSuffix}. Inspect our design quality.`;
      } else if (path.includes('/contact')) {
        description = `Get a custom apparel supply quote. Contact our local support at ${currentCountry.phone} or visit our localized service center${countryDescriptionSuffix}.`;
      } else if (path.includes('/about')) {
        description = `Learn about Uhuru Market Uniforms' premium uniform craftsmanship, raw material grading & regional community-driven production${countryDescriptionSuffix}.`;
      } else if (path.includes('/wholesale')) {
        description = `Request contract pricing on high-volume uniform supply for schools, hospitals, security agencies, and hospitality brands${countryDescriptionSuffix}.`;
      } else if (path.includes('/checkout')) {
        description = `Verify your wholesale inquiries, customizable branding preferences, and secure client profile syncing${countryDescriptionSuffix}.`;
      } else if (path.includes('/privacy') || path.includes('/policy')) {
        description = `We safeguard our clients' organizational and personal details under local data protection regulations${countryDescriptionSuffix}.`;
      } else if (path.includes('/terms')) {
        description = `Understand bulk order production terms, factory SLA timelines, and contract invoicing procedures${countryDescriptionSuffix}.`;
      } else if (path.includes('/shipping')) {
        description = `Find shipping estimates, prompt direct courier networks, and convenient localized delivery across ${currentCountry.name}.`;
      } else if (path.includes('/returns')) {
        description = `Read our terms for size corrections, fitting alterations, and manufacturing defect policies${countryDescriptionSuffix}.`;
      } else if (path.includes('/blog')) {
        description = `Expert advice and detailed logbooks on uniform fabrics, embroidery quality parameters, and factory procurement${countryDescriptionSuffix}.`;
      } else if (path.includes('/faq')) {
        description = `Read answers about minimum order quantities (MOQs), fabric choices, corporate customization, and regional supply queries${countryDescriptionSuffix}.`;
      } else if (path.includes('/careers')) {
        description = `Join our production team. Inspect open sewing, embroidery machine operations, and quality inspection roles${countryDescriptionSuffix}.`;
      } else if (path.includes('/fabric-gallery') || path.includes('/textiles')) {
        description = `Browse and filter our quality school uniform and corporate apparel textile samples${countryDescriptionSuffix}. Inspect material specs.`;
      } else if (path.includes('/uniform-simulator')) {
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
          "name": `Uhuru Market Uniforms (${currentCountry.name})`,
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

      // 3. LocalBusiness Schema localized per country with precise coordinates & opening hours
      const businessSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `Uhuru Market Uniforms (${currentCountry.name})`,
        "image": "https://naisiaetextiles.com/logo.png",
        "telephone": currentCountry.phone,
        "email": currentCountry.email,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": currentCountry.address,
          "addressLocality": currentCountry.city,
          "addressCountry": currentCountry.code
        },
        "priceRange": "$$",
        "hasMap": "https://www.google.com/maps/place/UHURU+MARKET+UNIFORMS/@-1.294565,36.8611397,15z/data=!4m10!1m2!2m1!1suhuru+market+uniforms!3m6!1s0x182f114397c34eb3:0x60f4dee669a3f796!8m2!3d-1.294565!4d36.8611397!15sChV1aHVydSBtYXJrZXQgdW5pZm9ybXNaFyIVdWh1cnUgbWFya2V0IHVuaWZvcm1zkgENdW5pZm9ybV9zdG9yZZoBRENpOURRVWxSUVVOdlpFTm9kSGxqUmpsdlQyMXpNRTFJUWtaaVZFWXdaRlpTYjFKRWJFaFZXR00wVGxaR1ZGa3hSUkFC4AEA-gEECAAQMQ!16s%2Fg%2F11z6sydbxv",
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": currentCountry.latitude,
          "longitude": currentCountry.longitude
        },
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
          ],
          "opens": "08:00",
          "closes": "18:00"
        }
      };
      schemasList.push(businessSchema);

      // 4. Explicit Organization Schema (ClothingStore) requested for Entity footprint
      const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "ClothingStore",
        "name": "UHURU MARKET UNIFORMS",
        "url": "https://naisiaetextiles.com/",
        "logo": "https://naisiaetextiles.com/logo.png",
        "hasMap": "https://www.google.com/maps/place/UHURU+MARKET+UNIFORMS/@-1.294565,36.8611397,15z/data=!4m10!1m2!2m1!1suhuru+market+uniforms!3m6!1s0x182f114397c34eb3:0x60f4dee669a3f796!8m2!3d-1.294565!4d36.8611397!15sChV1aHVydSBtYXJrZXQgdW5pZm9ybXNaFyIVdWh1cnUgbWFya2V0IHVuaWZvcm1zkgENdW5pZm9ybV9zdG9yZZoBRENpOURRVWxSUVVOdlpFTm9kSGxqUmpsdlQyMXpNRTFJUWtaaVZFWXdaRlpTYjFKRWJFaFZXR00wVGxaR1ZGa3hSUkFC4AEA-gEECAAQMQ!16s%2Fg%2F11z6sydbxv",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Uhuru Market, Jogoo Road",
          "addressLocality": "Nairobi",
          "addressCountry": "KE"
        },
        "sameAs": [
          "https://www.google.com/maps/place/UHURU+MARKET+UNIFORMS/@-1.294565,36.8611397,15z/data=!4m10!1m2!2m1!1suhuru+market+uniforms!3m6!1s0x182f114397c34eb3:0x60f4dee669a3f796!8m2!3d-1.294565!4d36.8611397!15sChV1aHVydSBtYXJrZXQgdW5pZm9ybXNaFyIVdWh1cnUgbWFya2V0IHVuaWZvcm1zkgENdW5pZm9ybV9zdG9yZZoBRENpOURRVWxSUVVOdlpFTm9kSGxqUmpsdlQyMXpNRTFJUWtaaVZFWXdaRlpTYjFKRWJFaFZXR00wVGxaR1ZGa3hSUkFC4AEA-gEECAAQMQ!16s%2Fg%2F11z6sydbxv",
          "https://www.facebook.com/naisiaetextiles",
          "https://www.instagram.com/nice_naadokila"
        ]
      };
      schemasList.push(organizationSchema);

      const newScript = document.createElement('script');
      newScript.id = schemaScriptId;
      newScript.type = 'application/ld+json';
      newScript.innerHTML = JSON.stringify(schemasList);
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
        { hreflang: 'x-default', url: `https://naisiaetextiles.com${cleanSubpath}` },
        { hreflang: 'en-ke', url: `https://naisiaetextiles.com${cleanSubpath}` },
        { hreflang: 'en-tz', url: `https://naisiaetextiles.com/tanzania${cleanSubpath}` },
        { hreflang: 'en-ug', url: `https://naisiaetextiles.com/uganda${cleanSubpath}` },
        { hreflang: 'fr-cd', url: `https://naisiaetextiles.com/dr-congo${cleanSubpath}` }
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

function ReviewRedirect() {
  useEffect(() => {
    window.location.replace("https://g.page/r/CZb3o2nm3vRgEBM/review");
  }, []);
  return (
    <div className="min-h-screen bg-[#04023D] flex flex-col items-center justify-center text-white p-6 font-sans">
      <div className="text-center max-w-sm space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#FA9411]/10 border border-[#FA9411]/30 flex items-center justify-center text-[#FA9411] mx-auto animate-spin">
          <span className="text-2xl">⭐</span>
        </div>
        <h2 className="text-xl font-black uppercase tracking-wider">Redirecting to Google Reviews...</h2>
        <p className="text-xs text-white/50 leading-relaxed">Please wait while we connect you to our official Google My Business review portal.</p>
      </div>
    </div>
  );
}

function AppContent({ isAdmin, loading }: any) {
  const { isCartOpen, setIsCartOpen, isWishlistOpen, setIsWishlistOpen } = useCart();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/login') || location.pathname.startsWith('/review');

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
            <Route path="/review" element={<ReviewRedirect />} />
            
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
                <Route path="review" element={<ReviewRedirect />} />
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
        {!isAdminRoute && <FloatingChat />}
        <GlobalToast />
      </Suspense>
    </InactivityHandler>
  );
}
