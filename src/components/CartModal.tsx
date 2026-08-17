import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, ShieldCheck, Tag, Ticket } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    cartSubtotal, 
    applyPromoCode, 
    removePromoCode, 
    appliedPromo, 
    discountAmount, 
    cartTotal 
  } = useCart();
  const navigate = useNavigate();
  const { formatPrice } = useLocalization();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const FREE_SHIPPING_THRESHOLD = 5000;
  const progressToFreeShipping = Math.min((cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - cartSubtotal, 0);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const result = applyPromoCode(promoInput);
    if (!result.success) {
      setPromoError(result.message);
      setTimeout(() => setPromoError(''), 3000);
    } else {
      setPromoInput('');
      setPromoError('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] overflow-hidden">
          {/* Backdrop Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#08047D]/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Sliding Cart Drawer Container */}
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full sm:w-screen sm:max-w-md bg-white sm:rounded-l-[2rem] shadow-[-20px_0_50px_rgba(0,0,0,0.15)] flex flex-col relative overflow-hidden"
            >
              {/* Header Interface */}
              <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#08047D] rounded-xl sm:rounded-2xl flex items-center justify-center text-[#FA9411]">
                    <ShoppingBag size={18} className="sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-black uppercase tracking-[2px] sm:tracking-[3px] text-[#08047D]">Your Cart</h2>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {cart.length} {cart.length === 1 ? 'Item' : 'Items'} Selected
                    </p>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  aria-label="Close Cart"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Free Shipping Progress */}
              {cart.length > 0 && (
                <div className="px-4 sm:px-8 py-3 sm:py-4 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div className="flex items-center gap-2">
                      <Truck size={13} className={remainingForFreeShipping === 0 ? 'text-green-500' : 'text-[#FA9411]'} />
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-700">
                        {remainingForFreeShipping === 0 
                          ? 'You qualify for Free Shipping!' 
                          : `Add ${formatPrice(remainingForFreeShipping)} for Free Shipping`}
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400">{Math.round(progressToFreeShipping)}%</span>
                  </div>
                  <div className="h-1 sm:h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToFreeShipping}%` }}
                      className={`h-full rounded-full transition-all duration-1000 ${remainingForFreeShipping === 0 ? 'bg-green-500' : 'bg-[#FA9411]'}`}
                    />
                  </div>
                </div>
              )}

              {/* Scrollable Items Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8 py-12 sm:py-20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-slate-100 rounded-full blur-2xl opacity-50 scale-150"></div>
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 relative z-10 border border-slate-100">
                        <ShoppingBag size={36} className="sm:w-[42px] sm:h-[42px]" />
                      </div>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-[2px] sm:tracking-[3px]">Your Bag is Empty</h3>
                      <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-widest max-w-[180px] sm:max-w-[200px] mx-auto leading-relaxed">
                        Start adding some of our premium textiles to your collection.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        onClose();
                        navigate('/products');
                      }}
                      className="px-6 py-3 sm:px-8 sm:py-4 bg-[#08047D] text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-[2px] sm:tracking-[3px] hover:bg-[#08047D] transition-all shadow-xl shadow-[#08047D]/10 active:scale-95"
                    >
                      Shop Featured Collection
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {cart.map((item, index) => (
                      <motion.div 
                        key={`${item.id}-${item.selectedVariants ? JSON.stringify(item.selectedVariants) : 'default'}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-3.5 sm:gap-5 p-3.5 sm:p-5 bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100 relative group transition-all hover:border-[#FA9411]/30 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
                      >
                        {/* Product Thumbnail Asset */}
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-50 rounded-xl sm:rounded-[1.2rem] overflow-hidden border border-slate-100 shrink-0 group-hover:scale-[1.02] transition-transform duration-500">
                          <img 
                            src={item.imageUrl || 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80'} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Content Management Blocks */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div className="space-y-1">
                            <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wide text-[#08047D] truncate pr-8 group-hover:text-[#08047D] transition-colors">
                              {item.name}
                            </h4>
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              {item.selectedVariants && Object.entries(item.selectedVariants).map(([type, value]) => (
                                <span key={type} className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-[#FA9411] bg-[#FA9411]/5 px-1.5 sm:px-2 py-0.5 rounded-full border border-[#FA9411]/10">
                                  {type}: {value}
                                </span>
                              ))}
                              <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-slate-400">
                                Unit: {formatPrice(item.price)}
                              </span>
                            </div>

                            {/* Logo Customization details inside Shopping Cart */}
                            {item.brandingType && (
                              <div className="pt-1.5 flex flex-col gap-1 border-t border-slate-50 mt-1">
                                <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-[#FA9411] flex items-center gap-1">
                                  🪡 {item.brandingType} ({item.brandingPosition})
                                </span>
                                {item.customLogoUrl && (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-6 h-6 bg-white p-0.5 border border-slate-150 rounded overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                                      <img src={item.customLogoUrl} className="max-w-full max-h-full object-contain" alt="mini logo attachment preview" />
                                    </div>
                                    <span className="text-[7.5px] text-slate-400 font-bold truncate max-w-[100px] uppercase">
                                      {item.customLogoName || 'Custom Logo'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Interactive Quantity Mutators */}
                          <div className="flex items-center justify-between mt-2 sm:mt-3">
                            <div className="flex items-center bg-slate-50 rounded-lg px-0.5 py-0.5 border border-slate-100">
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariants)} 
                                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md hover:bg-white text-slate-400 hover:text-red-500 transition-all"
                                aria-label="Decrease Quantity"
                              >
                                <Minus size={9} />
                              </button>
                              <span className="px-2 sm:px-3 text-[10px] sm:text-[11px] font-black text-[#08047D] tabular-nums min-w-[20px] text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariants)} 
                                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md hover:bg-white text-slate-400 hover:text-[#FA9411] transition-all"
                                aria-label="Increase Quantity"
                              >
                                <Plus size={9} />
                              </button>
                            </div>
                            
                            <span className="text-xs font-black text-[#08047D] tabular-nums">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>

                        {/* Explicit Row Deletion Hook */}
                        <button 
                          onClick={() => removeFromCart(item.id, item.selectedVariants)} 
                          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 text-slate-300 hover:text-red-500 transition-all p-1 group-hover:opacity-100"
                          aria-label="Remove Item"
                        >
                          <Trash2 size={13} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                      </motion.div>
                    ))}

                    {/* Promo Code Input Block */}
                    <div className="pt-3.5 border-t border-slate-50">
                      {!appliedPromo ? (
                        <form onSubmit={handleApplyPromo} className="relative group">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FA9411] transition-colors">
                            <Tag size={13} />
                          </div>
                          <input 
                            type="text" 
                            placeholder="Enter Promo Code (e.g. UHURU10)" 
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl py-3.5 pl-9.5 pr-20 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider focus:bg-white focus:border-[#FA9411]/30 focus:ring-4 focus:ring-[#FA9411]/5 outline-none transition-all placeholder:text-slate-300"
                          />
                          <button 
                            type="submit"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#08047D] text-white rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-[#08047D] transition-all active:scale-95 shadow-lg shadow-[#08047D]/10"
                          >
                            Apply
                          </button>
                          {promoError && (
                            <motion.p 
                              initial={{ opacity: 0, y: -10 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              className="text-[8px] sm:text-[9px] font-bold text-red-500 uppercase tracking-widest mt-1.5 ml-3"
                            >
                              {promoError}
                            </motion.p>
                          )}
                        </form>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                              <Ticket size={13} />
                            </div>
                            <div>
                              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[1.5px] text-green-800">{appliedPromo.code}</p>
                              <p className="text-[7.5px] sm:text-[8px] font-bold text-green-600 uppercase tracking-widest">Code Applied Successfully</p>
                            </div>
                          </div>
                          <button 
                            onClick={removePromoCode}
                            className="p-1.5 text-green-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Summary Callout Layer */}
              {cart.length > 0 && (
                <div className="p-4 sm:p-8 border-t border-slate-100 bg-white space-y-4 sm:space-y-6 shadow-[0_-30px_60px_rgba(0,0,0,0.05)]">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Merchandise Subtotal</span>
                      <span className="text-xs sm:text-sm font-bold tabular-nums">{formatPrice(cartSubtotal)}</span>
                    </div>
                    
                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between text-green-600">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Limited Promo Discount</span>
                        <span className="text-xs sm:text-sm font-bold tabular-nums">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Taxes (VAT Incl.)</span>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest italic text-right">Calculated</span>
                    </div>
                    <div className="h-[1px] w-full bg-slate-100"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] font-black text-[#08047D] uppercase tracking-[1.5px] sm:tracking-[2px]">Total Payable</span>
                      <span className="text-xl sm:text-2xl font-black text-[#08047D] tracking-tight tabular-nums">
                        {formatPrice(cartTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/checkout');
                      }}
                      className="w-full flex items-center justify-center gap-3 sm:gap-4 py-4 sm:py-5 bg-[#08047D] text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-[3px] sm:tracking-[4px] hover:bg-[#08047D] transition-all shadow-2xl shadow-[#08047D]/20 group active:scale-[0.98]"
                    >
                      Initialize Secure Checkout 
                      <div className="p-0.5 sm:p-1 bg-white/10 rounded group-hover:bg-white group-hover:text-[#08047D] transition-all">
                        <ArrowRight size={11} className="sm:w-3 sm:h-3" />
                      </div>
                    </button>
                    
                    <button 
                      onClick={onClose}
                      className="w-full py-3 text-slate-400 font-black text-[8px] sm:text-[9px] uppercase tracking-[2px] sm:tracking-[3px] hover:text-[#08047D] transition-colors"
                    >
                      ← Continue Sourcing Fabrics
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 sm:gap-3 py-2.5 sm:py-3 px-3.5 sm:px-4 bg-slate-50 rounded-xl">
                    <ShieldCheck size={13} className="text-green-600 sm:w-3.5 sm:h-3.5" />
                    <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">
                      Encrypted Logistics Compliance Secured
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}