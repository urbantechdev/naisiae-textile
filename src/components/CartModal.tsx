import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, ShieldCheck, Tag, Ticket } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';

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
            className="absolute inset-0 bg-[#0A1628]/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Sliding Cart Drawer Container */}
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-screen max-w-md bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] flex flex-col relative"
            >
              {/* Header Interface */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#0A1628] rounded-2xl flex items-center justify-center text-[#C8961A]">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[3px] text-[#0A1628]">Your Cart</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {cart.length} {cart.length === 1 ? 'Item' : 'Items'} Selected
                    </p>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  aria-label="Close Cart"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Free Shipping Progress */}
              {cart.length > 0 && (
                <div className="px-8 py-4 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Truck size={14} className={remainingForFreeShipping === 0 ? 'text-green-500' : 'text-[#C8961A]'} />
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                        {remainingForFreeShipping === 0 
                          ? 'You qualify for Free Shipping!' 
                          : `Add ${remainingForFreeShipping.toLocaleString()}/- for Free Shipping`}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400">{Math.round(progressToFreeShipping)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToFreeShipping}%` }}
                      className={`h-full rounded-full transition-all duration-1000 ${remainingForFreeShipping === 0 ? 'bg-green-500' : 'bg-[#C8961A]'}`}
                    />
                  </div>
                </div>
              )}

              {/* Scrollable Items Container */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-slate-100 rounded-full blur-2xl opacity-50 scale-150"></div>
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 relative z-10 border border-slate-100">
                        <ShoppingBag size={42} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[3px]">Your Bag is Empty</h3>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                        Start adding some of our premium textiles to your collection.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        onClose();
                        navigate('/products');
                      }}
                      className="px-8 py-4 bg-[#0A1628] text-white rounded-2xl font-black text-[10px] uppercase tracking-[3px] hover:bg-[#C8102E] transition-all shadow-xl shadow-[#0A1628]/10 active:scale-95"
                    >
                      Shop Featured Collection
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <motion.div 
                        key={`${item.id}-${item.selectedVariants ? JSON.stringify(item.selectedVariants) : 'default'}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-5 p-5 bg-white rounded-[2.5rem] border border-slate-100 relative group transition-all hover:border-[#C8961A]/30 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
                      >
                        {/* Product Thumbnail Asset */}
                        <div className="w-24 h-24 bg-slate-50 rounded-[1.5rem] overflow-hidden border border-slate-100 shrink-0 group-hover:scale-[1.02] transition-transform duration-500">
                          <img 
                            src={item.imageUrl || 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80'} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Content Management Blocks */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-wide text-[#0A1628] truncate pr-8 group-hover:text-[#C8102E] transition-colors">
                              {item.name}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {item.selectedVariants && Object.entries(item.selectedVariants).map(([type, value]) => (
                                <span key={type} className="text-[8px] font-black uppercase tracking-wider text-[#C8961A] bg-[#C8961A]/5 px-2 py-0.5 rounded-full border border-[#C8961A]/10">
                                  {type}: {value}
                                </span>
                              ))}
                              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                                Unit: {item.price.toLocaleString()}/-
                              </span>
                            </div>

                            {/* Logo Customization details inside Shopping Cart */}
                            {item.brandingType && (
                              <div className="pt-2 flex flex-col gap-1.5 border-t border-slate-50 mt-1.5">
                                <span className="text-[8px] font-black uppercase tracking-wider text-[#C8961A] flex items-center gap-1">
                                  🪡 {item.brandingType} ({item.brandingPosition})
                                </span>
                                {item.customLogoUrl && (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-7 h-7 bg-white p-0.5 border border-slate-150 rounded-lg overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                                      <img src={item.customLogoUrl} className="max-w-full max-h-full object-contain" alt="mini logo attachment preview" />
                                    </div>
                                    <span className="text-[8px] text-slate-400 font-bold truncate max-w-[120px] uppercase">
                                      {item.customLogoName || 'Custom Logo'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Interactive Quantity Mutators */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center bg-slate-50 rounded-xl px-1 py-1 border border-slate-100">
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariants)} 
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-slate-400 hover:text-red-500 transition-all"
                                aria-label="Decrease Quantity"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="px-3 text-[11px] font-black text-[#0A1628] tabular-nums min-w-[24px] text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariants)} 
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-slate-400 hover:text-[#C8961A] transition-all"
                                aria-label="Increase Quantity"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                            
                            <span className="text-xs font-black text-[#0A1628] tabular-nums">
                              {(item.price * item.quantity).toLocaleString()}/-
                            </span>
                          </div>
                        </div>

                        {/* Explicit Row Deletion Hook */}
                        <button 
                          onClick={() => removeFromCart(item.id, item.selectedVariants)} 
                          className="absolute top-5 right-5 text-slate-200 hover:text-red-500 transition-all p-1 group-hover:opacity-100"
                          aria-label="Remove Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}

                    {/* Promo Code Input Block */}
                    <div className="pt-4 border-t border-slate-50">
                      {!appliedPromo ? (
                        <form onSubmit={handleApplyPromo} className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#C8961A] transition-colors">
                            <Tag size={14} />
                          </div>
                          <input 
                            type="text" 
                            placeholder="Enter Promo Code (e.g. UHURU10)" 
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-11 pr-24 text-[10px] font-bold uppercase tracking-wider focus:bg-white focus:border-[#C8961A]/30 focus:ring-4 focus:ring-[#C8961A]/5 outline-none transition-all placeholder:text-slate-300"
                          />
                          <button 
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#0A1628] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#C8102E] transition-all active:scale-95 shadow-lg shadow-[#0A1628]/10"
                          >
                            Apply
                          </button>
                          {promoError && (
                            <motion.p 
                              initial={{ opacity: 0, y: -10 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-2 ml-4"
                            >
                              {promoError}
                            </motion.p>
                          )}
                        </form>
                      ) : (
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                              <Ticket size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[2px] text-green-800">{appliedPromo.code}</p>
                              <p className="text-[8px] font-bold text-green-600 uppercase tracking-widest">Code Applied Successfully</p>
                            </div>
                          </div>
                          <button 
                            onClick={removePromoCode}
                            className="p-2 text-green-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Summary Callout Layer */}
              {cart.length > 0 && (
                <div className="p-8 border-t border-slate-100 bg-white space-y-6 shadow-[0_-30px_60px_rgba(0,0,0,0.05)]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">Merchandise Subtotal</span>
                      <span className="text-sm font-bold tabular-nums">{cartSubtotal.toLocaleString()}/-</span>
                    </div>
                    
                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between text-green-600">
                        <span className="text-[10px] font-black uppercase tracking-widest">Limited Promo Discount</span>
                        <span className="text-sm font-bold tabular-nums">-{discountAmount.toLocaleString()}/-</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">Taxes (VAT Incl.)</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest italic">Calculated</span>
                    </div>
                    <div className="h-[1px] w-full bg-slate-100"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-[#0A1628] uppercase tracking-[2px]">Total Payable</span>
                      <span className="text-2xl font-black text-[#0A1628] tracking-tight tabular-nums">
                        {cartTotal.toLocaleString()}/-
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/checkout');
                      }}
                      className="w-full flex items-center justify-center gap-4 py-5 bg-[#0A1628] text-white rounded-2xl font-black text-[10px] uppercase tracking-[4px] hover:bg-[#C8102E] transition-all shadow-2xl shadow-[#0A1628]/20 group active:scale-[0.98]"
                    >
                      Initialize Secure Checkout 
                      <div className="p-1 bg-white/10 rounded-lg group-hover:bg-white group-hover:text-[#C8102E] transition-all">
                        <ArrowRight size={12} />
                      </div>
                    </button>
                    
                    <button 
                      onClick={onClose}
                      className="w-full py-4 text-slate-400 font-black text-[9px] uppercase tracking-[3px] hover:text-[#0A1628] transition-colors"
                    >
                      ← Continue Sourcing Fabrics
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-3 py-3 px-4 bg-slate-50 rounded-xl">
                    <ShieldCheck size={14} className="text-green-600" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
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