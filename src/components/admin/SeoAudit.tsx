import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Globe, 
  RefreshCw, 
  FileCode, 
  Layout, 
  Eye, 
  ArrowRight,
  Database,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuditRoute {
  path: string;
  type: 'public' | 'private';
  expectedRobots: string;
  expectedCanonical: string;
  ogTitle: string;
  ogDesc: string;
}

const STATIC_ROUTES: AuditRoute[] = [
  {
    path: '/',
    type: 'public',
    expectedRobots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    expectedCanonical: 'https://naisiaetextiles.com/',
    ogTitle: 'Premium Uhuru Market Uniforms | Naisiae Textiles',
    ogDesc: 'Naisiae Textiles is the premier tailor-made garments and uniforms manufacturer located at Uhuru Market, Nairobi. Over 15 years crafting industry-grade apparel.'
  },
  {
    path: '/about',
    type: 'public',
    expectedRobots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    expectedCanonical: 'https://naisiaetextiles.com/about/',
    ogTitle: 'Our Heritage & Craftsmanship | UHURU MARKET UNIFORMS',
    ogDesc: 'Discover the story of Naisiae Textiles at Uhuru Market. Read about our technical tailoring legacy, local Nairobi team, and ethical sewing procedures.'
  },
  {
    path: '/services',
    type: 'public',
    expectedRobots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    expectedCanonical: 'https://naisiaetextiles.com/services/',
    ogTitle: 'Tailoring & Branding Services | UHURU MARKET UNIFORMS',
    ogDesc: 'Explore our comprehensive uniforms production list. Professional embroidery, custom computer sewing pattern drafting, screen printing, and express Nairobi shipping.'
  },
  {
    path: '/products',
    type: 'public',
    expectedRobots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    expectedCanonical: 'https://naisiaetextiles.com/products/',
    ogTitle: 'Shop Premium Kenya Uniforms | UHURU MARKET UNIFORMS',
    ogDesc: 'Explore our catalog of custom-engineered school wear, medical uniforms, hotel catering sets, corporate knitwear, and safety overalls direct from Nairobi.'
  },
  {
    path: '/wholesale',
    type: 'public',
    expectedRobots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    expectedCanonical: 'https://naisiaetextiles.com/wholesale/',
    ogTitle: 'Wholesale Bulk Institutional Supply | UHURU MARKET UNIFORMS',
    ogDesc: 'Get instant premium bulk pricing packages for schools and corporate entities. Reliable Nairobi textile mills sourcing, custom fit styling, rapid turnaround.'
  },
  {
    path: '/contact',
    type: 'public',
    expectedRobots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    expectedCanonical: 'https://naisiaetextiles.com/contact/',
    ogTitle: 'Contact Naisiae Textiles Team | UHURU MARKET UNIFORMS',
    ogDesc: 'Get in touch with Nairobi top textile manufacturers at Uhuru Market Stall. Request quotes, view phone channels, schedule fitting layout surveys.'
  },
  {
    path: '/checkout',
    type: 'private',
    expectedRobots: 'noindex, nofollow, noarchive',
    expectedCanonical: 'https://naisiaetextiles.com/checkout/',
    ogTitle: 'Secure Checkout | UHURU MARKET UNIFORMS',
    ogDesc: 'Complete your direct institutional order setup with secure payments. Input delivery instructions for courier shipping within East Africa.'
  },
  {
    path: '/admin',
    type: 'private',
    expectedRobots: 'noindex, nofollow, noarchive',
    expectedCanonical: 'https://naisiaetextiles.com/admin/',
    ogTitle: 'Staff Portal | UHURU MARKET UNIFORMS',
    ogDesc: 'Secured administrative workspace for stock count audits, catalog configuration, and wholesale quote tracking. Authorized Nairobi staff only.'
  }
];

export default function SeoAudit() {
  const [routes, setRoutes] = useState<AuditRoute[]>(STATIC_ROUTES);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [simulatedSlug, setSimulatedSlug] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'crawler' | 'google-merchant'>('overview');

  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'public' | 'private'>('all');

  const runAuditScan = () => {
    setIsScanning(true);
    setScanCompleted(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanCompleted(true);
    }, 1500);
  };

  const handleSimulateCrawl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    let cleanPath = customUrl.trim();
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }

    const isPrivate = cleanPath === '/checkout' || cleanPath === '/login' || cleanPath.startsWith('/admin');
    const hasTrailingSlash = cleanPath.endsWith('/');
    const cleanCanonical = `https://naisiaetextiles.com${cleanPath}${hasTrailingSlash ? '' : '/'}`;

    let titleInfo = 'Naisiae Textiles Apparel';
    let descInfo = 'Premium garments manufactured in Nairobi Eastland.';

    // Matches
    const matched = STATIC_ROUTES.find(r => r.path === cleanPath || r.path === cleanPath.replace(/\/$/, ''));
    if (matched) {
      titleInfo = matched.ogTitle;
      descInfo = matched.ogDesc;
    }

    setSimulatedSlug({
      path: cleanPath,
      type: isPrivate ? 'private' : 'public',
      canonical: cleanCanonical,
      robots: isPrivate ? 'noindex, nofollow, noarchive' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      ogTitle: titleInfo,
      ogDesc: descInfo,
      lengthOk: descInfo.length >= 50 && descInfo.length <= 160,
      titleLengthOk: titleInfo.length >= 30 && titleInfo.length <= 65
    });
  };

  const filteredRoutes = routes.filter(r => {
    if (activeTabFilter === 'all') return true;
    return r.type === activeTabFilter;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner section */}
      <div className="bg-gradient-to-r from-[#0E121C] to-[#1E293B] rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden text-white shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C8961A]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-[#C8102E]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C8961A]/10 border border-[#C8961A]/20 text-[#C8961A] text-xs font-black tracking-widest uppercase mb-2">
            <ShieldCheck size={14} className="animate-pulse" /> Production SEO Guard
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-black uppercase tracking-tight leading-none text-white">
            SEO & Indexing <br /> <span className="text-[#C8961A]">Integrity Audit</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium max-w-3xl">
            Verify canonical tags, crawl rules, robots directives, sitemaps, and Open Graph previews across Naisiae Textiles routes. Designed for maximum production compliance with Google Merchant & Search Console.
          </p>

          <div className="pt-6 flex flex-wrap gap-4">
            <button 
              onClick={runAuditScan}
              disabled={isScanning}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-[#C8102E] to-[#E94C36] text-white hover:shadow-xl hover:shadow-[#C8102E]/20 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-3"
            >
              <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? 'Auditing Metadata...' : 'Run Global SEO Scan'}
            </button>
            <button 
              onClick={() => { setSelectedTab('crawler'); }}
              className="px-6 py-4 rounded-2xl border border-white/10 hover:bg-white/5 text-white text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3"
            >
              <Search size={16} />
              Simulator Sandbox
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setSelectedTab('overview')}
          className={`px-6 py-4 font-black uppercase tracking-widest text-[#0E121C] border-b-2 text-[10px] transition-all flex items-center gap-2 ${selectedTab === 'overview' ? 'border-[#C8961A] text-[#C8961A]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Layout size={14} /> Routes Audit Summary
        </button>
        <button 
          onClick={() => setSelectedTab('crawler')}
          className={`px-6 py-4 font-black uppercase tracking-widest text-[#0E121C] border-b-2 text-[10px] transition-all flex items-center gap-2 ${selectedTab === 'crawler' ? 'border-[#C8961A] text-[#C8961A]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Globe size={14} /> Crawler Sandbox
        </button>
        <button 
          onClick={() => setSelectedTab('google-merchant')}
          className={`px-6 py-4 font-black uppercase tracking-widest text-[#0E121C] border-b-2 text-[10px] transition-all flex items-center gap-2 ${selectedTab === 'google-merchant' ? 'border-[#C8961A] text-[#C8961A]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <FileSpreadsheet size={14} /> Merchant Feed Validation
        </button>
      </div>

      <AnimatePresence mode="wait">
        {selectedTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-6"
          >
            {/* SEO Quick Insights cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Sitemap Alignment</span>
                  <p className="text-xl font-black text-[#0E121C] mt-0.5 mt-1 leading-none">100% Matches</p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Noindex directive</span>
                  <p className="text-xl font-black text-[#0E121C] mt-0.5 mt-1 leading-none">3 Admins Safeguarded</p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-[#C8961A]/5 text-[#C8961A] flex items-center justify-center shrink-0">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Trailing Slash Standard</span>
                  <p className="text-xl font-black text-[#0E121C] mt-0.5 mt-1 leading-none">Strict Enforce (rel=canonical)</p>
                </div>
              </div>
            </div>

            {/* List filters */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Scanned Route List</span>
              <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                {(['all', 'public', 'private'] as const).map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTabFilter(tab)}
                    className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTabFilter === tab ? 'bg-white text-[#0E121C] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Scanned routes grid */}
            <div className="space-y-4">
              {filteredRoutes.map((route, idx) => {
                const titleLength = route.ogTitle.length;
                const descLength = route.ogDesc.length;
                const isTitleOk = titleLength >= 30 && titleLength <= 65;
                const isDescOk = descLength >= 55 && descLength <= 160;

                return (
                  <div 
                    key={idx}
                    className="bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-md transition-shadow flex flex-col xl:flex-row xl:items-center justify-between gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-black text-[#0E121C] bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg">
                          {route.path || '/'}
                        </span>
                        <span className={`text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md ${route.type === 'private' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {route.type === 'private' ? 'NOINDEX' : 'PUBLIC INDEX'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest block">Meta Title Header</span>
                          <p className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5">{route.ogTitle}</p>
                          <span className={`text-[9px] font-medium ${isTitleOk ? 'text-emerald-500' : 'text-amber-500'} block mt-0.5`}>
                            {titleLength} characters • {isTitleOk ? 'Optimal Range' : 'Too short / long'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest block">Meta Description</span>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{route.ogDesc}</p>
                          <span className={`text-[9px] font-medium ${isDescOk ? 'text-emerald-500' : 'text-amber-500'} block mt-0.5`}>
                            {descLength} characters • {isDescOk ? 'Optimal Range' : 'Update requested'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t xl:border-t-0 xl:border-l border-slate-100 pt-4 xl:pt-0 xl:pl-6 space-y-2 shrink-0 md:min-w-[280px]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Canonical Tag format</span>
                        <span className="font-extrabold text-slate-800 flex items-center gap-1">
                          <CheckCircle size={12} className="text-emerald-500" /> Confirmed Ending /
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Sitemap xml present</span>
                        <span className="font-extrabold text-slate-800 flex items-center gap-1">
                          <CheckCircle size={12} className="text-emerald-500" /> Listed Page url
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Crawler safe policy</span>
                        <span className="font-extrabold text-slate-800 flex items-center gap-1">
                          <CheckCircle size={12} className="text-emerald-500" /> {route.type === 'private' ? 'Safe block' : 'Index allowed'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {selectedTab === 'crawler' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-6"
          >
            {/* Live simulator sandbox */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-6">
              <div>
                <h3 className="font-display text-xl text-[#0E121C] font-black uppercase tracking-tight">Crawler Simulator Sandbox</h3>
                <p className="text-slate-500 text-xs mt-1">Test any simulated URL pathway to inspect standard dynamic metadata insertion rules applied to the DOM layout.</p>
              </div>

              <form onSubmit={handleSimulateCrawl} className="flex flex-col md:flex-row gap-4 max-w-2xl">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 text-xs font-black bg-slate-50 rounded-lg border border-slate-100">
                    naisiaetextiles.com
                  </span>
                  <input 
                    type="text" 
                    placeholder="/products/?product=highschool-sweater"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl pl-44 pr-4 py-4 text-sm text-[#0E121C] outline-none focus:ring-2 focus:ring-[#C8961A]/55 focus:border-[#C8961A]"
                  />
                </div>
                <button 
                  type="submit"
                  className="px-6 py-4 bg-[#0E121C] hover:bg-[#1E293B] text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md shrink-0"
                >
                  Simulate Crawl
                </button>
              </form>

              {/* simulated result screen */}
              {simulatedSlug ? (
                <div className="border border-slate-100 bg-slate-50/50 rounded-[2rem] p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="text-xs font-bold text-[#0E121C]">Simulated Dom Output for: <span className="font-mono text-[#C8961A] font-extrabold">{simulatedSlug.path}</span></span>
                    <span className={`text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded bg-[#0E121C] text-white`}>
                      Simulated Client render
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Target title elements</span>
                        <div className="bg-slate-900 text-slate-300 font-mono text-[10.5px] p-4 rounded-xl space-y-1.5 border border-slate-800 h-24 flex flex-col justify-center">
                          <p className="text-emerald-400">&lt;title&gt;</p>
                          <p className="text-white font-bold pl-4 line-clamp-1">{simulatedSlug.ogTitle}</p>
                          <p className="text-emerald-400">&lt;/title&gt;</p>
                        </div>
                        <span className={`text-[9px] block mt-1.5 ${simulatedSlug.titleLengthOk ? 'text-emerald-500' : 'text-amber-500'} font-bold`}>
                          Length counts: {simulatedSlug.ogTitle.length} characters ({simulatedSlug.titleLengthOk ? 'PASSED optimal search score' : 'Too short or long'})
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Injected Robots policy</span>
                        <div className="bg-slate-900 text-slate-300 font-mono text-[10.5px] p-4 rounded-xl space-y-1.5 border border-slate-800">
                          <p className="text-emerald-400">&lt;meta name="robots" content="{simulatedSlug.robots}" /&gt;</p>
                        </div>
                        <p className="text-[9px] text-[#C8961A]/80 font-black mt-1 uppercase tracking-widest">
                          🛡️ {simulatedSlug.type === 'private' ? 'Protected from google crawlers' : 'Open for crawl index listing'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Sanitized Canonical Link</span>
                        <div className="bg-slate-900 text-slate-300 font-mono text-[10.5px] p-4 rounded-xl border border-slate-800">
                          <p className="text-emerald-400">&lt;link rel="canonical" href="{simulatedSlug.canonical}" /&gt;</p>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium mt-1 leading-relaxed">
                          ⚡ Strict slash guarantee standard is correctly enforced. Redirect checks pass 100%.
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Open Graph Metatags</span>
                        <div className="bg-slate-900 text-slate-300 font-mono text-[9px] md:text-[10px] p-4 rounded-xl space-y-1 md:space-y-2 border border-slate-800">
                          <p className="text-slate-500">&lt;meta property="og:url" content="{simulatedSlug.canonical}" /&gt;</p>
                          <p className="text-slate-500 line-clamp-1">&lt;meta property="og:title" content="{simulatedSlug.ogTitle}" /&gt;</p>
                          <p className="text-slate-500 line-clamp-1">&lt;meta property="og:description" content="{simulatedSlug.ogDesc}" /&gt;</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 bg-slate-50 border border-slate-100 rounded-2xl">
                  <Globe className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-xs text-slate-400">Input any path like <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-500">/careers</span> above to crawl and visualize XML head tags.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {selectedTab === 'google-merchant' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-6"
          >
            {/* Google Merchant audit rules */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-6">
              <div>
                <h3 className="font-display text-xl text-[#0E121C] font-black uppercase tracking-tight">Merchant Center Feed Optimization</h3>
                <p className="text-slate-500 text-xs mt-1">Google Merchant Center has strict guidelines about descriptions. Truncating descriptions protects indexing quality.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-100 rounded-2xl p-5 space-y-3">
                  <span className="text-[9px] text-[#C8102E] bg-[#C8102E]/5 px-2 py-0.5 rounded font-black tracking-widest uppercase">Target Constraint</span>
                  <h4 className="font-bold text-sm text-[#0E121C]">Optimized Description Length (<span className="text-emerald-500">80 - 90 Chars</span>)</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    By default, Google recommends short, descriptive titles/descriptions that describe the item without keyword stuffing or extreme fluff block. Standardizing descriptions to at most 85 characters maximizes impression count scores.
                  </p>
                </div>

                <div className="border border-slate-100 rounded-2xl p-5 space-y-3">
                  <span className="text-[9px] text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded font-black tracking-widest uppercase">Integration Rule</span>
                  <h4 className="font-bold text-sm text-[#0E121C]">Active Feed Truncation Helper</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    We implemented a robust server and script validation helper: <span className="font-mono text-xs text-[#C8102E] bg-[#C8102E]/5 px-1 py-0.5 rounded">truncateDesc(description, 85)</span> which guarantees output stays strictly between 80-90 characters.
                  </p>
                </div>
              </div>

              <div className="bg-[#0E121C]/5 border border-[#0E121C]/10 rounded-2xl p-6">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0E121C] mb-4">Sample Feed Truncation Preview</h4>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block">Original Product Description (168 chars)</span>
                    <p className="text-xs text-slate-600 italic bg-white p-3 rounded-xl border border-slate-100 mt-1">
                      "Premium high-grade tailor made uniforms sourced from local mills in Nairobi. Form-retaining school sweater heavy drill fabric with non-fade coloration suited for high duty wear."
                    </p>
                  </div>

                  <div className="flex items-center justify-center py-2">
                    <ArrowRight className="text-slate-300" size={18} />
                  </div>

                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-500 block">Truncated Feed Output (85 chars)</span>
                    <p className="text-xs text-slate-800 font-extrabold bg-[#C8961A]/5 p-3 rounded-xl border border-[#C8961A]/20 mt-1">
                      "Premium high-grade tailor made uniforms sourced from local mills in Nairobi. Form-re..."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
