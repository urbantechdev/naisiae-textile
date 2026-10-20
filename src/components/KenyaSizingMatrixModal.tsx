import React, { useState } from 'react';
import { X, Ruler, Sparkles, Check, ChevronRight, Info, ShieldCheck, ArrowRight, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KENYA_UNIFORM_SIZING_TABLE, SIZE_CATEGORIES, SizeCategoryOption } from '../constants/uniformPriceMaster';

interface KenyaSizingMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (sizeCategoryId: string) => void;
}

export function KenyaSizingMatrixModal({
  isOpen,
  onClose,
  onSelectCategory
}: KenyaSizingMatrixModalProps) {
  // Calculator state
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(3); // Default JSS
  const [userHeight, setUserHeight] = useState('');
  const [userChest, setUserChest] = useState('');
  const [userWaist, setUserWaist] = useState('');
  const [customCalculatedSize, setCustomCalculatedSize] = useState<string | null>(null);

  const activeLevel = KENYA_UNIFORM_SIZING_TABLE[selectedLevelIndex] || KENYA_UNIFORM_SIZING_TABLE[0];

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const chest = parseFloat(userChest);
    const waist = parseFloat(userWaist);

    if (chest > 0 || waist > 0) {
      const primaryMeasure = chest > 0 ? chest : waist + 2;
      if (primaryMeasure <= 24) {
        setCustomCalculatedSize('ECDE: Size 22 – 24 (Pre-Primary / PP1)');
      } else if (primaryMeasure <= 26) {
        setCustomCalculatedSize('Lower Primary: Size 24 – 26 (Grades 1 – 3)');
      } else if (primaryMeasure <= 30) {
        setCustomCalculatedSize('Upper Primary: Size 28 – 30 (Grades 4 – 6)');
      } else if (primaryMeasure <= 34) {
        setCustomCalculatedSize('Junior Secondary (JSS): Size 32 – 34 (Grades 7 – 9 CBC)');
      } else if (primaryMeasure <= 38) {
        setCustomCalculatedSize('Senior High: Size 36 – 38 (Forms 1 – 4)');
      } else if (primaryMeasure <= 42) {
        setCustomCalculatedSize('Adult / College: Size L (Chest 40 - 42")');
      } else {
        setCustomCalculatedSize('Adult / College: Size XL – 3XL');
      }
    } else {
      setCustomCalculatedSize(`Recommended based on ${activeLevel.level}: Size ${activeLevel.typicalSize}`);
    }
  };

  const handleApplyFilter = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#08047D] via-[#1007A3] to-[#08047D] text-white p-5 sm:p-6 relative">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FA9411] text-white text-[10px] font-black tracking-wider uppercase">
                    Official Kenya 2026 Standards
                  </span>
                  <span className="text-blue-200 text-xs hidden sm:inline">Uhuru Market Uniform Matrix</span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <Ruler className="text-[#FA9411]" size={24} />
                  <span>Kenya Uniform Sizing & Measurement Guide</span>
                </h3>
                <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
                  Calibrated to Kenya Ministry of Education CBC guidelines and Uhuru Market industrial tailoring dimensions across ECDE, Primary, JSS, and High School.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
            {/* Quick Interactive Stage Selector */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Step 1: Select Student Educational Grade / Level
                </label>
                <span className="text-[11px] text-[#08047D] font-bold">
                  {KENYA_UNIFORM_SIZING_TABLE.length} Stage Profiles
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {KENYA_UNIFORM_SIZING_TABLE.map((item, idx) => {
                  const isSelected = selectedLevelIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedLevelIndex(idx);
                        setCustomCalculatedSize(null);
                      }}
                      className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'border-[#08047D] bg-[#08047D]/5 ring-2 ring-[#08047D] shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-black text-xs text-slate-900 leading-snug line-clamp-1">
                        {item.level.split('(')[0]}
                      </div>
                      <div className="text-[11px] font-bold text-[#FA9411]">
                        Size {item.typicalSize}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.age}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Highlight Card */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-slate-900">
                    {activeLevel.level}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Standard Fit
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Target Student Age: <strong className="text-slate-900">{activeLevel.age}</strong> · Estimated Height: <strong className="text-slate-900">{activeLevel.heightCm}</strong>
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-mono text-[11px]">
                    Chest: <strong>{activeLevel.chestInches}</strong>
                  </div>
                  <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-mono text-[11px]">
                    Waist: <strong>{activeLevel.waistInches}</strong>
                  </div>
                  <div className="bg-[#08047D] text-white px-3 py-1 rounded-lg font-black text-xs shadow-xs">
                    Recommended Size: {activeLevel.typicalSize}
                  </div>
                </div>
              </div>

              {/* Action button to filter */}
              <button
                type="button"
                onClick={() => {
                  const targetCat = activeLevel.level.toLowerCase().includes('ecde') ? 'ecde' :
                                    activeLevel.level.toLowerCase().includes('junior') || activeLevel.level.toLowerCase().includes('jss') ? 'jss' :
                                    activeLevel.level.toLowerCase().includes('senior') ? 'secondary' :
                                    activeLevel.level.toLowerCase().includes('college') ? 'adult' : 'primary';
                  handleApplyFilter(targetCat);
                }}
                className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-[#08047D] hover:bg-[#050259] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
              >
                <span>Filter Products for this Size</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Quick Measurement Calculator Form */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
                <Sparkles size={15} className="text-[#FA9411]" />
                <span>Custom Measurement Calculator (Inches or CM)</span>
              </div>

              <form onSubmit={handleCalculate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Chest / Bust (Inches)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="18"
                    max="60"
                    placeholder="e.g. 32"
                    value={userChest}
                    onChange={(e) => setUserChest(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#08047D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Waist (Inches)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="16"
                    max="55"
                    placeholder="e.g. 28"
                    value={userWaist}
                    onChange={(e) => setUserWaist(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#08047D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Height (cm optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 155"
                    value={userHeight}
                    onChange={(e) => setUserHeight(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#08047D]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FA9411] hover:bg-[#e0840c] text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-colors h-[38px]"
                >
                  <Ruler size={14} />
                  <span>Recommend Size</span>
                </button>
              </form>

              {customCalculatedSize && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-fadeIn">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>Calculated Result: <strong>{customCalculatedSize}</strong></span>
                </div>
              )}
            </div>

            {/* Standard Kenya Size Categories Reference Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Official Kenya Price Master Size Categories
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SIZE_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-[#08047D]/50 transition-colors bg-white flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-black text-xs text-slate-900">{cat.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 text-[#08047D]">
                          {cat.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{cat.ageGuidance}</p>
                      <p className="text-[10.5px] text-slate-600 mt-1 line-clamp-2">{cat.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyFilter(cat.id)}
                      className="text-left text-[11px] font-bold text-[#08047D] hover:text-[#FA9411] flex items-center gap-1 mt-1 transition-colors"
                    >
                      <span>View items ({cat.sizes})</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth & Tailoring Tips */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-black text-amber-950">
                <Info size={14} className="text-[#FA9411]" />
                <span>Naisiae Uhuru Market Tailoring & Growth Allowance:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                For school children (Grades 1 – 9), we recommend choosing <strong>1 size larger</strong> (e.g. Size 30 instead of 28) to accommodate natural growth across the academic terms. All Naisiae trousers and skirts feature an inner adjustable elastic waist band or double-stitch hem allowance.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Certified Kenya Uniform Sizing Standards</span>
            </span>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
