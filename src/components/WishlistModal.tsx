import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WishlistModal({ isOpen, onClose }: WishlistModalProps) {
  const { 
    wishlist, 
    toggleWishlist, 
    addToCart,
    setIsCartOpen 
  } = useCart();
  const { formatPrice } = useLocalization();
  const navigate = useNavigate();

  const handleMoveToCart = (item: any) => {
    addToCart({
      ...item,
      selectedVariants: item.selectedVariants || {},
      priceType: item.priceType || 'fixed'
    });
    toggleWishlist(item); // Remove from wishlist
    onClose();
    setIsCartOpen(true);
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

          {/* Sliding Wishlist Drawer Container */}
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
                  <div className="w-10 h-10 bg-[#FA9411] rounded-2xl flex items-center justify-center text-white">
                    <Heart size={20} fill="currentColor" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[3px] text-[#08047D]">Your Collection</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {wishlist.length} {wishlist.length === 1 ? 'Design' : 'Designs'} Saved
                    </p>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  aria-label="Close Wishlist"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Items Container */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {wishlist.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-50 rounded-full blur-2xl opacity-50 scale-150"></div>
                      <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center text-[#FA9411] relative z-10 border border-amber-100">
                        <Heart size={42} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[3px]">Collection is Empty</h3>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                        Save your favorite uniform designs here to compare or order later.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        onClose();
                        navigate('/products');
                      }}
                      className="px-8 py-4 bg-[#08047D] text-white rounded-2xl font-black text-[10px] uppercase tracking-[3px] hover:bg-[#FA9411] transition-all shadow-xl shadow-[#08047D]/10 active:scale-95"
                    >
                      Browse Our Catalog
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wishlist.map((item, index) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-5 p-5 bg-white rounded-[2.5rem] border border-slate-100 relative group transition-all hover:border-[#FA9411]/30 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
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
                            <h4 className="text-xs font-black uppercase tracking-wide text-[#08047D] truncate pr-8 group-hover:text-[#FA9411] transition-colors">
                              {item.name}
                            </h4>
                            <p className="text-[8px] font-black uppercase tracking-wider text-[#FA9411] bg-[#FA9411]/5 px-2 py-0.5 rounded-full border border-[#FA9411]/10 w-fit">
                              {item.category}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs font-black text-[#08047D] tabular-nums">
                              {formatPrice(item.price)}
                            </span>
                            
                            <button 
                              onClick={() => handleMoveToCart(item)}
                              className="w-8 h-8 rounded-lg bg-[#08047D] hover:bg-[#08047D] text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
                              title="Move to Cart"
                            >
                              <ShoppingBag size={14} />
                            </button>
                           </div>
                        </div>

                        {/* Explicit Row Deletion Hook */}
                        <button 
                          onClick={() => toggleWishlist(item)} 
                          className="absolute top-5 right-5 text-slate-200 hover:text-red-500 transition-all p-1 group-hover:opacity-100"
                          aria-label="Remove Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Callout Layer */}
              {wishlist.length > 0 && (
                <div className="p-8 border-t border-slate-100 bg-white shadow-[0_-30px_60px_rgba(0,0,0,0.05)]">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/products');
                    }}
                    className="w-full flex items-center justify-center gap-4 py-5 bg-[#08047D] text-white rounded-2xl font-black text-[10px] uppercase tracking-[4px] hover:bg-[#FA9411] transition-all shadow-2xl shadow-[#08047D]/20 group active:scale-[0.98]"
                  >
                    Continue Browsing Catalog
                    <div className="p-1 bg-white/10 rounded-lg group-hover:bg-white group-hover:text-[#FA9411] transition-all">
                      <ArrowRight size={12} />
                    </div>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
