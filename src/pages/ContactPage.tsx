import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, Send, Instagram, Facebook, Twitter, ExternalLink, Navigation } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { doc, onSnapshot, query, collection, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';

import { useCart } from '../context/CartContext';

const checkmarkVariants: any = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeInOut",
      delay: 0.2
    }
  }
};

const scaleInVariants: any = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  }
};

export default function ContactPage() {
  const { cartCount, wishlistCount, setIsCartOpen, setIsWishlistOpen, isCartOpen, isWishlistOpen, setIsQuoteModalOpen } = useCart();
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) setSiteSettings(snapshot.data());
    });

    const qPromos = query(collection(db, 'promotions'), where('active', '==', true));
    const unsubscribePromos = onSnapshot(qPromos, (snapshot) => {
      setPromotions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeSettings();
      unsubscribePromos();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await addDoc(collection(db, 'contact_submissions'), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'new'
      });
      setSubmitStatus({ message: 'Thank you! Your message has been sent. We will get back to you soon.', type: 'success' });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'contact_submissions');
      setSubmitStatus({ message: 'Failed to send message. Please try again later.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        wishlistCount={wishlistCount}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />
      <div className="pt-20">
        <Breadcrumb />
        <section className="pt-32 pb-20 px-6 bg-[#08047D] text-white overflow-hidden relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FA9411] mb-6 block font-mono">Channel Connection</span>
              <h1 className="text-6xl md:text-8xl font-display tracking-[2px] leading-[0.9] mb-8">
                Let's Start a <br /> <span className="text-[#08047D]">Conversation.</span>
              </h1>
              <p className="text-lg text-white/60 leading-relaxed font-medium max-w-xl">
                Whether you're looking for institutional uniforms, corporate branding, or have a custom textile project, our experts are ready to assist.
              </p>
            </motion.div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#08047D]/10 to-transparent blur-3xl pointer-events-none" />
        </section>

        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-10 lg:p-16 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-50"
            >
              <h2 className="font-display text-4xl text-[#08047D] tracking-widest mb-10">Send a direct line</h2>
              
            {submitStatus?.type === 'success' ? (
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={scaleInVariants}
                className="py-16 px-6 flex flex-col items-center justify-center text-center space-y-8"
              >
                <div className="relative flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center text-green-500 border border-green-200 z-10 shadow-lg shadow-green-100"
                  >
                    <svg className="w-12 h-12 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <motion.path 
                        d="M20 6L9 17L4 12" 
                        variants={checkmarkVariants}
                      />
                    </svg>
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 w-24 h-24 rounded-full border-2 border-green-400 pointer-events-none"
                  />
                </div>
                <div className="space-y-3 max-w-md">
                  <h3 className="font-display text-3xl text-[#08047D] tracking-wide">Message Transmitted</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-[2px] leading-relaxed">
                    Thank you! Your message was delivered successfully. Our customer support desk and team at Jogoo Rd will review your inquiry within 24 hours.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitStatus(null)}
                  className="px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 border border-slate-200"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="John Doe"
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#08047D]/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2"></label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder=""
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#08047D]/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Subject</label>
                  <input 
                    type="text" 
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Wholesale Inquiry / Custom Order"
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#08047D]/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Your Message</label>
                  <textarea 
                    rows={6} 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="How can we help your institution?"
                    className="w-full bg-slate-50 border-none rounded-3xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#08047D]/20 outline-none transition-all resize-none"
                  ></textarea>
                </div>

                {submitStatus && (
                  <div className="p-4 rounded-2xl text-xs font-bold uppercase tracking-[2px] bg-red-50 text-red-600 border border-red-100">
                    {submitStatus.message}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#08047D] hover:bg-[#08047D] text-white py-5 rounded-2xl font-black text-[12px] uppercase tracking-[3px] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#08047D]/10 active:scale-95 disabled:opacity-75"
                >
                  {isSubmitting ? 'Transmitting...' : 'Send Message'} <Send size={18} />
                </button>
              </form>
            )}
            </motion.div>

            {/* Contact Info & Details */}
            <div className="space-y-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="font-display text-3xl text-[#08047D] tracking-widest mb-8 border-b-4 border-[#08047D] inline-block pb-2">HQ Details</h3>
                <div className="space-y-10">
                  <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#08047D] shrink-0 border border-slate-100">
                      <MapPin size={28} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Our Location</h4>
                      <p className="text-[#08047D] font-bold leading-relaxed">Uhuru Market, Jogoo Road,<br />Nairobi, Kenya</p>
                      <a
                        href="https://www.google.com/maps/place/UHURU+MARKET+UNIFORMS/@-1.294565,36.8611397,15z/data=!4m10!1m2!2m1!1suhuru+market+uniforms!3m6!1s0x182f114397c34eb3:0x60f4dee669a3f796!8m2!3d-1.294565!4d36.8611397!15sChV1aHVydSBtYXJrZXQgdW5pZm9ybXNaFyIVdWh1cnUgbWFya2V0IHVuaWZvcm1zkgENdW5pZm9ybV9zdG9yZZoBRENpOURRVWxSUVVOdlpFTm9kSGxqUmpsdlQyMXpNRTFJUWtaaVZFWXdaRlpTYjFKRWJFaFZXR00wVGxaR1ZGa3hSUkFC4AEA-gEECAAQMQ!16s%2Fg%2F11z6sydbxv"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#08047D] hover:text-[#08047D] mt-2 transition-colors group"
                      >
                        <span>View on Google Maps</span>
                        <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#08047D] shrink-0 border border-slate-100">
                      <Phone size={28} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Direct Line</h4>
                      <p className="text-[#08047D] font-bold">{siteSettings?.contactPhone || '+254 792 021 795'}</p>
                      <p className="text-slate-400 text-[10px] mt-1 font-bold">MON - FRI: 8am - 5pm</p>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#08047D] shrink-0 border border-slate-100">
                      <Mail size={28} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Email support</h4>
                      <p className="text-[#08047D] font-bold">{siteSettings?.contactEmail || 'support@naisiaetextiles.com'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-emerald-500/[0.02] p-10 rounded-[40px] border border-emerald-500/10"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <h3 className="font-display text-2xl text-[#08047D] tracking-widest uppercase">Google Review</h3>
                  <div className="flex text-amber-500 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-sm">★</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-6 font-semibold">
                  We are incredibly proud to manufacture school uniforms and custom garments right here in Nairobi. If you love our craft, please leave us a 5-star review on Google!
                </p>
                <a 
                  href="https://g.page/r/CZb3o2nm3vRgEBM/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#FA9411] hover:bg-[#FA9411]/90 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FA9411]/10 active:scale-95 border border-white/10"
                >
                  <span>Leave Google Review</span>
                  <span>⭐</span>
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-[#F8FAFC] p-10 rounded-[40px] border border-slate-100"
              >
                <h3 className="font-display text-2xl text-[#08047D] tracking-widest mb-6 uppercase">Connect Sociales</h3>
                <div className="flex gap-4">
                  {[
                    { icon: <Instagram size={20} />, link: '#' },
                    { icon: <Facebook size={20} />, link: '#' },
                    { icon: <Twitter size={20} />, link: '#' }
                  ].map((social, idx) => (
                    <a 
                      key={idx}
                      href={social.link}
                      className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#08047D] hover:shadow-lg transition-all"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Live Google Map Section */}
        <section className="relative w-full border-t border-slate-200 bg-slate-900 overflow-hidden">
          <div className="h-[520px] w-full relative">
            <iframe
              title="Uhuru Market Uniforms Google Map"
              src="https://maps.google.com/maps?q=-1.294565,36.8611397+(Uhuru+Market+Uniforms)&t=&z=16&ie=UTF8&iwloc=B&output=embed"
              className="w-full h-full border-0 filter contrast-[1.02]"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Interactive Map Overlay Card */}
            <div className="absolute top-6 left-6 right-6 md:right-auto md:max-w-md z-10">
              <div className="bg-[#04023D]/95 backdrop-blur-xl border border-white/10 text-white p-6 rounded-3xl shadow-2xl shadow-black/50">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[2px] text-[#FA9411] font-mono">Verified Location</span>
                    <h3 className="font-display text-xl text-white font-bold tracking-tight mt-0.5">
                      Uhuru Market Uniforms
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-[#08047D] flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                </div>

                <p className="text-xs text-white/70 leading-relaxed mb-4">
                  Uhuru Market, Jogoo Road, Nairobi, Kenya
                </p>

                <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono mb-5 pb-4 border-b border-white/10">
                  <span>GPS:</span>
                  <span className="text-white/80 font-bold">-1.294565, 36.8611397</span>
                  <span className="text-emerald-400 ml-auto flex items-center gap-1 font-sans font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Open Mon-Sat
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <a
                    href="https://www.google.com/maps/place/UHURU+MARKET+UNIFORMS/@-1.294565,36.8611397,15z/data=!4m10!1m2!2m1!1suhuru+market+uniforms!3m6!1s0x182f114397c34eb3:0x60f4dee669a3f796!8m2!3d-1.294565!4d36.8611397!15sChV1aHVydSBtYXJrZXQgdW5pZm9ybXNaFyIVdWh1cnUgbWFya2V0IHVuaWZvcm1zkgENdW5pZm9ybV9zdG9yZZoBRENpOURRVWxSUVVOdlpFTm9kSGxqUmpsdlQyMXpNRTFJUWtaaVZFWXdaRlpTYjFKRWJFaFZXR00wVGxaR1ZGa3hSUkFC4AEA-gEECAAQMQ!16s%2Fg%2F11z6sydbxv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#08047D] hover:bg-[#a50d26] text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#08047D]/20 active:scale-95"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink size={13} />
                  </a>
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=UHURU+MARKET+UNIFORMS&destination_place_id=ChIJs07DlyMRLxARlvfjaebe9GA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10 active:scale-95"
                  >
                    <span>Get Directions</span>
                    <Navigation size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
}
