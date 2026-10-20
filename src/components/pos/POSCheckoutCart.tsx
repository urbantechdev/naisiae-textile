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

  // Payment method: cash, mpesa, card, credit
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card' | 'credit'>('cash');
  
  // Quick discount percent state (0, 5, 10, 15, custom)
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customPromoOpen, setCustomPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Cash tender calculations
  const [tenderedAmount, setTenderedAmount] = useState<number | ''>('');
  
  // M-Pesa state
  const [mpesaPhone, setMpesaPhone] = useState(customer.phone || '');
  const [mpesaCode, setMpesaCode] = useState('');
  const [stkStatus, setStkStatus] = useState<'idle' | 'prompted' | 'received'>('idle');

  // Sync phone when customer changes
  useEffect(() => {
    if (customer.phone && !mpesaPhone) {
      setMpesaPhone(customer.phone);
    }
  }, [customer.phone]);

  // Tax calculation (16% VAT inclusive in standard pricing)
  const [taxInclusive, setTaxInclusive] = useState(true);

  // Computed subtotal and discount
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

  const taxAmount = useMemo(() => {
    // 16% VAT portion
    return Math.round((effectiveTotal * 0.16) / 1.16);
  }, [effectiveTotal]);

  // Change due calculator
  const changeDue = useMemo(() => {
    if (tenderedAmount === '' || typeof tenderedAmount !== 'number') return 0;
    return Math.max(0, tenderedAmount - effectiveTotal);
  }, [tenderedAmount, effectiveTotal]);

  // Cash quick presets (rounded to common Kenyan note denominations)
  const quickCashPresets = useMemo(() => {
    const total = effectiveTotal;
    if (total <= 0) return [500, 1000, 2000, 5000];
    const presets: number[] = [total]; // Exact
    [500, 1000, 2000, 5000].forEach(denom => {
      if (denom > total && !presets.includes(denom)) {
        presets.push(denom);
      }
    });
    // Add next round thousand if not present
    const nextThousand = Math.ceil(total / 1000) * 1000;
    if (nextThousand > total && !presets.includes(nextThousand)) {
      presets.push(nextThousand);
    }
    return presets.slice(0, 4);
  }, [effectiveTotal]);

  // Handle discount change
  const handleSelectDiscount = (pct: number) => {
    appExperience.triggerFeedback('tap');
    setDiscountPercent(pct);
    if (pct > 0 && appliedPromo) {
      removePromoCode();
    }
  };

  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    if (res.success) {
      setDiscountPercent(0);
      setPromoMessage({ text: 'Promo code applied!', error: false });
      setPromoInput('');
      setTimeout(() => setPromoMessage(null), 3000);
    } else {
      setPromoMessage({ text: res.message, error: true });
      setTimeout(() => setPromoMessage(null), 3500);
    }
  };

  // Trigger STK Push Simulation
  const handleTriggerStkPush = () => {
    if (!mpesaPhone) {
      setPromoMessage({ text: 'Enter customer phone for STK Push', error: true });
      return;
    }
    appExperience.triggerFeedback('tap');
    setStkStatus('prompted');
    setTimeout(() => {
      setStkStatus('received');
      setMpesaCode(`MP${Math.floor(100000 + Math.random() * 900000)}KE`);
      appExperience.triggerFeedback('success');
    }, 2800);
  };

  // Complete the transaction
  const handleFinalizeSale = () => {
    if (cart.length === 0) return;
    
    appExperience.triggerFeedback('success');

    const ticketNumber = `NT-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const saleRecord: POSSaleRecord = {
      ticketNumber,
      timestamp,
      cashier: 'Alice W. (Register 01)',
      station: 'Uhuru Market Stall 4B',
      customerName: customer.name,
      customerPhone: customer.phone,
      customerType: customer.type,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        variant: item.selectedVariants ? Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ') : undefined,
        customization: item.customization
      })),
      subtotal: effectiveSubtotal,
      discount: effectiveDiscount,
      tax: taxAmount,
      total: effectiveTotal,
      paymentMethod,
      amountTendered: paymentMethod === 'cash' ? (typeof tenderedAmount === 'number' ? tenderedAmount : effectiveTotal) : effectiveTotal,
      changeDue: paymentMethod === 'cash' ? changeDue : 0,
      paymentRef: paymentMethod === 'mpesa' ? (mpesaCode || `MP${Date.now().toString().slice(-6)}`) : undefined
    };

    onCompleteSale(saleRecord);
  };

  return (
    <div className="bg-white flex flex-col h-full rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden select-none">
      {/* 1. Ticket Header Bar */}
      <div className="bg-[#08047D] text-white p-3.5 sm:p-4 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FA9411] text-white flex items-center justify-center shadow-md">
            <ShoppingBag size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">Active Ticket</span>
              <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded text-white font-bold">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-[10px] text-white/70 font-medium">Uhuru Market Register #01</p>
          </div>
        </div>

        {/* Quick Top Tools */}
        <div className="flex items-center gap-1.5">
          {heldCount > 0 && (
            <button
              type="button"
              onClick={onOpenHeldOrders}
              className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-sm active:scale-95"
              title="View held tickets"
            >
              <PauseCircle size={13} />
              <span>Held ({heldCount})</span>
            </button>
          )}

          {cart.length > 0 && (
            <>
              <button
                type="button"
                onClick={onHoldSale}
                className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                title="Hold / Park this ticket"
              >
                <PauseCircle size={13} />
                <span className="hidden sm:inline">Hold</span>
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white text-[10px] font-bold p-1.5 rounded-lg transition-colors"
                title="Void entire ticket"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Customer Profile Pill */}
      <div 
        onClick={onOpenCustomerModal}
        className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between hover:bg-slate-100/80 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#08047D]/10 text-[#08047D] flex items-center justify-center">
            <User size={13} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-tight">
              <span>{customer.name}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-[#08047D]/10 text-[#08047D] rounded font-bold uppercase tracking-wider">
                {customer.type}
              </span>
            </div>
            {customer.phone && (
              <span className="text-[10px] text-slate-500">{customer.phone}</span>
            )}
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#08047D] hover:underline">
          Change
        </span>
      </div>

      {/* 3. Items Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-slate-100">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-3">
              <ShoppingBag size={28} />
            </div>
            <h4 className="text-sm font-bold text-slate-700">Ticket is Empty</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
              Tap any uniform or product from the catalog on the left to add items to this checkout ticket.
            </p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="pt-2.5 first:pt-0 flex items-start justify-between gap-2 group">
              {/* Image thumbnail */}
              <div className="w-11 h-11 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <ShoppingBag size={16} className="text-slate-300" />
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0 pr-1">
                <h5 className="font-bold text-xs text-slate-900 leading-tight truncate">
                  {item.name}
                </h5>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                  <span>{formatPrice(item.price)} each</span>
                  {item.selectedVariants && (
                    <span className="text-slate-400">
                      · {Object.values(item.selectedVariants).join(', ')}
                    </span>
                  )}
                </div>
                {item.customization && (
                  <div className="text-[9px] text-[#FA9411] font-medium italic truncate mt-0.5">
                    {item.customization}
                  </div>
                )}
              </div>

              {/* Stepper & Line Total */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs font-black text-slate-900">
                  {formatPrice(item.price * item.quantity)}
                </span>

                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariants)}
                    className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-red-500 transition-colors"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="text-xs font-bold w-5 text-center text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariants)}
                    className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-[#08047D] transition-colors"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

              {/* Delete Icon */}
              <button
                type="button"
                onClick={() => removeFromCart(item.id, item.selectedVariants)}
                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                title="Remove item"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* 4. Discount & Pricing Section */}
      <div className="p-3.5 sm:p-4 bg-slate-50/80 border-t border-slate-200/90 space-y-2.5 shrink-0">
        {/* Quick Discounts */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            Discount:
          </span>
          <div className="flex items-center gap-1">
            {[0, 5, 10, 15].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleSelectDiscount(pct)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                  discountPercent === pct && !appliedPromo
                    ? 'bg-[#08047D] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pct === 0 ? 'None' : `${pct}%`}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomPromoOpen(!customPromoOpen)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                customPromoOpen || appliedPromo
                  ? 'bg-[#FA9411] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Promo
            </button>
          </div>
        </div>

        {/* Promo code drawer */}
        {customPromoOpen && (
          <form onSubmit={handleApplyPromoCode} className="flex gap-1.5 pt-1">
            <input
              type="text"
              placeholder="Enter code (e.g. UHURU10)"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white uppercase font-bold"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-[#08047D] text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Apply
            </button>
          </form>
        )}

        {promoMessage && (
          <div className={`text-[10px] font-bold ${promoMessage.error ? 'text-red-500' : 'text-emerald-600'}`}>
            {promoMessage.text}
          </div>
        )}

        {/* Calculation Table */}
        <div className="space-y-1 text-xs pt-1 border-t border-slate-200/80">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-800">{formatPrice(effectiveSubtotal)}</span>
          </div>

          {effectiveDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Discount ({discountPercent > 0 ? `${discountPercent}%` : appliedPromo?.code}):</span>
              <span>-{formatPrice(effectiveDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-500 text-[10.5px]">
            <span>VAT (16% inclusive):</span>
            <span>{formatPrice(taxAmount)}</span>
          </div>

          <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">Total Due:</span>
            <span className="text-xl sm:text-2xl font-black text-[#08047D] tracking-tight">
              {formatPrice(effectiveTotal)}
            </span>
          </div>
        </div>

        {/* 5. Payment Tender Mode Selector */}
        <div className="pt-2">
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 rounded-xl text-center">
            <button
              type="button"
              onClick={() => { appExperience.triggerFeedback('tap'); setPaymentMethod('cash'); }}
              className={`py-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all ${
                paymentMethod === 'cash' ? 'bg-white text-[#08047D] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Banknote size={14} />
              <span>Cash</span>
            </button>
            <button
              type="button"
              onClick={() => { appExperience.triggerFeedback('tap'); setPaymentMethod('mpesa'); }}
              className={`py-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all ${
                paymentMethod === 'mpesa' ? 'bg-[#009639] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone size={14} />
              <span>M-Pesa</span>
            </button>
            <button
              type="button"
              onClick={() => { appExperience.triggerFeedback('tap'); setPaymentMethod('card'); }}
              className={`py-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all ${
                paymentMethod === 'card' ? 'bg-white text-[#08047D] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard size={14} />
              <span>Card</span>
            </button>
            <button
              type="button"
              onClick={() => { appExperience.triggerFeedback('tap'); setPaymentMethod('credit'); }}
              className={`py-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all ${
                paymentMethod === 'credit' ? 'bg-white text-[#08047D] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={14} />
              <span>Invoice</span>
            </button>
          </div>

          {/* Payment Specific Controls */}
          {paymentMethod === 'cash' && (
            <div className="mt-2.5 space-y-2 bg-white p-2.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 shrink-0">Tender:</span>
                <input
                  type="number"
                  placeholder="Amount given"
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-2.5 py-1 text-xs font-bold border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              {/* Fast Presets */}
              <div className="flex gap-1 overflow-x-auto pb-0.5">
                {quickCashPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTenderedAmount(preset)}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition-colors shrink-0"
                  >
                    {preset === effectiveTotal ? 'Exact' : formatPrice(preset)}
                  </button>
                ))}
              </div>

              {/* Real-time Change Due */}
              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-500">Change Due:</span>
                <span className={`text-xs font-black ${changeDue > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {formatPrice(changeDue)}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'mpesa' && (
            <div className="mt-2.5 space-y-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                <span>Till No: 489201</span>
                <span>(Naisiae Textiles)</span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="tel"
                  placeholder="Customer 07... / 01..."
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-emerald-300 bg-white font-semibold"
                />
                <button
                  type="button"
                  onClick={handleTriggerStkPush}
                  disabled={stkStatus === 'prompted'}
                  className="px-2.5 py-1 rounded-lg bg-[#009639] hover:bg-[#007a2f] text-white text-[10px] font-bold flex items-center gap-1 shadow-sm shrink-0"
                >
                  <Send size={11} />
                  <span>{stkStatus === 'prompted' ? 'Sent...' : 'Prompt PIN'}</span>
                </button>
              </div>
              {stkStatus === 'received' && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                  <Check size={12} className="text-emerald-600" />
                  <span>Verified: {mpesaCode}</span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="mt-2.5 bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-center">
              <p className="text-xs font-bold text-slate-700">Ready for POS Terminal</p>
              <p className="text-[10px] text-slate-500">Tap or insert customer card on the wireless reader</p>
            </div>
          )}

          {paymentMethod === 'credit' && (
            <div className="mt-2.5 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <p className="text-xs font-bold text-amber-900">30-Day Institutional LPO Terms</p>
              <p className="text-[10px] text-amber-700">Invoice will be assigned to {customer.institution || customer.name}</p>
            </div>
          )}
        </div>

        {/* 6. Big Action Button: Charge / Complete Sale */}
        <button
          type="button"
          disabled={cart.length === 0}
          onClick={handleFinalizeSale}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#08047D] to-[#04023D] hover:from-[#050259] hover:to-[#03012C] disabled:opacity-40 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#08047D]/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Check size={18} className="stroke-[3]" />
          <span>Charge {formatPrice(effectiveTotal)}</span>
        </button>
      </div>
    </div>
  );
}
