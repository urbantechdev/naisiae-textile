import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { ChevronDown, HelpCircle, Phone, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useCart } from '../context/CartContext';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'moq',
    question: "What is your Minimum Order Quantity (MOQ) for bulk orders?",
    answer: "Our standard minimum order quantity for custom institutional uniforms, hospital scrubs, and corporate wear is 50 units. This allows us to offer direct-factory wholesale pricing and optimal material sourcing. For smaller trial orders, please contact our support team directly to discuss fabric availability.",
    category: "Orders & Pricing"
  },
  {
    id: 'location',
    question: "Where is Naisiae Textiles located within Uhuru Market?",
    answer: "We are proudly located at the heart of Uhuru Market along Jogoo Road, Nairobi, Kenya. Our full-scale production floor handles embroidery, cutting, pattern drafting, and heavy-duty sewing. Visitors and school boards are welcome to visit our workshop for direct sizing fittings and fabric inspection.",
    category: "Location & Visiting"
  },
  {
    id: 'embroidery',
    question: "Do you offer custom branding, badges, and embroidery?",
    answer: "Yes, we specialize in advanced industrial branding. We offer high-density computerized embroidery, durable screen printing, and sub-surface heat press transfers. We can embroider school crests, hospital logos, company slogans, or security designations directly onto the garments prior to assembly.",
    category: "Branding & Customization"
  },
  {
    id: 'fabric-quality',
    question: "What fabric materials do you use for school uniforms?",
    answer: "We use laboratory-tested, institutional-grade raw textiles. Our standard uniforms use heavy-duty Polyester-Cotton (PV) blends, high-tensile drill cotton, warm combed acrylic yarn for blazers/sweaters, and anti-peeling fabrics for active sportswear games kits. They are pre-shrunk, fade-resistant, and tailored to withstand active daily wear.",
    category: "Quality & Materials"
  },
  {
    id: 'tender-inquiries',
    question: "How do we receive a formal bid proposal or tender quote?",
    answer: "You can request a formal quotation by filling out our Wholesale Request form or visiting our Contact page. Alternatively, you can directly email us your institutional tender document, size specifications, and design requirements to naisiaetext@gmail.com, or reach our tender desk on WhatsApp at +254792021795.",
    category: "Corporate & Tenders"
  },
  {
    id: 'timelines',
    question: "What are your production and delivery timelines?",
    answer: "Standard production spans 7 to 14 business days, depending on the order volume, styling complexity, and scheduling. Large school-entry orders (e.g., blazers and academic uniforms for full terms) are scheduled on signed SLA timelines. Nationwide shipping is handled via direct transport networks or courier pickup.",
    category: "Shipping & Fulfillment"
  }
];

export default function FAQPage() {
  const { cartCount, wishlistCount, setIsCartOpen, setIsWishlistOpen, isCartOpen, isWishlistOpen, setIsQuoteModalOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [faqs, setFaqs] = useState<FAQItem[]>(DEFAULT_FAQS);
  const [openId, setOpenId] = useState<string | null>('moq');
  const [activeTab, setActiveTab] = useState<string>('All');

  useEffect(() => {
    // Listen to real-time faq collection if available
    const unsubscribe = onSnapshot(collection(db, 'faqs'), 
      (snapshot) => {
        if (!snapshot.empty) {
          const items: FAQItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
              id: doc.id,
              question: data.question || '',
              answer: data.answer || '',
              category: data.category || 'General'
            });
          });
          setFaqs(items);
        }
      },
      (error) => {
        console.warn("Using offline default FAQ system:", error.message);
      }
    );
    return () => unsubscribe();
  }, []);

  // Dynamically inject Google-certified FAQPage JSON-LD Structured Data based on FAQ items state
  useEffect(() => {
    if (!faqs || faqs.length === 0) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((f) => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": f.answer
        }
      }))
    };

    const scriptId = "dynamic-faq-jsonld";
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = scriptId;
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(schema, null, 2);

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) {
        existing.remove();
      }
    };
  }, [faqs]);

  const categories = ['All', ...Array.from(new Set(faqs.map(f => f.category)))];
  const filteredFaqs = activeTab === 'All' ? faqs : faqs.filter(f => f.category === activeTab);

  return (
    <div id="faq-root-container" className="min-h-screen bg-[#04023D] text-white flex flex-col font-sans">
      <Navbar 
        wishlistCount={wishlistCount}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />
      <Breadcrumb />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-36 pb-20 bg-gradient-to-b from-[#162032] to-[#04023D] border-b border-white/5">
        <div className="absolute inset-0 bg-[#04023D]/40 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(199,16,46,0.15),transparent_80%)]"></div>
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <span className="text-[#FA9411] text-xs font-black uppercase tracking-[4px] bg-[#FA9411]/10 px-4 py-1.5 rounded-full inline-block mb-4 border border-[#FA9411]/20">
            Institutional Support
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-7xl uppercase font-display font-black tracking-tighter text-white mb-6">
            FAQ <span className="font-sans text-[#08047D] font-medium tracking-normal lowercase italic">& support</span>
          </h1>
          <p className="max-w-2xl mx-auto text-white/70 text-base md:text-lg font-light leading-relaxed">
            Detailed answers and production insights regarding custom bulk uniform manufacturing, fabric grading standards, and wholesale order placement.
          </p>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-20 max-w-5xl mx-auto w-full px-6 flex-1">
        {/* Categories Tab Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all duration-300 ${
                activeTab === cat
                  ? 'bg-[#08047D] text-white border-[#08047D] shadow-[0_10px_25px_rgba(200,16,46,0.3)] scale-105'
                  : 'bg-white/5 text-white/60 border-white/5 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <motion.div
                  key={faq.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                    isOpen 
                      ? 'border-[#FA9411]/50 bg-white/[0.03] shadow-[0_15px_30px_rgba(0,0,0,0.3)]' 
                      : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full px-6 py-6 md:py-8 flex items-center justify-between text-left gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <HelpCircle className={`shrink-0 transition-colors duration-300 ${isOpen ? 'text-[#FA9411]' : 'text-white/30'}`} size={22} />
                      <h3 className="text-sm md:text-base font-black uppercase tracking-wide text-white group-hover:text-[#FA9411] transition-colors">
                        {faq.question}
                      </h3>
                    </div>
                    <ChevronDown 
                      size={20} 
                      className={`text-white/40 shrink-0 transition-transform duration-500 ${isOpen ? 'rotate-180 text-[#FA9411]' : ''}`} 
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-8 md:px-14 text-white/70 text-sm md:text-base font-light leading-relaxed border-t border-white/5 pt-4">
                          <p className="mb-4">{faq.answer}</p>
                          <span className="text-[10px] uppercase tracking-widest font-mono text-[#FA9411]">
                            Category: {faq.category}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Instant CTA */}
        <div className="mt-20 border border-white/5 rounded-3xl p-8 bg-gradient-to-r from-[#162032] to-transparent flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
          <div className="space-y-2">
            <h4 className="text-lg font-black uppercase tracking-wider text-white">Have a custom institutional question?</h4>
            <p className="text-white/60 text-sm font-light">Reach our dedicated Uhuru Market production floor directly for prompt guidance.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 shrink-0 w-full md:w-auto">
            <Link 
              to="/contact" 
              className="flex-1 md:flex-none text-center px-6 py-4 bg-white text-[#04023D] text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#FA9411] hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
            >
              Contact Support <ArrowRight size={14} />
            </Link>
            <a 
              href="https://wa.me/254792021795" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex-1 md:flex-none text-center px-6 py-4 bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all duration-300"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
