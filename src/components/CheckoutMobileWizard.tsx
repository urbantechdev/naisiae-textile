import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Truck, 
  Mail, 
  Phone, 
  User, 
  ArrowRight, 
  Copy, 
  Check 
} from 'lucide-react';
import { appExperience } from '../utils/haptics';

interface CheckoutMobileWizardProps {
  cart: any[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  cartSubtotal: number;
  cartTotal: number;
  discountAmount: number;
  appliedPromo: any;
  formatPrice: (price: number) => string;
  formData: {
    name: string;
    email: string;
    phone: string;
    institution: string;
    details: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  checkoutMethod: 'rfq' | 'mpesa';
  setCheckoutMethod: (method: 'rfq' | 'mpesa') => void;
  mpesaPaymentOption: 'deposit' | 'full';
  setMpesaPaymentOption: (option: 'deposit' | 'full') => void;
  mpesaRefCode: string;
  setMpesaRefCode: (code: string) => void;
  pastedSms: string;
  handleSmsPaste: (text: string) => void;
  handleCopyNumber: () => void;
  handleCopyAmount: (amount: number) => void;
  copiedNumber: boolean;
  copiedAmount: boolean;
  smsExtractionSuccess: boolean;
  loading: boolean;
  errors: Record<string, string>;
  validateStep: (step: number) => boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  activeCheckoutStep: number;
  setActiveCheckoutStep: React.Dispatch<React.SetStateAction<number>>;
  currentUser: any;
  handleGoogleSignIn: () => void;
  handleSignOut: () => void;
  authLoading: boolean;
  deliveryMethod: 'pickup' | 'nairobi' | 'other';
  setDeliveryMethod: (method: 'pickup' | 'nairobi' | 'other') => void;
  stkPushState: 'idle' | 'sending' | 'pending_pin' | 'verifying' | 'completed';
  stkCountdown: number;
  stkPhoneNumber: string;
  setStkPhoneNumber: (phone: string) => void;
  handleInitiateStkPush: () => Promise<void>;
}

export const CheckoutMobileWizard: React.FC<CheckoutMobileWizardProps> = ({
  cart,
  updateQuantity,
  cartSubtotal,
  cartTotal,
  discountAmount,
  formatPrice,
  formData,
  setFormData,
  checkoutMethod,
  setCheckoutMethod,
  mpesaPaymentOption,
  setMpesaPaymentOption,
  mpesaRefCode,
  setMpesaRefCode,
  pastedSms,
  handleSmsPaste,
  handleCopyNumber,
  handleCopyAmount,
  copiedNumber,
  copiedAmount,
  smsExtractionSuccess,
  loading,
  errors,
  validateStep,
  handleSubmit,
  activeCheckoutStep,
  setActiveCheckoutStep,
  currentUser,
  handleGoogleSignIn,
  handleSignOut,
  authLoading,
  deliveryMethod,
  setDeliveryMethod,
  stkPushState,
  stkCountdown,
  stkPhoneNumber,
  setStkPhoneNumber,
  handleInitiateStkPush,
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 pt-20 px-4">
      {/* Mobile App Top Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-[#0A1628] uppercase tracking-wide">Sourcing Checkout</h1>
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Secure Sourcing Gateway</p>
        </div>
        <div className="bg-[#C8102E]/10 text-[#C8102E] text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
          Bulk Sourcing
        </div>
      </div>

      {/* Steps Horizontal indicator bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-6">
        <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2">
          <span className="text-[#0A1628]">
            {activeCheckoutStep === 0 && "Step 1: Lead Details"}
            {activeCheckoutStep === 1 && "Step 2: Sourcing Mode"}
            {activeCheckoutStep === 2 && "Step 3: Review Order"}
          </span>
          <span className="text-[#C8102E]">{activeCheckoutStep + 1} of 3</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (idx < activeCheckoutStep || validateStep(activeCheckoutStep)) {
                  setActiveCheckoutStep(idx);
                  appExperience.triggerHaptic('light');
                  appExperience.playSound('tap');
                } else {
                  appExperience.triggerHaptic('error');
                }
              }}
              className="h-1.5 focus:outline-none w-full"
            >
              <div className={`h-full rounded-full transition-all duration-300 ${
                idx === activeCheckoutStep 
                  ? 'bg-[#C8102E]' 
                  : idx < activeCheckoutStep 
                    ? 'bg-[#0A1628]' 
                    : 'bg-slate-200'
              }`} />
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-5">
        <AnimatePresence mode="wait">
          {activeCheckoutStep === 0 && (
            <motion.div
              key="step_contact"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Google auth card if not logged in */}
              {!currentUser ? (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50/20 p-5 rounded-3xl border border-indigo-100/50 space-y-3">
                  <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wide">Sync Your Uhuru Account</h3>
                  <p className="text-[10px] text-indigo-600 font-semibold leading-relaxed">
                    Log in with Google to pre-fill your corporate institutional details and secure real-time tracking dashboard access.
                  </p>
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={() => {
                      appExperience.triggerHaptic('medium');
                      appExperience.playSound('tap');
                      handleGoogleSignIn();
                    }}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {authLoading ? "Initializing Sync..." : "Sync with Google Profile"}
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 border border-slate-300">
                      <img src={currentUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.displayName}`} className="w-full h-full object-cover" alt="avatar" />
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Active Profile</span>
                      <span className="text-xs font-black text-[#0A1628] uppercase block mt-0.5">{currentUser.displayName}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      appExperience.triggerHaptic('light');
                      appExperience.playSound('tap');
                      handleSignOut();
                    }}
                    className="text-[9px] font-black text-red-600 hover:text-red-700 uppercase"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* Personal details card */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <User className="text-[#C8961A]" size={16} />
                  <h3 className="text-xs font-black text-[#0A1628] uppercase tracking-wider">Procurement Lead Details</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Grace Wambui"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:border-[#C8102E] outline-none transition-all"
                    />
                    {errors.name && <p className="text-red-500 text-[10px] font-bold mt-0.5">{errors.name}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. grace@school.ac.ke"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:border-[#C8102E] outline-none transition-all"
                    />
                    {errors.email && <p className="text-red-500 text-[10px] font-bold mt-0.5">{errors.email}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Phone (Safaricom M-Pesa)</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 0712345678"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:border-[#C8102E] outline-none transition-all"
                    />
                    {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-0.5">{errors.phone}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Institution / Organization</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={e => setFormData({ ...formData, institution: e.target.value })}
                      placeholder="e.g. Kenya High School"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:border-[#C8102E] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Customization / Delivery Terms</label>
                    <textarea
                      rows={2}
                      value={formData.details}
                      onChange={e => setFormData({ ...formData, details: e.target.value })}
                      placeholder="Logo colors, branding positions, custom measurements..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:border-[#C8102E] outline-none resize-none transition-all"
                    />
                  </div>

                  {/* Delivery Mode Selection Card */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <label className="text-[9px] font-black uppercase text-[#0A1628] tracking-[1px] block">
                      🚚 Sourcing Delivery Option
                    </label>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryMethod('pickup');
                          appExperience.triggerHaptic('light');
                          appExperience.playSound('tap');
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                          deliveryMethod === 'pickup'
                            ? 'bg-amber-500/5 border-[#C8961A] text-[#0A1628]'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-black uppercase tracking-wider">Self Pick-up</span>
                          <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Ksh 0.00</span>
                        </div>
                        <p className="text-[8.5px] text-slate-400 font-semibold leading-normal">
                          Collect directly from our Uhuru Market, Nairobi factory stall.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryMethod('nairobi');
                          appExperience.triggerHaptic('light');
                          appExperience.playSound('tap');
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                          deliveryMethod === 'nairobi'
                            ? 'bg-green-500/5 border-green-500 text-[#0A1628]'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-black uppercase tracking-wider">Nairobi Courier</span>
                          <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">Ksh 300.00</span>
                        </div>
                        <p className="text-[8.5px] text-slate-400 font-semibold leading-normal">
                          Express delivery to your doorstep within Nairobi county.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryMethod('other');
                          appExperience.triggerHaptic('light');
                          appExperience.playSound('tap');
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                          deliveryMethod === 'other'
                            ? 'bg-blue-500/5 border-blue-500 text-[#0A1628]'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-black uppercase tracking-wider">Other Regions / Export</span>
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">TBD</span>
                        </div>
                        <p className="text-[8.5px] text-slate-400 font-semibold leading-normal">
                          Countrywide parcel or international export shipping. Quote on WhatsApp.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeCheckoutStep === 1 && (
            <motion.div
              key="step_method"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Checkout Sourcing Method choices */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <Truck className="text-[#C8961A]" size={16} />
                  <h3 className="text-xs font-black text-[#0A1628] uppercase tracking-wider">Choose Sourcing Method</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* RFQ */}
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutMethod('rfq');
                      appExperience.triggerHaptic('light');
                      appExperience.playSound('tap');
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      checkoutMethod === 'rfq'
                        ? 'border-[#C8961A] bg-[#C8961A]/5 ring-4 ring-[#C8961A]/5'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-xl mb-1.5 block">📋</span>
                    <h4 className="text-[10px] font-black uppercase text-[#0A1628] tracking-wider">RFQ Check</h4>
                    <p className="text-[8px] text-slate-400 mt-1 font-semibold leading-normal">Submit a quotation request. Finalize billing via WhatsApp.</p>
                  </button>

                  {/* M-Pesa */}
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutMethod('mpesa');
                      appExperience.triggerHaptic('light');
                      appExperience.playSound('tap');
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      checkoutMethod === 'mpesa'
                        ? 'border-green-500 bg-green-500/5 ring-4 ring-green-500/5'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-xl mb-1.5 block">💚</span>
                    <h4 className="text-[10px] font-black uppercase text-[#0A1628] tracking-wider">M-Pesa Log</h4>
                    <p className="text-[8px] text-slate-400 mt-1 font-semibold leading-normal">Record mobile payment to queue orders immediately.</p>
                  </button>
                </div>

                {checkoutMethod === 'mpesa' && (
                  <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-305">
                    {/* Booking levels */}
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100">
                      <label className="text-[9px] font-black uppercase text-slate-400 block">Sourcing Level</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMpesaPaymentOption('deposit');
                            appExperience.triggerHaptic('light');
                            appExperience.playSound('tap');
                          }}
                          className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                            mpesaPaymentOption === 'deposit'
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white text-slate-400 border-slate-150'
                          }`}
                        >
                          50% Deposit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMpesaPaymentOption('full');
                            appExperience.triggerHaptic('light');
                            appExperience.playSound('tap');
                          }}
                          className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                            mpesaPaymentOption === 'full'
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white text-slate-400 border-slate-150'
                          }`}
                        >
                          100% Full
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-[11px] border-t border-slate-200/50 pt-2 text-slate-500 font-bold">
                        <span>Expected Pay:</span>
                        <span className="font-mono text-xs text-[#0A1628] font-black">
                          Ksh {(mpesaPaymentOption === 'deposit' ? Math.round(cartTotal * 0.5) : cartTotal).toLocaleString()}/-
                        </span>
                      </div>
                    </div>
                                       {/* Premium Safaricom STK Push module */}
                    <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 shadow-xl relative overflow-hidden border border-emerald-500/20">
                      <div className="absolute top-0 right-0 bg-[#3BB348] text-white text-[7px] font-black px-2 py-0.5 rounded-bl uppercase tracking-wider">
                        STK Push Active
                      </div>
                      
                      <div>
                        <span className="text-[8px] font-black text-[#C8961A] tracking-[2px] uppercase block mb-1">Safaricom Lipa na M-Pesa</span>
                        <h4 className="text-xs font-black text-white uppercase tracking-wide">M-Pesa Express STK Push</h4>
                        <p className="text-[9px] text-slate-300 font-semibold leading-normal mt-1">
                          Our automated gateway will trigger an instant PIN prompt on your Safaricom mobile line.
                        </p>
                      </div>

                      {stkPushState === 'idle' && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">M-Pesa Mobile Number</label>
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
                            <span>Send STK Push Prompt 📲</span>
                          </button>
                        </div>
                      )}

                      {stkPushState === 'sending' && (
                        <div className="py-4 flex flex-col items-center justify-center text-center space-y-2">
                          <div className="w-8 h-8 border-2 border-[#3BB348] border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">Initiating secure handshake...</p>
                          <p className="text-[8px] text-slate-400">Requesting M-Pesa STK API payload for {stkPhoneNumber}</p>
                        </div>
                      )}

                      {stkPushState === 'pending_pin' && (
                        <div className="py-4 flex flex-col items-center justify-center text-center space-y-2.5">
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <div className="absolute inset-0 border-2 border-slate-700 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-t-[#3BB348] rounded-full animate-spin"></div>
                            <span className="text-xs font-black font-mono text-[#C8961A]">{stkCountdown}s</span>
                          </div>
                          <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider">PIN Prompt sent to {stkPhoneNumber}</p>
                          <p className="text-[9px] text-slate-300 leading-normal max-w-[220px]">
                            Check your Safaricom screen, enter your M-Pesa PIN, and press OK to authorize transaction.
                          </p>
                        </div>
                      )}

                      {stkPushState === 'verifying' && (
                        <div className="py-4 flex flex-col items-center justify-center text-center space-y-2">
                          <div className="w-8 h-8 border-2 border-[#C8961A] border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse">Verifying M-Pesa Receipt...</p>
                          <p className="text-[8px] text-slate-400">Querying Safaricom payment logs for confirmation code...</p>
                        </div>
                      )}

                      {stkPushState === 'completed' && (
                        <div className="py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1.5">
                          <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase">
                            <span>🟢 STK Payment Secured!</span>
                          </div>
                          <p className="text-[9px] text-slate-300">
                            The transaction was successfully processed by Safaricom. Your generated receipt reference is logged:
                          </p>
                          <div className="font-mono bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-center text-xs font-black tracking-widest text-emerald-400 uppercase">
                            {mpesaRefCode}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Manual Override Option */}
                    <div className="pt-2 border-t border-dashed border-slate-200">
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2">
                        <p className="text-[8.5px] font-bold text-slate-500 leading-normal">
                          💡 Experiencing delays? You can also manually paste a Safaricom text confirmation or transaction reference below:
                        </p>
                        
                        <input
                          type="text"
                          value={mpesaRefCode}
                          onChange={(e) => setMpesaRefCode(e.target.value.toUpperCase())}
                          placeholder="Or enter Code manually (e.g. SAB4F9G1D4)"
                          maxLength={10}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-black tracking-wider outline-none focus:border-green-500 text-center uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeCheckoutStep === 2 && (
            <motion.div
              key="step_review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Order Sourcing item review lists */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <ShoppingBag className="text-[#C8961A]" size={16} />
                  <h3 className="text-xs font-black text-[#0A1628] uppercase tracking-wider">Review Sourcing Items</h3>
                </div>

                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 p-2 bg-slate-55 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200/50 bg-white shrink-0">
                          <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[11px] font-black text-[#0A1628] truncate uppercase">{item.name}</h4>
                          <p className="text-[9px] text-slate-400 font-extrabold mt-0.5">{formatPrice(item.price)} each</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            updateQuantity(item.id, item.quantity - 1);
                            appExperience.triggerHaptic('light');
                            appExperience.playSound('tap');
                          }}
                          className="w-5.5 h-5.5 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400"
                        >
                          <Minus size={9} />
                        </button>
                        <span className="text-[10px] font-bold font-mono">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => {
                            updateQuantity(item.id, item.quantity + 1);
                            appExperience.triggerHaptic('light');
                            appExperience.playSound('tap');
                          }}
                          className="w-5.5 h-5.5 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400"
                        >
                          <Plus size={9} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sourcing Totals list */}
                <div className="border-t border-slate-100 pt-3.5 space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase tracking-wider">
                    <span>Items Subtotal:</span>
                    <span className="text-slate-800">{formatPrice(cartSubtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[10px] text-emerald-600 font-black uppercase tracking-wider">
                      <span>Bulk Discount:</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-[#0A1628] border-t border-slate-50 pt-2">
                    <span>Total Order:</span>
                    <span className="text-[#C8961A] text-xs">{formatPrice(cartTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Security shield notice */}
              <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100 flex items-start gap-3">
                <ShieldCheck className="text-emerald-600 mt-0.5 shrink-0" size={16} />
                <div>
                  <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-wide">Secure Sourcing Escrow</h4>
                  <p className="text-[9px] text-emerald-700 leading-normal font-medium mt-0.5">
                    Your sourcing inquiry and payments are escrowed safely under Naisiae Textiles Ltd & Uhuru Market Uniform compliance terms.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky App-Like Bottom Floating Command Plate */}
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-150 p-4 z-40 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] flex items-center justify-between gap-4 pb-safe">
          <div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Sourcing Total</span>
            <span className="text-base font-black text-[#0A1628] tabular-nums block">
              {formatPrice(checkoutMethod === 'mpesa' && mpesaPaymentOption === 'deposit' ? Math.round(cartTotal * 0.5) : cartTotal)}
            </span>
            {checkoutMethod === 'mpesa' && mpesaPaymentOption === 'deposit' && (
              <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">50% Booking Deposit</span>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            {activeCheckoutStep > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveCheckoutStep(prev => prev - 1);
                  appExperience.triggerHaptic('light');
                  appExperience.playSound('pop');
                }}
                className="h-11 px-4.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center"
              >
                Back
              </button>
            )}
            {activeCheckoutStep < 2 ? (
              <button
                type="button"
                onClick={() => {
                  if (validateStep(activeCheckoutStep)) {
                    setActiveCheckoutStep(prev => prev + 1);
                    appExperience.triggerHaptic('medium');
                    appExperience.playSound('tap');
                  } else {
                    appExperience.triggerHaptic('error');
                  }
                }}
                className="h-11 px-5.5 bg-gradient-to-r from-[#0A1628] to-[#1C3560] text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-1"
              >
                Next Step <ArrowRight size={11} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="h-11 px-5.5 bg-gradient-to-r from-[#C2112E] to-[#E94C36] text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-1"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Complete <Check size={11} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
