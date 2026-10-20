import React, { useState } from 'react';
import { Plus, Minus, ShoppingBag, Check, Eye, Tag, Sparkles } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { appExperience } from '../../utils/haptics';

interface POSProductCardProps {
  product: any;
  inCartQuantity: number;
  onAddToCart: (product: any, selectedVariant?: Record<string, string>) => void;
  onUpdateQuantity: (quantity: number, selectedVariant?: Record<string, string>) => void;
  onQuickView: (product: any) => void;
  viewMode?: 'grid' | 'list';
}

export function POSProductCard({
  product,
  inCartQuantity,
  onAddToCart,
  onUpdateQuantity,
  onQuickView,
  viewMode = 'grid'
}: POSProductCardProps) {
  const { formatPrice } = useLocalization();

  // Extract variants (e.g. Size or Color)
  const variants = product.variants || [];
  const sizeVariants = variants.filter((v: any) => v.type?.toLowerCase() === 'size' || !v.type);
  const sizeBreakdown = product.sizeBreakdown || (sizeVariants.length > 0 ? sizeVariants.map((v: any) => v.value) : ['Standard']);

  const [selectedSize, setSelectedSize] = useState<string>(
    sizeBreakdown.length > 0 ? sizeBreakdown[0] : (sizeVariants.length > 0 ? sizeVariants[0].value : '')
  );

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    appExperience.triggerFeedback('cart_add');
    const selectedVariant = selectedSize ? { Size: selectedSize } : undefined;
    onAddToCart(product, selectedVariant);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    appExperience.triggerFeedback('tap');
    const selectedVariant = selectedSize ? { Size: selectedSize } : undefined;
    onUpdateQuantity(inCartQuantity + 1, selectedVariant);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    appExperience.triggerFeedback('tap');
    const selectedVariant = selectedSize ? { Size: selectedSize } : undefined;
    onUpdateQuantity(inCartQuantity - 1, selectedVariant);
  };

  // Helper label for size category badge
  const sizeCategoryLabel = 
    product.sizeCategory === 'ecde' ? 'ECDE 22-32' :
    product.sizeCategory === 'primary' ? 'Primary 24-36' :
    product.sizeCategory === 'jss' ? 'JSS 28-40' :
    product.sizeCategory === 'secondary' ? 'Sec 30-44' :
    product.sizeCategory === 'adult' ? 'Adult S-3XL' :
    product.typicalSizes || null;

  // Dense List View mode
  if (viewMode === 'list') {
    return (
      <div 
        onClick={() => onQuickView(product)}
        className={`bg-white p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 hover:shadow-md cursor-pointer select-none ${
          inCartQuantity > 0 ? 'border-[#08047D] ring-1 ring-[#08047D]/30 bg-[#08047D]/[0.02]' : 'border-slate-200/90'
        }`}
      >
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center relative">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover object-top" />
          ) : (
            <ShoppingBag size={20} className="text-slate-300" />
          )}
          {inCartQuantity > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FA9411] text-white text-[10px] font-black flex items-center justify-center shadow-sm">
              {inCartQuantity}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-bold text-xs text-slate-900 truncate leading-snug">{product.name}</h4>
            {sizeCategoryLabel && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-50 text-[#08047D] border border-blue-200">
                {sizeCategoryLabel}
              </span>
            )}
            {product.gender && product.gender !== 'Unisex' && (
              <span className="text-[9px] px-1 rounded font-bold bg-slate-100 text-slate-600">
                {product.gender}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10.5px] text-slate-500 mt-0.5">
            <span className="text-[#08047D] font-bold">{product.category}</span>
            {product.educationSector && product.educationSector !== 'All' && (
              <span className="text-slate-400">· {product.educationSector}</span>
            )}
            {product.skuPrefix && (
              <span className="text-slate-400 font-mono text-[9px]">· {product.skuPrefix}</span>
            )}
          </div>
        </div>

        {/* Variant Select & Price */}
        <div className="flex items-center gap-3 shrink-0">
          {sizeBreakdown.length > 0 && (
            <select
              value={selectedSize}
              onChange={(e) => { e.stopPropagation(); setSelectedSize(e.target.value); }}
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              {sizeBreakdown.map((sz: string, idx: number) => (
                <option key={idx} value={sz}>Size {sz}</option>
              ))}
            </select>
          )}

          <div className="text-right">
            <div className="text-xs sm:text-sm font-black text-slate-900">{formatPrice(product.price)}</div>
            {product.marketHighKES ? (
              <div className="text-[9px] text-slate-400 line-through">
                Mkt: {formatPrice(product.marketHighKES)}
              </div>
            ) : (
              <div className="text-[9px] text-emerald-600 font-semibold">In Stock</div>
            )}
          </div>

          {/* Action */}
          {inCartQuantity === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              className="py-1.5 px-3 bg-[#08047D] hover:bg-[#050259] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <Plus size={13} />
              <span>Add</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-slate-700 hover:text-red-500 shadow-xs"
              >
                <Minus size={12} />
              </button>
              <span className="text-xs font-bold w-6 text-center text-[#08047D]">{inCartQuantity}</span>
              <button
                type="button"
                onClick={handleIncrement}
                className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-slate-700 hover:text-[#08047D] shadow-xs"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Standard Grid View mode
  return (
    <div 
      onClick={() => onQuickView(product)}
      className={`bg-white rounded-2xl border transition-all flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 cursor-pointer select-none group relative overflow-hidden ${
        inCartQuantity > 0 
          ? 'border-[#08047D] ring-2 ring-[#08047D]/20 shadow-sm' 
          : 'border-slate-200/90 shadow-sm'
      }`}
    >
      {/* Product Image Area */}
      <div className="aspect-[4/3] w-full bg-slate-50 relative overflow-hidden border-b border-slate-100 flex items-center justify-center">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <ShoppingBag size={32} className="text-slate-300" />
        )}

        {/* Top Badges Stack */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          <span className="bg-white/95 backdrop-blur-xs text-[#08047D] text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs border border-slate-200/60 uppercase tracking-wide">
            {product.category}
          </span>
          {sizeCategoryLabel && (
            <span className="bg-[#08047D]/95 text-white text-[8.5px] font-bold px-1.5 py-0.2 rounded shadow-xs">
              {sizeCategoryLabel}
            </span>
          )}
        </div>

        {/* Gender Badge */}
        {product.gender && product.gender !== 'Unisex' && (
          <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[8.5px] font-bold px-1.5 py-0.2 rounded">
            {product.gender}
          </span>
        )}

        {/* Quick View Eye Button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs text-slate-600 hover:text-[#08047D] flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
          title="Quick View"
        >
          <Eye size={13} />
        </button>

        {/* In-cart indicator badge */}
        {inCartQuantity > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-[#08047D] text-white text-[10px] font-black flex items-center gap-1 shadow-md">
            <Check size={11} className="stroke-[3]" />
            <span>{inCartQuantity} in ticket</span>
          </div>
        )}
      </div>

      {/* Product Body */}
      <div className="p-3 flex flex-col gap-2 flex-1 justify-between">
        <div>
          <h4 className="font-bold text-xs sm:text-[13px] text-slate-900 leading-snug line-clamp-2 group-hover:text-[#08047D] transition-colors">
            {product.name}
          </h4>

          {/* Size Variant Selector Dropdown */}
          <div className="mt-1.5 flex items-center justify-between gap-1.5">
            <span className="text-[10px] text-slate-500 font-medium">Select Size:</span>
            <select
              value={selectedSize}
              onChange={(e) => { e.stopPropagation(); setSelectedSize(e.target.value); }}
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#08047D]"
            >
              {sizeBreakdown.map((sz: string, idx: number) => (
                <option key={idx} value={sz}>Size {sz}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price & Action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-slate-900 block leading-tight">
                {formatPrice(product.price)}
              </span>
              {product.marketHighKES && product.marketHighKES > product.price && (
                <span className="text-[9px] text-slate-400 line-through">
                  {formatPrice(product.marketHighKES)}
                </span>
              )}
            </div>
            <span className="text-[9px] text-emerald-600 font-semibold block">
              Uhuru Mkt Factory Price
            </span>
          </div>

          {inCartQuantity === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              className="py-1.5 px-3 rounded-xl bg-[#08047D] hover:bg-[#050259] text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <Plus size={13} />
              <span>Add</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-slate-700 hover:text-red-500 shadow-xs active:scale-90"
              >
                <Minus size={12} />
              </button>
              <span className="text-xs font-bold w-5 text-center text-[#08047D]">{inCartQuantity}</span>
              <button
                type="button"
                onClick={handleIncrement}
                className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-slate-700 hover:text-[#08047D] shadow-xs active:scale-90"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
