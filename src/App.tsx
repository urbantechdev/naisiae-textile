/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState, lazy, Suspense } from 'react';
import { auth, db } from './services/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

// Code-split heavy pages to optimize initial bundle payload and improve Core Web Vitals
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

import { ErrorBoundary } from './components/ErrorBoundary';
import { InactivityHandler } from './components/InactivityHandler';
import { CartProvider, useCart } from './context/CartContext';

const CartModal = lazy(() => import('./components/CartModal').then(module => ({ default: module.CartModal })));
const WishlistModal = lazy(() => import('./components/WishlistModal').then(module => ({ default: module.WishlistModal })));
const QuoteModal = lazy(() => import('./components/QuoteModal').then(module => ({ default: module.QuoteModal })));
const CatalogueModal = lazy(() => import('./components/CatalogueModal').then(module => ({ default: module.CatalogueModal })));
const FloatingChat = lazy(() => import('./components/FloatingChat').then(module => ({ default: module.FloatingChat })));
const GlobalToast = lazy(() => import('./components/GlobalToast').then(module => ({ default: module.GlobalToast })));

// Dynamic SEO Engine to enforce branding permanently across all routes
function DynamicSEOEngine() {
  const location = useLocation();

  useEffect(() => {
    const updateSEO = () => {
      const path = location.pathname;
      let title = "UHURU MARKET UNIFORMS & Institutional Apparel | Naisiae Textiles Nairobi";
      let description = "Official Uhuru Market Uniforms by Naisiae Textiles. Premium school, corporate & medical uniform manufacturing in Nairobi, Kenya at direct factory rates.";

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
        description = "Learn about Naisiae Textiles' premium uniform craftsmanship, raw material grading & community-driven production at Uhuru Market, Nairobi.";
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
      } else if (path === '/blog' || path.startsWith('/blog')) {
        title = "Industry Guides & Sourcing Logbook | UHURU MARKET UNIFORMS";
        description = "Expert advice and detailed logbooks on uniform fabrics, embroidery quality parameters, and direct-factory school uniform procurement in Kenya.";
      } else if (path === '/faq' || path.startsWith('/faq')) {
        title = "Frequently Asked Questions & Support | UHURU MARKET UNIFORMS";
        description = "Read answers about minimum order quantities (MOQs), fabric choices, corporate customization, and tender queries for Uhuru Market Uniforms.";
      } else if (path === '/careers' || path.startsWith('/careers')) {
        title = "Careers & Tailoring Opportunities | UHURU MARKET UNIFORMS";
        description = "Join our production team in Nairobi. Inspect open sewing, embroidery machine operations, and quality inspection roles at Naisiae Textiles.";
      }

      // Force apply changes securely to the DOM
      document.title = title;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      }

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
          "name": "Uhuru Market Uniforms (Naisiae Textiles)",
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

      // 3. Service Schema for /services
      if (path === '/services' || path === '/services/') {
        const serviceSchema = {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Uniform Manufacturing & Industrial Branding",
          "serviceType": "Apparel Sourcing",
          "provider": {
            "@type": "LocalBusiness",
            "name": "Uhuru Market Uniforms (Naisiae Textiles)",
            "image": "https://naisiaetextiles.com/favicon.png",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Uhuru Market, Jogoo Road",
              "addressLocality": "Nairobi",
              "addressCountry": "KE"
            },
            "telephone": "+254792021795"
          },
          "areaServed": "Kenya",
          "description": "Premium industrial embroidery, high-speed custom stitching, and pattern grading for schools, healthcare centers, and security agencies."
        };
        schemasList.push(serviceSchema);
      }

      // 4. BlogPosting Schema for /blog posts
      if (path === '/blog' || path.startsWith('/blog')) {
        const urlParams = new URLSearchParams(window.location.search);
        const postParam = urlParams.get('post');
        const blogTitle = postParam ? `${postParam.replace(/-/g, ' ').toUpperCase()} | Uniform Blog` : title;
        
        const blogSchema = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonicalUrl
          },
          "headline": blogTitle,
          "description": description,
          "image": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=600&auto=format&fit=crop",
          "author": {
            "@type": "Organization",
            "name": "Naisiae Textiles Development Team"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Uhuru Market Uniforms (Naisiae Textiles)",
            "logo": {
              "@type": "ImageObject",
              "url": "https://naisiaetextiles.com/logo.png"
            }
          },
          "datePublished": "2026-06-07T00:00:00Z"
        };
        schemasList.push(blogSchema);
      }

      // 5. FAQPage Schema for /faq
      if (path === '/faq' || path === '/faq/') {
        const faqSchema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is your Minimum Order Quantity (MOQ) for bulk orders?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our standard minimum order quantity for custom institutional uniforms, hospital scrubs, and corporate wear is 50 units. This allows us to offer direct-factory rates."
              }
            },
            {
              "@type": "Question",
              "name": "Where is Naisiae Textiles located within Uhuru Market?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We are proudly located at the heart of Uhuru Market along Jogoo Road, Nairobi, Kenya. Visitors are welcome for fittings."
              }
            },
            {
              "@type": "Question",
              "name": "Do you offer custom school embroidery?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, we specialize in high-density computerized embroidery and active sportswear screen printing."
              }
            }
          ]
        };
        schemasList.push(faqSchema);
      }

      // 6. JobPosting Schema for /careers
      if (path === '/careers' || path === '/careers/') {
        const jobSchema = {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          "title": "Industrial Tailoring Specialist (Lead Cutter)",
          "description": "Draft master patterns, optimize heavy fabric cutting blocks, and supervise assembly lines at Uhuru Market production floor.",
          "datePosted": "2026-06-07",
          "hiringOrganization": {
            "@type": "Organization",
            "name": "Naisiae Textiles",
            "sameAs": "https://naisiaetextiles.com/"
          },
          "jobLocation": {
            "@type": "Place",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Uhuru Market, Jogoo Road",
              "addressLocality": "Nairobi",
              "addressCountry": "KE"
            }
          },
          "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": "KES",
            "value": {
              "@type": "QuantitativeValue",
              "minValue": 35000,
              "maxValue": 45000,
              "unitText": "MONTH"
            }
          },
          "employmentType": "FULL_TIME"
        };
        schemasList.push(jobSchema);
      }

      const newScript = document.createElement('script');
      newScript.id = schemaScriptId;
      newScript.type = 'application/ld+json';
      newScript.innerHTML = JSON.stringify(schemasList.length === 1 ? schemasList[0] : schemasList);
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
        <CartProvider>
          <DynamicSEOEngine />
          <AppContent isAdmin={isAdmin} loading={loading} />
        </CartProvider>
      </Router>
    </ErrorBoundary>
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
          
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/careers" element={<CareersPage />} />
          
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/admin/*" 
            element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
