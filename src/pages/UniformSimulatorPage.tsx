import React, { useState, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ChevronRight, 
  Info, 
  Printer, 
  HelpCircle, 
  RotateCcw, 
  Check, 
  Plus, 
  Download, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  Palette,
  Briefcase,
  Sliders,
  DollarSign
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { appExperience } from '../utils/haptics';
import { useLocalization } from '../context/LocalizationContext';

// Nairobi / Kenya High School Standard Colorways
const HIGH_SCHOOL_COLORS = [
  { name: 'Nairobi Navy Blue', hex: '#0B1B3D', key: 'navy' },
  { name: 'Uhuru Forest Green', hex: '#113F26', key: 'green' },
  { name: 'Jogoo Maroon', hex: '#4A0813', key: 'maroon' },
  { name: 'Presidential Charcoal', hex: '#3B3E45', key: 'charcoal' },
  { name: 'Royal Blue', hex: '#1B4F72', key: 'royal' },
  { name: 'Classic Black', hex: '#1A1A1A', key: 'black' },
  { name: 'Golden Yellow', hex: '#E29B12', key: 'gold' }
];

const TRIM_COLORS = [
  { name: 'Bright Gold', hex: '#F1C40F' },
  { name: 'Optic White', hex: '#FFFFFF' },
  { name: 'Bright Red', hex: '#922B21' },
  { name: 'Sky Blue', hex: '#AED6F1' },
  { name: 'Navy Blue', hex: '#0B1B3D' }
];

const SHIRT_COLORS = [
  { name: 'Chalk White', hex: '#FAFAFC', key: 'white' },
  { name: 'Sky Blue', hex: '#C2DFFF', key: 'sky' },
  { name: 'Cream Ivory', hex: '#FDF2E9', key: 'cream' }
];

const BOTTOM_COLORS = [
  { name: 'School Grey', hex: '#7F8C8D', key: 'grey' },
  { name: 'Uhuru Khaki', hex: '#C2A175', key: 'khaki' },
  { name: 'Nairobi Navy', hex: '#0B1B3D', key: 'navy' },
  { name: 'Presidential Black', hex: '#1A1A1A', key: 'black' }
];

const FABRICS = [
  { 
    id: 'cotton-twill', 
    name: 'Naisiae Cotton-Twill Weave', 
    desc: 'Classic diagonal parallel rib structure. Breathable, comfortable, standard for quality school uniform shirts, blouses, and trousers.',
    gsm: '220 GSM',
    composition: '100% Breathable Cotton',
    badge: 'Standard Breathable',
    patternId: 'pattern-cotton-twill'
  },
  { 
    id: 'polyester-blend', 
    name: 'Duratex Polyester-Blend', 
    desc: 'Durable, smooth micro-mesh texture. Highly crease-resistant and fade-proof. Best for long days and active school wear.',
    gsm: '240 GSM',
    composition: '65% Polyester / 35% Viscose',
    badge: 'Crease-Resistant',
    patternId: 'pattern-polyester-blend'
  },
  { 
    id: 'heavy-drill', 
    name: 'Uhuru Heavy-Duty Drill', 
    desc: 'Deep diagonal rib pattern. Thick, stiff, exceptionally rugged fabric designed for extreme durability in skirts and trousers.',
    gsm: '280 GSM',
    composition: '100% Cotton Drill',
    badge: 'Extra Rugged',
    patternId: 'pattern-heavy-drill'
  },
  { 
    id: 'acrylic-knit', 
    name: 'Jogoo Low-Pill Acrylic Knit', 
    desc: 'Vertical ribbed cable knit structure. Soft, warm, stretch-resilient, retains vibrant dye. Perfect for pullovers and sweaters.',
    gsm: '320 GSM',
    composition: '100% Low-Pill Acrylic',
    badge: 'Thermal Comfort',
    patternId: 'pattern-acrylic-knit'
  },
  { 
    id: 'tartan-plaid', 
    name: 'Heritage Tartan Plaid', 
    desc: 'Prestigious interlocking multi-colored checkers. Gives uniform skirts, ties, and details an elite, classic academic appearance.',
    gsm: '240 GSM',
    composition: '80% Polyester / 20% Wool',
    badge: 'Traditional Plaid',
    patternId: 'pattern-tartan-plaid'
  }
];

export default function UniformSimulatorPage() {
  const { cartCount, wishlistCount, setIsCartOpen, setIsWishlistOpen, addToCart, setToast, setIsQuoteModalOpen } = useCart();
  const { formatPrice } = useLocalization();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Simulation parameters
  const [genderFit, setGenderFit] = useState<'boy' | 'girl'>('boy');
  const [outerwearStyle, setOuterwearStyle] = useState<'sweater' | 'vest' | 'blazer'>('sweater');
  const [outerColor, setOuterColor] = useState(HIGH_SCHOOL_COLORS[0]);
  const [trimStyle, setTrimStyle] = useState<'none' | 'single' | 'double'>('double');
  const [trimColor, setTrimColor] = useState(TRIM_COLORS[0]);
  const [shirtStyle, setShirtStyle] = useState<'plain' | 'oxford' | 'peterpan'>('plain');
  const [shirtColor, setShirtColor] = useState(SHIRT_COLORS[0]);
  const [bottomColor, setBottomColor] = useState(BOTTOM_COLORS[0]);
  const [tieStyle, setTieStyle] = useState<'none' | 'solid' | 'striped'>('striped');
  const [tieColor, setTieColor] = useState(HIGH_SCHOOL_COLORS[2]); // Default Maroon tie
  const [tieStripeColor, setTieStripeColor] = useState(TRIM_COLORS[0]); // Gold stripe

  // Fabric selections for parts
  const [outerFabric, setOuterFabric] = useState<string>('acrylic-knit');
  const [shirtFabric, setShirtFabric] = useState<string>('cotton-twill');
  const [bottomFabric, setBottomFabric] = useState<string>('heavy-drill');

  // Custom Badge option
  const [selectedBadge, setSelectedBadge] = useState<string>('royal-crest');
  const [customBadgeText, setCustomBadgeText] = useState('Naisiae Academy');

  // Pricing calculator parameters
  const [orderQuantity, setOrderQuantity] = useState(150);

  // Recalculate dynamic wholesale pricing
  const pricingData = useMemo(() => {
    // Base components prices in KES
    const basePrices = {
      sweater: 1200,
      vest: 950,
      blazer: 2400
    };

    const shirtPrice = 650;
    const bottomPrice = genderFit === 'boy' ? 850 : 950; // Skirts vs Trousers
    const tiePrice = tieStyle === 'none' ? 0 : 200;
    const badgePrice = selectedBadge === 'none' ? 0 : 150;

    let costPerSet = basePrices[outerwearStyle] + shirtPrice + bottomPrice + tiePrice + badgePrice;

    // Apply trim extra
    if (trimStyle === 'single') costPerSet += 80;
    if (trimStyle === 'double') costPerSet += 150;

    // Quantity Discount brackets
    let discountPercent = 0;
    if (orderQuantity >= 50 && orderQuantity < 100) discountPercent = 5;
    else if (orderQuantity >= 100 && orderQuantity < 300) discountPercent = 12;
    else if (orderQuantity >= 300 && orderQuantity < 1000) discountPercent = 20;
    else if (orderQuantity >= 1000) discountPercent = 28;

    const discountAmount = costPerSet * (discountPercent / 100);
    const netCostPerSet = costPerSet - discountAmount;
    const totalOrderCost = netCostPerSet * orderQuantity;

    return {
      grossCost: costPerSet,
      discountPercent,
      netCost: Math.round(netCostPerSet),
      totalCost: Math.round(totalOrderCost),
      saving: Math.round(discountAmount * orderQuantity)
    };
  }, [genderFit, outerwearStyle, trimStyle, selectedBadge, tieStyle, orderQuantity]);

  // Handle adding current mock simulation package to Cart / Request Sample
  const handleRequestSample = () => {
    appExperience.triggerFeedback('success');
    
    const outerFabricName = FABRICS.find(f => f.id === outerFabric)?.name || outerFabric;
    const shirtFabricName = FABRICS.find(f => f.id === shirtFabric)?.name || shirtFabric;
    const bottomFabricName = FABRICS.find(f => f.id === bottomFabric)?.name || bottomFabric;

    const sampleItem = {
      id: `simulated-uniform-${Date.now()}`,
      name: `Custom Simulated Uniform Sample (${genderFit === 'boy' ? 'Boy Fit' : 'Girl Fit'})`,
      price: 0, // Swatch or sample approval pack is free of commit cost
      imageUrl: 'https://images.unsplash.com/photo-1544717305-27a734ef1904?auto=format&fit=crop&q=80&w=400',
      category: 'Simulated Uniforms',
      selectedVariants: {
        'Outerwear': `${outerwearStyle.toUpperCase()} in ${outerColor.name} [${outerFabricName}]`,
        'Trim': `${trimStyle} Trim in ${trimColor.name}`,
        'Collar / Shirt': `${shirtStyle} in ${shirtColor.name} [${shirtFabricName}]`,
        'Bottoms': `${genderFit === 'boy' ? 'Trousers' : 'Skirt'} in ${bottomColor.name} [${bottomFabricName}]`,
        'Tie Pattern': `${tieStyle} (${tieColor.name})`,
        'Emblem Text': customBadgeText
      }
    };

    addToCart(sampleItem, 1);
    
    setToast({
      message: `Simulated design saved! 1x Approved Sample added to cart.`,
      type: 'success'
    });
    
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-[#0A1628] pb-12">
      {/* Navbar with mega menu and cart integrations */}
      <Navbar 
        wishlistCount={wishlistCount}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />
      
      {/* Standardized Breadcrumbs */}
      <Breadcrumb />

      {/* Hero Header with Premium Naisiae Typography */}
      <section className="pt-24 pb-8 px-6">
        <div className="max-w-[1440px] mx-auto text-center">
          <span className="text-[10px] font-black text-[#C8961A] uppercase tracking-[4px] bg-[#C8961A]/10 px-4 py-1.5 rounded-full mb-4 inline-block">
            Virtual Tailor Lab
          </span>
          <h1 className="font-display text-5xl md:text-[7.5rem] text-[#0A1628] leading-[0.8] tracking-tighter mb-6 uppercase italic">
            Uniform <span className="text-white/0 stroke-text font-black" style={{ WebkitTextStroke: '2px #0A1628' }}>Simulator</span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-xs md:text-sm uppercase font-bold tracking-[3px] leading-relaxed">
            Configure sweaters, shirts, blazers, and ties in Nairobi's standard school colorways. Preview instantly in real-time Vector rendering.
          </p>
        </div>
      </section>

      {/* Main Simulation Workspace Grid */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Hand: High Fidelity Vector Render Canvas (5 cols) */}
        <div className="lg:col-span-5 sticky top-28 space-y-6">
          <div className="bg-white rounded-[3.5rem] border border-slate-200/85 overflow-hidden shadow-sm relative">
            
            {/* Nairobi Loom Certification Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[2px] text-[#00C4CC]">Active Vector Canvas</span>
              </div>
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">Ratio: 1:1 Loom Spec</span>
            </div>

            {/* Immersive SVG Simulator Window */}
            <div className="aspect-square bg-gradient-to-b from-[#F2F4F7] to-[#E5E9F0] flex items-center justify-center p-8 relative overflow-hidden group">
              
              {/* Floating Blueprint Scale lines overlay */}
              <div className="absolute inset-0 border-[16px] border-white pointer-events-none z-10" />
              <div className="absolute top-8 left-8 text-[8px] font-mono text-slate-400/80 pointer-events-none select-none">
                Y: 100% CAD COMPLIANT
              </div>
              
              {/* LIVE HIGH CRAFT RESPONSIVE SVG VECTOR MODEL */}
              <svg 
                className="w-full h-full max-w-[340px] drop-shadow-2xl z-0 transition-transform duration-500 hover:scale-105"
                viewBox="0 0 400 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Cotton Twill Pattern */}
                  <pattern id="pattern-cotton-twill" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="10" height="10" fill="none" />
                    <line x1="0" y1="0" x2="0" y2="10" stroke="#ffffff" strokeWidth="1.5" opacity="0.18" />
                    <line x1="5" y1="0" x2="5" y2="10" stroke="#000000" strokeWidth="1" opacity="0.08" />
                  </pattern>

                  {/* Polyester Blend Pattern */}
                  <pattern id="pattern-polyester-blend" width="6" height="6" patternUnits="userSpaceOnUse">
                    <rect width="6" height="6" fill="none" />
                    <rect width="3" height="3" fill="#ffffff" opacity="0.12" />
                    <rect x="3" y="3" width="3" height="3" fill="#000000" opacity="0.08" />
                  </pattern>

                  {/* Heavy Drill Pattern */}
                  <pattern id="pattern-heavy-drill" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
                    <rect width="14" height="14" fill="none" />
                    <line x1="0" y1="0" x2="0" y2="14" stroke="#000000" strokeWidth="3" opacity="0.15" />
                    <line x1="7" y1="0" x2="7" y2="14" stroke="#ffffff" strokeWidth="2" opacity="0.15" />
                  </pattern>

                  {/* Acrylic Knit Pattern */}
                  <pattern id="pattern-acrylic-knit" width="12" height="16" patternUnits="userSpaceOnUse">
                    <rect width="12" height="16" fill="none" />
                    <rect x="0" y="0" width="5" height="16" fill="#ffffff" opacity="0.14" />
                    <rect x="5" y="0" width="1" height="16" fill="#000000" opacity="0.12" />
                    <rect x="6" y="0" width="5" height="16" fill="#000000" opacity="0.09" />
                    <rect x="11" y="0" width="1" height="16" fill="#ffffff" opacity="0.18" />
                  </pattern>

                  {/* Tartan Plaid Pattern */}
                  <pattern id="pattern-tartan-plaid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <rect width="40" height="40" fill="none" />
                    <rect x="0" y="0" width="40" height="8" fill="#ffffff" opacity="0.15" />
                    <rect x="0" y="20" width="40" height="4" fill="#000000" opacity="0.18" />
                    <rect x="0" y="0" width="8" height="40" fill="#ffffff" opacity="0.15" />
                    <rect x="20" y="0" width="40" height="40" fill="#000000" opacity="0.18" />
                    <line x1="0" y1="12" x2="40" y2="12" stroke="#F1C40F" strokeWidth="1.5" opacity="0.3" />
                    <line x1="12" y1="0" x2="12" y2="40" stroke="#F1C40F" strokeWidth="1.5" opacity="0.3" />
                    <line x1="0" y1="32" x2="40" y2="32" stroke="#C8102E" strokeWidth="1" opacity="0.3" />
                    <line x1="32" y1="0" x2="32" y2="40" stroke="#C8102E" strokeWidth="1" opacity="0.3" />
                  </pattern>
                </defs>

                {/* Hair/Head Silhouette Fallback (Clean Neutral Portrait Line-Art) */}
                <path d="M170 80 C170 50, 230 50, 230 80 C230 90, 230 110, 230 110 L170 110 Z" fill="#2C3E50" />
                <circle cx="200" cy="110" r="24" fill="#E8C3A7" />
                
                {/* Neck */}
                <rect x="190" y="125" width="20" height="25" fill="#DCB091" />

                {/* 1. Shirt Collar Layer */}
                {shirtStyle === 'peterpan' ? (
                  // Round Peter Pan collar
                  <g id="shirt-collar-peterpan">
                    {/* Left Collar */}
                    <path d="M192 140 C170 140, 160 160, 190 165 Z" fill={shirtColor.hex} stroke="#B2C4D9" strokeWidth="1" />
                    <path d="M192 140 C170 140, 160 160, 190 165 Z" fill={`url(#${FABRICS.find(f => f.id === shirtFabric)?.patternId || 'pattern-cotton-twill'})`} />
                    {/* Right Collar */}
                    <path d="M208 140 C230 140, 240 160, 210 165 Z" fill={shirtColor.hex} stroke="#B2C4D9" strokeWidth="1" />
                    <path d="M208 140 C230 140, 240 160, 210 165 Z" fill={`url(#${FABRICS.find(f => f.id === shirtFabric)?.patternId || 'pattern-cotton-twill'})`} />
                  </g>
                ) : (
                  // Sharp triangular shirt collar (plain/oxford)
                  <g id="shirt-collar-sharp">
                    {/* Back Shirt neck */}
                    <path d="M185 132 L215 132 L210 145 L190 145 Z" fill={shirtColor.hex} />
                    <path d="M185 132 L215 132 L210 145 L190 145 Z" fill={`url(#${FABRICS.find(f => f.id === shirtFabric)?.patternId || 'pattern-cotton-twill'})`} />
                    {/* Left Collar Point */}
                    <path d="M185 134 L170 162 L198 152 Z" fill={shirtColor.hex} stroke="#C8D4E2" strokeWidth="1.5" />
                    <path d="M185 134 L170 162 L198 152 Z" fill={`url(#${FABRICS.find(f => f.id === shirtFabric)?.patternId || 'pattern-cotton-twill'})`} />
                    {/* Right Collar Point */}
                    <path d="M215 134 L230 162 L202 152 Z" fill={shirtColor.hex} stroke="#C8D4E2" strokeWidth="1.5" />
                    <path d="M215 134 L230 162 L202 152 Z" fill={`url(#${FABRICS.find(f => f.id === shirtFabric)?.patternId || 'pattern-cotton-twill'})`} />
                  </g>
                )}

                {/* 2. Necktie Layer (if chosen) */}
                {tieStyle !== 'none' && (
                  <g id="necktie-assembly">
                    {/* Tie knot */}
                    <path d="M193 148 L207 148 L203 160 L197 160 Z" fill={tieColor.hex} />
                    
                    {/* Tie Body */}
                    <path d="M196 160 L204 160 L208 240 L200 250 L192 240 Z" fill={tieColor.hex} />

                    {/* Striped pattern overlay */}
                    {tieStyle === 'striped' && (
                      <g id="tie-stripes" clipPath="url(#tie-body-clip)">
                        {/* Clip path definition inline fallback */}
                        <path d="M196 160 L204 160 L208 240 L200 250 L192 240 Z" fill="none" id="tie-clip-helper" />
                        
                        {/* We draw beautiful diagonal stripes */}
                        <line x1="190" y1="170" x2="210" y2="185" stroke={tieStripeColor.hex} strokeWidth="3" />
                        <line x1="190" y1="190" x2="210" y2="205" stroke={tieStripeColor.hex} strokeWidth="3" />
                        <line x1="190" y1="210" x2="210" y2="225" stroke={tieStripeColor.hex} strokeWidth="3" />
                        <line x1="190" y1="230" x2="210" y2="245" stroke={tieStripeColor.hex} strokeWidth="3" />
                      </g>
                    )}
                  </g>
                )}

                {/* 3. Outerwear (Sweater vs Vest vs Blazer) */}
                {outerwearStyle === 'blazer' ? (
                  // Classic structured blazer with lapels
                  <g id="blazer-assembly">
                    {/* Left Shoulder & Sleeve */}
                    <path d="M170 145 C150 150, 130 180, 125 240 C125 250, 135 255, 140 255 L150 250 L155 180 Z" fill={outerColor.hex} />
                    <path d="M170 145 C150 150, 130 180, 125 240 C125 250, 135 255, 140 255 L150 250 L155 180 Z" fill={`url(#${FABRICS.find(f => f.id === outerFabric)?.patternId || 'pattern-heavy-drill'})`} />
                    {/* Right Shoulder & Sleeve */}
                    <path d="M230 145 C250 150, 270 180, 275 240 C275 250, 265 255, 260 255 L250 250 L245 180 Z" fill={outerColor.hex} />
                    <path d="M230 145 C250 150, 270 180, 275 240 C275 250, 265 255, 260 255 L250 250 L245 180 Z" fill={`url(#${FABRICS.find(f => f.id === outerFabric)?.patternId || 'pattern-heavy-drill'})`} />

                    {/* Main blazer chest body */}
                    <path d="M155 155 L245 155 L255 270 L145 270 Z" fill={outerColor.hex} />
                    <path d="M155 155 L245 155 L255 270 L145 270 Z" fill={`url(#${FABRICS.find(f => f.id === outerFabric)?.patternId || 'pattern-heavy-drill'})`} />

                    {/* Left Lapel fold */}
                    <path d="M170 155 L190 220 L155 200 Z" fill={outerColor.hex} stroke="#FFFFFF" strokeWidth="0.5" />
                    <path d="M170 155 L190 220 L155 200 Z" fill={`url(#${FABRICS.find(f => f.id === outerFabric)?.patternId || 'pattern-heavy-drill'})`} />
                    {/* Right Lapel fold */}
                    <path d="M230 155 L210 220 L245 200 Z" fill={outerColor.hex} stroke="#FFFFFF" strokeWidth="0.5" />
                    <path d="M230 155 L210 220 L245 200 Z" fill={`url(#${FABRICS.find(f => f.id === outerFabric)?.patternId || 'pattern-heavy-drill'})`} />

                    {/* Blazer buttons */}
                    <circle cx="200" cy="235" r="4" fill="#C8961A" />
                    <circle cx="200" cy="255" r="4" fill="#C8961A" />
                  </g>
                ) : (
                  // Sweater (Full long sleeve knit) or Vest (sleeveless)
                  <g id="knitwear-assembly">
                    {/* Sleeves (only if full sweater) */}
                    {outerwearStyle === 'sweater' && (
                      <g id="sweater-sleeves">
                        {/* Left sleeve */}
                        <path d="M170 145 C150 150, 130 180, 125 250 L138 255 L155 180 Z" fill={outerColor.hex} />
                        <path d="M170 145 C150 150, 130 180, 125 250 L138 255 L155 180 Z" fill={`url(#${FABRICS.find(f => f.id === outerFabric)?.patternId || 'pattern-acrylic-knit'})`} />
                        {/* Right sleeve */}
                        <path d="M230 145 C250 150, 270 180, 275 250 L262 255 L245 180 Z" fill={outerColor.hex} />
                        <path d="M230 145 C250 150, 270 180, 275 250 L262 255 L245 180 Z" fill={`url(#${FABRICS.find(f => f.id === outerFabric)?.patternId || 'pattern-acrylic-knit'})`} />

                        {/* Sleeve cuffs with trims */}
                        {trimStyle !== 'none' && (
                          <g id="cuff-trims">
                            <rect x="125" y="248" width="13" height="4" fill={trimColor.hex} />
                            <rect x="262" y="248" width="13" height="4" fill={trimColor.hex} />
                          </g>
                        )}
                      </g>
                    )}

                    {/* Knit Vest / Sweater main body */}
                    <path d="M155 145 L245 145 L252 265 L148 265 Z" fill={outerColor.hex} />
                    <path d="M155 145 L245 145 L252 265 L148 265 Z" fill={`url(#${FABRICS.find(f => f.id === outerFabric)?.patternId || 'pattern-acrylic-knit'})`} />

                    {/* V-Neck Cutout (revealing shirt and tie beneath) */}
                    <path d="M185 145 L215 145 L200 190 Z" fill="#F2F4F7" /> {/* Re-clear V-neck */}
                    
                    {/* Re-render V-neck cutout content transparent overlay simulation */}
                    <path d="M185 145 L215 145 L200 190 Z" fill="transparent" />

                    {/* Neckline Trims based on selection */}
                    {trimStyle !== 'none' && (
                      <g id="neckline-trims">
                        {/* Left trim line */}
                        <line x1="185" y1="145" x2="200" y2="190" stroke={trimColor.hex} strokeWidth={trimStyle === 'double' ? '3' : '1.5'} />
                        {/* Right trim line */}
                        <line x1="215" y1="145" x2="200" y2="190" stroke={trimColor.hex} strokeWidth={trimStyle === 'double' ? '3' : '1.5'} />
                        
                        {/* If double, draw the second thin accent line inside */}
                        {trimStyle === 'double' && (
                          <g opacity="0.8">
                            <line x1="188" y1="145" x2="200" y2="182" stroke="#FFFFFF" strokeWidth="1" />
                            <line x1="212" y1="145" x2="200" y2="182" stroke="#FFFFFF" strokeWidth="1" />
                          </g>
                        )}
                      </g>
                    )}

                    {/* Ribbed bottom hem */}
                    <rect x="148" y="260" width="104" height="6" fill={outerColor.hex} stroke="#000000" strokeWidth="0.1" />
                    {trimStyle !== 'none' && (
                      <rect x="148" y="261" width="104" height="2" fill={trimColor.hex} />
                    )}
                  </g>
                )}

                {/* 4. Custom School Embroidery Badge Crest */}
                {selectedBadge !== 'none' && (
                  <g id="embroidery-crest" transform="translate(162, 185) scale(0.65)">
                    {/* Outer Crest Shape */}
                    <path d="M5 5 C5 5, 25 -5, 45 5 C45 25, 40 45, 25 55 C10 45, 5 25, 5 5 Z" fill={trimColor.hex} />
                    <path d="M8 8 C8 8, 25 -2, 42 8 C42 24, 38 42, 25 51 C12 42, 8 24, 8 8 Z" fill="#0A1628" />
                    
                    {/* Symbolic inner star / embroidery lines */}
                    <polygon points="25,15 28,24 37,24 30,30 33,39 25,33 17,39 20,30 13,24 22,24" fill={trimColor.hex} />
                  </g>
                )}

                {/* 5. Bottoms Layer (Skirt vs Trousers) */}
                {genderFit === 'girl' ? (
                  // School box pleat skirt
                  <g id="skirt-assembly">
                    <path d="M152 265 L248 265 L260 345 L140 345 Z" fill={bottomColor.hex} />
                    <path d="M152 265 L248 265 L260 345 L140 345 Z" fill={`url(#${FABRICS.find(f => f.id === bottomFabric)?.patternId || 'pattern-heavy-drill'})`} />
                    
                    {/* Shadow & pleats lines */}
                    <line x1="170" y1="265" x2="165" y2="345" stroke="#000000" strokeWidth="1.5" opacity="0.35" />
                    <line x1="190" y1="265" x2="188" y2="345" stroke="#000000" strokeWidth="1.5" opacity="0.35" />
                    <line x1="210" y1="265" x2="212" y2="345" stroke="#000000" strokeWidth="1.5" opacity="0.35" />
                    <line x1="230" y1="265" x2="235" y2="345" stroke="#000000" strokeWidth="1.5" opacity="0.35" />
                  </g>
                ) : (
                  // School boys school trousers
                  <g id="trousers-assembly">
                    {/* Left Leg */}
                    <path d="M152 265 L200 265 L198 360 L145 360 Z" fill={bottomColor.hex} />
                    <path d="M152 265 L200 265 L198 360 L145 360 Z" fill={`url(#${FABRICS.find(f => f.id === bottomFabric)?.patternId || 'pattern-heavy-drill'})`} />
                    {/* Right Leg */}
                    <path d="M200 265 L248 265 L255 360 L202 360 Z" fill={bottomColor.hex} />
                    <path d="M200 265 L248 265 L255 360 L202 360 Z" fill={`url(#${FABRICS.find(f => f.id === bottomFabric)?.patternId || 'pattern-heavy-drill'})`} />
                    
                    {/* Crisp ironing line crease */}
                    <line x1="171" y1="265" x2="171" y2="360" stroke="#FFFFFF" strokeWidth="1" opacity="0.15" />
                    <line x1="229" y1="265" x2="229" y2="360" stroke="#FFFFFF" strokeWidth="1" opacity="0.15" />
                  </g>
                )}

                {/* Legs (Socks & Shoes) */}
                <rect x="165" y="360" width="12" height="15" fill="#E8C3A7" />
                <rect x="223" y="360" width="12" height="15" fill="#E8C3A7" />
                {/* Standard black school shoes */}
                <path d="M162 375 L180 375 L182 382 L158 382 Z" fill="#111111" />
                <path d="M220 375 L238 375 L242 382 L218 382 Z" fill="#111111" />
              </svg>

              {/* Live Badge Watermark Indicator */}
              <div className="absolute bottom-6 left-6 bg-[#0E121C] text-white/90 text-[7px] font-mono rounded-lg px-2.5 py-1 uppercase tracking-widest border border-white/10 flex items-center gap-1.5 z-20">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Badge: {customBadgeText || 'Plain Crest'}
              </div>

            </div>

            {/* Spec Sheet Footer Export options */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[10px] font-bold text-slate-500 uppercase">
                Fit: {genderFit === 'boy' ? 'Boy Trim Trousers' : 'Girl Box Skirt'} / Weight: 260 GSM Acrylic
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    appExperience.triggerFeedback('success');
                    window.print();
                  }}
                  className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:text-[#0A1628] hover:border-slate-300 transition-all flex items-center justify-center"
                  title="Print Specification Page"
                >
                  <Printer size={14} />
                </button>
                <button
                  onClick={handleRequestSample}
                  className="bg-[#0A1628] hover:bg-[#C8102E] text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[2px] transition-all flex items-center gap-1.5"
                >
                  <Plus size={12} /> Add Config to Swatch Pack
                </button>
              </div>
            </div>

          </div>

          {/* Quick Technical Specs Guide Card */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/85 p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <Layers size={18} />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-black uppercase tracking-[2px] text-[#0A1628]">Recommended Raw Material</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  For this selection, Naisiae recommends pairing the <span className="text-[#0A1628] font-bold">Uhuru Heavy-Duty Drill</span> for bottoms and <span className="text-[#0A1628] font-bold">Jogoo Low-Pill Acrylic</span> for sweaters. These are certified by the Kenya Bureau of Standards for longevity and safety.
                </p>
                <div className="pt-2">
                  <a 
                    href="/fabric-gallery" 
                    className="text-[9px] font-black uppercase tracking-[2.5px] text-[#C8102E] hover:text-[#0A1628] transition-colors flex items-center gap-1"
                  >
                    Browse Fabrics Gallery <ChevronRight size={12} />
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Hand: Deep Simulation Parametric Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Controls Panel */}
          <div className="bg-white rounded-[3.5rem] border border-slate-200/85 p-8 md:p-10 shadow-sm space-y-8">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#C8102E]/5 flex items-center justify-center text-[#C8102E]">
                  <Sliders size={18} />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[2.5px] text-[#0A1628]">Virtual Tailoring Rig</h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Configure Every Component Live</p>
                </div>
              </div>

              <button
                onClick={() => {
                  appExperience.triggerFeedback('tap');
                  setGenderFit('boy');
                  setOuterwearStyle('sweater');
                  setOuterColor(HIGH_SCHOOL_COLORS[0]);
                  setTrimStyle('double');
                  setTrimColor(TRIM_COLORS[0]);
                  setShirtStyle('plain');
                  setShirtColor(SHIRT_COLORS[0]);
                  setBottomColor(BOTTOM_COLORS[0]);
                  setTieStyle('striped');
                  setTieColor(HIGH_SCHOOL_COLORS[2]);
                  setCustomBadgeText('Naisiae Academy');
                  setOuterFabric('acrylic-knit');
                  setShirtFabric('cotton-twill');
                  setBottomFabric('heavy-drill');
                }}
                className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 hover:text-[#C8102E] transition-all flex items-center gap-1.5"
              >
                <RotateCcw size={12} /> Reset Config
              </button>
            </div>

            {/* Parameter 1: Fit and Outerwear style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">1. Anatomical Fit Target</label>
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
                  <button
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      setGenderFit('boy');
                    }}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      genderFit === 'boy' ? 'bg-[#0A1628] text-white shadow' : 'text-slate-500 hover:text-[#0A1628]'
                    }`}
                  >
                    Boys Fit (Trousers)
                  </button>
                  <button
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      setGenderFit('girl');
                    }}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      genderFit === 'girl' ? 'bg-[#0A1628] text-white shadow' : 'text-slate-500 hover:text-[#0A1628]'
                    }`}
                  >
                    Girls Fit (Skirt)
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">2. Layer 1: Outerwear Cut</label>
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
                  <button
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      setOuterwearStyle('sweater');
                    }}
                    className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      outerwearStyle === 'sweater' ? 'bg-[#0A1628] text-white shadow' : 'text-slate-500 hover:text-[#0A1628]'
                    }`}
                  >
                    Sweater
                  </button>
                  <button
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      setOuterwearStyle('vest');
                    }}
                    className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      outerwearStyle === 'vest' ? 'bg-[#0A1628] text-white shadow' : 'text-slate-500 hover:text-[#0A1628]'
                    }`}
                  >
                    Knit Vest
                  </button>
                  <button
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      setOuterwearStyle('blazer');
                    }}
                    className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      outerwearStyle === 'blazer' ? 'bg-[#0A1628] text-white shadow' : 'text-slate-500 hover:text-[#0A1628]'
                    }`}
                  >
                    Blazer
                  </button>
                </div>
              </div>

            </div>

            {/* Parameter 2: Outerwear Color Picker */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">
                3. Primary Outerwear Shade: <span className="text-[#0A1628] font-bold">{outerColor.name}</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {HIGH_SCHOOL_COLORS.map((color) => (
                  <button
                    key={color.key}
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      setOuterColor(color);
                    }}
                    className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center relative ${
                      outerColor.key === color.key ? 'border-[#C8102E] scale-110 shadow-md' : 'border-slate-200 hover:border-slate-400'
                    }`}
                    title={color.name}
                  >
                    <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: color.hex }} />
                    {outerColor.key === color.key && (
                      <span className="absolute inset-0 flex items-center justify-center text-white font-black text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Parameter 3: Neckline and Cuff Trim options */}
            {outerwearStyle !== 'blazer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-200/50">
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Sweater Trim Pattern</label>
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200/60">
                    {['none', 'single', 'double'].map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          appExperience.triggerFeedback('tap');
                          setTrimStyle(p as any);
                        }}
                        className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${
                          trimStyle === p ? 'bg-[#C8961A] text-white shadow' : 'text-slate-500 hover:text-[#0A1628]'
                        }`}
                      >
                        {p} Stripe
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Trim Contrast Color</label>
                  <div className="flex gap-2">
                    {TRIM_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => {
                          appExperience.triggerFeedback('tap');
                          setTrimColor(color);
                        }}
                        className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center relative ${
                          trimColor.name === color.name ? 'border-[#0A1628] scale-110' : 'border-slate-200'
                        }`}
                        title={color.name}
                      >
                        <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: color.hex }} />
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Parameter 4: Shirt details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">4. Shirt Collar Style</label>
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
                  {[
                    { id: 'plain', label: 'Classic Point' },
                    { id: 'peterpan', label: 'Peter Pan' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        appExperience.triggerFeedback('tap');
                        setShirtStyle(s.id as any);
                      }}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                        shirtStyle === s.id ? 'bg-[#0A1628] text-white shadow' : 'text-slate-500 hover:text-[#0A1628]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Shirt / Blouse Color</label>
                <div className="flex gap-2.5">
                  {SHIRT_COLORS.map((color) => (
                    <button
                      key={color.key}
                      onClick={() => {
                        appExperience.triggerFeedback('tap');
                        setShirtColor(color);
                      }}
                      className={`px-4 py-2.5 rounded-xl border-2 transition-all text-[9px] font-bold uppercase tracking-wider ${
                        shirtColor.key === color.key ? 'bg-white border-[#0A1628] shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 shadow-inner border border-slate-200/60" style={{ backgroundColor: color.hex }} />
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Parameter 5: Bottoms Color Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">
                5. Bottoms Fabric Tone ({genderFit === 'boy' ? 'Trousers' : 'Skirt'}): <span className="text-[#0A1628] font-bold">{bottomColor.name}</span>
              </label>
              <div className="flex gap-3">
                {BOTTOM_COLORS.map((color) => (
                  <button
                    key={color.key}
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      setBottomColor(color);
                    }}
                    className={`flex-1 py-3 rounded-2xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                      bottomColor.key === color.key 
                        ? 'bg-[#0A1628] text-white border-[#0A1628] shadow' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: color.hex }} />
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Component Material & Texture Customizer */}
            <div className="bg-[#FAF9F5] rounded-[2.5rem] border border-amber-900/10 p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-amber-900/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-600/10 flex items-center justify-center text-amber-700">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[2px] text-[#0A1628]">Material Texture & Loom Specs</h3>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Toggle high-fidelity fabric blends and weaves</p>
                  </div>
                </div>
                <span className="text-[8px] font-mono bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded uppercase">KEBS Compliant</span>
              </div>

              <div className="space-y-6">
                {/* 1. Outerwear Material */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Outerwear Fabric:</span>
                    <span className="text-[9px] font-bold text-[#C8102E]">{FABRICS.find(f => f.id === outerFabric)?.name}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {FABRICS.map((fab) => (
                      <button
                        key={fab.id}
                        onClick={() => {
                          appExperience.triggerFeedback('tap');
                          setOuterFabric(fab.id);
                        }}
                        className={`py-2 px-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 text-center ${
                          outerFabric === fab.id 
                            ? 'bg-[#0A1628] text-white border-[#0A1628] shadow-sm scale-[1.03]' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-[#0A1628]'
                        }`}
                      >
                        <span className="text-[8px] font-black tracking-tighter truncate w-full">{fab.name.split(' ')[1] || fab.name}</span>
                        <span className="text-[7px] font-mono opacity-60">{fab.gsm}</span>
                      </button>
                    ))}
                  </div>
                  {/* Detailed Specs for outer */}
                  {outerFabric && (
                    <div className="p-3 bg-white/80 rounded-xl border border-slate-100 text-[10px] leading-relaxed text-slate-500 flex justify-between items-start gap-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#0A1628]">{FABRICS.find(f => f.id === outerFabric)?.name}</span>
                        <p className="text-[9px] leading-relaxed">{FABRICS.find(f => f.id === outerFabric)?.desc}</p>
                      </div>
                      <div className="shrink-0 text-right font-mono text-[8px] space-y-0.5 border-l border-slate-200 pl-3">
                        <span className="block font-bold text-[#C8961A]">{FABRICS.find(f => f.id === outerFabric)?.gsm}</span>
                        <span className="block text-slate-400">{FABRICS.find(f => f.id === outerFabric)?.composition}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Shirt Material */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Shirt / Blouse Fabric:</span>
                    <span className="text-[9px] font-bold text-[#C8102E]">{FABRICS.find(f => f.id === shirtFabric)?.name}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {FABRICS.map((fab) => (
                      <button
                        key={fab.id}
                        onClick={() => {
                          appExperience.triggerFeedback('tap');
                          setShirtFabric(fab.id);
                        }}
                        className={`py-2 px-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 text-center ${
                          shirtFabric === fab.id 
                            ? 'bg-[#0A1628] text-white border-[#0A1628] shadow-sm scale-[1.03]' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-[#0A1628]'
                        }`}
                      >
                        <span className="text-[8px] font-black tracking-tighter truncate w-full">{fab.name.split(' ')[1] || fab.name}</span>
                        <span className="text-[7px] font-mono opacity-60">{fab.gsm}</span>
                      </button>
                    ))}
                  </div>
                  {/* Detailed Specs for shirt */}
                  {shirtFabric && (
                    <div className="p-3 bg-white/80 rounded-xl border border-slate-100 text-[10px] leading-relaxed text-slate-500 flex justify-between items-start gap-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#0A1628]">{FABRICS.find(f => f.id === shirtFabric)?.name}</span>
                        <p className="text-[9px] leading-relaxed">{FABRICS.find(f => f.id === shirtFabric)?.desc}</p>
                      </div>
                      <div className="shrink-0 text-right font-mono text-[8px] space-y-0.5 border-l border-slate-200 pl-3">
                        <span className="block font-bold text-[#C8961A]">{FABRICS.find(f => f.id === shirtFabric)?.gsm}</span>
                        <span className="block text-slate-400">{FABRICS.find(f => f.id === shirtFabric)?.composition}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Bottoms Material */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Bottoms Fabric:</span>
                    <span className="text-[9px] font-bold text-[#C8102E]">{FABRICS.find(f => f.id === bottomFabric)?.name}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {FABRICS.map((fab) => (
                      <button
                        key={fab.id}
                        onClick={() => {
                          appExperience.triggerFeedback('tap');
                          setBottomFabric(fab.id);
                        }}
                        className={`py-2 px-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 text-center ${
                          bottomFabric === fab.id 
                            ? 'bg-[#0A1628] text-white border-[#0A1628] shadow-sm scale-[1.03]' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-[#0A1628]'
                        }`}
                      >
                        <span className="text-[8px] font-black tracking-tighter truncate w-full">{fab.name.split(' ')[1] || fab.name}</span>
                        <span className="text-[7px] font-mono opacity-60">{fab.gsm}</span>
                      </button>
                    ))}
                  </div>
                  {/* Detailed Specs for bottoms */}
                  {bottomFabric && (
                    <div className="p-3 bg-white/80 rounded-xl border border-slate-100 text-[10px] leading-relaxed text-slate-500 flex justify-between items-start gap-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#0A1628]">{FABRICS.find(f => f.id === bottomFabric)?.name}</span>
                        <p className="text-[9px] leading-relaxed">{FABRICS.find(f => f.id === bottomFabric)?.desc}</p>
                      </div>
                      <div className="shrink-0 text-right font-mono text-[8px] space-y-0.5 border-l border-slate-200 pl-3">
                        <span className="block font-bold text-[#C8961A]">{FABRICS.find(f => f.id === bottomFabric)?.gsm}</span>
                        <span className="block text-slate-400">{FABRICS.find(f => f.id === bottomFabric)?.composition}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Parameter 6: Necktie Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-200/50">
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">School Necktie Style</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200/60">
                  {['none', 'solid', 'striped'].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        appExperience.triggerFeedback('tap');
                        setTieStyle(t as any);
                      }}
                      className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        tieStyle === t ? 'bg-[#0A1628] text-white shadow' : 'text-slate-500 hover:text-[#0A1628]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {tieStyle !== 'none' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Tie Primary Color</label>
                  <div className="flex gap-2">
                    {HIGH_SCHOOL_COLORS.slice(0, 5).map((color) => (
                      <button
                        key={color.key}
                        onClick={() => {
                          appExperience.triggerFeedback('tap');
                          setTieColor(color);
                        }}
                        className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center relative ${
                          tieColor.key === color.key ? 'border-[#0A1628] scale-110' : 'border-slate-200'
                        }`}
                        title={color.name}
                      >
                        <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: color.hex }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Parameter 7: School Embroidery Badge & Crest text */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">6. School Embroidery Badge & Text</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Crest Emblem Select</span>
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                    {[
                      { id: 'none', label: 'Plain' },
                      { id: 'royal-crest', label: 'Academy Crest' }
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          appExperience.triggerFeedback('tap');
                          setSelectedBadge(b.id);
                        }}
                        className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                          selectedBadge === b.id ? 'bg-[#0A1628] text-white' : 'text-slate-500 hover:text-[#0A1628]'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">School Name (For Embroidery reference)</span>
                  <input
                    type="text"
                    maxLength={24}
                    value={customBadgeText}
                    onChange={(e) => setCustomBadgeText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-[#0A1628] focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                    placeholder="Enter school name..."
                  />
                </div>

              </div>
            </div>

          </div>

          {/* Dynamic Wholesale Cost Estimator & Quote Trigger */}
          <div className="bg-gradient-to-r from-[#0E121C] to-[#1E293B] text-white rounded-[3.5rem] p-8 md:p-10 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#C8961A]/10 to-transparent rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-400/15 flex items-center justify-center text-emerald-400">
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[2.5px] text-white">Dynamic Wholesale Estimator</h3>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Real-Time Bulk Volume Discounts</p>
              </div>
            </div>

            {/* Slider for volume selection */}
            <div className="space-y-3">
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-slate-300">
                <span>Target Uniform Kits (Sweater + Shirt + Pants/Skirt)</span>
                <span className="text-emerald-400 font-bold">{orderQuantity} Full Kits</span>
              </div>
              <input
                type="range"
                min="10"
                max="2000"
                step="10"
                value={orderQuantity}
                onChange={(e) => {
                  appExperience.triggerFeedback('tap');
                  setOrderQuantity(parseInt(e.target.value));
                }}
                className="w-full accent-emerald-400 bg-neutral-800 rounded-lg appearance-none h-1.5 cursor-pointer"
              />
              <div className="flex justify-between text-[7px] font-bold text-slate-500 uppercase">
                <span>Min: 10 Kits</span>
                <span>Wholesale Bracket: 100+ (12% off)</span>
                <span>Super Volume: 1000+ (28% off)</span>
              </div>
            </div>

            {/* Price details grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-black/40 rounded-2xl border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <div>
                <p className="text-[7.5px] font-black text-slate-500 mb-0.5">Retail Value</p>
                <p className="text-white line-through font-mono text-sm">{formatPrice(pricingData.grossCost)}</p>
              </div>
              <div>
                <p className="text-[7.5px] font-black text-slate-500 mb-0.5">Applied Discount</p>
                <p className="text-emerald-400 font-black text-sm">{pricingData.discountPercent}% OFF</p>
              </div>
              <div>
                <p className="text-[7.5px] font-black text-slate-500 mb-0.5">Net / Kit</p>
                <p className="text-white font-mono text-sm font-black">{formatPrice(pricingData.netCost)}</p>
              </div>
              <div>
                <p className="text-[7.5px] font-black text-[#C8961A] mb-0.5">Total Saved</p>
                <p className="text-[#C8961A] font-mono text-sm font-black">{formatPrice(pricingData.saving)}</p>
              </div>
            </div>

            {/* Total Display & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 border-t border-white/10">
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[2px]">Projected Project Volume</span>
                <p className="text-2xl font-mono text-white font-black mt-1">{formatPrice(pricingData.totalCost)}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    appExperience.triggerFeedback('success');
                    setIsQuoteModalOpen(true);
                  }}
                  className="bg-[#C8102E] hover:bg-[#A60D24] text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-1.5 active:scale-95 shadow-lg shadow-[#C8102E]/20"
                >
                  <FileText size={14} /> Submit Design for Tender Quote
                </button>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* Nairobi Footer */}
      <Footer />
    </div>
  );
}
