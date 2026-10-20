import fs from 'fs';
import path from 'path';

function parseCSV(text: string) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    if (cols.length >= 13) {
      rows.push(cols);
    }
  }
  return rows;
}

const csv = fs.readFileSync('public/assets/aistudio/Naisiae_Kenya_Uniform_Price_Master_2026__1__068ad036.csv', 'utf8');
const rows = parseCSV(csv);

const records = rows.map((r, i) => {
  const category = r[0];
  const subcategory = r[1];
  const educationSector = r[2];
  const product = r[3];
  const gender = r[4];
  const typicalSizes = r[5];
  const marketLow = parseInt(r[6], 10) || 0;
  const marketHigh = parseInt(r[7], 10) || 0;
  const costPrice = parseInt(r[8], 10) || 0;
  const wholesalePrice = parseInt(r[9], 10) || 0;
  const retailPrice = parseInt(r[10], 10) || 0;
  const reorderLevel = parseInt(r[11], 10) || 10;
  const skuPrefix = r[12];
  const notes = (r[13] || '').replace(/^"|"$/g, '');

  let sizeCategory = 'accessories';
  let sizeBreakdown = ['One Size'];

  if (typicalSizes === '22-32') {
    sizeCategory = 'ecde';
    sizeBreakdown = ['22', '24', '26', '28', '30', '32'];
  } else if (typicalSizes === '24-36') {
    sizeCategory = 'primary';
    sizeBreakdown = ['24', '26', '28', '30', '32', '34', '36'];
  } else if (typicalSizes === '28-40') {
    sizeCategory = 'jss';
    sizeBreakdown = ['28', '30', '32', '34', '36', '38', '40'];
  } else if (typicalSizes === '30-44') {
    sizeCategory = 'secondary';
    sizeBreakdown = ['30', '32', '34', '36', '38', '40', '42', '44'];
  } else if (typicalSizes === 'S-3XL') {
    sizeCategory = 'adult';
    sizeBreakdown = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
  } else if (['Child', 'Youth', 'Adult', 'Child/Adult', 'Adult/Youth', 'Youth/Adult', 'Various'].includes(typicalSizes)) {
    sizeCategory = 'accessories';
    sizeBreakdown = ['Child', 'Youth', 'Adult'];
  }

  return {
    id: `master_${i + 1}`,
    category,
    subCategory: subcategory,
    educationSector,
    name: product,
    gender,
    typicalSizes,
    sizeCategory,
    sizeBreakdown,
    marketLowKES: marketLow,
    marketHighKES: marketHigh,
    suggestedCostKES: costPrice,
    suggestedWholesaleKES: wholesalePrice,
    suggestedRetailKES: retailPrice,
    reorderLevel,
    skuPrefix,
    notes
  };
});

const tsCode = `// Generated from Naisiae_Kenya_Uniform_Price_Master_2026__1__068ad036.csv
// Unified Kenya Uniform Price Master with Size Categories, Educational Sectors, and Pricing Benchmarks

export interface UniformPriceMasterItem {
  id: string;
  category: string;
  subCategory: string;
  educationSector: string;
  name: string;
  gender: 'Unisex' | 'Boys' | 'Girls' | 'Male' | 'Female' | string;
  typicalSizes: string;
  sizeCategory: 'ecde' | 'primary' | 'jss' | 'secondary' | 'adult' | 'accessories';
  sizeBreakdown: string[];
  marketLowKES: number;
  marketHighKES: number;
  suggestedCostKES: number;
  suggestedWholesaleKES: number;
  suggestedRetailKES: number;
  reorderLevel: number;
  skuPrefix: string;
  notes: string;
}

export interface SizeCategoryOption {
  id: string;
  name: string;
  badge: string;
  sizes: string;
  ageGuidance: string;
  description: string;
}

export const SIZE_CATEGORIES: SizeCategoryOption[] = [
  {
    id: 'all',
    name: 'All Sizes',
    badge: 'Full Matrix',
    sizes: 'All Standard',
    ageGuidance: 'All Educational & Work Sectors',
    description: 'Browse complete catalog across all grade and size brackets'
  },
  {
    id: 'ecde',
    name: 'ECDE (22-32)',
    badge: 'Pre-Primary',
    sizes: '22, 24, 26, 28, 30, 32',
    ageGuidance: 'Ages 3 – 6 · Playgroup, PP1 & PP2',
    description: 'Toddler and early childhood uniforms with comfort elastic trims'
  },
  {
    id: 'primary',
    name: 'Primary (24-36)',
    badge: 'Primary CBC',
    sizes: '24, 26, 28, 30, 32, 34, 36',
    ageGuidance: 'Ages 6 – 12 · Grades 1 to 6',
    description: 'Heavy-duty poly-viscose and twill fabrics built for active primary students'
  },
  {
    id: 'jss',
    name: 'JSS / Junior (28-40)',
    badge: 'Junior Secondary',
    sizes: '28, 30, 32, 34, 36, 38, 40',
    ageGuidance: 'Ages 12 – 15 · CBC Grades 7, 8 & 9',
    description: 'Compliant Junior Secondary CBC tailored shirts, skirts, blazers & trousers'
  },
  {
    id: 'secondary',
    name: 'Secondary (30-44)',
    badge: 'Senior High',
    sizes: '30, 32, 34, 36, 38, 40, 42, 44',
    ageGuidance: 'Ages 14 – 18 · Forms 1 to 4',
    description: 'Senior high school blazers, gabardine trousers, skirts, ties & lab coats'
  },
  {
    id: 'adult',
    name: 'Adult / Tertiary (S-3XL)',
    badge: 'Colleges & Workwear',
    sizes: 'S, M, L, XL, 2XL, 3XL',
    ageGuidance: 'Youth & Adults · KMTC, Hotel, Corporate, Security',
    description: 'Hospital scrubs, chef whites, corporate blazers and industrial overalls'
  },
  {
    id: 'accessories',
    name: 'Accessories / Free Size',
    badge: 'One Size / Free Size',
    sizes: 'One Size, Child, Youth, Adult',
    ageGuidance: 'Universal Fit',
    description: 'School ties, woven badges/crests, belts, socks, stockings and hats'
  }
];

export const EDUCATION_SECTORS = [
  'All',
  'ECDE',
  'Primary',
  'JSS',
  'Secondary',
  'KMTC',
  'College',
  'Hospitality',
  'Workplace'
] as const;

export const KENYA_UNIFORM_SIZING_TABLE = [
  { level: 'ECDE (PP1 - PP2)', age: '3 - 5 Years', chestInches: '22 - 24"', waistInches: '20 - 22"', typicalSize: '22 - 26', heightCm: '95 - 110 cm' },
  { level: 'Lower Primary (Grades 1 - 3)', age: '6 - 8 Years', chestInches: '24 - 26"', waistInches: '22 - 24"', typicalSize: '24 - 28', heightCm: '110 - 128 cm' },
  { level: 'Upper Primary (Grades 4 - 6)', age: '9 - 11 Years', chestInches: '26 - 30"', waistInches: '24 - 26"', typicalSize: '28 - 32', heightCm: '128 - 145 cm' },
  { level: 'Junior Secondary (JSS Grades 7 - 9)', age: '12 - 14 Years', chestInches: '30 - 34"', waistInches: '26 - 30"', typicalSize: '30 - 36', heightCm: '145 - 162 cm' },
  { level: 'Senior Secondary (Forms 1 - 4)', age: '15 - 18 Years', chestInches: '32 - 38"', waistInches: '28 - 34"', typicalSize: '32 - 40+', heightCm: '160 - 180 cm' },
  { level: 'KMTC / College / Adult Small', age: 'Tertiary', chestInches: '36 - 38"', waistInches: '30 - 32"', typicalSize: 'Size S', heightCm: '165 - 175 cm' },
  { level: 'College / Adult Medium', age: 'Tertiary', chestInches: '38 - 40"', waistInches: '32 - 34"', typicalSize: 'Size M', heightCm: '170 - 180 cm' },
  { level: 'College / Adult Large', age: 'Tertiary', chestInches: '40 - 42"', waistInches: '34 - 36"', typicalSize: 'Size L', heightCm: '175 - 185 cm' },
  { level: 'College / Adult XL - 3XL', age: 'Tertiary', chestInches: '44 - 50"', waistInches: '38 - 44"', typicalSize: 'Size XL - 3XL', heightCm: '175+ cm' }
];

export const UNIFORM_PRICE_MASTER: UniformPriceMasterItem[] = ${JSON.stringify(records, null, 2)};

/**
 * Enriches any product from Firestore or API with official Kenya uniform price master metadata
 * WITHOUT changing or overriding its original images, ID, or custom attributes!
 */
export function enrichProductWithPriceMaster(product: any): any {
  if (!product) return product;

  // Exact or keyword match
  const nameLower = (product.name || '').toLowerCase();
  const catLower = (product.category || '').toLowerCase();

  // Find best match in master
  let matched = UNIFORM_PRICE_MASTER.find(m => {
    const mName = m.name.toLowerCase();
    return nameLower === mName || nameLower.includes(mName) || mName.includes(nameLower);
  });

  // Secondary fuzzy heuristics
  if (!matched) {
    if (nameLower.includes('trous') && (nameLower.includes('high') || nameLower.includes('second'))) {
      matched = UNIFORM_PRICE_MASTER.find(m => m.name === 'High School Trousers' || (m.educationSector === 'Secondary' && m.name.includes('Trouser')));
    } else if (nameLower.includes('trous') && nameLower.includes('prim')) {
      matched = UNIFORM_PRICE_MASTER.find(m => m.name === 'Primary School Trousers' || (m.educationSector === 'Primary' && m.name.includes('Trouser')));
    } else if (nameLower.includes('jss') || nameLower.includes('junior')) {
      matched = UNIFORM_PRICE_MASTER.find(m => m.educationSector === 'JSS');
    } else if (nameLower.includes('blazer')) {
      matched = UNIFORM_PRICE_MASTER.find(m => m.name.includes('Blazer'));
    } else if (nameLower.includes('kmtc') || nameLower.includes('scrub') || nameLower.includes('labcoat') || nameLower.includes('lab coat')) {
      matched = UNIFORM_PRICE_MASTER.find(m => m.educationSector === 'KMTC' || m.category === 'Medical Uniform');
    } else if (nameLower.includes('chef')) {
      matched = UNIFORM_PRICE_MASTER.find(m => m.category === 'Service Uniform' || m.name.includes('Chef'));
    } else if (nameLower.includes('tracksuit')) {
      matched = UNIFORM_PRICE_MASTER.find(m => m.name.includes('Tracksuit'));
    } else if (nameLower.includes('fleece')) {
      matched = UNIFORM_PRICE_MASTER.find(m => m.name.includes('Fleece'));
    } else if (nameLower.includes('sweater') || nameLower.includes('pullover')) {
      matched = UNIFORM_PRICE_MASTER.find(m => m.name.includes('Sweater'));
    } else if (nameLower.includes('shirt') || nameLower.includes('blouse')) {
      matched = UNIFORM_PRICE_MASTER.find(m => m.name.includes('Shirt') || m.name.includes('Blouse'));
    } else if (nameLower.includes('skirt') || nameLower.includes('tunic') || nameLower.includes('pinafore') || nameLower.includes('dress')) {
      matched = UNIFORM_PRICE_MASTER.find(m => m.name.includes('Skirt') || m.name.includes('Dress'));
    } else if (nameLower.includes('sock') || nameLower.includes('stocking')) {
      matched = UNIFORM_PRICE_MASTER.find(m => m.name.includes('Socks') || m.name.includes('Stockings'));
    } else if (nameLower.includes('cap') || nameLower.includes('hat') || nameLower.includes('muffin') || nameLower.includes('scurf') || nameLower.includes('scarf')) {
      matched = UNIFORM_PRICE_MASTER.find(m => m.category === 'Accessories');
    }
  }

  // Derive size category if matched
  const sizeCategory = product.sizeCategory || (matched ? matched.sizeCategory : (
    nameLower.includes('ecde') || nameLower.includes('pp1') || nameLower.includes('pp2') ? 'ecde' :
    nameLower.includes('jss') || nameLower.includes('junior') ? 'jss' :
    nameLower.includes('high') || nameLower.includes('second') ? 'secondary' :
    nameLower.includes('prim') ? 'primary' :
    nameLower.includes('kmtc') || nameLower.includes('chef') || nameLower.includes('corporate') || nameLower.includes('work') || nameLower.includes('security') ? 'adult' :
    catLower.includes('accessories') || nameLower.includes('tie') || nameLower.includes('badge') || nameLower.includes('crest') ? 'accessories' : 'primary'
  ));

  const educationSector = product.educationSector || (matched ? matched.educationSector : (
    nameLower.includes('jss') || nameLower.includes('junior') ? 'JSS' :
    nameLower.includes('high') || nameLower.includes('second') ? 'Secondary' :
    nameLower.includes('kmtc') ? 'KMTC' :
    nameLower.includes('chef') ? 'Hospitality' :
    nameLower.includes('corporate') ? 'Workplace' :
    nameLower.includes('ecde') ? 'ECDE' : 'Primary'
  ));

  const gender = product.gender || (matched ? matched.gender : (
    nameLower.includes('boy') ? 'Boys' :
    nameLower.includes('girl') ? 'Girls' :
    nameLower.includes('women') ? 'Female' :
    nameLower.includes('men') ? 'Male' : 'Unisex'
  ));

  const typicalSizes = product.typicalSizes || (matched ? matched.typicalSizes : (
    sizeCategory === 'ecde' ? '22-32' :
    sizeCategory === 'primary' ? '24-36' :
    sizeCategory === 'jss' ? '28-40' :
    sizeCategory === 'secondary' ? '30-44' :
    sizeCategory === 'adult' ? 'S-3XL' : 'One Size'
  ));

  const sizeBreakdown = (product.sizeBreakdown && product.sizeBreakdown.length > 0)
    ? product.sizeBreakdown 
    : (matched ? matched.sizeBreakdown : (
        typicalSizes === '22-32' ? ['22', '24', '26', '28', '30', '32'] :
        typicalSizes === '24-36' ? ['24', '26', '28', '30', '32', '34', '36'] :
        typicalSizes === '28-40' ? ['28', '30', '32', '34', '36', '38', '40'] :
        typicalSizes === '30-44' ? ['30', '32', '34', '36', '38', '40', '42', '44'] :
        typicalSizes === 'S-3XL' ? ['S', 'M', 'L', 'XL', '2XL', '3XL'] : ['One Size']
      ));

  // Market Range
  const marketLowKES = product.marketLowKES || (matched ? matched.marketLowKES : Math.max(100, Math.round((product.price || 500) * 0.8)));
  const marketHighKES = product.marketHighKES || (matched ? matched.marketHighKES : Math.round((product.price || 500) * 1.5));
  const suggestedWholesaleKES = product.suggestedWholesaleKES || (matched ? matched.suggestedWholesaleKES : Math.round((product.price || 500) * 0.85));
  const suggestedRetailKES = product.suggestedRetailKES || (matched ? matched.suggestedRetailKES : (product.price || 500));
  const skuPrefix = product.skuPrefix || (matched ? matched.skuPrefix : 'NAIS-UNIF');
  const reorderLevel = product.reorderLevel || (matched ? matched.reorderLevel : 10);
  const notes = product.notes || (matched ? matched.notes : 'Indicative Kenya market range; verify size and school requirements.');

  // PRESERVE 100% OF EXISTING IMAGES AND PROPERTIES
  return {
    ...product,
    sizeCategory,
    educationSector,
    gender,
    typicalSizes,
    sizeBreakdown,
    marketLowKES,
    marketHighKES,
    suggestedWholesaleKES,
    suggestedRetailKES,
    skuPrefix,
    reorderLevel,
    notes,
    // Keep existing variants if already structured, or synthesize variants from sizeBreakdown
    variants: (product.variants && product.variants.length > 0)
      ? product.variants
      : sizeBreakdown.map((sz: string, idx: number) => ({
          id: 'size_' + sz.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + idx,
          type: 'Size',
          value: sz,
          price: 0,
          stock: 100
        }))
  };
}
`;

fs.writeFileSync('src/constants/uniformPriceMaster.ts', tsCode, 'utf8');
console.log(`Successfully written src/constants/uniformPriceMaster.ts with ${records.length} records.`);
