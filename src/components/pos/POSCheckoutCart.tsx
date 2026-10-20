import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  PauseCircle, 
  RotateCcw, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  FileText, 
  Check, 
  Sparkles, 
  Percent, 
  ChevronDown,
  X,
  Send,
  AlertCircle
} from 'lucide-react';
import { useCart, CartItem } from '../../context/CartContext';
import { useLocalization } from '../../context/LocalizationContext';
import { appExperience } from '../../utils/haptics';
import { POSCustomerInfo } from './POSCustomerModal';
import { POSSaleRecord } from './POSReceiptModal';
import { AnimateStkPushModal } from './AnimateStkPushModal';

interface POSCheckoutCartProps {
  customer: POSCustomerInfo;
  onOpenCustomerModal: () => void;
  onHoldSale: () => void;
  onOpenHeldOrders: () => void;
  heldCount: number;
  onCompleteSale: (sale: POSSaleRecord) => void;
}

export function POSCheckoutCart({
  customer,
  onOpenCustomerModal,
  onHoldSale,
  onOpenHeldOrders,
  heldCount,
  onCompleteSale
}: POSCheckoutCartProps) {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    cartSubtotal, 
    cartTotal,
    discountAmount,
    appliedPromo,
    applyPromoCode,
    removePromoCode
  } = useCart();
  const { currentCountry, formatPrice } = useLocalization();

  // Simplified Payment method: cash or mpesa
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('cash');
  
  // Quick discount percent state (0, 10)
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Cash tender calculations
  const [tenderedAmount, setTenderedAmount] = useState<number | ''>('');
  
  // M-Pesa state
  const [mpesaPhone, setMpesaPhone] = useState(customer.phone || '');
  const [stkStatus, setStkStatus] = useState<'idle' | 'prompted' | 'received'>('idle');
  const [isStkModalOpen, setIsStkModalOpen] = useState(false);
  const [stkTxCode, setStkTxCode] = useState('');

  // Sync phone when customer changes
  useEffect(() => {
    if (customer.phone && !mpesaPhone) {
      setMpesaPhone(customer.phone);
    }
  }, [customer.phone]);

  const effectiveSubtotal = useMemo(() => {
    return cartSubtotal;
  }, [cartSubtotal]);

  const effectiveDiscount = useMemo(() => {
    if (discountPercent > 0) {
      return Math.round((effectiveSubtotal * discountPercent) / 100);
    }
    return discountAmount;
  }, [effectiveSubtotal, discountPercent, discountAmount]);

  const effectiveTotal = useMemo(() => {
    return Math.max(0, effectiveSubtotal - effectiveDiscount);
  }, [effectiveSubtotal, effectiveDiscount]);

  // Change due calculator
  const changeDue = useMemo(() => {
    if (tenderedAmount === '' || typeof tenderedAmount !== 'number') return 0;
    return Math.max(0, tenderedAmount - effectiveTotal);
  }, [tenderedAmount, effectiveTotal]);

  const handleSelectDiscount = (pct: number) => {
    appExperience.triggerFeedback('tap');
    setDiscountPercent(pct);
  };

  const handleTriggerStkPush = () => {
    if (!mpesaPhone || mpesaPhone.length < 9) {
      alert('Please enter a valid M-Pesa phone number (e.g. 0712345678).');
      return;
    }
    appExperience.triggerFeedback('tap');
    setStkStatus('prompted');
    setIsStkModalOpen(true);
  };

  const handleStkSuccess = (code: string) => {
    setStkTxCode(code);
    setStkStatus('received');
    setIsStkModalOpen(false);
    appExperience.triggerFeedback('success');
  };

  const handleStkCancel = () => {
    setIsStkModalOpen(false);
    setStkStatus('idle');
  };

  // Finalize Sale
  const handleFinalizeSale = () => {
    if (cart.length === 0) return;
    appExperience.triggerFeedback('success');

    const saleRecord: POSSaleRecord = {
      ticketNumber: `SALE-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cashier: 'Main Till 01',
      station: 'Uhuru Market Stall 4B',
      customerType: customer.type || 'Retail',
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        variant: i.selectedVariants ? Object.entries(i.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ') : undefined,
        customization: i.customization
      })),
      subtotal: effectiveSubtotal,
      discount: effectiveDiscount,
      tax: Math.round(effectiveTotal * 0.16 / 1.16),
      total: effectiveTotal,
      paymentMethod: paymentMethod === 'cash' ? 'Cash' : 'M-Pesa Express',
      paymentRef: paymentMethod === 'mpesa' ? (stkTxCode || `MPESA-${Date.now().toString().slice(-6)}`) : undefined,
      customerName: customer.name,
      customerPhone: customer.phone || mpesaPhone,
      amountTendered: paymentMethod === 'cash' ? (typeof tenderedAmount === 'number' ? tenderedAmount : effectiveTotal) : effectiveTotal,
      changeDue: paymentMethod === 'cash' ? changeDue : 0
    };

    onCompleteSale(saleRecord);
    clearCart();
    setTenderedAmount('');
    setStkStatus('idle');
    setStkTxCode('');
  };

  return (
    <div className="w-full h-full bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-100/80 flex flex-col overflow-hidden self-start">
      
      {/* 1. Header & Active Customer */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#08047D] to-[#1a13a8] text-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
            <ShoppingBag size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-xs uppercase tracking-wider text-white">Active Order Ticket</h3>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-blue-100">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-[11px] font-medium text-blue-200 mt-0.5">{formatPrice(effectiveTotal)} total due</p>
          </div>
        </div>

        {/* Customer assignment */}
        <button
          type="button"
          onClick={onOpenCustomerModal}
          className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all border border-white/20 shadow-sm"
        >
          <User size={14} className="text-blue-200" />
          <span className="max-w-[110px] truncate">{customer.name}</span>
        </button>
      </div>

      {/* 2. Quick Ticket Actions (Hold / Clear / Held Orders) */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onHoldSale}
            disabled={cart.length === 0}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-40 transition-all"
          >
            <PauseCircle size={14} className="text-[#FA9411]" />
            <span>Park Ticket</span>
          </button>
          
          {heldCount > 0 && (
            <button
              type="button"
              onClick={onOpenHeldOrders}
              className="px-3 py-1.5 rounded-xl bg-[#FA9411]/15 text-[#FA9411] font-black text-xs border border-[#FA9411]/30 hover:bg-[#FA9411]/25 animate-pulse flex items-center gap-1 shadow-xs"
            >
              <span>Parked Tickets</span>
              <span className="w-5 h-5 rounded-full bg-[#FA9411] text-white flex items-center justify-center text-[10px]">
                {heldCount}
              </span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (cart.length > 0) {
              appExperience.triggerFeedback('pop');
              clearCart();
            }
          }}
          disabled={cart.length === 0}
          className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1.5 disabled:opacity-30 transition-all cursor-pointer"
        >
          <Trash2 size={13} />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* 3. Cart Items Scroll Area */}
      <div className="flex-1 max-h-[260px] sm:max-h-[300px] overflow-y-auto p-4 space-y-3 bg-white">
        {cart.length === 0 ? (
          <div className="py-14 text-center text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-300">
              <ShoppingBag size={32} />
            </div>
            <p className="text-sm font-bold text-slate-700">Ticket is empty</p>
            <p className="text-xs text-slate-400 mt-1">Tap products from the catalog to add items</p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white overflow-hidden shrink-0 border border-slate-200 shadow-xs flex items-center justify-center">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <ShoppingBag size={18} className="text-slate-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span className="font-black text-[#08047D]">{formatPrice(item.price)}</span>
                  {item.selectedVariants?.Size && (
                    <span className="bg-blue-50 text-[#08047D] border border-blue-200 px-2 py-0.5 rounded-md font-mono font-bold text-[10px]">
                      Size: {item.selectedVariants.Size}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-xs">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariants)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-red-500 transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-black w-6 text-center text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariants)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-[#08047D] transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.id, item.selectedVariants)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Remove item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Simplified Checkout & Payment Footer */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/90 space-y-4 shrink-0">
        
        {/* Quick Discount Toggle */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-500">Quick Discount:</span>
          <div className="flex gap-1.5">
            {[0, 10].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleSelectDiscount(pct)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  discountPercent === pct
                    ? 'bg-[#08047D] text-white ring-2 ring-[#08047D]/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pct === 0 ? 'None' : `${pct}% Off`}
              </button>
            ))}
          </div>
        </div>

        {/* Total Summary Card */}
        <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold">{formatPrice(effectiveSubtotal)}</span>
          </div>
          {effectiveDiscount > 0 && (
            <div className="flex justify-between text-xs text-emerald-600 font-bold">
              <span>Discount ({discountPercent}%):</span>
              <span>-{formatPrice(effectiveDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
            <span className="text-xs font-black uppercase text-slate-900 tracking-wider">Total Due:</span>
            <span className="text-2xl font-black text-[#08047D]">{formatPrice(effectiveTotal)}</span>
          </div>
        </div>

        {/* Simplified Payment Method Selector (Cash vs M-Pesa) */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200/80 rounded-2xl">
          <button
            type="button"
            onClick={() => { appExperience.triggerFeedback('tap'); setPaymentMethod('cash'); }}
            className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
              paymentMethod === 'cash' ? 'bg-white text-[#08047D] shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Banknote size={16} />
            <span>Cash</span>
          </button>
          <button
            type="button"
            onClick={() => { appExperience.triggerFeedback('tap'); setPaymentMethod('mpesa'); }}
            className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
              paymentMethod === 'mpesa' ? 'bg-[#009639] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone size={16} />
            <span>M-Pesa</span>
          </button>
        </div>

        {/* Cash Tender Input */}
        {paymentMethod === 'cash' && (
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-600 shrink-0">Cash Tendered:</span>
              <input
                type="number"
                placeholder="Enter amount given"
                value={tenderedAmount}
                onChange={(e) => setTenderedAmount(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#08047D]/30"
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-500">Change Due:</span>
              <span className={`text-sm font-black ${changeDue > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {formatPrice(changeDue)}
              </span>
            </div>
          </div>
        )}

        {/* M-Pesa Input */}
        {paymentMethod === 'mpesa' && (
          <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 space-y-2.5">
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="M-Pesa Number (07...)"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                type="button"
                onClick={handleTriggerStkPush}
                disabled={stkStatus === 'prompted'}
                className="px-4 py-2 rounded-xl bg-[#009639] hover:bg-[#007a2f] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0 transition-all cursor-pointer"
              >
                <Send size={13} />
                <span>{stkStatus === 'prompted' ? 'Sending...' : 'STK Push'}</span>
              </button>
            </div>
            {stkStatus === 'received' && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100/60 p-2 rounded-xl">
                <Check size={15} className="text-emerald-600 stroke-[3]" />
                <span>M-Pesa payment verified successfully!</span>
              </div>
            )}
          </div>
        )}

        {/* Charge Button */}
        <button
          type="button"
          disabled={cart.length === 0}
          onClick={handleFinalizeSale}
          className="w-full py-4 px-5 rounded-2xl bg-[#08047D] hover:bg-[#050259] disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-[#08047D]/25 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
        >
          <Check size={18} className="stroke-[3]" />
          <span>Charge {formatPrice(effectiveTotal)}</span>
        </button>

      </div>

      {/* Centered Animated STK Push Modal */}
      <AnimateStkPushModal
        isOpen={isStkModalOpen}
        phoneNumber={mpesaPhone}
        amount={effectiveTotal}
        onSuccess={handleStkSuccess}
        onCancel={handleStkCancel}
      />
    </div>
  );
}
