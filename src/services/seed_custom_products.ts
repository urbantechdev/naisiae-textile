import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Define the absolute high-quality category images
const IMAGE_MAPPING: Record<string, string> = {
  "High School Trousers": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop",
  "Primary School Trousers": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800&auto=format&fit=crop",
  "School Shorts": "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=800&auto=format&fit=crop",
  "PE Shorts": "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop",
  "School Shirts": "https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=800&auto=format&fit=crop",
  "Long-Sleeve Sweaters": "https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?q=80&w=800&auto=format&fit=crop",
  "Short-Sleeve Sweaters": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop",
  "Fleece Jackets": "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop",
  "Tracksuits": "https://images.unsplash.com/photo-1483721310020-03333e577076?q=80&w=800&auto=format&fit=crop",
  "School T-Shirts": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop",
  "School Socks": "https://images.unsplash.com/photo-1582966772680-860e372bb558?q=80&w=800&auto=format&fit=crop",
  "School Ties": "https://images.unsplash.com/photo-1589756823855-edd13437435e?q=80&w=800&auto=format&fit=crop",
  "KMTC Cardigans": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop",
  "KMTC Dresses": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop",
  "KMTC Aprons": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop",
  "KMTC Labcoat": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=800&auto=format&fit=crop",
  "Chef Trousers": "https://images.unsplash.com/photo-1595257841889-eca9682337ae?q=80&w=800&auto=format&fit=crop",
  "Chef Jackets": "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=800&auto=format&fit=crop",
  "School Blazers": "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=800&auto=format&fit=crop",
  "Sleepover Wear": "https://images.unsplash.com/photo-1541855492-581f618f69a0?q=80&w=800&auto=format&fit=crop",
  "School Scarfs": "https://images.unsplash.com/photo-1601625263541-1a3b1180fb37?q=80&w=800&auto=format&fit=crop",
  "School Muffins": "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=800&auto=format&fit=crop"
};

const RAW_PRODUCTS = [
  {
    name: "High School Trousers",
    priceType: "fixed",
    description: "Tailored from heavy-duty 65/35 poly-viscose gabardine fabric designed for daily high school wear. Features twin slant front pockets, a secure brass fly zipper, bar-tacked stress points, and an inner anti-slip waistband. Available in classic Summit, Grey, and Short cuts with pre-hemmed cuffs that resist fraying through repeated laundry cycles.",
    wholesalePrice: 350,
    oldPrice: null,
    variants: "Size:26|Style:Short=350,Size:26|Style:Summit=550,Size:26|Style:Grey=700,Size:28|Style:Short=350,Size:28|Style:Summit=550,Size:28|Style:Grey=700,Size:30|Style:Short=350,Size:30|Style:Summit=550,Size:30|Style:Grey=750",
    active: true,
    subCategory: "Trousers",
    badge: "Bestseller",
    category: "School Uniforms",
    stock: 100,
    tags: "high school, trousers, uniform, premium"
  },
  {
    name: "Primary School Trousers",
    priceType: "fixed",
    description: "Sturdy poly-cotton twill trousers built for active primary school students. Includes a half-elastic waistband for growth flexibility and easy pull-on comfort, deep side pockets, and double-needle seat seams to prevent splits during games. Offered in Summit navy and standard school grey shades.",
    wholesalePrice: 220,
    oldPrice: null,
    variants: "Size:20|Style:Summit=220,Size:20|Style:Grey=300,Size:22|Style:Summit=240,Size:22|Style:Grey=300,Size:24|Style:Summit=260,Size:24|Style:Grey=320,Size:26|Style:Summit=280,Size:26|Style:Grey=340,Size:28|Style:Summit=300,Size:28|Style:Grey=360,Size:30|Style:Summit=320,Size:30|Style:Grey=380,Size:32|Style:Summit=340,Size:32|Style:Grey=400,Size:34|Style:Summit=360,Size:34|Style:Grey=420,Size:36|Style:Summit=440,Size:36|Style:Grey=490",
    active: true,
    subCategory: "Trousers",
    badge: null,
    category: "School Uniforms",
    stock: 100,
    tags: "primary school, trousers, uniform, durable"
  },
  {
    name: "School Shorts",
    priceType: "fixed",
    description: "Classic school uniform shorts tailored from 220 GSM heavy-grade cotton-poly fabric. Styled with a structured waistband, belt loops, side slit pockets, and a buttoned rear pocket. Built with anti-fade dyes to maintain rich colors through school term washing. Options include Summit, Grey, Kijana/Thika, Khaki, and American patterns.",
    wholesalePrice: 240,
    oldPrice: null,
    variants: "Size:20|Style:Summit=240,Size:20|Style:Grey=320,Size:20|Style:Kijana=450,Size:22|Style:Summit=260,Size:22|Style:Grey=340,Size:22|Style:Kijana=450,Size:24|Style:Summit=280,Size:24|Style:Grey=360,Size:24|Style:Kijana=500,Size:26|Style:Summit=300,Size:26|Style:Grey=380,Size:26|Style:Kijana=500,Size:28|Style:Summit=320,Size:28|Style:Grey=400,Size:28|Style:Kijana=550,Size:28|Style:American=500,Size:30|Style:Summit=340,Size:30|Style:Grey=420,Size:30|Style:Kijana=550,Size:30|Style:American=500,Size:32|Style:Summit=360,Size:32|Style:Grey=440,Size:32|Style:Kijana=600,Size:32|Style:American=550,Size:34|Style:Summit=360,Size:34|Style:Grey=440,Size:34|Style:Kijana=600,Size:34|Style:American=550,Size:36|Style:Kijana=650,Size:36|Style:American=600",
    active: true,
    subCategory: "Shorts",
    badge: null,
    category: "School Uniforms",
    stock: 100,
    tags: "shorts, primary school, khaki, boys, school uniform"
  },
  {
    name: "PE Shorts",
    priceType: "fixed",
    description: "Breathable physical education shorts tailored from quick-drying knitted polyester mesh. Features a wide elastic waistband with a drawcord inside for a secure fit during athletics and team sports. Double-stitched hems ensure longevity through energetic activity.",
    wholesalePrice: 220,
    oldPrice: null,
    variants: "Size:20|Style:Plain=220,Size:22|Style:Plain=240,Size:24|Style:Plain=260,Size:26|Style:Plain=280,Size:26|Style:Stripes=240,Size:28|Style:Plain=300,Size:28|Style:Stripes=260,Size:30|Style:Plain=320,Size:30|Style:Stripes=280,Size:32|Style:Plain=340,Size:32|Style:Stripes=300,Size:36|Style:Plain=360,Size:36|Style:Stripes=320,Size:40|Style:Plain=420,Size:40|Style:Stripes=340,Size:44|Style:Plain=440,Size:44|Style:Stripes=360,Size:48|Style:Stripes=380",
    active: true,
    subCategory: "Shorts",
    badge: "Sports",
    category: "School Uniforms",
    stock: 100,
    tags: "pe shorts, games, sports, elastic"
  },
  {
    name: "School Shirts",
    priceType: "fixed",
    description: "Crisp uniform shirts sewn from a 110 GSM poplin weave blend (cotton-polyester) for effortless ironing and skin breathability. Styled with a stiff fused collar, durable button closures, a left chest pocket, and reinforced armhole stitching. Available in Plain, Checked, Yoke detail, 100% Cotton, and Long Sleeve options.",
    wholesalePrice: 200,
    oldPrice: null,
    variants: "Size:E|Style:Plain=200,Size:E|Style:Checked=250,Size:18|Style:Yoke=230,Size:18|Style:Cotton=350,Size:18|Style:LongSleeve=250,Size:20|Style:Yoke=270,Size:20|Style:Cotton=370,Size:20|Style:LongSleeve=330,Size:22|Style:Yoke=290,Size:22|Style:Cotton=390,Size:22|Style:LongSleeve=330,Size:24|Style:Yoke=310,Size:24|Style:Cotton=410,Size:24|Style:LongSleeve=350,Size:26|Style:Yoke=330,Size:26|Style:Cotton=430,Size:26|Style:LongSleeve=350,Size:28|Style:Yoke=350,Size:28|Style:Cotton=450,Size:28|Style:LongSleeve=400,Size:30|Style:Yoke=350,Size:30|Style:Cotton=450,Size:30|Style:LongSleeve=400,Size:SS|Style:Plain=250,Size:SS|Style:Checked=300,Size:S|Style:Plain=250,Size:S|Style:Checked=300,Size:M|Style:Plain=300,Size:M|Style:Checked=300,Size:L|Style:Plain=300,Size:L|Style:Checked=300,Size:XL|Style:Plain=300,Size:XL|Style:Checked=300,Size:XXL|Style:Plain=300,Size:XXL|Style:Checked=300",
    active: true,
    subCategory: "Shirts",
    badge: "Premium Cotton",
    category: "School Uniforms",
    stock: 100,
    tags: "shirts, school shirt, formal, checked"
  },
  {
    name: "Long-Sleeve Sweaters",
    priceType: "fixed",
    description: "Warm V-neck long-sleeve school sweaters knitted from 100% heavy-gauge low-pill acrylic yarn. Features double-ply ribbed cuffs and a snug ribbed waist to trap body heat on cold morning assemblies. Machine washable without stretching or shape distortion. Plain or contrast neck stripe options.",
    wholesalePrice: 450,
    oldPrice: null,
    variants: "Size:22|Style:Plain=450,Size:22|Style:Stripes=470,Size:24|Style:Plain=490,Size:24|Style:Stripes=510,Size:26|Style:Plain=520,Size:26|Style:Stripes=540,Size:28|Style:Plain=540,Size:28|Style:Stripes=560,Size:30|Style:Plain=570,Size:30|Style:Stripes=590,Size:32|Style:Plain=600,Size:32|Style:Stripes=620,Size:34|Style:Plain=650,Size:34|Style:Stripes=670,Size:36|Style:Plain=700,Size:36|Style:Stripes=720,Size:38|Style:Plain=750,Size:38|Style:Stripes=770,Size:40|Style:Plain=800,Size:40|Style:Stripes=820,Size:42|Style:Plain=1000,Size:42|Style:Stripes=1050,Size:44|Style:Plain=1200,Size:44|Style:Stripes=1250",
    active: true,
    subCategory: "Sweaters",
    badge: "Winter Warm",
    category: "School Uniforms",
    stock: 100,
    tags: "sweaters, long sleeve, primary school, high school, knitwear"
  },
  {
    name: "Short-Sleeve Sweaters",
    priceType: "fixed",
    description: "Sleeveless and short-sleeve sweater vests ideal for moderate school weather. Machine-knitted with soft 10-gauge acrylic yarn, featuring ribbed armholes and a sturdy V-neckband that maintains its shape over long term wear.",
    wholesalePrice: 410,
    oldPrice: null,
    variants: "Size:22|Style:Plain=410,Size:22|Style:Stripes=430,Size:24|Style:Plain=450,Size:24|Style:Stripes=470,Size:26|Style:Plain=480,Size:26|Style:Stripes=500,Size:28|Style:Plain=500,Size:28|Style:Stripes=520,Size:30|Style:Plain=530,Size:30|Style:Stripes=550,Size:32|Style:Plain=560,Size:32|Style:Stripes=580,Size:34|Style:Plain=610,Size:34|Style:Stripes=630,Size:36|Style:Plain=660,Size:36|Style:Stripes=680,Size:38|Style:Plain=710,Size:38|Style:Stripes=730,Size:40|Style:Plain=760,Size:40|Style:Stripes=780,Size:42|Style:Plain=950,Size:42|Style:Stripes=970,Size:44|Style:Plain=1150,Size:44|Style:Stripes=1170",
    active: true,
    subCategory: "Sweaters",
    badge: "Lightweight",
    category: "School Uniforms",
    stock: 100,
    tags: "sweaters, short sleeve, vests, school wear, pullover"
  },
  {
    name: "Fleece Jackets",
    priceType: "fixed",
    description: "Heavyweight 300 GSM anti-pill polar fleece jackets tailored for school assemblies and cold boarding nights. Built with a sturdy full-length front zipper, stand-up collar, deep hand-warmer pockets, and elasticated wrist cuffs for insulation.",
    wholesalePrice: 1300,
    oldPrice: 1600,
    variants: "Size:20-24=1300,Size:26-28=1400,Size:30-32=1500,Size:34-36=1600,Size:38=1700,Size:40=1800",
    active: true,
    subCategory: "Fleece Jackets",
    badge: "Cozy Fleece",
    category: "School Uniforms",
    stock: 100,
    tags: "fleece, jackets, winter wear, boarding school"
  },
  {
    name: "Tracksuits",
    priceType: "fixed",
    description: "Full two-piece school tracksuit set comprising a zip-up track jacket and matching track pants. Made from durable micro-tapestry polyester with a soft inner jersey lining. Zippered jacket pockets, elasticated cuffs, and reinforced knee panels ensure long-lasting performance for sports days.",
    wholesalePrice: 800,
    oldPrice: null,
    variants: "Size:20-26|Type:Normal=800,Size:20-26|Type:Special=850,Size:28-30|Type:Normal=850,Size:28-30|Type:Special=900,Size:32-34|Type:Normal=900,Size:32-34|Type:Special=950,Size:36-38|Type:Normal=1000,Size:36-38|Type:Special=1050,Size:40|Type:Normal=1100,Size:40|Type:Special=1150,Size:42|Type:Normal=1200,Size:42|Type:Special=1250,Size:44|Type:Normal=1350",
    active: true,
    subCategory: "Tracksuits",
    badge: "Athletics",
    category: "School Uniforms",
    stock: 100,
    tags: "tracksuits, sports, games, jogging, physical education"
  },
  {
    name: "School T-Shirts",
    priceType: "fixed",
    description: "Soft 180 GSM combed cotton crew-neck and polo-style t-shirts for sports, houses, and casual school events. Features taped neck seams to prevent stretching, double-stitched sleeve cuffs, and a smooth surface suitable for screen printing or school crest embroidery.",
    wholesalePrice: 250,
    oldPrice: null,
    variants: "Size:60-65|Type:Plain=250,Size:60-65|Type:LDP=300,Size:70-75|Type:Plain=300,Size:70-75|Type:LDP=350,Size:80-90|Type:Plain=350,Size:80-90|Type:LDP=400",
    active: true,
    subCategory: "T-Shirts",
    badge: "Branded polo",
    category: "School Uniforms",
    stock: 100,
    tags: "tshirts, sports, polo, games, embroidery"
  },
  {
    name: "School Socks",
    priceType: "fixed",
    description: "Pack of 6 knee-high ribbed school socks knitted from a comfortable 80% cotton and 20% elastane blend. Reinforced heel and toe cushions prevent wear holes from school shoes, while elasticated turnover tops keep the socks securely in place all day.",
    wholesalePrice: 1680,
    oldPrice: null,
    variants: "Type:Pack=1680",
    active: true,
    subCategory: "Accessories",
    badge: "Pack of 6",
    category: "School Uniforms",
    stock: 100,
    tags: "socks, school socks, accessories"
  },
  {
    name: "School Ties",
    priceType: "fixed",
    description: "Smart woven uniform ties tailored from smooth matte polyester yarn. Stain-resistant finish with neat tipping and a durable inner interlining that preserves crisp knotting for daily school assembly standards.",
    wholesalePrice: 40,
    oldPrice: null,
    variants: "Type:Small=40,Type:Standard=60",
    active: true,
    subCategory: "Accessories",
    badge: "Formals",
    category: "School Uniforms",
    stock: 100,
    tags: "ties, high school tie, accessories"
  },
  {
    name: "KMTC Cardigans",
    priceType: "fixed",
    description: "Official Kenya Medical Training College (KMTC) button-down cardigans crafted from a premium navy wool-blend yarn. Features deep front welt pockets, clear KMTC button fasteners, and reinforced cuffs designed for hospital ward shifts and clinical rounds.",
    wholesalePrice: 1500,
    oldPrice: null,
    variants: null,
    active: true,
    subCategory: "Medical",
    badge: "KMTC Official",
    category: "KMTC Uniforms",
    stock: 100,
    tags: "kmtc, cardigans, medical, nursing, college"
  },
  {
    name: "KMTC Dresses",
    priceType: "fixed",
    description: "Official KMTC nursing and clinical dresses tailored from easy-care teal poly-cotton poplin. Designed with a neat action-back pleat for easy arm movement during ward duties, side slit pockets, a notched collar, and durable front button fastenings.",
    wholesalePrice: 1500,
    oldPrice: null,
    variants: null,
    active: true,
    subCategory: "Medical",
    badge: "KMTC Official",
    category: "KMTC Uniforms",
    stock: 100,
    tags: "kmtc, dress, nursing, scrubbing, clinic"
  },
  {
    name: "KMTC Aprons",
    priceType: "fixed",
    description: "Protective medical aprons for KMTC students and hospital interns. Cut from splash-resistant heavyweight twill fabric with reinforced tie tapes, twin front utility pockets, and adjustable neck straps for full coverage during clinical practicals.",
    wholesalePrice: 500,
    oldPrice: null,
    variants: null,
    active: true,
    subCategory: "Medical",
    badge: "KMTC Official",
    category: "KMTC Uniforms",
    stock: 100,
    tags: "kmtc, aprons, protector"
  },
  {
    name: "KMTC Labcoat",
    priceType: "fixed",
    description: "Classic white laboratory coat for KMTC students, doctors, and lab technicians. Tailored from 200 GSM high-grade poly-cotton twill with a side-access slit, three deep patch pockets, a notched lapel, and concealed press-stud closures.",
    wholesalePrice: 800,
    oldPrice: null,
    variants: null,
    active: true,
    subCategory: "Medical",
    badge: "Clinicals",
    category: "KMTC Uniforms",
    stock: 100,
    tags: "labcoat, medical, doctor, chemistry, scrub"
  },
  {
    name: "Chef Trousers",
    priceType: "fixed",
    description: "Professional kitchen trousers crafted from 65/35 poly-cotton twill with a stain-release finish. Styled with a soft elasticated waistband and internal drawstring for all-day kitchen comfort, side slant pockets, and a rear wallet pocket. Plain black or traditional houndstooth check.",
    wholesalePrice: 1000,
    oldPrice: null,
    variants: null,
    active: true,
    subCategory: "Hospitality",
    badge: "Professional",
    category: "Chef Uniforms",
    stock: 100,
    tags: "chef, trousers, hotel, culinary, checkered, black"
  },
  {
    name: "Chef Jackets",
    priceType: "fixed",
    description: "Double-breasted professional executive chef jackets tailored from 220 GSM drill cotton blend. Heat-resistant cloth-covered buttons, a thermometer sleeve pocket, ventilated underarm eyelets, and a mandarin collar provide utility and heat relief.",
    wholesalePrice: 800,
    oldPrice: null,
    variants: null,
    active: true,
    subCategory: "Hospitality",
    badge: "Professional",
    category: "Chef Uniforms",
    stock: 100,
    tags: "chef, jackets, kitchen, restaurant, catering"
  },
  {
    name: "School Blazers",
    priceType: "fixed",
    description: "Structured school blazers constructed with a durable poly-viscose outer shell, smooth inner satin lining, and double-fused chest canvas for a sharp silhouette. Features gold or silver emblem button options, three patch pockets, and an inside wallet pocket.",
    wholesalePrice: 2500,
    oldPrice: null,
    variants: null,
    active: true,
    subCategory: "Blazers",
    badge: "Prestige",
    category: "School Uniforms",
    stock: 100,
    tags: "blazers, executive school coat, high school"
  },
  {
    name: "Sleepover Wear",
    priceType: "fixed",
    description: "Cozy 100% brushed cotton flannel pajamas and boarding school lounge sets. Breathable, warm, and gentle on the skin with an elastic drawstring waist and double-stitched seams for durable nightwear.",
    wholesalePrice: 1000,
    oldPrice: null,
    variants: null,
    active: true,
    subCategory: "Boarding",
    badge: "Cozy Wear",
    category: "School Uniforms",
    stock: 100,
    tags: "sleepover, boarding, pajamas, flannel"
  },
  {
    name: "School Scarfs",
    priceType: "fixed",
    description: "Heavy-knit acrylic school scarves crafted with a soft rib weave in rich institutional colors. Provides thermal protection during cold mornings while remaining light, non-itchy, and easy to wash.",
    wholesalePrice: 300,
    oldPrice: null,
    variants: null,
    active: true,
    subCategory: "Accessories",
    badge: "Knitwear",
    category: "School Uniforms",
    stock: 100,
    tags: "scarfs, winter school wear, accessories"
  },
  {
    name: "School Muffins",
    priceType: "fixed",
    description: "Warm knitted winter beanie caps / muffins for school students. Made from stretchable soft acrylic yarn with a turned-up cuff that provides double coverage over the ears on cold morning trips.",
    wholesalePrice: 300,
    oldPrice: null,
    variants: null,
    active: true,
    subCategory: "Accessories",
    badge: "Knitwear",
    category: "School Uniforms",
    stock: 100,
    tags: "muffins, winter wear, headgear, cap"
  }
];

// Reusable elegant decomposition logic for variants
function decomposeComboVariants(variantsStr: string | null, wholesalePrice: number) {
  if (!variantsStr) return { variantsList: [], basePrice: wholesalePrice };
  const combosStr = variantsStr.split(',').map(s => s.trim()).filter(Boolean);
  
  const combos: Array<{ attributes: Record<string, string>; price: number }> = [];
  const uniqueTypes = new Set<string>();
  const typeValues: Record<string, Set<string>> = {};

  for (const rawCombo of combosStr) {
    const parts = rawCombo.split('=');
    if (parts.length < 2) continue;
    
    const attrPart = parts[0].trim();
    const price = parseFloat(parts[1].trim()) || wholesalePrice;
    const attrs: Record<string, string> = {};

    for (const pair of attrPart.split('|')) {
      let [type, val] = pair.includes(':') ? pair.split(':') : ['Style', pair];
      type = type.trim();
      val = val.trim();

      // Normalize tags/types
      if (type.toLowerCase() === 'size') type = 'Size';
      if (type.toLowerCase() === 'style') type = 'Style';
      if (type.toLowerCase() === 'type') type = 'Style';

      attrs[type] = val;
      uniqueTypes.add(type);
      if (!typeValues[type]) typeValues[type] = new Set();
      typeValues[type].add(val);
    }
    combos.push({ attributes: attrs, price });
  }

  if (combos.length === 0) return { variantsList: [], basePrice: wholesalePrice };

  const typesArr = Array.from(uniqueTypes);
  const variantsList: any[] = [];

  // Minimum combo price to act as the base price
  const basePrice = Math.min(...combos.map(c => c.price));

  if (typesArr.length === 1) {
    const type = typesArr[0];
    const vals = Array.from(typeValues[type]);
    vals.forEach((val, index) => {
      const matchCombo = combos.find(c => c.attributes[type] === val);
      const absPrice = matchCombo ? matchCombo.price : basePrice;
      variantsList.push({
        id: `${type.toLowerCase()}_${val.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${index}`,
        type,
        value: val,
        price: Math.max(0, absPrice - basePrice),
        stock: 100
      });
    });
  } else if (typesArr.length >= 2) {
    const typeA = typesArr[0]; // size (usually)
    const typeB = typesArr[1]; // style (usually)
    const valsA = Array.from(typeValues[typeA]);
    const valsB = Array.from(typeValues[typeB]);

    // Find combination representing minimum price
    const minCombo = combos.reduce((min, c) => c.price < min.price ? c : min, combos[0]);
    const baselineA = minCombo.attributes[typeA];
    const baselineB = minCombo.attributes[typeB];

    // Create combinations for Size: Price increments as we select sizes
    valsA.forEach((valA, index) => {
      // price difference of this size keeping Style at baselineB
      const currentCombo = combos.find(c => c.attributes[typeA] === valA && c.attributes[typeB] === baselineB);
      const priceDiff = currentCombo ? (currentCombo.price - minCombo.price) : 0;
      variantsList.push({
        id: `${typeA.toLowerCase()}_${valA.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${index}`,
        type: typeA,
        value: valA,
        price: Math.max(0, priceDiff),
        stock: 100
      });
    });

    // Create combinations for Style: Price increments relative to baseline
    valsB.forEach((valB, index) => {
      if (valB === baselineB) {
        variantsList.push({
          id: `${typeB.toLowerCase()}_${valB.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${index}`,
          type: typeB,
          value: valB,
          price: 0,
          stock: 100
        });
        return;
      }
      // price difference of this style keeping Size at baselineA
      const currentCombo = combos.find(c => c.attributes[typeA] === baselineA && c.attributes[typeB] === valB);
      const priceDiff = currentCombo ? (currentCombo.price - minCombo.price) : 0;
      variantsList.push({
        id: `${typeB.toLowerCase()}_${valB.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${index}`,
        type: typeB,
        value: valB,
        price: Math.max(0, priceDiff),
        stock: 100
      });
    });
  }

  return { variantsList, basePrice };
}

async function runSeed() {
  console.log("Loading Firebase configuration...");
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.error("Firebase config file not found! Please check initialization.");
    process.exit(1);
  }

  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  console.log("Connecting to Firestore with database id:", firebaseConfig.firestoreDatabaseId || "default");

  // Step 1: Fetch and clear any existing products in the 'products' collection
  const productsQuery = await getDocs(collection(db, 'products'));
  const oldProductDocs = productsQuery.docs;
  console.log(`Found ${oldProductDocs.length} existing products in firestore. Purging to run complete custom sync...`);

  const batchSize = 100;
  for (let i = 0; i < oldProductDocs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = oldProductDocs.slice(i, i + batchSize);
    chunk.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    console.log(`Purged chunk ${i + chunk.length}/${oldProductDocs.length}`);
  }

  console.log("Proceeding to parse and inject updated products list...");

  // Step 2: Push new products
  for (const [idx, raw] of RAW_PRODUCTS.entries()) {
    const isCombo = !!raw.variants;
    const { variantsList, basePrice } = decomposeComboVariants(raw.variants, raw.wholesalePrice);
    
    // Set standard retail price slightly above or equal to minimum combination
    const finalBasePrice = isCombo ? basePrice : raw.wholesalePrice;
    
    const productItem = {
      name: raw.name,
      category: raw.category,
      subCategory: raw.subCategory || "",
      price: finalBasePrice,
      wholesalePrice: raw.wholesalePrice,
      oldPrice: raw.oldPrice || null,
      active: raw.active,
      imageUrl: IMAGE_MAPPING[raw.name] || "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop",
      imageUrls: [IMAGE_MAPPING[raw.name] || "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop"],
      description: raw.description,
      badge: raw.badge,
      stock: raw.stock,
      variants: variantsList,
      tags: raw.tags.split(',').map(t => t.trim()).filter(Boolean),
      sortOrder: idx + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'products'), productItem);
    console.log(`Successfully added [${idx + 1}/${RAW_PRODUCTS.length}] ${productItem.name} (Ref ID: ${docRef.id})`);
  }

  console.log("Fantastic! Migration completed successfully.");
  process.exit(0);
}

runSeed().catch(err => {
  console.error("Migration failed with fatal error:", err);
  process.exit(1);
});
