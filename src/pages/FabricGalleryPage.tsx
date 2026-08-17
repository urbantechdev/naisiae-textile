import React, { useState, useRef, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  Info, 
  Wind, 
  Zap, 
  Shield, 
  ShoppingCart, 
  Plus, 
  RotateCcw, 
  Search, 
  Sliders, 
  Heart, 
  Sparkles,
  Layers,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { appExperience } from '../utils/haptics';

// Fabric specifications interface
interface FabricSample {
  id: string;
  name: string;
  type: string;
  typeName: string;
  description: string;
  longDescription: string;
  gsm: number;
  width: string;
  composition: string;
  weaveType: string;
  playgroundProof: number; // 1-10 durability
  breathability: number; // 1-10
  softness: number; // 1-10
  wrinkleResistance: number; // 1-10
  imageUrl: string;
  colors: { name: string; hex: string }[];
  suitability: string[];
  careInstructions: string[];
  threadCount: string; // threads per cm2
}

const FABRIC_SAMPLES: FabricSample[] = [
  {
    id: 'uhuru-drill',
    name: 'Uhuru Heavy-Duty Drill',
    type: 'heavy-duty-drill',
    typeName: 'Heavy-Duty Cotton Drill',
    description: 'Rugged twill weave for heavy-duty school skirts, trousers, corporate dust coats, and workwear.',
    longDescription: 'Specially engineered for the active student and industrial worker. Featuring a pronounced 2/1 twill construction, this drill resists high friction and playground slides without compromising on structure or color depth.',
    gsm: 260,
    width: '58/60 inches',
    composition: '65% Cotton, 35% Polyester',
    weaveType: 'Rigid Twill Weave',
    playgroundProof: 10,
    breathability: 6,
    softness: 7,
    wrinkleResistance: 8,
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1200',
    colors: [
      { name: 'Uhuru Khaki', hex: '#C2A175' },
      { name: 'Jogoo Road Navy', hex: '#0B1B3D' },
      { name: 'Nairobi Forest Green', hex: '#143622' },
      { name: 'Classic Black', hex: '#1A1A1A' }
    ],
    suitability: ['School Trousers', 'School Skirts', 'Workwear Overalls', 'Chef Jackets'],
    careInstructions: ['Warm machine wash', 'Iron on medium heat', 'Do not bleach', 'Tumble dry low'],
    threadCount: '110 threads/cm²'
  },
  {
    id: 'premium-gabardine',
    name: 'Naisiae Premium Gabardine',
    type: 'polyester-wool',
    typeName: 'Polyester-Wool Gabardine',
    description: 'Premium heavyweight diagonal rib, perfect for high-grade school blazers and administrative uniforms.',
    longDescription: 'A luxurious textile with a tight weave structure. The wool component provides unmatched natural insulating capabilities and water repellency, while the polyester guarantees crisp tailoring lines and high crease recovery.',
    gsm: 280,
    width: '58/60 inches',
    composition: '45% Wool, 55% Polyester',
    weaveType: 'Fine Diagonal Weave',
    playgroundProof: 9,
    breathability: 8,
    softness: 8,
    wrinkleResistance: 10,
    imageUrl: 'https://images.unsplash.com/photo-1520635680191-3d69937fc6ee?auto=format&fit=crop&q=80&w=1200',
    colors: [
      { name: 'Naisiae Emerald', hex: '#0E5A36' },
      { name: 'Presidential Navy', hex: '#050E24' },
      { name: 'Uhuru Maroon', hex: '#500B15' },
      { name: 'Charcoal Grey', hex: '#3B3E45' }
    ],
    suitability: ['Prefect Blazers', 'School Blazers', 'Corporate Coats', 'Administrative Wear'],
    careInstructions: ['Dry clean recommended', 'Cool iron with pressing cloth', 'Do not tumble dry'],
    threadCount: '145 threads/cm²'
  },
  {
    id: 'golden-polycotton',
    name: 'Golden Thread Polycotton',
    type: 'polyester-cotton',
    typeName: 'Polyester-Cotton Blend (Polycotton)',
    description: 'High durability with active breathability, perfect for school shirts, blouses, and light uniforms.',
    longDescription: 'The perfect synergy of natural cotton comfort and synthetic fiber strength. This fabric remains cool in warm classrooms, resists yellowing under the Kenyan sun, and has a quick-dry characteristic making it ideal for daily laundry rotation.',
    gsm: 165,
    width: '45 inches',
    composition: '65% Polyester, 35% Cotton',
    weaveType: 'Plain Weave',
    playgroundProof: 8,
    breathability: 9,
    softness: 8,
    wrinkleResistance: 9,
    imageUrl: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&q=80&w=1200',
    colors: [
      { name: 'Chalk White', hex: '#F9F9FB' },
      { name: 'Sky Blue', hex: '#AED6F1' },
      { name: 'Nairobi Cream', hex: '#FDF2E9' },
      { name: 'Pastel Pink', hex: '#FADBD8' }
    ],
    suitability: ['School Shirts', 'School Blouses', 'Hospitality Aprons', 'Medical Scrubs'],
    careInstructions: ['Machine wash warm', 'Iron on cotton setting', 'Tumble dry safe', 'Do not twist heavily'],
    threadCount: '95 threads/cm²'
  },
  {
    id: 'savannah-cotton',
    name: 'Savannah Combed Cotton',
    type: 'combed-cotton',
    typeName: '100% Combed Cotton Jersey',
    description: 'Premium ultra-soft long-staple cotton, exceptionally breathable, ideal for sports kits and active school polo shirts.',
    longDescription: 'Crafted from hand-selected Kenyan cotton and combed to remove short fibers. This yields a remarkably soft yarn that eliminates skin irritation, maintains superb sweat absorption, and drapes comfortably on active juniors.',
    gsm: 180,
    width: '60 inches',
    composition: '100% Combed Cotton',
    weaveType: 'Jersey Knit',
    playgroundProof: 7,
    breathability: 10,
    softness: 10,
    wrinkleResistance: 5,
    imageUrl: 'https://images.unsplash.com/photo-1582298538104-fe2e74c27f59?auto=format&fit=crop&q=80&w=1200',
    colors: [
      { name: 'Royal Blue', hex: '#1B4F72' },
      { name: 'Bright Red', hex: '#922B21' },
      { name: 'Sun Gold', hex: '#F1C40F' },
      { name: 'Optic White', hex: '#FFFFFF' }
    ],
    suitability: ['Games Polo Shirts', 'P.E. T-Shirts', 'Sports Shorts', 'Inner Linings'],
    careInstructions: ['Wash in cold water', 'Dry in shade to preserve color', 'Iron on low inside-out'],
    threadCount: '80 threads/cm²'
  },
  {
    id: 'jogoo-acrylic',
    name: 'Jogoo Road Acrylic Knitwear',
    type: 'acrylic-knitwear',
    typeName: 'Premium Low-Pill Acrylic',
    description: 'Heavyweight ribbed knit with premium thermal insulation, standard for school sweaters and vests.',
    longDescription: 'Engineered specifically for cool morning commutes. This high-density acrylic yarn uses triple-ply twisting to minimize pilling (balling), retains brilliant school colors across dozens of washes, and maintains elasticity at the cuffs and hem.',
    gsm: 320,
    width: 'Continuous Tubular Rib',
    composition: '100% Low-Pill Acrylic',
    weaveType: 'Chunky Rib Knit',
    playgroundProof: 8,
    breathability: 7,
    softness: 9,
    wrinkleResistance: 9,
    imageUrl: 'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?auto=format&fit=crop&q=80&w=1200',
    colors: [
      { name: 'Deep Maroon', hex: '#4A0813' },
      { name: 'Uhuru Forest Green', hex: '#113F26' },
      { name: 'Royal Purple', hex: '#3E0A52' },
      { name: 'School Grey', hex: '#565A5C' }
    ],
    suitability: ['School Sweaters', 'Knit Vests', 'School Cardigans', 'Athletic Socks'],
    careInstructions: ['Cool gentle machine wash', 'Dry flat in shade', 'Do not iron', 'Do not tumble dry'],
    threadCount: '75 stitches/cm²'
  },
  {
    id: 'executive-oxford',
    name: 'Executive Oxford Blue',
    type: 'oxford-fabric',
    typeName: 'Cotton-Polyester Oxford',
    description: 'Distinctive basketweave with double warp and single weft, popular for premium executive shirts and blouses.',
    longDescription: 'Features a substantial basketweave texture that gives the fabric its classic, slightly grainy feel. Highly breathable with rich structural holding, it remains looking sharp and professional throughout long school assemblies and school representative events.',
    gsm: 150,
    width: '45/46 inches',
    composition: '60% Cotton, 40% Polyester',
    weaveType: 'Textured Basketweave',
    playgroundProof: 8,
    breathability: 9,
    softness: 8,
    wrinkleResistance: 8,
    imageUrl: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=1200',
    colors: [
      { name: 'Oxford Light Blue', hex: '#C2DFFF' },
      { name: 'Oxford White', hex: '#FDFEFE' },
      { name: 'Oxford Pink', hex: '#FADBD8' },
      { name: 'Oxford Charcoal Stripe', hex: '#7F8C8D' }
    ],
    suitability: ['Senior Prefect Shirts', 'Executive Corporate Shirts', 'Branded Office Apparel'],
    careInstructions: ['Machine wash warm', 'Medium iron while slightly damp', 'Hang to dry'],
    threadCount: '125 threads/cm²'
  }
];

export default function FabricGalleryPage() {
  const { cartCount, wishlistCount, setIsCartOpen, setIsWishlistOpen, addToCart, setToast, setIsQuoteModalOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Filter States
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSuitability, setActiveSuitability] = useState('all');
  const [weightFilter, setWeightFilter] = useState('all');

  // Active Fabric Selection
  const [selectedFabric, setSelectedFabric] = useState<FabricSample>(FABRIC_SAMPLES[0]);
  
  // Custom Color Selection for Previewing Swatch Accent
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  // Loupe position for magnifier on the main detail card
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0, show: false });
  
  // Zoom Level on the virtual microscope simulation
  const [zoomLevel, setZoomLevel] = useState(1); // 1 to 40x
  
  // Microscope simulation mode: 'texture' vs 'threads'
  const [microscopeMode, setMicroscopeMode] = useState<'texture' | 'threads'>('texture');

  // Thread simulation warp/weft options
  const [threadTension, setThreadTension] = useState(15); // slider for thread density spacing

  // Handle detailed magnifying loupe hover coordinates
  const handleLoupeMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLoupePos({ x, y, show: true });
  };

  // Filtered fabric samples based on criteria
  const filteredSamples = useMemo(() => {
    return FABRIC_SAMPLES.filter(sample => {
      // 1. Blend type match
      if (activeFilter !== 'all' && sample.type !== activeFilter) return false;
      
      // 2. Suitability match
      if (activeSuitability !== 'all') {
        const matchesSuitability = sample.suitability.some(s => 
          s.toLowerCase().includes(activeSuitability.toLowerCase())
        );
        if (!matchesSuitability) return false;
      }
      
      // 3. Weight match
      if (weightFilter !== 'all') {
        if (weightFilter === 'light' && sample.gsm >= 180) return false;
        if (weightFilter === 'medium' && (sample.gsm < 180 || sample.gsm > 250)) return false;
        if (weightFilter === 'heavy' && sample.gsm <= 250) return false;
      }

      return true;
    });
  }, [activeFilter, activeSuitability, weightFilter]);

  // Requesting a swatch
  const handleRequestSwatch = (fabric: FabricSample) => {
    appExperience.triggerFeedback('success');
    
    // Create custom item representation
    const item = {
      id: `swatch-${fabric.id}`,
      name: `${fabric.name} Swatch Sample`,
      price: 0, // Swatches are free!
      imageUrl: fabric.imageUrl,
      category: 'Swatches',
      selectedVariants: {
        'Fabric Grade': fabric.typeName,
        'Selected Shade': fabric.colors[selectedColorIndex]?.name || 'Default'
      }
    };

    addToCart(item, 1);
    
    setToast({
      message: `Added 1x ${fabric.name} Swatch to Cart!`,
      type: 'success'
    });
    
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-[#08047D] pb-12">
      {/* Navbar with central context integrations */}
      <Navbar 
        wishlistCount={wishlistCount}
        setIsWishlistOpen={setIsWishlistOpen}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsQuoteModalOpen={setIsQuoteModalOpen}
      />
      
      {/* Standard SEO Compliant Breadcrumbs */}
      <Breadcrumb />

      {/* Hero Header with Naisiae Signature Typography */}
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-[1440px] mx-auto text-center">
          <h1 className="font-display text-6xl md:text-[8rem] text-[#08047D] leading-[0.8] tracking-tighter mb-8 uppercase italic">
            Textile <span className="text-white/0 stroke-text font-black" style={{ WebkitTextStroke: '2px #08047D' }}>Gallery</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-xs md:text-sm uppercase font-black tracking-[4px] leading-relaxed">
            Explore Uhuru Market's physical raw materials. Use our virtual macro lens to inspect composition, weave architecture, and playground durability ratings.
          </p>
        </div>
      </section>

      {/* Main Interactive Work Bench */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Side: Filter and Samples List (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Controls Bento Panel */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/85 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#08047D]/5 flex items-center justify-center text-[#08047D]">
                <Sliders size={16} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[2.5px] text-[#08047D]">Textile Filters</h2>
            </div>

            {/* Filter 1: Blend / Textile Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Blend Composition</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Blends' },
                  { id: 'polyester-cotton', label: 'Polycotton' },
                  { id: 'heavy-duty-drill', label: 'Twill Drill' },
                  { id: 'polyester-wool', label: 'Poly-Wool' },
                  { id: 'combed-cotton', label: 'Combed Cotton' },
                  { id: 'acrylic-knitwear', label: 'Acrylic Knit' },
                  { id: 'oxford-fabric', label: 'Oxford Weave' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      setActiveFilter(item.id);
                    }}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border ${
                      activeFilter === item.id 
                        ? 'bg-[#08047D] text-white border-[#08047D]' 
                        : 'bg-slate-50 text-slate-500 hover:text-[#08047D] border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 2: Suitability & Application */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Intended Application</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Outfits' },
                  { id: 'school', label: 'School Uniforms' },
                  { id: 'corporate', label: 'Corporate Apparel' },
                  { id: 'healthcare', label: 'Scrubs & Medical' },
                  { id: 'workwear', label: 'Industrial / Work' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      setActiveSuitability(item.id);
                    }}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border ${
                      activeSuitability === item.id 
                        ? 'bg-[#08047D] text-white border-[#08047D]' 
                        : 'bg-slate-50 text-slate-500 hover:text-[#08047D] border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 3: Weight Specification */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Fabric Weight Class</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Weights' },
                  { id: 'light', label: 'Lightweight (<180 GSM)' },
                  { id: 'medium', label: 'Medium (180 - 250 GSM)' },
                  { id: 'heavy', label: 'Heavyweight (>250 GSM)' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      setWeightFilter(item.id);
                    }}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border ${
                      weightFilter === item.id 
                        ? 'bg-[#FA9411] text-white border-[#FA9411]' 
                        : 'bg-slate-50 text-slate-500 hover:text-[#FA9411] border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Action */}
            <button
              onClick={() => {
                appExperience.triggerFeedback('success');
                setActiveFilter('all');
                setActiveSuitability('all');
                setWeightFilter('all');
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={13} /> Reset Filter Suite
            </button>
          </div>

          {/* Results List: Beautiful Fabric Swatch list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Available Samples ({filteredSamples.length})</span>
              <span className="text-[9px] font-bold text-[#FA9411] uppercase tracking-widest">Naisiae Certified Standards</span>
            </div>

            {filteredSamples.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-[2.5rem] space-y-4">
                <p className="text-xl">🧵</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No matching textiles found.<br />Try adjusting your filter selection.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                {filteredSamples.map((sample) => (
                  <motion.div
                    layoutId={`fabric-card-${sample.id}`}
                    key={sample.id}
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      setSelectedFabric(sample);
                      setSelectedColorIndex(0); // Reset custom color swatch index
                      setZoomLevel(1); // Reset microscope zoom
                    }}
                    className={`group p-4 bg-white border rounded-3xl transition-all cursor-pointer flex items-center gap-4 ${
                      selectedFabric.id === sample.id 
                        ? 'ring-2 ring-[#08047D] border-transparent shadow-md' 
                        : 'border-slate-200 hover:border-[#08047D]/40 shadow-sm'
                    }`}
                  >
                    {/* Small Texture Crop */}
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-100 shrink-0">
                      <img 
                        src={sample.imageUrl} 
                        alt={sample.name} 
                        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-[#08047D]/5 mix-blend-multiply"></div>
                    </div>

                    {/* Metadata summary */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-black text-[#08047D] uppercase truncate group-hover:text-[#08047D] transition-colors tracking-wide">{sample.name}</h3>
                        <span className="text-[8px] font-black text-[#FA9411] uppercase shrink-0 bg-[#FA9411]/10 px-2 py-0.5 rounded-full tracking-wider">{sample.gsm} GSM</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold truncate mt-1 leading-snug">{sample.typeName}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {sample.suitability.slice(0, 2).map((suit, index) => (
                          <span key={index} className="text-[7.5px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-md tracking-wider">
                            {suit}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Heavy Interactive Laboratory Detail Workbench (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Visualizer Stage */}
          <div className="bg-white rounded-[3.5rem] border border-slate-200/85 overflow-hidden shadow-sm relative">
            
            {/* Signature Top Accent */}
            <div className="h-1.5 bg-gradient-to-r from-[#08047D] via-[#E94C36] to-[#FA9411]" />
            
            {/* Header Details */}
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[9px] font-black text-[#FA9411] uppercase tracking-[3px]">{selectedFabric.typeName}</span>
                <h2 className="font-display text-3xl font-black text-[#08047D] uppercase tracking-tight mt-1">{selectedFabric.name}</h2>
              </div>
              <button
                onClick={() => handleRequestSwatch(selectedFabric)}
                className="self-start md:self-auto bg-[#08047D] hover:bg-[#08047D] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-2 shadow-lg shadow-[#08047D]/10 active:scale-95"
              >
                <Plus size={14} /> Request Free Swatch
              </button>
            </div>

            {/* Immersive View Port */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-100">
              
              {/* Left Column: Microscope Loupe & Magnifier Box */}
              <div className="p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 relative bg-[#FAFAFB]">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 mb-2">Tactile Macro Lens</h3>
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed mb-6">
                    Move your mouse cursor over the canvas below to magnify fiber threads and inspect yarn-level weave compliance.
                  </p>
                </div>

                {/* The Interactive Interactive Loupe Zone */}
                <div 
                  className="aspect-square w-full max-w-[280px] mx-auto rounded-3xl overflow-hidden relative shadow-inner cursor-crosshair border border-slate-200 select-none"
                  onMouseMove={handleLoupeMouseMove}
                  onMouseLeave={() => setLoupePos(p => ({ ...p, show: false }))}
                  onMouseEnter={() => setLoupePos(p => ({ ...p, show: true }))}
                >
                  {/* Base Image */}
                  <img 
                    src={selectedFabric.imageUrl} 
                    alt={selectedFabric.name} 
                    className="w-full h-full object-cover object-center relative z-0 pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle Diagonal Color Tint representation for the custom swatches */}
                  <div 
                    className="absolute inset-0 z-10 pointer-events-none mix-blend-color opacity-70"
                    style={{ backgroundColor: selectedFabric.colors[selectedColorIndex]?.hex || 'transparent' }}
                  />

                  {/* High Tech Magnifier Loupe lens */}
                  <AnimatePresence>
                    {loupePos.show && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute w-24 h-24 rounded-full border-2 border-[#FA9411] bg-white shadow-2xl z-20 pointer-events-none overflow-hidden"
                        style={{
                          left: `${loupePos.x}%`,
                          top: `${loupePos.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        {/* Zoomed portion of the fabric */}
                        <div 
                          className="w-full h-full bg-cover bg-center scale-[2.8]"
                          style={{
                            backgroundImage: `url(${selectedFabric.imageUrl})`,
                            backgroundPosition: `${loupePos.x}% ${loupePos.y}%`,
                          }}
                        />
                        {/* Custom shade layer in magnifier */}
                        <div 
                          className="absolute inset-0 pointer-events-none mix-blend-color opacity-70 scale-[2.8]"
                          style={{ 
                            backgroundColor: selectedFabric.colors[selectedColorIndex]?.hex || 'transparent',
                            transformOrigin: `${loupePos.x}% ${loupePos.y}%`
                          }}
                        />
                        
                        {/* Microscope Crosshair lines */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                          <div className="w-full h-[1px] bg-red-500 absolute" />
                          <div className="h-full w-[1px] bg-red-500 absolute" />
                          <div className="w-6 h-6 rounded-full border border-red-500 absolute" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Status overlay bar */}
                  <div className="absolute bottom-3 inset-x-3 bg-black/75 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between text-white border border-white/10 z-30 pointer-events-none">
                    <span className="text-[7.5px] font-black uppercase tracking-[1.5px] text-white">Linen Loupe (2.8x)</span>
                    <span className="text-[7px] font-mono text-emerald-400 uppercase tracking-widest">{selectedFabric.threadCount}</span>
                  </div>
                </div>

                {/* Standard colors Swatches picker */}
                <div className="mt-6 space-y-2">
                  <span className="text-[8px] font-black uppercase tracking-[2px] text-slate-400">Preview Nairobi School Colorways</span>
                  <div className="flex items-center gap-3">
                    {selectedFabric.colors.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColorIndex(idx)}
                        className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center relative ${
                          selectedColorIndex === idx ? 'border-[#08047D] scale-110 shadow-md' : 'border-slate-200 hover:border-slate-400'
                        }`}
                        title={color.name}
                      >
                        <div 
                          className="w-6 h-6 rounded-full shadow-inner"
                          style={{ backgroundColor: color.hex }}
                        />
                        {selectedColorIndex === idx && (
                          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#00C4CC] border border-white rounded-full flex items-center justify-center text-white text-[6px] font-black">✓</span>
                        )}
                      </button>
                    ))}
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide truncate max-w-[120px]">
                      {selectedFabric.colors[selectedColorIndex]?.name}
                    </span>
                  </div>
                </div>

              </div>

              {/* Right Column: Dynamic Specs & Ratings Meter */}
              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 mb-2">Technical Summary</h3>
                  <p className="text-slate-600 text-xs font-semibold leading-relaxed">
                    {selectedFabric.description}
                  </p>
                </div>

                {/* Rating Metrics bars */}
                <div className="space-y-4">
                  {[
                    { label: 'Playground Wear Proofing', value: selectedFabric.playgroundProof, icon: <Shield size={13} />, color: 'bg-emerald-500' },
                    { label: 'Breathability Index', value: selectedFabric.breathability, icon: <Wind size={13} />, color: 'bg-blue-400' },
                    { label: 'Crease & Wrinkle Recovery', value: selectedFabric.wrinkleResistance, icon: <Zap size={13} />, color: 'bg-yellow-500' },
                    { label: 'Tactile Softness Rating', value: selectedFabric.softness, icon: <Eye size={13} />, color: 'bg-purple-400' }
                  ].map((metric, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-500">
                        <div className="flex items-center gap-1.5">
                          {metric.icon}
                          <span>{metric.label}</span>
                        </div>
                        <span className="font-mono">{metric.value} / 10</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.value * 10}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className={`h-full ${metric.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Structural specification grid */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 grid grid-cols-2 gap-4 text-[10px] font-semibold text-slate-600">
                  <div>
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Raw Composition</p>
                    <p className="text-[#08047D] font-bold uppercase tracking-wider">{selectedFabric.composition}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Standard Cut Width</p>
                    <p className="text-[#08047D] font-bold uppercase tracking-wider">{selectedFabric.width}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200/50">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Loom Weave Pattern</p>
                    <p className="text-[#08047D] font-bold uppercase tracking-wider">{selectedFabric.weaveType}</p>
                  </div>
                </div>

              </div>

            </div>

            {/* Immersive Weave Virtual Microscope (Interactive Simulation) */}
            <div className="p-8 bg-slate-900 text-white relative">
              
              {/* Microscope details */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#00C4CC] animate-pulse"></span>
                    <span className="text-[9px] font-black text-[#00C4CC] tracking-[2.5px] uppercase">Loom Architecture</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white uppercase tracking-tight">Weave Microscope Simulation</h3>
                </div>
                
                {/* View modes toggle */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
                  <button
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      setMicroscopeMode('texture');
                    }}
                    className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      microscopeMode === 'texture' ? 'bg-[#00C4CC] text-[#04023D]' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    High-Res Scan
                  </button>
                  <button
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      setMicroscopeMode('threads');
                      if (zoomLevel < 12) setZoomLevel(15); // Auto zoom in to see threads
                    }}
                    className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      microscopeMode === 'threads' ? 'bg-[#00C4CC] text-[#04023D]' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Fiber Grid
                  </button>
                </div>
              </div>

              {/* Simulation Screen Canvas */}
              <div className="w-full aspect-[21/9] rounded-3xl bg-black border border-white/10 overflow-hidden relative flex items-center justify-center">
                
                {microscopeMode === 'texture' ? (
                  /* High-Res Texture Zooming Camera Frame */
                  <div className="w-full h-full relative">
                    <motion.div 
                      className="w-full h-full bg-cover bg-center"
                      style={{ 
                        backgroundImage: `url(${selectedFabric.imageUrl})`,
                        scale: 1 + (zoomLevel / 10)
                      }}
                      animate={{ scale: 1 + (zoomLevel / 10) }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    />
                    {/* Selected Shade tinting Layer */}
                    <div 
                      className="absolute inset-0 pointer-events-none mix-blend-color opacity-70"
                      style={{ backgroundColor: selectedFabric.colors[selectedColorIndex]?.hex || 'transparent' }}
                    />
                    
                    {/* Overlay Grid scanning lines */}
                    <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 pointer-events-none" />
                    <div className="absolute top-2 left-4 text-[7px] font-mono uppercase tracking-widest text-[#00C4CC]/70 bg-black/60 px-2 py-1 rounded border border-white/5">
                      Lens: High-Resolution Texture Array / Optical Zoom: {zoomLevel.toFixed(1)}x
                    </div>
                  </div>
                ) : (
                  /* High Tech procedural Warp and Weft Fiber grid Representation */
                  <div className="absolute inset-0 bg-neutral-950 overflow-hidden flex items-center justify-center">
                    
                    {/* SVG Weave Pattern representation */}
                    <svg className="w-full h-full opacity-90" viewBox="0 0 500 200">
                      <defs>
                        {/* Define Polyester fiber style (Shiny/Smooth silver cylinders) */}
                        <linearGradient id="poly-fiber" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#85929E" />
                          <stop offset="30%" stopColor="#D5DBDB" />
                          <stop offset="70%" stopColor="#AEB6BF" />
                          <stop offset="100%" stopColor="#5D6D7E" />
                        </linearGradient>
                        {/* Define Cotton fiber style (Soft/Organic matte thread) */}
                        <linearGradient id="cotton-fiber" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#F5CBA7" />
                          <stop offset="40%" stopColor="#FDF2E9" />
                          <stop offset="80%" stopColor="#EDBB99" />
                          <stop offset="100%" stopColor="#DC7633" />
                        </linearGradient>
                        {/* Selected shade dynamic color override */}
                        <linearGradient id="tinted-fiber" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#1C2833" />
                          <stop offset="40%" stopColor={selectedFabric.colors[selectedColorIndex]?.hex || '#AED6F1'} />
                          <stop offset="100%" stopColor="#04023D" />
                        </linearGradient>
                      </defs>

                      {/* Weave Render: Warp threads (vertical) and Weft threads (horizontal) interlocking */}
                      {/* Generates rows/cols dynamically based on threadTension slider */}
                      {Array.from({ length: threadTension }).map((_, i) => {
                        const x = (500 / threadTension) * i + (500 / threadTension / 2);
                        // Pattern: Alternate polyester vs cotton based on fiber type
                        const isPolyesterWarp = selectedFabric.composition.includes('Polyester') && i % 2 === 0;
                        const fillGradient = isPolyesterWarp ? 'url(#poly-fiber)' : 'url(#tinted-fiber)';
                        
                        return (
                          <rect 
                            key={`warp-${i}`}
                            x={x - 4} 
                            y="0" 
                            width={8 + (zoomLevel / 4)} 
                            height="200" 
                            fill={fillGradient}
                            className="opacity-80"
                          />
                        );
                      })}

                      {/* Weft threads (horizontal) */}
                      {Array.from({ length: 12 }).map((_, i) => {
                        const y = (200 / 12) * i + (200 / 12 / 2);
                        const isCottonWeft = selectedFabric.composition.includes('Cotton') && i % 2 === 0;
                        const fillGradient = isCottonWeft ? 'url(#cotton-fiber)' : 'url(#tinted-fiber)';
                        
                        return (
                          <line
                            key={`weft-${i}`}
                            x1="0"
                            y1={y}
                            x2="500"
                            y2={y}
                            stroke={fillGradient}
                            strokeWidth={6 + (zoomLevel / 6)}
                            strokeDasharray={i % 2 === 0 ? '12,6' : '6,12'}
                            className="opacity-70"
                          />
                        );
                      })}

                    </svg>

                    {/* HUD labels */}
                    <div className="absolute top-2 left-4 text-[7px] font-mono uppercase tracking-widest text-[#00C4CC] bg-black/60 px-2 py-1 rounded border border-white/5 flex gap-3 items-center">
                      <span>Loom model: {selectedFabric.weaveType}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                    </div>

                    <div className="absolute bottom-2 right-4 text-[7px] font-mono text-slate-400">
                      Double-cross structure / 3D weave matrix simulation
                    </div>
                  </div>
                )}

                {/* Digital Scale overlay */}
                <div className="absolute inset-x-0 bottom-0 h-4 bg-black/60 backdrop-blur-sm border-t border-white/5 flex items-center justify-between px-4 text-[6.5px] font-mono text-white/50 tracking-widest">
                  <span>0 mm</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="w-[1px] h-1.5 bg-white/40" />
                    ))}
                  </div>
                  <span>1.0 mm</span>
                </div>

              </div>

              {/* Simulation Controls Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/10 text-xs">
                
                {/* Microscope Zoom control */}
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-[#00C4CC]">
                    <span>Microscope Zoom Depth</span>
                    <span>{zoomLevel.toFixed(1)}x / 40.0x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    step="0.5"
                    value={zoomLevel}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setZoomLevel(value);
                      if (value > 12 && microscopeMode !== 'threads') {
                        setMicroscopeMode('threads'); // Auto-switch to thread schematic if zoomed far enough
                      } else if (value <= 12 && microscopeMode === 'threads') {
                        setMicroscopeMode('texture');
                      }
                    }}
                    className="w-full accent-[#00C4CC] bg-neutral-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between text-[7.5px] font-bold text-slate-500 uppercase">
                    <span>1.0x (Standard)</span>
                    <span>12.0x (Optimal Scanner)</span>
                    <span>40.0x (Fiber Grid)</span>
                  </div>
                </div>

                {/* Thread density warp weft spacing */}
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-[#00C4CC]">
                    <span>Virtual Loom Density (Thread Count)</span>
                    <span>{threadTension} threads/cm²</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="24"
                    step="1"
                    value={threadTension}
                    disabled={microscopeMode !== 'threads'}
                    onChange={(e) => {
                      appExperience.triggerFeedback('tap');
                      setThreadTension(parseInt(e.target.value));
                    }}
                    className="w-full accent-[#00C4CC] bg-neutral-800 rounded-lg appearance-none h-1.5 cursor-pointer disabled:opacity-30"
                  />
                  <div className="flex justify-between text-[7.5px] font-bold text-slate-500 uppercase">
                    <span>Loose Weave</span>
                    <span>Standard Density</span>
                    <span>Dense Interlocking</span>
                  </div>
                </div>

              </div>

            </div>

            {/* In-depth details & Care specifications bento panels */}
            <div className="p-8 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100">
              
              {/* Suitability guidelines */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Layers size={14} className="text-[#FA9411]" />
                  <h4 className="text-[10px] font-black uppercase tracking-[2px]">Institution Suitability & Compliances</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedFabric.suitability.map((suit, index) => (
                    <span key={index} className="px-3 py-1.5 bg-white border border-slate-200 text-[#08047D] font-bold text-[9px] uppercase tracking-widest rounded-xl shadow-sm">
                      ✓ {suit}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                  *Naisiae Textiles certifies that this loom selection conforms with standard East African Ministry of Education uniform textile tensile standards.
                </p>
              </div>

              {/* Maintenance instructions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Info size={14} className="text-[#08047D]" />
                  <h4 className="text-[10px] font-black uppercase tracking-[2px]">Loom Maintenance & Lifespan Rules</h4>
                </div>
                <ul className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {selectedFabric.careInstructions.map((instruction, index) => (
                    <li key={index} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#08047D]" />
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>

          {/* Sourcing Call To Action block */}
          <div className="p-8 bg-[#04023D] text-white rounded-[3.5rem] border border-white/5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FA9411]/10 to-transparent rounded-full pointer-events-none" />
            
            <div className="space-y-2 max-w-lg relative z-10">
              <span className="text-[8px] font-black text-[#FA9411] uppercase tracking-[3px]">Institutional Orders</span>
              <h3 className="font-display text-2xl font-black uppercase tracking-wide">Custom Dyed Batches & Tenders</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                Need a specific fabric colorway or a high-volume custom knit pattern? Visit our Nairobi workshop along Jogoo Road or request a bulk manufacturing estimate. Min. 50 units.
              </p>
            </div>

            <button
              onClick={() => {
                appExperience.triggerFeedback('success');
                setIsQuoteModalOpen(true);
              }}
              className="bg-gradient-to-r from-[#08047D] to-[#FA9411] text-white hover:shadow-[0_4px_25px_rgba(200,16,46,0.4)] px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] transition-all shrink-0 self-start md:self-auto active:scale-95"
            >
              Enquire About Fabric Dyeing
            </button>
          </div>

        </div>

      </section>

      {/* Global footer with trademark listings */}
      <Footer />

    </div>
  );
}
