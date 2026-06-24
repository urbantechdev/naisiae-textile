import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface SegmentMap {
  [key: string]: string;
}

const segmentToTitle: SegmentMap = {
  '': 'Home',
  'about': 'About Us',
  'services': 'Industrial Services',
  'products': 'Uniform Catalog',
  'categories': 'Product Sectors',
  'portfolio': 'Sourcing Portfolio',
  'wholesale': 'Bulk Tenders',
  'contact': 'Production Office',
  'fabric-gallery': 'Textile Gallery',
  'faq': 'Help & FAQs',
  'blog': 'Logbook & Textiles Guide',
  'careers': 'Careers & Tailoring',
  'privacy': 'Privacy Standards',
  'terms': 'Terms of Assembly',
  'shipping': 'Shipping & Freight',
  'returns': 'Exchange & Returns'
};

const humanizeSegment = (segment: string): string => {
  if (!segment) return '';
  const decoded = decodeURIComponent(segment);
  return decoded
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function Breadcrumb() {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Split the path into segments and remove empty elements
  const rawSegments = pathname.split('/').filter(Boolean);
  
  // Build items list
  const breadcrumbItems = [
    {
      name: 'Home',
      url: 'https://naisiaetextiles.com/',
      path: '/'
    }
  ];

  let currentPath = '';
  rawSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    const displayName = segmentToTitle[segment.toLowerCase()] || humanizeSegment(segment);
    breadcrumbItems.push({
      name: displayName,
      url: `https://naisiaetextiles.com${currentPath}`,
      path: currentPath
    });
  });

  // Check if we have sub-parameters for pages like blog posts (?post=...)
  const queryParams = new URLSearchParams(location.search);
  const postParam = queryParams.get('post');
  if (pathname.includes('/blog') && postParam) {
    const postTitle = humanizeSegment(postParam);
    breadcrumbItems.push({
      name: postTitle,
      url: `https://naisiaetextiles.com/blog/?post=${postParam}`,
      path: `/blog/?post=${postParam}`
    });
  }

  // Inject BreadcrumbList JSON-LD Schema on render
  useEffect(() => {
    // Generate BreadcrumbList Schema structure
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems.map((item, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": item.name,
        "item": item.url
      }))
    };

    // Find or create the script tag in document.head
    const scriptId = "dynamic-breadcrumb-jsonld";
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = scriptId;
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }
    
    scriptTag.text = JSON.stringify(schema, null, 2);

    return () => {
      // Keep state neat
      const existing = document.getElementById(scriptId);
      if (existing) {
        existing.remove();
      }
    };
  }, [location.pathname, location.search]);

  // If we are on the Home page, don't show the visual bar but keep schema injected
  if (pathname === '/') {
    return null;
  }

  return (
    <nav 
      id="site-navigation-breadcrumb" 
      aria-label="Breadcrumb" 
      className="bg-[#111827]/40 border-b border-white/5 py-4 w-full"
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center space-x-2 text-xs font-mono tracking-wider uppercase text-white/50">
        <Link 
          to="/" 
          id="breadcrumb-home-link"
          className="flex items-center gap-1 hover:text-[#C8961A] transition-colors py-0.5"
        >
          <Home size={14} className="shrink-0" />
          <span>Home</span>
        </Link>
        
        {breadcrumbItems.slice(1).map((item, index) => {
          const isLast = index === breadcrumbItems.length - 2; // -2 because slice starting at index 1 shifts the array by 1
          
          return (
            <React.Fragment key={item.path}>
              <ChevronRight size={12} className="text-white/20 shrink-0" />
              {isLast ? (
                <span id={`breadcrumb-leaf-${index}`} className="text-[#C8961A] font-black truncate max-w-[200px] md:max-w-xs">
                  {item.name}
                </span>
              ) : (
                <Link 
                  to={item.path} 
                  id={`breadcrumb-link-${index}`}
                  className="hover:text-[#C8961A] transition-colors truncate max-w-[200px]"
                >
                  {item.name}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
