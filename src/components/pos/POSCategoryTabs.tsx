import React, { useState, useRef, useEffect } from 'react';
import { appExperience } from '../../utils/haptics';
import { Ruler, Sparkles, Filter, Layers, GraduationCap, ChevronDown, Check, ChevronRight } from 'lucide-react';
import { SIZE_CATEGORIES, EDUCATION_SECTORS } from '../../constants/uniformPriceMaster';

interface POSCategoryTabsProps {
  categories: { id: string; name: string; count?: number }[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  subCategories: string[];
  activeSubCategory: string | null;
  onSelectSubCategory: (sub: string | null) => void;
  // Size categories and sector features
  activeSizeCategory?: string;
  onSelectSizeCategory?: (sizeCatId: string) => void;
  sizeCategoryCounts?: Record<string, number>;
  activeSector?: string;
  onSelectSector?: (sector: string) => void;
  activeGender?: string;
  onSelectGender?: (gender: string) => void;
  onOpenSizingGuide?: () => void;
}

export function POSCategoryTabs({
  categories,
  activeCategory,
  onSelectCategory,
  subCategories,
  activeSubCategory,
  onSelectSubCategory,
  activeSizeCategory = 'all',
  onSelectSizeCategory,
  sizeCategoryCounts = {},
  activeSector = 'All',
  onSelectSector,
  activeGender = 'All',
  onSelectGender,
  onOpenSizingGuide
}: POSCategoryTabsProps) {
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCategoryObj = categories.find(c => c.id.toLowerCase() === activeCategory.toLowerCase()) || categories[0];

  return (
    <div className="mb-4 space-y-2.5">
      {/* 1. Category Menu Dropdown Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#08047D]/10 rounded-xl text-[#08047D]">
            <Filter size={16} />
          </div>
          <div>
            <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Catalog Category</div>
            <div className="text-xs font-black text-[#08047D]">
              {activeCategoryObj ? activeCategoryObj.name : 'All Categories'}
            </div>
          </div>
        </div>

        {/* Dropdown Toggle Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              appExperience.triggerFeedback('tap');
              setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#08047D] hover:bg-[#050259] text-white rounded-xl text-xs font-bold flex items-center justify-between sm:justify-start gap-3 shadow-sm transition-all cursor-pointer"
          >
            <span>Select Category</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isCategoryDropdownOpen ? 'rotate-180 text-[#FA9411]' : ''}`} />
          </button>

          {/* Dropdown Menu List */}
          {isCategoryDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 p-1.5 space-y-1 animate-fadeIn">
              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Browse Uniform Categories
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
                {categories.map((cat) => {
                  const isActive = activeCategory.toLowerCase() === cat.id.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        appExperience.triggerFeedback('tap');
                        onSelectCategory(cat.id);
                        onSelectSubCategory(null);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                        isActive
                          ? 'bg-[#08047D] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-[#08047D]'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {cat.count !== undefined && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {cat.count}
                          </span>
                        )}
                        {isActive && <Check size={13} className="text-[#FA9411]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Category Chips for Fast 1-Tap Mobile Swiping */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
        {categories.map((cat) => {
          const isActive = activeCategory.toLowerCase() === cat.id.toLowerCase();
          return (
            <button
              key={`chip-${cat.id}`}
              type="button"
              onClick={() => {
                appExperience.triggerFeedback('tap');
                onSelectCategory(cat.id);
                onSelectSubCategory(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 active:scale-95 ${
                isActive
                  ? 'bg-[#08047D] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{cat.name}</span>
              {cat.count !== undefined && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Official Kenya Size Categories Row */}
      {onSelectSizeCategory && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg text-amber-800 text-[10.5px] font-black shrink-0 border border-amber-200">
            <Layers size={13} className="text-[#FA9411]" />
            <span className="hidden sm:inline">Size Matrix:</span>
          </div>

          {SIZE_CATEGORIES.map((sizeCat) => {
            const isSizeActive = activeSizeCategory === sizeCat.id;
            const count = sizeCategoryCounts[sizeCat.id] ?? (sizeCat.id === 'all' ? Object.values(sizeCategoryCounts).reduce((a, b) => a + b, 0) : undefined);
            
            return (
              <button
                key={sizeCat.id}
                type="button"
                onClick={() => {
                  appExperience.triggerFeedback('tap');
                  onSelectSizeCategory(sizeCat.id);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
                  isSizeActive
                    ? 'bg-[#FA9411] text-white shadow-xs ring-1 ring-[#FA9411]'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={sizeCat.description}
              >
                <span>{sizeCat.name}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSizeActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Sizing Matrix Guide Modal Launcher */}
          {onOpenSizingGuide && (
            <button
              type="button"
              onClick={() => {
                appExperience.triggerFeedback('tap');
                onOpenSizingGuide();
              }}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-[#08047D] hover:bg-blue-100 ml-auto"
            >
              <Ruler size={13} className="text-[#FA9411]" />
              <span>Sizing Guide & Age Matrix</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Education / Sector & Gender Filter Row */}
      {(onSelectSector || onSelectGender) && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none select-none text-[10.5px]">
          {onSelectSector && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-slate-400 font-semibold px-1 flex items-center gap-1">
                <GraduationCap size={12} />
                <span>Sector:</span>
              </span>
              {['All', 'ECDE', 'Primary', 'JSS', 'Secondary', 'KMTC', 'Hospitality', 'Workplace'].map((sec) => {
                const isSecActive = activeSector === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      onSelectSector(sec);
                    }}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                      isSecActive
                        ? 'bg-[#08047D] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sec}
                  </button>
                );
              })}
            </div>
          )}

          {/* Gender Filter */}
          {onSelectGender && (
            <div className="flex items-center gap-1 shrink-0 ml-2 pl-2 border-l border-slate-200">
              <span className="text-slate-400 font-semibold px-1">Gender:</span>
              {['All', 'Unisex', 'Boys', 'Girls'].map((g) => {
                const isGActive = activeGender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      appExperience.triggerFeedback('tap');
                      onSelectGender(g);
                    }}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                      isGActive
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Subcategories Row (if available) */}
      {subCategories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none items-center">
          <button
            type="button"
            onClick={() => {
              appExperience.triggerFeedback('tap');
              onSelectSubCategory(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
              activeSubCategory === null
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Sub-types
          </button>
          {subCategories.map((sub) => {
            const isSubActive = activeSubCategory === sub;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  appExperience.triggerFeedback('tap');
                  onSelectSubCategory(isSubActive ? null : sub);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  isSubActive
                    ? 'bg-[#FA9411] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
