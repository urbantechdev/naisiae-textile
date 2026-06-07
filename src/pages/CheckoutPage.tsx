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
  ArrowRight,
  Copy,
  Check,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

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

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(false);

  // M-Pesa Send Money checkout states
  const [checkoutMethod, setCheckoutMethod] = useState<'rfq' | 'mpesa'>('mpesa'); // defaulted to mpesa as requested
  const [mpesaPaymentOption, setMpesaPaymentOption] = useState<'deposit' | 'full'>('deposit');
  const [mpesaRefCode, setMpesaRefCode] = useState('');
  const [pastedSms, setPastedSms] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [smsExtractionSuccess, setSmsExtractionSuccess] = useState(false);
  const [submittedQuoteData, setSubmittedQuoteData] = useState<any | null>(null);

  const handleSmsPaste = (text: string) => {
    setPastedSms(text);
    // Find standard 10 letter code. Standard M-Pesa is usually uppercase alphanumeric of 10 characters
    const mpesaRegex = /\b([A-Z0-9]{10})\b/i;
    const match = text.match(mpesaRegex);
    if (match) {
      const parsedCode = match[1].toUpperCase();
      setMpesaRefCode(parsedCode);
      setSmsExtractionSuccess(true);
      setTimeout(() => setSmsExtractionSuccess(false), 3000);
    }
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('0792021795');
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCopyAmount = (amount: number) => {
    navigator.clipboard.writeText(amount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        setFormData(prev => ({
          ...prev,
          name: user.displayName || prev.name || '',
          email: user.email || prev.email || '',
        }));
      }
    });
    return unsubscribe;
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'Client',
            photoURL: user.photoURL || '',
            role: 'user',
            lastLogin: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn("Could not save initial user doc (non-fatal):", err);
      }

      setFormData(prev => ({
        ...prev,
        name: user.displayName || prev.name || '',
        email: user.email || prev.email || '',
      }));
    } catch (err) {
      console.error("Google sign-in on checkout failed:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setFormData(prev => ({
        ...prev,
        name: '',
        email: '',
      }));
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

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
    
    if (checkoutMethod === 'mpesa') {
      const code = mpesaRefCode.trim().toUpperCase();
      if (!code) {
        newErrors.mpesaRefCode = 'M-Pesa transaction code is required';
      } else if (!/^[A-Z0-9]{10}$/.test(code)) {
        newErrors.mpesaRefCode = 'M-Pesa transaction code must be exactly 10 alphanumeric characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const mpesaSummaryText = checkoutMethod === 'mpesa' 
        ? `\n[PAYMENT METHOD: M-PESA SEND MONEY]\n[PAYMENT OPTION: ${mpesaPaymentOption === 'deposit' ? '50% Booking Deposit' : '100% Full Payment'}]\n[AMOUNT SPECIFIED: Ksh ${(mpesaPaymentOption === 'deposit' ? Math.round(cartTotal * 0.5) : cartTotal).toLocaleString()}/-]\n[M-PESA TRANSACTION CODE: ${mpesaRefCode.trim().toUpperCase()}]`
        : `\n[PAYMENT METHOD: None - Standard RFQ Inquiry]`;

      const quoteDetails = [
        formData.institution ? `[Institution: ${formData.institution}]` : '',
        formData.details ? `[Details: ${formData.details}]` : '',
        appliedPromo?.code ? `[Promo Code: ${appliedPromo.code}]` : '',
        `[Source: Checkout Page]`,
        mpesaSummaryText
      ].filter(Boolean).join('\n');

      const quoteData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        service: 'Bulk Apparel Sourcing',
        details: quoteDetails,
        paymentMethod: checkoutMethod, // 'rfq' | 'mpesa'
        mpesaPaymentOption: checkoutMethod === 'mpesa' ? mpesaPaymentOption : null,
        mpesaAmountPaid: checkoutMethod === 'mpesa' ? (mpesaPaymentOption === 'deposit' ? Math.round(cartTotal * 0.5) : cartTotal) : 0,
        mpesaTransactionCode: checkoutMethod === 'mpesa' ? mpesaRefCode.trim().toUpperCase() : null,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          customization: item.customization || null,
          variants: item.selectedVariants || null,
          brandingType: item.brandingType || null,
          brandingPosition: item.brandingPosition || null,
          customLogoUrl: item.customLogoUrl || null,
          customLogoName: item.customLogoName || null
        })),
        total: cartTotal,
        status: 'new',
        uid: auth.currentUser?.uid || 'guest',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'quotes'), quoteData);
      setSubmittedQuoteData(quoteData);
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
    const isMpesa = submittedQuoteData?.paymentMethod === 'mpesa';

    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar 
          wishlistCount={wishlist.length}
          setIsWishlistOpen={setIsWishlistOpen}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          setIsQuoteModalOpen={setIsQuoteModalOpen}
        />
        <Breadcrumb />
        <div className="pt-40 pb-24 px-6 max-w-2xl mx-auto text-center">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-xl ${
              isMpesa ? 'bg-green-500 shadow-green-500/20' : 'bg-green-500 shadow-green-500/20'
            }`}
          >
            <CheckCircle2 size={48} />
          </motion.div>
          {isMpesa ? (
            <>
              <h1 className="font-display text-4xl lg:text-6xl text-[#0A1628] leading-[0.9] mb-6">
                Order <span className="text-green-600">Fast-Tracked!</span>
              </h1>
              <p className="text-slate-500 font-medium text-lg leading-relaxed mb-8 max-w-xl mx-auto">
                Thank you! Your bulk order was initialized with an M-Pesa deposit check. Our billing office is reconciling code <strong className="text-slate-900 font-black font-mono tracking-widest">{submittedQuoteData.mpesaTransactionCode}</strong> and your order will queue for immediate manufacturing within 2 hours.
              </p>

              {/* Digital receipt ticket */}
              <div className="bg-[#0E121C] text-white p-6 rounded-3xl text-left border border-white/10 mb-12 max-w-md mx-auto relative overflow-hidden shadow-2xl">
                {/* Neon decorative edge */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#C21A30] via-[#E94C36] to-[#C8961A]" />
                
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[9px] font-black text-[#C8961A] tracking-[2px] uppercase block">NAISIAE TEXTILES LTD</span>
                    <span className="text-[8px] text-white/40 uppercase tracking-widest mt-0.5 block">Official Payment Invoice</span>
                  </div>
                  <span className="text-[9px] font-black text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    🟢 M-Pesa Logged
                  </span>
                </div>
                
                <div className="space-y-4 text-xs font-sans">
                  <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5">
                    <span className="text-white/40 font-bold uppercase tracking-wider text-[9px]">Sender Lead</span>
                    <span className="font-black text-white uppercase">{submittedQuoteData.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <span className="text-white/40 font-bold uppercase tracking-wider text-[8px] block mb-1">M-Pesa Reference</span>
                      <span className="font-black text-white font-mono tracking-widest text-[13px]">{submittedQuoteData.mpesaTransactionCode}</span>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <span className="text-white/40 font-bold uppercase tracking-wider text-[8px] block mb-1">Deposit Amount</span>
                      <span className="font-black text-green-400 text-[13px] tabular-nums">Ksh {submittedQuoteData.mpesaAmountPaid?.toLocaleString()}/-</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 font-bold uppercase tracking-wider text-[9px]">Sourcing Level</span>
                    <span className="font-black text-[#C8961A] uppercase tracking-wide">
                      {submittedQuoteData.mpesaPaymentOption === 'deposit' ? '50% Order Booking' : '100% Fully Paid'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 text-[9px] text-white/30 text-center font-bold uppercase tracking-[2px]">
                  🔒 SECURE RECONCILIATION ACTIVE
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display text-4xl lg:text-6xl text-[#0A1628] leading-[0.9] mb-6">
                Inquiry <span className="text-[#C8961A]">Received</span>
              </h1>
              <p className="text-slate-500 font-medium text-lg leading-relaxed mb-12">
                Thank you for sourcing with Naisiae Textiles Limited. Our sourcing team is reviewing your request and will contact you via WhatsApp/Email within 12 hours with a formal quote and production timeline.
              </p>
            </>
          )}

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
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />
      <Breadcrumb />
      
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

              {/* Google Express Authentication Section */}
              {!currentUser ? (
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <h3 className="text-sm font-bold text-[#0A1628] flex items-center gap-1.5 justify-center sm:justify-start">
                      ⚡ Express Sourcing Setup
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Connect your Google account to auto-fill details instantly.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    className="bg-white hover:bg-slate-100 border border-slate-200 text-[#0A1628] font-black text-[10px] uppercase tracking-[1.5px] px-5 py-3.5 rounded-xl flex items-center gap-2.5 shadow-sm active:scale-95 transition-all w-full sm:w-auto justify-center cursor-pointer"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                    {authLoading ? "Syncing..." : "Sign in with Google"}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-green-50/50 border border-green-100/40 rounded-2xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <div className="w-9 h-9 rounded-full bg-[#C8961A]/10 border border-[#C8961A]/20 flex items-center justify-center font-bold text-xs text-[#0A1628] overflow-hidden shrink-0">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="User avatar" className="w-full h-full object-cover" />
                      ) : (
                        currentUser.displayName?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-[#0A1628]">Profile Connected</h3>
                      <p className="text-[10px] text-slate-500 font-bold truncate max-w-[200px] sm:max-w-xs">{currentUser.displayName || currentUser.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-[9px] font-black text-[#C8102E] hover:text-[#940F22] uppercase tracking-[1.5px] bg-white px-3.5 py-2 rounded-lg border border-slate-150 shadow-sm active:scale-95 transition-all cursor-pointer w-full sm:w-auto text-center"
                  >
                    Disconnect Profile
                  </button>
                </div>
              )}

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
                      <Mail size={12} className="text-[#C8961A]" /> 
                    </label>
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className={`w-full bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-100'} rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-[#C8961A]/5 focus:bg-white transition-all`}
                      placeholder=""
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

                {/* PAYMENT METHOD CHOOSING */}
                <div className="space-y-4 pt-4 border-t border-slate-150">
                  <h3 className="text-xs font-black uppercase tracking-[2px] text-slate-400 ml-1">
                    Choose Sourcing Option
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* RFQ Option */}
                    <button
                      type="button"
                      onClick={() => setCheckoutMethod('rfq')}
                      className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        checkoutMethod === 'rfq'
                          ? 'bg-[#0A1628]/5 border-[#0A1628] text-[#0A1628]'
                          : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-[1.5px]">Standard RFQ</span>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          checkoutMethod === 'rfq' ? 'border-[#0A1628] bg-[#0A1628]' : 'border-slate-300'
                        }`}>
                          {checkoutMethod === 'rfq' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400">Request formal quotes without paying anything upfront.</p>
                    </button>

                    {/* M-Pesa Send Money Option */}
                    <button
                      type="button"
                      onClick={() => setCheckoutMethod('mpesa')}
                      className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer ${
                        checkoutMethod === 'mpesa'
                          ? 'bg-green-50/40 border-[#3BB348] text-[#0E121C]'
                          : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500'
                      }`}
                    >
                      <div className="absolute top-0 right-0 bg-[#3BB348] text-white text-[7px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-widest animate-pulse">
                        Fast-Track
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-[1.5px] flex items-center gap-1.5">
                          🟢 M-Pesa Express
                        </span>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          checkoutMethod === 'mpesa' ? 'border-[#3BB348] bg-[#3BB348]' : 'border-slate-300'
                        }`}>
                          {checkoutMethod === 'mpesa' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400">Pay deposit or full amount now to put your order live instantly.</p>
                    </button>
                  </div>
                </div>

                {/* MPESA DETAILS ACCORDION */}
                {checkoutMethod === 'mpesa' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-slate-50/70 border border-slate-200/60 rounded-3xl space-y-6 overflow-hidden text-left"
                  >
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                      <div className="w-10 h-10 bg-[#3BB348] rounded-xl flex items-center justify-center text-white text-lg font-black shrink-0 relative">
                        📱
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#0A1628] uppercase tracking-[1px] flex items-center gap-1.5">
                          M-Pesa Safaricom Send Money
                          <span className="px-2 py-0.5 bg-[#3BB348]/10 text-[#3BB348] rounded-md text-[8px] font-black uppercase border border-[#3BB348]/20">Authorized Account</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Follow steps to submit and secure immediate production queuing</p>
                      </div>
                    </div>

                    {/* Step 1: Deposit Type Selection */}
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 ml-1 block">
                        Step 1: Choose Amount Option
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setMpesaPaymentOption('deposit')}
                          className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                            mpesaPaymentOption === 'deposit'
                              ? 'bg-[#3BB348]/10 border-[#3BB348] text-[#3BB348] font-black shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 font-bold'
                          }`}
                        >
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400 mb-0.5">50% Booking Deposit</span>
                          <span className="text-xs font-black">Ksh {Math.round(cartTotal * 0.5).toLocaleString()}/-</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMpesaPaymentOption('full')}
                          className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                            mpesaPaymentOption === 'full'
                              ? 'bg-[#3BB348]/10 border-[#3BB348] text-[#3BB348] font-black shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 font-bold'
                          }`}
                        >
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400 mb-0.5 font-bold">100% Full Payment</span>
                          <span className="text-xs font-black">Ksh {cartTotal.toLocaleString()}/-</span>
                        </button>
                      </div>
                    </div>

                    {/* Step 2: Payment Target */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                      <span className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 ml-1 block">
                        Step 2: Send Money Details
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Recipient Name</p>
                          <p className="text-xs font-black text-slate-800">Michael Kirigo (Finance)</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800 tracking-wider">0792021795</span>
                            <button
                              type="button"
                              onClick={handleCopyNumber}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-[9px] font-black text-slate-600 rounded-md transition-all uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                            >
                              {copiedNumber ? <span className="text-green-600">Copied!</span> : 'Copy'}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Copy Amount Box */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Amount to send</p>
                          <p className="text-xs font-black text-green-600">Ksh {((mpesaPaymentOption === 'deposit' ? Math.round(cartTotal * 0.5) : cartTotal)).toLocaleString()}/-</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyAmount(mpesaPaymentOption === 'deposit' ? Math.round(cartTotal * 0.5) : cartTotal)}
                          className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-[#3BB348] text-[9px] font-black rounded-lg transition-all uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          {copiedAmount ? 'Amount Copied!' : 'Copy Amount'}
                        </button>
                      </div>
                    </div>

                    {/* Step 3: SMS Paste & Transaction Code Parser */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-400">
                          Step 3: Enter M-Pesa Transaction Code
                        </label>
                        <span className="text-[8px] font-bold text-[#3BB348] bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase tracking-widest">
                          ⚡ Auto-parse SMS enabled
                        </span>
                      </div>

                      {/* SMS Paste Assistant */}
                      <div className="space-y-1.5">
                        <textarea
                          placeholder="Tip: Paste the complete Safari M-Pesa SMS message received here. We'll automatically find & pull your transaction code!"
                          value={pastedSms}
                          onChange={(e) => handleSmsPaste(e.target.value)}
                          rows={2}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium placeholder:text-slate-400 outline-none focus:border-green-500/50 transition-all resize-none font-sans"
                        />
                        {smsExtractionSuccess && (
                          <motion.div 
                            initial={{ opacity: 0, x: -5 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            className="text-[10px] text-green-600 font-bold flex items-center gap-1.5"
                          >
                            ✨ Auto-extracted code: {mpesaRefCode}!
                          </motion.div>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="e.g. QJG4H1NK6Z"
                          value={mpesaRefCode}
                          onChange={(e) => setMpesaRefCode(e.target.value.toUpperCase())}
                          className={`w-full bg-white border ${errors.mpesaRefCode ? 'border-red-500' : 'border-slate-200 focus:border-[#3BB348]'} rounded-xl px-4 py-3.5 text-sm font-black tracking-widest uppercase placeholder:text-slate-300 outline-none text-center font-mono`}
                        />
                        {mpesaRefCode.length === 10 && /^[A-Z0-9]{10}$/i.test(mpesaRefCode) && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 text-xs flex items-center gap-1">
                            ✅ Code Verified
                          </div>
                        )}
                      </div>
                      {errors.mpesaRefCode && (
                        <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.mpesaRefCode}</p>
                      )}
                    </div>
                  </motion.div>
                )}

                <div className="pt-6">
                  <button 
                    disabled={loading}
                    className={`w-full py-6 text-white rounded-3xl font-black text-[13px] uppercase tracking-[4px] transition-all flex items-center justify-center gap-4 shadow-2xl group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                      checkoutMethod === 'mpesa' 
                        ? 'bg-[#3BB348] hover:bg-green-600 shadow-green-600/10' 
                        : 'bg-[#0A1628] hover:bg-[#C8102E] shadow-[#0A1628]/20'
                    }`}
                  >
                    {loading 
                      ? "Processing Securely..." 
                      : checkoutMethod === 'mpesa' 
                        ? "Verify payment & complete order 🚀" 
                        : "Submit Inquiry to Procurement"
                    }
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
                      <img src={item.imageUrl} className="w-full h-full object-cover object-top" alt={item.name} />
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

                      {/* Live logo and customization details inside Checkout summary */}
                      {item.brandingType && (
                        <div className="mt-2.5 p-2 bg-white/5 border border-white/10 rounded-xl space-y-2">
                          <div className="inline-block px-2 py-0.5 bg-[#C8961A]/20 text-[#C8961A] text-[8px] font-black uppercase tracking-[1.5px] rounded border border-[#C8961A]/30">
                            🪡 Custom Branding Active
                          </div>
                          <div className="text-[9px] text-white/70 font-bold uppercase tracking-wide">
                            Method: {item.brandingType} · Position: {item.brandingPosition}
                          </div>
                          {item.customLogoUrl && (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-white rounded-lg p-0.5 overflow-hidden shrink-0 flex items-center justify-center">
                                <img src={item.customLogoUrl} className="max-w-full max-h-full object-contain" alt="mini logo preview" />
                              </div>
                              <span className="text-[8px] text-white/40 font-bold uppercase truncate max-w-[150px]">{item.customLogoName || 'Custom Logo'}</span>
                            </div>
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
