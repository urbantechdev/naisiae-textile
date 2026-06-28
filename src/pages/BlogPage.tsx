import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { Calendar, User, ArrowLeft, ArrowRight, Share2, BookOpen, Clock } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useCart } from '../context/CartContext';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  imageUrl: string;
}

const DEFAULT_POSTS: BlogPost[] = [
  {
    id: 'school-fabric-guide',
    slug: 'school-fabric-guide',
    title: "The Ultimate Guide to School Uniform Fabric Quality & Durability",
    summary: "How school boards can choose Polyester-Cotton PV blends vs drill cotton for maximum daily comfort, colorfastness, and low abrasion pillings.",
    content: `When school boards and purchasing committees are tasked with sourcing uniforms, the most critical decision is not the color palette—it is the raw textile composition. In East Africa's active schooling climate, uniform friction is extremely high. 

### 1. Polyester-Cotton (PV) Blends
A standard 65% Polyester and 35% Cotton blend (commonly called PV) is the gold standard for school shirts, blouses, and light trousers. Polyester provides outstanding anti-wrinkle properties, keeps dye pigments locked to prevent wash-fading, and has very high tensile strength. Cotton ensures airflow and sweat absorption, which is vital for long classroom sessions.

### 2. Heavy Cotton Drills
Trousers, tunics, and blazers require a heavier weave to survive playground friction. Twill and drill fabrics use diagonal rib patterns that naturally diffuse abrasion and tearing forces. Sourcing combed cotton ensures that short, breakable fibers are combed away prior to spinning, dramatically reducing the fuzzy "pilling" balls that occur after ten washes.

### 3. Sizing Calibration for Growth
A common mistake is ordering exact form-fitting garments. High-quality school garments are drafted with double-folded hems and standard growth allowances in torso length, allowing simple, local tailor releases that extend the lifespan of a single blazer or trouser set from one academic year to two or three.`,
    category: "Materials & Quality",
    author: "Naisiae Textiles Sourcing Team",
    date: "2026-06-05",
    readTime: "5 Min Read",
    imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 'computerized-embroidery',
    slug: 'computerized-embroidery',
    title: "Computerized Embroidery vs Screen Printing: Which Branding Fits Your Uniforms?",
    summary: "An industrial cost-benefit analysis of logo branding types for primary school blazers, medical scrubs, and heavy security outerwear.",
    content: `Branding determines how an institution is recognized. However, choosing the incorrect printing or stitch type can lead to faded logos, cracked badges, or unraveled emblem threads. Let's inspect the two premium options we offer at Naisiae Textiles.

### Computerized Embroidery
Embroidery is the practice of stitching logos directly using high-speed industrial thread machinery. We use premium viscose-rayon and polyester yarns that withstand chlorine washing and intense commercial ironing.
*   **Best For:** Premium school blazers, doctor and nurse scrubs, corporate shirts, and security chest badges.
*   **Lifespan:** Outlasts the garment itself. The stitching is embedded right into the weave.
*   **Vibe:** Sophisticated, dimensional, and deeply authoritative.

### Industrial Screen Printing
For thin t-shirts, active sportswear games kits, and promotional branded giveaways, screen printing uses plastisol or water-based inks pressed through mesh stencils.
*   **Best For:** Sports games kits, light athletic wear, and promotional bulk branding.
*   **Lifespan:** High-quality plastisol ink lasts 50+ wash cycles before developing micro-cracks.
*   **Vibe:** Modern, flat, highly precise vector shapes with vibrant pigments.

At our Uhuru Market production floor, we help entities select the correct mix of embroidery and printing depending on material weight and washing frequencies.`,
    category: "Branding",
    author: "Branding Dept Lead",
    date: "2026-06-03",
    readTime: "4 Min Read",
    imageUrl: "https://images.unsplash.com/photo-1563170351-be82c888a44b?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 'wholesale-sourcing-guide',
    slug: 'wholesale-sourcing-guide',
    title: "Simplifying Institutional Procurement: Direct Factory Sourcing Tips",
    summary: "How Kenyan schools and healthcare institutions can bypass middlemen and source bulk uniforms directly from Uhuru Market Nairobi.",
    content: `For decades, intermediate retail middlemen have inflated uniform costs for schools and clinics by up to 100%. By implementing direct factory sourcing contracts, organizations can save significant capital and enjoy full design customization. Here are several strategic tips:

### 1. Establish Solid Material Specifications Early
Do not let suppliers decide fabric density on the fly. Demand explicit parameters such as "65% PV combed cotton blends, 220 GSM drill, or pre-shrunk anti-pill finish." These benchmarks hold tailors accountable and guarantee uniform consistency across years.

### 2. Request a Gold Sample Prior to Main Production
Never authorize a bulk production run of 1,000 blazers based on a small physical fabric swatch. Insist on a complete, fully embroidered and sized "Gold Sample." Use this physical sample as the formal quality benchmark to check during the final shipping inspection.

### 3. Schedule Production Non-Peak Months
August, December, and January are peak school-entry months when every tailoring floor in Nairobi is heavily congested. To secure maximum discounts and guarantee instant shipping SLA, smart boards draft and order uniforms during secondary school term gaps in March or October.`,
    category: "Procurement Guide",
    author: "Direct Procurement Specialist",
    date: "2026-06-01",
    readTime: "6 Min Read",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600&auto=format&fit=crop"
  }
];

export default function BlogPage() {
  const { cartCount, wishlistCount, setIsCartOpen, setIsWishlistOpen, isCartOpen, isWishlistOpen, setIsQuoteModalOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [posts, setPosts] = useState<BlogPost[]>(DEFAULT_POSTS);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Sync with router search params if user navigated to a specific blog /blog?post=slug
    const params = new URLSearchParams(window.location.search);
    const postParam = params.get('post');
    if (postParam) {
      setSelectedSlug(postParam);
    }
  }, []);

  useEffect(() => {
    // Listen to real-time blogs collection from firestore
    const unsubscribe = onSnapshot(collection(db, 'blogs'), 
      (snapshot) => {
        if (!snapshot.empty) {
          const items: BlogPost[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
              id: doc.id,
              slug: data.slug || doc.id,
              title: data.title || '',
              summary: data.summary || '',
              content: data.content || '',
              category: data.category || 'General',
              author: data.author || 'Naisiae Writer',
              date: data.date || '2026-06-07',
              readTime: data.readTime || '5 Min Read',
              imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=600&auto=format&fit=crop"
            });
          });
          setPosts(items);
        }
      },
      (error) => {
        console.warn("Using offline default blog post arrays:", error.message);
      }
    );
    return () => unsubscribe();
  }, []);

  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category)))];
  const filteredPosts = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory);

  const selectedPost = posts.find(p => p.slug === selectedSlug || p.id === selectedSlug);

  const handleShare = (post: BlogPost) => {
    const postUrl = `${window.location.origin}/blog?post=${post.slug}`;
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.summary,
        url: postUrl
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(postUrl);
      setToastMessage("Blog post link copied to clipboard!");
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div id="blog-root-container" className="min-h-screen bg-[#0E121C] text-white flex flex-col font-sans">
      <Navbar 
        wishlistCount={wishlistCount}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />
      <Breadcrumb />

      <AnimatePresence mode="wait">
        {selectedPost ? (
          /* SINGLE BLOG POST VIEW */
          <motion.article
            key="single-post"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="pt-36 pb-24 max-w-4xl mx-auto px-6 space-y-10 flex-1"
          >
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedSlug(null);
                window.history.pushState({}, '', '/blog');
              }}
              className="group flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-black uppercase tracking-widest bg-white/5 px-4 py-2 border border-white/5 hover:border-white/15 rounded-xl cursor-pointer"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Uniform Blogs
            </button>

            {/* Post Image & Header */}
            <div className="space-y-6">
              <div className="w-full aspect-[21/9] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                <img 
                  src={selectedPost.imageUrl} 
                  alt={selectedPost.title} 
                  className="w-full h-full object-cover object-top" 
                  width={800}
                  height={340}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-white/50 text-xs font-mono">
                <span className="bg-[#C8961A]/10 text-[#C8961A] border border-[#C8961A]/20 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest">
                  {selectedPost.category}
                </span>
                <span className="flex items-center gap-1.5"><Calendar size={12} className="text-[#C8102E]" /> {selectedPost.date}</span>
                <span className="flex items-center gap-1.5"><Clock size={12} className="text-[#C8961A]" /> {selectedPost.readTime}</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-black uppercase leading-tight md:leading-none tracking-tight text-white pr-6">
                {selectedPost.title}
              </h1>

              <div className="flex items-center justify-between border-y border-white/5 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 text-white/80 font-bold font-sans text-xs shrink-0">
                    N
                  </div>
                  <span className="text-xs font-semibold text-white/80">{selectedPost.author}</span>
                </div>
                <button
                  onClick={() => handleShare(selectedPost)}
                  className="flex items-center gap-2 text-white/60 hover:text-[#C8961A] text-xs font-mono bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/5 transition-all rounded-xl"
                >
                  <Share2 size={12} /> Share Article
                </button>
              </div>
            </div>

            {/* Article Content */}
            <div className="text-white/80 text-base md:text-lg font-light leading-relaxed prose prose-invert max-w-none text-left space-y-6">
              {selectedPost.content.split('\n\n').map((para, idx) => {
                if (para.startsWith('###')) {
                  return (
                    <h3 key={idx} className="text-lg md:text-xl font-black uppercase tracking-wider text-[#C8961A] pt-4">
                      {para.replace('###', '').trim()}
                    </h3>
                  );
                } else if (para.startsWith('*')) {
                  return (
                    <ul key={idx} className="list-disc list-inside pl-4 space-y-2 text-sm text-white/75">
                      {para.split('\n').map((li, liIdx) => (
                        <li key={liIdx}>{li.replace('*', '').trim()}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={idx} className="font-sans leading-relaxed whitespace-pre-wrap font-light">
                    {para}
                  </p>
                );
              })}
            </div>
          </motion.article>
        ) : (
          /* BLOGS GRID INDEX VIEW */
          <motion.div
            key="grid-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col flex-1"
          >
            {/* Header section */}
            <section className="relative overflow-hidden pt-36 pb-20 bg-gradient-to-b from-[#162032] to-[#0E121C] border-b border-white/5">
              <div className="absolute inset-0 bg-[#0E121C]/40 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(199,16,46,0.15),transparent_80%)]"></div>
              <div className="relative max-w-7xl mx-auto px-6 text-center">
                <span className="text-[#C8961A] text-xs font-black uppercase tracking-[4px] bg-[#C8961A]/10 px-4 py-1.5 rounded-full inline-block mb-4 border border-[#C8961A]/20">
                  Naisiae Sync Protocols
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-7xl uppercase font-display font-black tracking-tighter text-white mb-6">
                  Logbook <span className="font-sans text-[#C8102E] font-medium tracking-normal lowercase italic">& guides</span>
                </h1>
                <p className="max-w-2xl mx-auto text-white/70 text-base md:text-lg font-light leading-relaxed">
                  Industrial sourcing recommendations, fabric specification breakdowns, and guides for Kenyan school boards, clinics, and businesses.
                </p>
              </div>
            </section>

            {/* Filter tab bar */}
            <div className="py-8 border-b border-white/5">
              <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all duration-300 ${
                      activeCategory === cat
                        ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-md scale-105'
                        : 'bg-white/5 text-white/50 border-white/5 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Blogs List */}
            <section className="py-20 max-w-7xl mx-auto w-full px-6 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="group border border-white/5 bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.02] rounded-[2rem] overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-2xl"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[16/10] bg-zinc-900 border-b border-white/5 overflow-hidden shrink-0 relative">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" 
                        loading="lazy"
                        width={400}
                        height={250}
                      />
                      <span className="absolute bottom-4 left-4 bg-[#0E121C]/90 text-[#C8961A] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded bg-slate-900 border border-white/10">
                        {post.category}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="p-8 flex flex-col flex-1 text-left space-y-4">
                      <div className="flex items-center gap-4 text-white/40 text-[10px] font-mono leading-none">
                        <span className="flex items-center gap-1"><Calendar size={10} className="text-[#C8102E]" /> {post.date}</span>
                        <span className="flex items-center gap-1"><Clock size={10} className="text-[#C8961A]" /> {post.readTime}</span>
                      </div>

                      <h3 className="text-lg font-black uppercase leading-tight tracking-wide text-white group-hover:text-[#C8961A] transition-colors line-clamp-2 md:min-h-[44px]">
                        {post.title}
                      </h3>

                      <p className="text-white/60 text-xs md:text-sm font-light leading-relaxed line-clamp-3">
                        {post.summary}
                      </p>

                      <div className="border-t border-white/5 pt-4 flex items-center justify-between shrink-0">
                        <button
                          onClick={() => {
                            setSelectedSlug(post.slug);
                            window.history.pushState({}, '', `/blog?post=${post.slug}`);
                          }}
                          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white font-black uppercase tracking-wider group/link font-mono cursor-pointer transition-colors"
                        >
                          Read Post <ArrowRight size={14} className="text-[#C8102E] group-hover/link:translate-x-1.5 transition-transform" />
                        </button>
                        <button
                          onClick={() => handleShare(post)}
                          className="text-white/30 hover:text-[#C8961A] transition-colors p-1"
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#C8961A] text-white px-6 py-4 rounded-xl shadow-2xl z-50 text-xs font-black uppercase tracking-widest flex items-center gap-3 border border-white/15"
          >
            <BookOpen size={16} /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
