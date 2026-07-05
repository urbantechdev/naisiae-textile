import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, Send, Instagram, Facebook, Twitter } from 'lucide-react';
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
        <section className="pt-32 pb-20 px-6 bg-[#0A1628] text-white overflow-hidden relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C8961A] mb-6 block font-mono">Channel Connection</span>
              <h1 className="text-6xl md:text-8xl font-display tracking-[2px] leading-[0.9] mb-8">
                Let's Start a <br /> <span className="text-[#C8102E]">Conversation.</span>
              </h1>
              <p className="text-lg text-white/60 leading-relaxed font-medium max-w-xl">
                Whether you're looking for institutional uniforms, corporate branding, or have a custom textile project, our experts are ready to assist.
              </p>
            </motion.div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#C8102E]/10 to-transparent blur-3xl pointer-events-none" />
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
              <h2 className="font-display text-4xl text-[#0A1628] tracking-widest mb-10">Send a direct line</h2>
              
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
                  <h3 className="font-display text-3xl text-[#0A1628] tracking-wide">Message Transmitted</h3>
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
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#C8102E]/20 outline-none transition-all"
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
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#C8102E]/20 outline-none transition-all"
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
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#C8102E]/20 outline-none transition-all"
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
                    className="w-full bg-slate-50 border-none rounded-3xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#C8102E]/20 outline-none transition-all resize-none"
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
                  className="w-full bg-[#0A1628] hover:bg-[#C8102E] text-white py-5 rounded-2xl font-black text-[12px] uppercase tracking-[3px] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#0A1628]/10 active:scale-95 disabled:opacity-75"
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
                <h3 className="font-display text-3xl text-[#0A1628] tracking-widest mb-8 border-b-4 border-[#C8102E] inline-block pb-2">HQ Details</h3>
                <div className="space-y-10">
                  <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#C8102E] shrink-0 border border-slate-100">
                      <MapPin size={28} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Our Location</h4>
                      <p className="text-[#0A1628] font-bold leading-relaxed">Industrial Area, Road C,<br />Nairobi, Kenya</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#C8102E] shrink-0 border border-slate-100">
                      <Phone size={28} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Direct Line</h4>
                      <p className="text-[#0A1628] font-bold">{siteSettings?.contactPhone || '+254 792 021 795'}</p>
                      <p className="text-slate-400 text-[10px] mt-1 font-bold">MON - FRI: 8am - 5pm</p>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#C8102E] shrink-0 border border-slate-100">
                      <Mail size={28} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Email support</h4>
                      <p className="text-[#0A1628] font-bold">{siteSettings?.contactEmail || 'support@naisiaetextiles.com'}</p>
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
                  <h3 className="font-display text-2xl text-[#0A1628] tracking-widest uppercase">Google Review</h3>
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
                  className="w-full bg-[#C8961A] hover:bg-[#C8961A]/90 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#C8961A]/10 active:scale-95 border border-white/10"
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
                <h3 className="font-display text-2xl text-[#0A1628] tracking-widest mb-6 uppercase">Connect Sociales</h3>
                <div className="flex gap-4">
                  {[
                    { icon: <Instagram size={20} />, link: '#' },
                    { icon: <Facebook size={20} />, link: '#' },
                    { icon: <Twitter size={20} />, link: '#' }
                  ].map((social, idx) => (
                    <a 
                      key={idx}
                      href={social.link}
                      className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#C8102E] hover:shadow-lg transition-all"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Map Placeholder */}
        <section className="h-[500px] w-full bg-slate-100 grayscale hover:grayscale-0 transition-all duration-700 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 pointer-events-none">
            <div className="text-center">
              <MapPin size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-display text-4xl tracking-widest opacity-20">Interactive Map Interface</p>
            </div>
          </div>
          {/* Real Google Map iframe would go here */}
        </section>
        <Footer />
      </div>
    </div>
  );
}
