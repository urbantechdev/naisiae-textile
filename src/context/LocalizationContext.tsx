import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { appExperience } from '../utils/haptics';

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  exchangeRate: number; // relative to KES
  languages: { code: string; label: string }[];
  defaultLanguage: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  keywords: string;
}

export const COUNTRIES: CountryConfig[] = [
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'Ksh',
    exchangeRate: 1.0,
    languages: [
      { code: 'en', label: 'English' },
      { code: 'sw', label: 'Kiswahili' }
    ],
    defaultLanguage: 'en',
    phone: '+254 792 021 795',
    email: 'sales.ke@naisiaetextiles.com',
    city: 'Nairobi',
    address: 'Uhuru Market, Jogoo Road, Nairobi, Kenya',
    keywords: 'Naisiae textiles, school uniforms Nairobi, Uhuru Market uniforms, institutional apparel Kenya, high-grade school sweaters, custom blazers, medical scrubs Kenya, security uniforms, wholesale textile factory Nairobi'
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    currencySymbol: 'TSh',
    exchangeRate: 20.2,
    languages: [
      { code: 'sw', label: 'Kiswahili' },
      { code: 'en', label: 'English' }
    ],
    defaultLanguage: 'sw',
    phone: '+255 742 123 456',
    email: 'sales.tz@naisiaetextiles.com',
    city: 'Dar es Salaam',
    address: 'Kariakoo Market Area, Dar es Salaam, Tanzania',
    keywords: 'vifaa vya nguo Tanzania, sare za shule Dar es Salaam, kiwanda cha nguo Kariakoo, sare za hospitali, sweaters za shule Tanzania, Naisiae textiles Tanzania, sare za kampuni'
  },
  {
    code: 'CD',
    name: 'DR Congo',
    flag: '🇨🇩',
    currency: 'CDF',
    currencySymbol: 'FC',
    exchangeRate: 22.0,
    languages: [
      { code: 'fr', label: 'Français' },
      { code: 'sw', label: 'Kiswahili' }
    ],
    defaultLanguage: 'fr',
    phone: '+243 812 345 678',
    email: 'sales.cd@naisiaetextiles.com',
    city: 'Kinshasa',
    address: 'Boulevard du 30 Juin, Kinshasa, Gombe, DRC',
    keywords: 'textile République démocratique du Congo, uniformes scolaires Kinshasa, vêtements d\'entreprise DRC, fabrication d\'uniformes scolaires, blouses médicales Kinshasa, grossiste de vêtements'
  },
  {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    currencySymbol: 'USh',
    exchangeRate: 28.5,
    languages: [
      { code: 'en', label: 'English' },
      { code: 'sw', label: 'Kiswahili' }
    ],
    defaultLanguage: 'en',
    phone: '+256 702 987 654',
    email: 'sales.ug@naisiaetextiles.com',
    city: 'Kampala',
    address: 'Nakasero Market District, Kampala, Uganda',
    keywords: 'school uniforms Kampala, wholesale uniform manufacturing Uganda, custom corporate sweaters Kampala, nurse scrubs Uganda, high-quality institutional apparel, Uganda textiles'
  },
  {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    currency: 'ETB',
    currencySymbol: 'Br',
    exchangeRate: 0.92,
    languages: [
      { code: 'am', label: 'አማርኛ' },
      { code: 'en', label: 'English' }
    ],
    defaultLanguage: 'am',
    phone: '+251 911 234 567',
    email: 'sales.et@naisiaetextiles.com',
    city: 'Addis Ababa',
    address: 'Merkato District, Addis Ababa, Ethiopia',
    keywords: 'የአልባሳት ፋብሪካ ኢትዮጵያ, የትምህርት ቤት ዩኒፎርም አዲስ አበባ, የህክምና አልባሳት, የኮርፖሬት ልብሶች, የጨርቃጨርቅ አቅራቢዎች መርካቶ, Naisiae textiles Ethiopia'
  }
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  // Navigation
  'Home': { en: 'Home', sw: 'Nyumbani', fr: 'Accueil', am: 'መነሻ' },
  'Products': { en: 'Products', sw: 'Bidhaa', fr: 'Produits', am: 'ምርቶች' },
  'Services': { en: 'Services', sw: 'Huduma', fr: 'Services', am: 'አገልግሎቶች' },
  'Portfolio': { en: 'Portfolio', sw: 'Kazi Zetu', fr: 'Portfolio', am: 'የስራ ማህደር' },
  'Textiles': { en: 'Textiles', sw: 'Nguo', fr: 'Textiles', am: 'ጨርቃጨርቅ' },
  'Simulator': { en: 'Simulator', sw: 'Kifanisi', fr: 'Simulateur', am: 'አስመሳይ' },
  'Categories': { en: 'Categories', sw: 'Sura', fr: 'Catégories', am: 'ምድቦች' },
  'Enquire': { en: 'Enquire', sw: 'Uliza', fr: 'S\'enquérir', am: 'መጠየቅ' },
  'Cart': { en: 'Cart', sw: 'Kikapu', fr: 'Panier', am: 'ጋሪ' },
  'Contact Us': { en: 'Contact Us', sw: 'Wasiliana Nasi', fr: 'Contactez-nous', am: 'ያግኙን' },
  'About Us': { en: 'About Us', sw: 'Kuhusu Sisi', fr: 'À Propos', am: 'ስለ እኛ' },
  'Careers': { en: 'Careers', sw: 'Kazi', fr: 'Carrières', am: 'የስራ እድሎች' },
  'FAQ': { en: 'FAQ', sw: 'Maswali ya Kawaida', fr: 'FAQ', am: 'ተደጋጋሚ ጥያቄዎች' },
  'Wholesale': { en: 'Wholesale', sw: 'Jumla', fr: 'Vente en Gros', am: 'የጅምላ ሽያጭ' },

  // Call to actions & common labels
  'Add to Cart': { en: 'Add to Cart', sw: 'Weka Kwenye Kikapu', fr: 'Ajouter au Panier', am: 'ወደ ጋሪ አስገባ' },
  'Saved Designs': { en: 'Saved Designs', sw: 'Mielekeo Iliyohifadhiwa', fr: 'Designs Enregistrés', am: 'የተቀመጡ ዲዛይኖች' },
  'Inquire Now': { en: 'Inquire Now', sw: 'Uliza Sasa', fr: 'Demander un Devis', am: 'አሁን ይጠይቁ' },
  'Live Chat': { en: 'Live Chat', sw: 'Ongea Nasi', fr: 'Chat en Direct', am: 'የቀጥታ ውይይት' },
  'Shop Online': { en: 'Shop Online', sw: 'Nunua Mtandaoni', fr: 'Acheter en Ligne', am: 'በመስመር ላይ ይግዙ' },
  'Secure Console': { en: 'Secure Console', sw: 'Console Salama', fr: 'Console Sécurisée', am: 'ደህንነቱ የተጠበቀ ኮንሶል' },
  'Accepted Payments': { en: 'Accepted Payments', sw: 'Malipo Yanayokubaliwa', fr: 'Paiements Acceptés', am: 'ተቀባይነት ያላቸው የክፍያ መንገዶች' },
  'Our Work': { en: 'Our Work', sw: 'Kazi Zetu', fr: 'Notre Travail', am: 'የሰራናቸው ስራዎች' },
  'Bulk wholesale': { en: 'Bulk Wholesale', sw: 'Jumla Kubwa', fr: 'Vente en Gros de Masse', am: 'ከፍተኛ የጅምላ ሽያጭ' },
  'Fabric Zoom': { en: 'Fabric Zoom', sw: 'Kuza Nguo', fr: 'Zoom sur Tissu', am: 'የጨርቅ ማጉያ' },
  'Select Country': { en: 'Country & Currency', sw: 'Nchi na Sarafu', fr: 'Pays & Devise', am: 'ሀገር እና ገንዘብ' },
  'Select Language': { en: 'Select Language', sw: 'Chagua Lugha', fr: 'Choisir la Langue', am: 'ቋንቋ ይምረጡ' },
  'Search products': { en: 'Search products...', sw: 'Tafuta bidhaa...', fr: 'Rechercher des produits...', am: 'ምርቶችን ይፈልጉ...' },
  'No matches found': { en: 'No matches found', sw: 'Hakuna matokeo yaliyopatikana', fr: 'Aucun résultat trouvé', am: 'ምንም ተዛማጅ አልተገኘም' },
  'View Details': { en: 'View Details', sw: 'Angalia Maelezo', fr: 'Voir les Détails', am: 'ዝርዝሩን ይመልከቱ' },
  'Quick View': { en: 'Quick View', sw: 'Kuangalia Haraka', fr: 'Aperçu Rapide', am: 'ፈጣን እይታ' },
  'Custom Uniform Simulator': { en: 'Custom Uniform Simulator', sw: 'Kifanisi cha Sare za Shule', fr: 'Simulateur d\'Uniformes', am: 'የዩኒፎርም አስመሳይ' },
  'Trending Collections': { en: 'Trending Collections', sw: 'Mikusanyiko Maarufu', fr: 'Collections Tendances', am: 'ተወዳጅ ስብስቦች' },
  'Request Sourcing Quote': { en: 'Request Sourcing Quote', sw: 'Omba Nukuu ya Bidhaa', fr: 'Demander un Devis d\'Approvisionnement', am: 'የዋጋ ማቅረቢያ ይጠይቁ' },
};

interface LocalizationContextType {
  currentCountry: CountryConfig;
  currentLanguage: string;
  changeCountry: (countryCode: string) => void;
  changeLanguage: (langCode: string) => void;
  t: (key: string) => string;
  formatPrice: (kesAmount: number) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Find country based on URL path prefix on load
  const initialCountry = useMemo(() => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    const firstSegment = segments[0]?.toLowerCase();

    if (firstSegment) {
      const matched = COUNTRIES.find(
        c => c.code.toLowerCase() === firstSegment || c.name.toLowerCase().replace(/ /g, '-') === firstSegment
      );
      if (matched) return matched;
    }
    return COUNTRIES[0]; // Default to Kenya
  }, [location.pathname]);

  const [currentCountry, setCurrentCountry] = useState<CountryConfig>(initialCountry);
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem('naisiae_language') || initialCountry.defaultLanguage;
  });

  // Keep in sync with pathname changes (browser back button, manual typing, links)
  useEffect(() => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    const firstSegment = segments[0]?.toLowerCase();

    if (firstSegment) {
      const matched = COUNTRIES.find(
        c => c.code.toLowerCase() === firstSegment || c.name.toLowerCase().replace(/ /g, '-') === firstSegment
      );
      if (matched && matched.code !== currentCountry.code) {
        setCurrentCountry(matched);
        const nextLang = localStorage.getItem('naisiae_language') || matched.defaultLanguage;
        setCurrentLanguage(nextLang);
      }
    } else if (currentCountry.code !== 'KE') {
      // If we are at root level without country prefix, set back to Kenya context
      setCurrentCountry(COUNTRIES[0]);
      const nextLang = localStorage.getItem('naisiae_language') || COUNTRIES[0].defaultLanguage;
      setCurrentLanguage(nextLang);
    }
  }, [location.pathname]);

  // Synchronize Google Translate cookie on mount or when language state is updated
  useEffect(() => {
    const savedLang = localStorage.getItem('naisiae_language') || currentLanguage;
    const cookieValue = `/en/${savedLang}`;
    
    const hasCorrectCookie = document.cookie.split(';').some(item => item.trim().startsWith('googtrans=') && item.includes(cookieValue));
    if (!hasCorrectCookie) {
      // Clear previous cookies first
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = `googtrans=${cookieValue}; path=/;`;
      document.cookie = `googtrans=${cookieValue}; path=/; domain=.${window.location.hostname};`;
      document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname};`;
    }
  }, [currentLanguage]);

  const changeCountry = (countryCode: string) => {
    appExperience.triggerFeedback('tap');
    const targetCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
    
    // Set default language of the new country if not already set, or respect current choice if available in country's list
    const hasCurrentLangInTarget = targetCountry.languages.some(l => l.code === currentLanguage);
    const nextLang = hasCurrentLangInTarget ? currentLanguage : targetCountry.defaultLanguage;
    
    localStorage.setItem('naisiae_language', nextLang);
    const cookieValue = `/en/${nextLang}`;
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=${cookieValue}; path=/;`;
    document.cookie = `googtrans=${cookieValue}; path=/; domain=.${window.location.hostname};`;
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname};`;

    // Update path to preserve routing context & local SEO
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    const firstSegment = segments[0]?.toLowerCase() || '';

    // Check if the current path starts with an existing country identifier
    const startsWithCountry = COUNTRIES.some(
      c => c.code.toLowerCase() === firstSegment || c.name.toLowerCase().replace(/ /g, '-') === firstSegment
    );

    let remainingPath = '';
    if (startsWithCountry) {
      remainingPath = segments.slice(1).join('/');
    } else {
      remainingPath = segments.join('/');
    }

    const newPrefix = targetCountry.code === 'KE' ? '' : `/${targetCountry.name.toLowerCase().replace(/ /g, '-')}`;
    const newPath = `${newPrefix}/${remainingPath}`.replace(/\/+/g, '/');
    
    // Use full page load so Google Translate updates completely with the new country context
    window.location.href = newPath || '/';
  };

  const changeLanguage = (langCode: string) => {
    appExperience.triggerFeedback('tap');
    localStorage.setItem('naisiae_language', langCode);
    setCurrentLanguage(langCode);

    const cookieValue = `/en/${langCode}`;
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=${cookieValue}; path=/;`;
    document.cookie = `googtrans=${cookieValue}; path=/; domain=.${window.location.hostname};`;
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname};`;

    // Force a smooth page refresh so Google Translate renders the new language
    window.location.reload();
  };

  const t = (key: string): string => {
    if (TRANSLATIONS[key] && TRANSLATIONS[key][currentLanguage]) {
      return TRANSLATIONS[key][currentLanguage];
    }
    return key;
  };

  const formatPrice = (kesAmount: number): string => {
    const converted = kesAmount * currentCountry.exchangeRate;
    const formatted = Math.round(converted).toLocaleString();
    if (currentCountry.code === 'KE') {
      return `${currentCountry.currencySymbol} ${formatted}/-`;
    }
    return `${currentCountry.currencySymbol} ${formatted}`;
  };

  const value = useMemo(() => ({
    currentCountry,
    currentLanguage,
    changeCountry,
    changeLanguage,
    t,
    formatPrice
  }), [currentCountry, currentLanguage]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) throw new Error('useLocalization must be used within a LocalizationProvider');
  return context;
}
