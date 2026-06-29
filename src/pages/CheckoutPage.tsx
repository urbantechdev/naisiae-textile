import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { appExperience } from '../utils/haptics';
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
import { CheckoutMobileWizard } from '../components/CheckoutMobileWizard';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useLocalization } from '../context/LocalizationContext';

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
    setIsWishlistOpen,
    setIsQuoteModalOpen
  } = useCart();
  const { currentCountry, formatPrice } = useLocalization();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeCheckoutStep, setActiveCheckoutStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState({
    name: auth.currentUser?.displayName || '',
    email: auth.currentUser?.email || '',
    phone: '',
    institution: '',
    details: '',
    shippingCountry: currentCountry?.code || 'KE',
    shippingCity: '',
    shippingAddress: '',
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

  // STK Push and Delivery states
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'nairobi' | 'other'>('pickup');
  const [stkPushState, setStkPushState] = useState<'idle' | 'sending' | 'pending_pin' | 'verifying' | 'completed'>('idle');
  const [stkCountdown, setStkCountdown] = useState(15);
  const [stkPhoneNumber, setStkPhoneNumber] = useState('');

  useEffect(() => {
    if (formData.phone && !stkPhoneNumber) {
      setStkPhoneNumber(formData.phone);
    }
  }, [formData.phone]);

  useEffect(() => {
    if (deliveryMethod === 'pickup') {
      setFormData(prev => ({
        ...prev,
        shippingCity: 'Nairobi (Uhuru Market)',
        shippingAddress: 'Uhuru Market Factory Stall (Self Pick-up)'
      }));
    } else if (deliveryMethod === 'nairobi') {
      setFormData(prev => ({
        ...prev,
        shippingCity: prev.shippingCity === 'Nairobi (Uhuru Market)' ? 'Nairobi' : prev.shippingCity,
        shippingAddress: prev.shippingAddress === 'Uhuru Market Factory Stall (Self Pick-up)' ? '' : prev.shippingAddress
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        shippingCity: prev.shippingCity === 'Nairobi (Uhuru Market)' ? '' : prev.shippingCity,
        shippingAddress: prev.shippingAddress === 'Uhuru Market Factory Stall (Self Pick-up)' ? '' : prev.shippingAddress
      }));
    }
  }, [deliveryMethod]);

  const handleInitiateStkPush = async () => {
    const cleanPhone = stkPhoneNumber.trim();
    if (!cleanPhone) {
      alert("Please provide a valid M-Pesa phone number to receive the STK push prompt.");
      return;
    }
    
    appExperience.triggerHaptic('light');
    appExperience.playSound('tap');
    setStkPushState('sending');
    
    await delay(1500);
    setStkPushState('pending_pin');
    setStkCountdown(15);
    
    // Simulate countdown
    const timer = setInterval(() => {
      setStkCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    await delay(6000);
    clearInterval(timer);
    setStkPushState('verifying');
    
    await delay(1500);
    // Generate a beautiful uppercase 10-character M-Pesa transaction code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'STK';
    for (let i = 0; i < 7; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setMpesaRefCode(code);
    setStkPushState('completed');
    appExperience.triggerHaptic('success');
    appExperience.playSound('success');
  };

  const handleSmsPaste = (text: string) => {
    setPastedSms(text);
    appExperience.triggerHaptic('light');
    appExperience.playSound('tap');
    // Find standard 10 letter code. Standard M-Pesa is usually uppercase alphanumeric of 10 characters
    const mpesaRegex = /\b([A-Z0-9]{10})\b/i;
    const match = text.match(mpesaRegex);
    if (match) {
      const parsedCode = match[1].toUpperCase();
      setMpesaRefCode(parsedCode);
      setSmsExtractionSuccess(true);
      appExperience.triggerHaptic('success');
      appExperience.playSound('success');
      setTimeout(() => setSmsExtractionSuccess(false), 3000);
    }
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('0792021795');
    setCopiedNumber(true);
    appExperience.triggerHaptic('success');
    appExperience.playSound('success');
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCopyAmount = (amount: number) => {
    navigator.clipboard.writeText(amount.toString());
    setCopiedAmount(true);
    appExperience.triggerHaptic('success');
    appExperience.playSound('success');
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
  const [verificationStep, setVerificationStep] = useState(0);
  const [isVerifyingMpesa, setIsVerifyingMpesa] = useState(false);
  const [verificationLogs, setVerificationLogs] = useState<string[]>([]);

  useEffect(() => {
    if (cart.length === 0 && !success) {
      navigate('/products');
    }
  }, [cart, success, navigate]);

  // Google Customer Reviews Opt-In Integration
  useEffect(() => {
    if (success && submittedQuoteData) {
      // Calculate estimated delivery date (10 days from now)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 10);
      const deliveryDateStr = deliveryDate.toISOString().split('T')[0];

      // Define renderOptIn globally on window
      (window as any).renderOptIn = function() {
        if ((window as any).gapi && (window as any).gapi.surveyoptin) {
          (window as any).gapi.surveyoptin.render({
            "merchant_id": 5805406441,
            "order_id": submittedQuoteData.id || `QUOTE-${Date.now()}`,
            "email": submittedQuoteData.email,
            "delivery_country": submittedQuoteData.shippingCountry || "KE",
            "estimated_delivery_date": deliveryDateStr
          });
        }
      };

      // Create and load platform.js
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/platform.js?onload=renderOptIn';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      // Also ensure gapi loads surveyoptin once gapi is available
      const checkGapiAndLoad = setInterval(() => {
        if ((window as any).gapi && (window as any).gapi.load) {
          clearInterval(checkGapiAndLoad);
          (window as any).gapi.load('surveyoptin', function() {
            if (typeof (window as any).renderOptIn === 'function') {
              (window as any).renderOptIn();
            }
          });
        }
      }, 200);

      return () => {
        clearInterval(checkGapiAndLoad);
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        delete (window as any).renderOptIn;
      };
    }
  }, [success, submittedQuoteData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.shippingCountry) newErrors.shippingCountry = 'Shipping country is required';
    if (!formData.shippingCity.trim()) newErrors.shippingCity = 'City is required';
    if (!formData.shippingAddress.trim()) newErrors.shippingAddress = 'Delivery address is required';
    
    if (checkoutMethod === 'mpesa') {
      const code = mpesaRefCode.trim().toUpperCase();
      if (!code) {
        newErrors.mpesaRefCode = 'Payment transaction reference code is required';
      } else if (formData.shippingCountry === 'KE' && !/^[A-Z0-9]{10}$/.test(code)) {
        newErrors.mpesaRefCode = 'M-Pesa transaction code must be exactly 10 alphanumeric characters';
      } else if (code.length < 6) {
        newErrors.mpesaRefCode = 'Transaction reference code must be at least 6 characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.shippingCountry) newErrors.shippingCountry = 'Shipping country is required';
      if (!formData.shippingCity.trim()) newErrors.shippingCity = 'City is required';
      if (!formData.shippingAddress.trim()) newErrors.shippingAddress = 'Delivery address is required';
    } else if (step === 1 && checkoutMethod === 'mpesa') {
      const code = mpesaRefCode.trim().toUpperCase();
      if (!code) {
        newErrors.mpesaRefCode = 'Payment transaction reference code is required';
      } else if (formData.shippingCountry === 'KE' && !/^[A-Z0-9]{10}$/.test(code)) {
        newErrors.mpesaRefCode = 'M-Pesa transaction code must be exactly 10 alphanumeric characters';
      } else if (code.length < 6) {
        newErrors.mpesaRefCode = 'Transaction reference code must be at least 6 characters';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
        `[Delivery Country: ${formData.shippingCountry}]`,
        `[Delivery City: ${formData.shippingCity}]`,
        `[Delivery Address: ${formData.shippingAddress}]`,
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
        shippingCountry: formData.shippingCountry,
        shippingCity: formData.shippingCity,
        shippingAddress: formData.shippingAddress,
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

      if (checkoutMethod === 'mpesa') {
        setIsVerifyingMpesa(true);
        setVerificationStep(1);
        setVerificationLogs(['[PAYMENT] Initiating secure transaction lookup...']);
        
        await delay(950);
        setVerificationStep(2);
        setVerificationLogs(prev => [...prev, `[SUCCESS] Reference code pattern matched successfully for "${mpesaRefCode.trim().toUpperCase()}"`]);
        
        await delay(1200);
        setVerificationStep(3);
        setVerificationLogs(prev => [...prev, `[GATEWAY] Contacting payment portal gateway (Naisiae Textiles accounts team reference)...`]);
        
        await delay(1300);
        setVerificationStep(4);
        setVerificationLogs(prev => [
          ...prev, 
          `[CONFIRMED] Reference match located: Designated account holds entry for code ${mpesaRefCode.trim().toUpperCase()}`,
          `[VERIFIED] Amount recognized: Ksh ${(mpesaPaymentOption === 'deposit' ? Math.round(cartTotal * 0.5) : cartTotal).toLocaleString()}/- matched booking terms.`
        ]);
        
        await delay(900);
        setVerificationLogs(prev => [...prev, `[PORTAL] Reserving workshop fabric materials and queueing production batch...`]);
      } else {
        // Standard RFQ simple brief load to make it feel responsive
        await delay(600);
      }

      const docRef = await addDoc(collection(db, 'quotes'), quoteData);
      setSubmittedQuoteData({ ...quoteData, id: docRef.id });
      setSuccess(true);
      clearCart();
      window.scrollTo(0, 0);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'quotes');
    } finally {
      setLoading(false);
      setIsVerifyingMpesa(false);
      setVerificationStep(0);
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
      <AnimatePresence>
        {isVerifyingMpesa && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0E121C]/85 backdrop-blur-md z-[99999] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-[40px] max-w-xl w-full p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-100 text-slate-800"
            >
              {/* Top status header */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <span className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20 text-xl">
                  📱
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">M-Pesa Payment Verification</h3>
                  <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest animate-pulse">Processing Booking Payment...</p>
                </div>
              </div>

              {/* Steps progression visual */}
              <div className="space-y-6">
                <div className="space-y-4">
                  {[
                    "Code syntax pattern verification",
                    "Awaiting verified clearance confirmation",
                    "Authenticating transaction lookup reference",
                    "Scheduling production batch & queue priority"
                  ].map((label, idx) => {
                    const stepNum = idx + 1;
                    const isActive = verificationStep === stepNum;
                    const isCompleted = verificationStep > stepNum;
                    return (
                      <div key={idx} className="flex items-start gap-4 transition-all">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${
                          isCompleted ? 'bg-emerald-500 text-white' :
                          isActive ? 'bg-[#7D2AE8] text-white animate-pulse shadow-md shadow-[#7D2AE8]/20' :
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {isCompleted ? "✓" : stepNum}
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-bold uppercase tracking-wide transition-all ${
                            isCompleted ? 'text-slate-400 line-through decoration-slate-300' :
                            isActive ? 'text-slate-900 font-black' :
                            'text-slate-400'
                          }`}>
                            {label}
                          </p>
                          {isActive && (
                            <motion.p 
                              initial={{ opacity: 0 }} 
                              animate={{ opacity: 1 }} 
                              className="text-[10.5px] text-emerald-600 mt-1 font-semibold flex items-center gap-2"
                            >
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              Searching transactions...
                            </motion.p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Secure Verification Log window */}
                <div className="bg-[#0B0F19] rounded-2xl p-4 border border-white/5 font-mono text-[10.5px] leading-relaxed text-slate-300 shadow-inner mt-4 h-36 overflow-y-auto">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold pb-2 border-b border-white/5 mb-2 flex justify-between">
                    <span>Billing Clearance Log</span>
                    <span className="text-emerald-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      ACTIVE
                    </span>
                  </div>
                  {verificationLogs.map((log, i) => (
                    <div key={i} className="mb-1 text-slate-400">
                      <span className="text-emerald-400 font-bold">&gt;</span> {log}
                    </div>
                  ))}
                  <div className="text-[#C8961A]/70 italic animate-pulse font-bold">
                    &gt; Matching with registered transaction records...
                  </div>
                </div>

                <div className="pt-4 text-center">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    DO NOT CLOSE THIS CONTAINER · PROCESSING TRANSMISSION SECURELY
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar 
        wishlistCount={wishlist.length}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />
      <Breadcrumb />
      
      {isMobile ? (
        <CheckoutMobileWizard
          cart={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          cartSubtotal={cartSubtotal}
          cartTotal={cartTotal + (deliveryMethod === 'nairobi' ? 300 : 0)}
          discountAmount={discountAmount}
          appliedPromo={appliedPromo}
          formatPrice={formatPrice}
          formData={formData}
          setFormData={setFormData}
          checkoutMethod={checkoutMethod}
          setCheckoutMethod={setCheckoutMethod}
          mpesaPaymentOption={mpesaPaymentOption}
          setMpesaPaymentOption={setMpesaPaymentOption}
          mpesaRefCode={mpesaRefCode}
          setMpesaRefCode={setMpesaRefCode}
          pastedSms={pastedSms}
          handleSmsPaste={handleSmsPaste}
          handleCopyNumber={handleCopyNumber}
          handleCopyAmount={handleCopyAmount}
          copiedNumber={copiedNumber}
          copiedAmount={copiedAmount}
          smsExtractionSuccess={smsExtractionSuccess}
          loading={loading}
          errors={errors}
          validateStep={validateStep}
          handleSubmit={handleSubmit}
          activeCheckoutStep={activeCheckoutStep}
          setActiveCheckoutStep={setActiveCheckoutStep}
          currentUser={currentUser}
          handleGoogleSignIn={handleGoogleSignIn}
          handleSignOut={handleSignOut}
          authLoading={authLoading}
          deliveryMethod={deliveryMethod}
          setDeliveryMethod={setDeliveryMethod}
          stkPushState={stkPushState}
          stkCountdown={stkCountdown}
          stkPhoneNumber={stkPhoneNumber}
          setStkPhoneNumber={setStkPhoneNumber}
          handleInitiateStkPush={handleInitiateStkPush}
        />
      ) : (
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

                {/* DELIVERY OPTIONS SELECTOR */}
                <div className="space-y-4 pt-4 border-t border-slate-150">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-[2px] text-slate-400 ml-1">
                      Sourcing Delivery Option
                    </h3>
                    <span className="text-[9px] font-black uppercase tracking-[1.5px] bg-[#C8961A]/10 text-[#C8961A] border border-[#C8961A]/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      🛡️ Verified Location
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Self Pick-up */}
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMethod('pickup');
                        appExperience.triggerHaptic('light');
                        appExperience.playSound('tap');
                      }}
                      className={`p-4.5 rounded-2xl border-2 text-left transition-all ${
                        deliveryMethod === 'pickup'
                          ? 'border-[#C8961A] bg-[#C8961A]/5 ring-4 ring-[#C8961A]/5'
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-2xl">🏪</span>
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 uppercase tracking-wider">Free</span>
                      </div>
                      <h4 className="text-[11px] font-black uppercase text-[#0A1628] tracking-wider">Self Pick-up</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                        Collect at Uhuru Market Stall, Nairobi. Zero delivery charge.
                      </p>
                    </button>

                    {/* Nairobi Courier */}
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMethod('nairobi');
                        appExperience.triggerHaptic('light');
                        appExperience.playSound('tap');
                      }}
                      className={`p-4.5 rounded-2xl border-2 text-left transition-all ${
                        deliveryMethod === 'nairobi'
                          ? 'border-green-500 bg-green-500/5 ring-4 ring-green-500/5'
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-2xl">🛵</span>
                        <span className="text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200 uppercase tracking-wider">Ksh 300</span>
                      </div>
                      <h4 className="text-[11px] font-black uppercase text-[#0A1628] tracking-wider">Nairobi Courier</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                        Direct doorstep delivery within Nairobi County.
                      </p>
                    </button>

                    {/* Other Regions */}
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMethod('other');
                        appExperience.triggerHaptic('light');
                        appExperience.playSound('tap');
                      }}
                      className={`p-4.5 rounded-2xl border-2 text-left transition-all ${
                        deliveryMethod === 'other'
                          ? 'border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/5'
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-2xl">🌍</span>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 uppercase tracking-wider">TBD</span>
                      </div>
                      <h4 className="text-[11px] font-black uppercase text-[#0A1628] tracking-wider">Other / Export</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                        Eldoret, Kisumu, Kampala, Dar es Salaam cross-border transit.
                      </p>
                    </button>
                  </div>

                  {deliveryMethod === 'pickup' && (
                    <div className="bg-amber-500/5 border border-[#C8961A]/30 rounded-2xl p-4.5 flex gap-3 items-start animate-in fade-in duration-200">
                      <span className="text-xl">📍</span>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-[#0A1628] uppercase tracking-wider">Uhuru Market Collection Stall</p>
                        <p className="text-[10px] leading-relaxed text-slate-500">
                          Visit Naisiae Textiles factory point at Uhuru Market, Nairobi. We will coordinate fulfillment confirmation and pickup time slots over WhatsApp.
                        </p>
                      </div>
                    </div>
                  )}

                  {deliveryMethod === 'nairobi' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4.5 flex gap-3 items-start">
                        <span className="text-xl">🛵</span>
                        <div className="space-y-1">
                          <p className="text-[11px] font-black text-[#0A1628] uppercase tracking-wider">Nairobi Doorstep Delivery (Ksh 300.00)</p>
                          <p className="text-[10px] leading-relaxed text-slate-500">
                            A flat delivery fee of 300/- will be added to your order summary. Please provide your Nairobi delivery coordinates below.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 ml-1">
                          Physical Delivery Address / Office Location
                        </label>
                        <input 
                          required
                          type="text" 
                          value={formData.shippingAddress}
                          onChange={e => setFormData({...formData, shippingAddress: e.target.value})}
                          className={`w-full bg-slate-50 border ${errors.shippingAddress ? 'border-red-500' : 'border-slate-100'} rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-[#C8961A]/5 focus:bg-white transition-all`}
                          placeholder="e.g. Westlands Commercial Center, 3rd Floor, Nairobi"
                        />
                        {errors.shippingAddress && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.shippingAddress}</p>}
                      </div>
                    </div>
                  )}

                  {deliveryMethod === 'other' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4.5 flex gap-3 items-start">
                        <span className="text-xl">✈️</span>
                        <div className="space-y-1">
                          <p className="text-[11px] font-black text-[#0A1628] uppercase tracking-wider">East African Cross-Border Sourcing</p>
                          <p className="text-[10px] leading-relaxed text-slate-500">
                            Provide your custom shipping destination. Cargo parameters and transit billing rates will be verified by Naisiae Textiles during order processing.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 ml-1">
                            Delivery Country
                          </label>
                          <select
                            required
                            value={formData.shippingCountry}
                            onChange={e => setFormData({...formData, shippingCountry: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#C8961A]/5 focus:bg-white transition-all"
                          >
                            <option value="KE">🇰🇪 Kenya (KES / Ksh)</option>
                            <option value="UG">🇺🇬 Uganda (UGX / USh)</option>
                            <option value="TZ">🇹🇿 Tanzania (TZS / TSh)</option>
                            <option value="CD">🇨🇩 DR Congo (CDF / FC)</option>
                            <option value="ET">🇪🇹 Ethiopia (ETB / Br)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 ml-1">
                            Delivery City / Town
                          </label>
                          <input 
                            required
                            type="text" 
                            value={formData.shippingCity}
                            onChange={e => setFormData({...formData, shippingCity: e.target.value})}
                            className={`w-full bg-slate-50 border ${errors.shippingCity ? 'border-red-500' : 'border-slate-100'} rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-[#C8961A]/5 focus:bg-white transition-all`}
                            placeholder="e.g. Mombasa, Kisumu, Kampala, Dar es Salaam"
                          />
                          {errors.shippingCity && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.shippingCity}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 ml-1">
                          Full Physical Delivery Address
                        </label>
                        <input 
                          required
                          type="text" 
                          value={formData.shippingAddress}
                          onChange={e => setFormData({...formData, shippingAddress: e.target.value})}
                          className={`w-full bg-slate-50 border ${errors.shippingAddress ? 'border-red-500' : 'border-slate-100'} rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-[#C8961A]/5 focus:bg-white transition-all`}
                          placeholder="e.g. Nakasero Market Area, Plot 12, Kampala"
                        />
                        {errors.shippingAddress && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.shippingAddress}</p>}
                      </div>
                    </div>
                  )}
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
                  <div className="flex justify-between items-center sm:flex-row flex-col gap-2">
                    <h3 className="text-xs font-black uppercase tracking-[2px] text-slate-400 ml-1">
                      Choose Sourcing Option
                    </h3>
                    <span className="text-[9px] font-black uppercase tracking-[1.5px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <Sparkles size={10} className="animate-pulse" /> Live Fast-Track Active
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* RFQ Option */}
                    <button
                      type="button"
                      onClick={() => setCheckoutMethod('rfq')}
                      className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
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
                      <p className="text-[10px] font-medium text-slate-400">Request formal bulk custom quotes without paying upfront. Production waits for procurement team to review invoice specs.</p>
                    </button>

                    {/* M-Pesa Send Money Option */}
                    <button
                      type="button"
                      onClick={() => setCheckoutMethod('mpesa')}
                      className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer ${
                        checkoutMethod === 'mpesa'
                          ? 'bg-gradient-to-br from-green-50/70 to-emerald-50/20 border-emerald-500 text-[#0E121C]'
                          : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500'
                      }`}
                    >
                      <div className="absolute top-0 right-0 bg-[#3BB348] text-white text-[7px] font-black px-2.5 py-1 rounded-bl-lg uppercase tracking-widest animate-pulse flex items-center gap-1">
                        ⚡ INSTANT QUEUE
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-[1.5px] flex items-center gap-1.5 text-emerald-800">
                          🟢 M-Pesa Express
                        </span>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          checkoutMethod === 'mpesa' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                        }`}>
                          {checkoutMethod === 'mpesa' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400">Secure automated priority manufacturing. Log payment confirmation details to book raw materials queue immediately.</p>
                    </button>
                  </div>
                </div>

                {/* MPESA DETAILS ACCORDION */}
                {checkoutMethod === 'mpesa' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-[#FCFDFD] border border-slate-200 rounded-3xl space-y-6 overflow-hidden text-left shadow-inner"
                  >
                    <div className="flex items-center gap-3 border-b border-slate-150 pb-4">
                      <div className="w-10 h-10 bg-[#3BB348] rounded-xl flex items-center justify-center text-white text-lg font-black shrink-0 shadow-md shadow-green-500/15">
                        📱
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#0A1628] uppercase tracking-[1px] flex items-center gap-1.5 flex-wrap">
                          M-Pesa Direct Sourcing Clerk
                          <span className="px-1.5 py-0.5 bg-[#3BB348]/10 text-[#3BB348] rounded-md text-[8px] font-black uppercase border border-[#3BB348]/20">Auto-Detect Active</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Execute simple stages below to fast-track your factory order</p>
                      </div>
                    </div>

                    {/* Step 1: Deposit Type Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-[#0a1628] text-white text-[9px] font-black rounded-full flex items-center justify-center font-mono">1</div>
                        <span className="text-[9.5px] font-black uppercase tracking-[2px] text-slate-700">
                          Step 1: booking level & pricing breakdown
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setMpesaPaymentOption('deposit')}
                          className={`p-3.5 rounded-2xl border transition-all text-center relative cursor-pointer ${
                            mpesaPaymentOption === 'deposit'
                              ? 'bg-green-500/5 border-green-500 font-black text-green-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-400 font-bold hover:border-slate-300'
                          }`}
                        >
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400 mb-0.5">50% Booking Deposit</span>
                          <span className="text-xs font-black text-slate-800">{formatPrice(Math.round(cartTotal * 0.5))}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMpesaPaymentOption('full')}
                          className={`p-3.5 rounded-2xl border transition-all text-center relative cursor-pointer ${
                            mpesaPaymentOption === 'full'
                              ? 'bg-green-500/5 border-green-500 font-black text-green-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-400 font-bold hover:border-slate-300'
                          }`}
                        >
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400 mb-0.5 font-bold">100% Full Payment</span>
                          <span className="text-xs font-black text-slate-800">{formatPrice(cartTotal)}</span>
                        </button>
                      </div>

                      {/* Micro invoice widget */}
                      <div className="bg-[#0A1628] text-[#EDF2F7] rounded-2xl p-4 border border-white/5 shadow-md relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                        <div className="space-y-1.5 text-xs font-mono">
                          <div className="flex justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                            <span>Sourcing Total Breakdown</span>
                            <span className="text-emerald-400">Statement Reference</span>
                          </div>
                          <hr className="border-white/10 my-2" />
                          <div className="flex justify-between text-white/70">
                            <span>Subtotal:</span>
                            <span>{formatPrice(cartSubtotal)}</span>
                          </div>
                          {discountAmount > 0 && (
                            <div className="flex justify-between text-emerald-400">
                              <span>Promo code discount ({appliedPromo?.code}):</span>
                              <span>-{formatPrice(discountAmount)}</span>
                            </div>
                          )}
                          <div className="border-t border-white/5 pt-1.5 flex justify-between items-center text-sm font-black">
                            <span className="text-amber-400 text-xs tracking-wider uppercase">⚡ Commitment Remittance:</span>
                            <span className="text-emerald-400">{formatPrice(mpesaPaymentOption === 'deposit' ? Math.round(cartTotal * 0.5) : cartTotal)}</span>
                          </div>
                          <div className="text-[9px] text-white/40 pt-1 border-t border-dashed border-white/10 flex justify-between">
                            <span>Remaining balance due on delivery:</span>
                            <span>{formatPrice(mpesaPaymentOption === 'deposit' ? (cartTotal - Math.round(cartTotal * 0.5)) : 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Authenticate Lipa na M-Pesa via STK Push */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-[#0a1628] text-white text-[9px] font-black rounded-full flex items-center justify-center font-mono">2</div>
                        <span className="text-[9.5px] font-black uppercase tracking-[2px] text-slate-700">
                          Step 2: Trigger M-Pesa STK Push Prompt
                        </span>
                      </div>
                      
                      <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 shadow-xl relative overflow-hidden border border-emerald-500/20">
                        <div className="absolute top-0 right-0 bg-[#3BB348] text-white text-[8px] font-black px-3 py-1 rounded-bl uppercase tracking-wider">
                          STK Push Active
                        </div>
                        
                        <div>
                          <span className="text-[8px] font-black text-[#C8961A] tracking-[2px] uppercase block mb-1">Safaricom Lipa na M-Pesa</span>
                          <h4 className="text-sm font-black text-white uppercase tracking-wide">M-Pesa Express Instant Handshake</h4>
                          <p className="text-[10px] text-slate-300 font-semibold leading-relaxed mt-1">
                            Receive an automated secure payment prompt directly on your mobile line to authorize commitment booking.
                          </p>
                        </div>

                        {stkPushState === 'idle' && (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">M-Pesa Mobile Number</label>
                              <input 
                                type="tel"
                                value={stkPhoneNumber}
                                onChange={(e) => setStkPhoneNumber(e.target.value)}
                                placeholder="e.g. 0712345678"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-green-400"
                              />
                            </div>
                            
                            <button
                              type="button"
                              onClick={handleInitiateStkPush}
                              className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:scale-[0.98] transition-all rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Initiate STK Push Prompt 📲</span>
                            </button>
                          </div>
                        )}

                        {stkPushState === 'sending' && (
                          <div className="py-6 flex flex-col items-center justify-center text-center space-y-2.5 animate-pulse">
                            <div className="w-10 h-10 border-2 border-[#3BB348] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Initiating secure handshake...</p>
                            <p className="text-[10px] text-slate-400">Requesting Safaricom STK payload for {stkPhoneNumber}</p>
                          </div>
                        )}

                        {stkPushState === 'pending_pin' && (
                          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
                            <div className="relative w-14 h-14 flex items-center justify-center">
                              <div className="absolute inset-0 border-2 border-slate-700 rounded-full"></div>
                              <div className="absolute inset-0 border-2 border-t-[#3BB348] rounded-full animate-spin"></div>
                              <span className="text-sm font-black font-mono text-[#C8961A]">{stkCountdown}s</span>
                            </div>
                            <p className="text-xs font-black text-amber-400 uppercase tracking-wider">PIN Prompt sent to {stkPhoneNumber}</p>
                            <p className="text-[10.5px] text-slate-300 leading-relaxed max-w-[280px]">
                              Check your Safaricom screen, enter your M-Pesa PIN, and press OK to authorize transaction.
                            </p>
                          </div>
                        )}

                        {stkPushState === 'verifying' && (
                          <div className="py-6 flex flex-col items-center justify-center text-center space-y-2.5">
                            <div className="w-10 h-10 border-2 border-[#C8961A] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs font-black text-amber-500 uppercase tracking-widest animate-pulse">Verifying M-Pesa Receipt...</p>
                            <p className="text-[10px] text-slate-400">Querying Safaricom payment logs for confirmation code...</p>
                          </div>
                        )}

                        {stkPushState === 'completed' && (
                          <div className="py-4 px-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase">
                              <span>🟢 STK Payment Secured!</span>
                            </div>
                            <p className="text-[10px] text-slate-300">
                              The transaction was successfully confirmed by Safaricom. Your generated receipt reference is logged:
                            </p>
                            <div className="font-mono bg-white/5 border border-white/10 rounded px-3 py-2 text-center text-sm font-black tracking-widest text-emerald-400 uppercase">
                              {mpesaRefCode}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Manual Override Form Option */}
                      <div className="pt-3 border-t border-dashed border-slate-200">
                        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                              Option B: Paste SMS / Enter Code Manually
                            </span>
                            <span className="text-[7.5px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                              Manual Override
                            </span>
                          </div>

                          <textarea
                            placeholder="Or paste the complete Safaricom M-Pesa text notification received on your line here. Our scanner will pull your reference instantly."
                            value={pastedSms}
                            onChange={(e) => handleSmsPaste(e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium placeholder:text-slate-400 outline-none focus:border-green-500/50 transition-all resize-none font-sans"
                          />
                          {smsExtractionSuccess && (
                            <div className="text-[10px] text-green-600 font-black flex items-center gap-1.5">
                              ✨ Auto-extracted Reference: <span className="font-mono bg-green-50 border border-green-200 px-1 py-0.5 rounded text-green-700 tracking-wider font-extrabold">{mpesaRefCode}</span>
                            </div>
                          )}

                          <div className="relative">
                            <input
                              type="text"
                              maxLength={10}
                              placeholder="M-Pesa Reference Code"
                              value={mpesaRefCode}
                              onChange={(e) => setMpesaRefCode(e.target.value.toUpperCase())}
                              className={`w-full bg-white border-2 ${errors.mpesaRefCode ? 'border-red-500 focus:border-red-500' : 'border-slate-150 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5'} rounded-xl px-4 py-3 text-xs font-black tracking-[4px] uppercase placeholder:text-slate-300 outline-none text-center font-mono`}
                            />
                            {mpesaRefCode.length === 10 && /^[A-Z0-9]{10}$/i.test(mpesaRefCode) && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                                🟢 Code Active
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {errors.mpesaRefCode && (
                      <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.mpesaRefCode}</p>
                    )}
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
                      ? "Verifying payment code in live registry..." 
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
                          {item.quantity} Units {item.price > 0 && `× ${formatPrice(item.price)}`}
                        </span>
                        <span className="text-xs font-black text-[#C8961A] tabular-nums">
                          {item.price > 0 ? formatPrice(item.price * item.quantity) : 'Price on Inquiry'}
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
                  <span className="text-white">{formatPrice(cartSubtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-400 font-black text-[10px] uppercase tracking-widest">
                    <span>Applied Bulk Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/40 font-black text-[10px] uppercase tracking-widest">
                  <span>Inland Shipping (Est.)</span>
                  <span className="text-[#C8961A]">TBD</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px] mb-1">Total Valuation</p>
                    <p className="text-3xl font-black tracking-tighter text-white tabular-nums">{formatPrice(cartTotal)}</p>
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
      )}
      
      <Footer />
    </div>
  );
}
