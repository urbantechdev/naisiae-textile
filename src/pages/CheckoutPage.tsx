import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  ChevronRight, 
  Trash2, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Truck, 
  ArrowLeft,
  CheckCircle2,
  Mail,
  Phone,
  User,
  MessageSquare,
  Package,
  ArrowRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CheckoutPage() {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    cartSubtotal, 
    cartTotal, 
    discountAmount, 
    appliedPromo,
    clearCart,
    wishlist,
    setIsWishlistOpen
  } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: auth.currentUser?.displayName || '',
    email: auth.currentUser?.email || '',
    phone: '',
    institution: '',
    details: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cart.length === 0 && !success) {
      navigate('/products');
    }
  }, [cart, success, navigate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const quoteData = {
        ...formData,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variants: item.selectedVariants || null,
          customization: item.customization || null,
          priceType: item.priceType || 'fixed'
        })),
        subtotal: cartSubtotal,
        discount: discountAmount,
        total: cartTotal,
        promoCode: appliedPromo?.code || null,
        status: 'new',
        uid: auth.currentUser?.uid || 'guest',
        source: 'checkout_page',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'quotes'), quoteData);
      setSuccess(true);
      clearCart();
      window.scrollTo(0, 0);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'quotes');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar 
          wishlistCount={wishlist.length}
          setIsWishlistOpen={setIsWishlistOpen}
        />
        <div className="pt-40 pb-24 px-6 max-w-2xl mx-auto text-center">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-green-500/20"
          >
            <CheckCircle2 size={48} />
          </motion.div>
          <h1 className="font-display text-4xl lg:text-6xl text-[#0A1628] leading-[0.9] mb-6">
            Inquiry <span className="text-[#C8961A]">Received</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg leading-relaxed mb-12">
            Thank you for sourcing with Uhuru Market Uniforms. Our sourcing team is reviewing your request and will contact you via WhatsApp/Email within 12 hours with a formal quote and production timeline.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/products"
              className="px-10 py-5 bg-[#0A1628] text-white rounded-2xl font-black text-[12px] uppercase tracking-[3px] hover:bg-[#C8102E] transition-all shadow-xl"
            >
              Continue Sourcing
            </Link>
            <Link 
              to="/"
              className="px-10 py-5 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[12px] uppercase tracking-[3px] hover:bg-slate-50 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar 
        wishlistCount={wishlist.length}
        setIsWishlistOpen={setIsWishlistOpen}
      />
      
      <div className="pt-32 lg:pt-44 pb-24 px-6 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#C8102E] transition-all shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-4xl lg:text-5xl text-[#0A1628] tracking-tight leading-none uppercase">Initialize <span className="text-[#C8961A]">Sourcing</span></h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mt-2 italic">Institutional Compliance & Bulk Processing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Sourcing Form Column */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-[40px] p-8 lg:p-12 shadow-2xl shadow-black/5 border border-slate-50">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-[#0A1628] rounded-2xl flex items-center justify-center text-[#C8961A]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0A1628]">Institutional Details</h2>
                  <p className="text-xs font-medium text-slate-400">Please provide contact information for the procurement lead.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 ml-1 flex items-center gap-2">
                      <User size={12} className="text-[#C8961A]" /> Full Name
                    </label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className={`w-full bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-100'} rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-[#C8961A]/5 focus:bg-white transition-all`}
                      placeholder="e.g. John Doe"
                    />
                    {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 ml-1 flex items-center gap-2">
                      <Mail size={12} className="text-[#C8961A]" /> Email Address
                    </label>
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className={`w-full bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-100'} rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-[#C8961A]/5 focus:bg-white transition-all`}
                      placeholder="procurement@school.com"
                    />
                    {errors.email && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 ml-1 flex items-center gap-2">
                      <Phone size={12} className="text-[#C8961A]" /> Phone / WhatsApp
                    </label>
                    <input 
                      required
                      type="tel" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className={`w-full bg-slate-50 border ${errors.phone ? 'border-red-500' : 'border-slate-100'} rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-[#C8961A]/5 focus:bg-white transition-all`}
                      placeholder="+254..."
                    />
                    {errors.phone && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 ml-1 flex items-center gap-2">
                      <Package size={12} className="text-[#C8961A]" /> Institution Name
                    </label>
                    <input 
                      type="text" 
                      value={formData.institution}
                      onChange={e => setFormData({...formData, institution: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-[#C8961A]/5 focus:bg-white transition-all"
                      placeholder="e.g. Alliance High School"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 ml-1 flex items-center gap-2">
                    <MessageSquare size={12} className="text-[#C8961A]" /> Customization & Production Details
                  </label>
                  <textarea 
                    value={formData.details}
                    onChange={e => setFormData({...formData, details: e.target.value})}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-[#C8961A]/5 focus:bg-white transition-all resize-none"
                    placeholder="Mention branding needs, logo embroidery positions, specific fabric weight, or urgent timelines..."
                  />
                </div>

                <div className="pt-6">
                  <button 
                    disabled={loading}
                    className="w-full py-6 bg-[#0A1628] text-white rounded-3xl font-black text-[13px] uppercase tracking-[4px] hover:bg-[#C8102E] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-[#0A1628]/20 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Processing Securely..." : "Submit Inquiry to Procurement"}
                    <div className="p-1 bg-white/10 rounded-lg group-hover:bg-white group-hover:text-[#C8102E] transition-all">
                      <ArrowRight size={16} />
                    </div>
                  </button>
                  <p className="text-[9px] font-black text-slate-400 text-center uppercase tracking-[3px] mt-6 flex items-center justify-center gap-2">
                    <ShieldCheck size={12} /> Compliance Guaranteed • Uhuru Market Sourcing Center
                  </p>
                </div>
              </form>
            </div>

            {/* Trust Assets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Truck size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#0A1628]">Nationwide Logistics</h4>
                  <p className="text-[10px] font-medium text-slate-400">Insured bulk delivery across Kenya.</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#0A1628]">Quality Inspection</h4>
                  <p className="text-[10px] font-medium text-slate-400">Institutional grade material certification.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cart Summary Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[#0A1628] rounded-[40px] p-8 lg:p-10 shadow-2xl shadow-[#0A1628]/10 text-white sticky top-44">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/10">
                <h3 className="font-display text-2xl tracking-wide uppercase italic">Sourcing <span className="text-[#C8961A]">Summary</span></h3>
                <span className="text-[10px] font-black bg-[#C8961A] text-[#0A1628] px-4 py-1.5 rounded-full uppercase tracking-[2px]">{cart.length} SKUs</span>
              </div>

              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mb-10">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl overflow-hidden border border-white/10 p-1 shrink-0">
                      <img src={item.imageUrl} className="w-full h-full object-contain" alt={item.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black uppercase tracking-wider truncate mb-1">{item.name}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">
                          {item.quantity} Units {item.price > 0 && `× ${item.price.toLocaleString()}/-`}
                        </span>
                        <span className="text-xs font-black text-[#C8961A] tabular-nums">
                          {item.price > 0 ? `${(item.price * item.quantity).toLocaleString()}/-` : 'Price on Inquiry'}
                        </span>
                      </div>
                      {item.priceType === 'wholesale' && (
                        <div className="mt-2 space-y-2">
                          <div className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[8px] font-black uppercase tracking-[1px] rounded border border-blue-500/30">
                            Custom Wholesale Request
                          </div>
                          {item.customization && (
                            <p className="text-[9px] text-white/50 leading-relaxed italic line-clamp-2">
                              "{item.customization}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex justify-between text-white/40 font-black text-[10px] uppercase tracking-widest">
                  <span>Gross Merchandise Value</span>
                  <span className="text-white">{cartSubtotal.toLocaleString()}/-</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-400 font-black text-[10px] uppercase tracking-widest">
                    <span>Applied Bulk Discount</span>
                    <span>-{discountAmount.toLocaleString()}/-</span>
                  </div>
                )}
                <div className="flex justify-between text-white/40 font-black text-[10px] uppercase tracking-widest">
                  <span>Inland Shipping (Est.)</span>
                  <span className="text-[#C8961A]">TBD</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px] mb-1">Total Valuation</p>
                    <p className="text-3xl font-black tracking-tighter text-white tabular-nums">{cartTotal.toLocaleString()}/-</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-[8px] font-black text-[#C8961A] uppercase tracking-[2px] bg-[#C8961A]/10 px-3 py-1.5 rounded-lg border border-[#C8961A]/20">
                      <ShieldCheck size={10} /> VAT Compliant
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
