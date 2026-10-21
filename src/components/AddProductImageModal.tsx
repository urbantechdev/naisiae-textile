import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  Star, 
  Check, 
  Sparkles, 
  Plus, 
  ImageIcon, 
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { appExperience } from '../utils/haptics';

interface AddProductImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    imageUrl?: string;
    imageUrls?: string[];
    category?: string;
  } | null;
  onImagesUpdated?: (newImageUrls: string[], primaryImageUrl: string) => void;
  showToast?: (toast: { message: string; type: 'success' | 'error' | 'info' }) => void;
}

// Curated high-resolution presets for Kenyan School Uniforms, Institutional Textiles & Fabrics
const PRESET_UNIFORM_IMAGES = [
  {
    name: 'Navy Blue Blazer',
    url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'School V-Neck Sweater',
    url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Crisp White Shirt / Blouse',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Grey Institutional Trousers',
    url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Plaid / Tartan Pleated Skirt',
    url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Sports Tracksuit & PE Kit',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Medical & Lab Coat',
    url: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Chef & Hospitality Uniform',
    url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Durable Twill Fabric Close-up',
    url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Gold / Navy Embroidery Texture',
    url: 'https://images.unsplash.com/photo-1520635680191-3d69937fc6ee?q=80&w=800&auto=format&fit=crop'
  }
];

export const AddProductImageModal: React.FC<AddProductImageModalProps> = ({
  isOpen,
  onClose,
  product,
  onImagesUpdated,
  showToast
}) => {
  if (!isOpen || !product) return null;

  // Initialize gallery from product images
  const initialList = [
    ...(product.imageUrls || []),
    ...(product.imageUrl && !(product.imageUrls || []).includes(product.imageUrl) ? [product.imageUrl] : [])
  ].filter(Boolean);

  const [images, setImages] = useState<string[]>(initialList);
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Add an image to the list
  const addImageToList = (url: string) => {
    if (!url.trim()) return;
    const cleanUrl = url.trim();
    if (images.includes(cleanUrl)) {
      showToast?.({ message: 'Image is already in the gallery', type: 'info' });
      return;
    }
    appExperience.triggerFeedback('tap');
    setImages(prev => [...prev, cleanUrl]);
    setUrlInput('');
  };

  // Remove an image
  const removeImage = (indexToRemove: number) => {
    appExperience.triggerFeedback('tap');
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Set primary (move to index 0)
  const setPrimary = (indexToPrimary: number) => {
    appExperience.triggerFeedback('tap');
    setImages(prev => {
      const selected = prev[indexToPrimary];
      const rest = prev.filter((_, idx) => idx !== indexToPrimary);
      return [selected, ...rest];
    });
  };

  // Handle local file uploads (supports multi-selection)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    appExperience.triggerFeedback('tap');
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setImages(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Handle drag and drop files
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    appExperience.triggerFeedback('tap');
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setImages(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Save to Firestore and notify parent
  const handleSave = async () => {
    if (!product?.id) return;
    setIsSaving(true);
    appExperience.triggerFeedback('tap');

    try {
      const primaryImage = images[0] || product.imageUrl || '';
      
      // Update in Firestore
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        imageUrls: images,
        imageUrl: primaryImage,
        updatedAt: serverTimestamp()
      }).catch(err => {
        console.warn('Firestore update warning (continuing with local state):', err);
      });

      // Notify parent callback
      onImagesUpdated?.(images, primaryImage);

      showToast?.({
        message: `Updated product gallery (${images.length} images saved)!`,
        type: 'success'
      });

      onClose();
    } catch (err) {
      console.error('Error saving product images:', err);
      showToast?.({
        message: 'Could not save images to remote database. Updated locally.',
        type: 'error'
      });
      // Still update UI locally
      const primaryImage = images[0] || product.imageUrl || '';
      onImagesUpdated?.(images, primaryImage);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#08047D]/10 text-[#08047D] flex items-center justify-center">
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#08047D]">
                Add & Manage Product Images
              </h3>
              <p className="text-[11px] font-bold text-slate-500 truncate max-w-[280px] sm:max-w-md">
                {product.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Gallery Preview Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                <Layers size={13} className="text-[#FA9411]" />
                Current Images ({images.length})
              </label>
              <span className="text-[10px] font-bold text-slate-400">
                First image is Primary cover photo
              </span>
            </div>

            {images.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400">
                <ImageIcon size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold">No images added yet.</p>
                <p className="text-[10px] text-slate-400">Upload photos or paste URLs below.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {images.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className={`group relative aspect-square rounded-2xl overflow-hidden border-2 bg-slate-50 transition-all shadow-xs ${
                      idx === 0 
                        ? 'border-[#FA9411] ring-2 ring-[#FA9411]/20' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img 
                      src={url} 
                      alt={`Product asset ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                    />

                    {/* Primary Badge */}
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-[#FA9411] text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-sm flex items-center gap-0.5">
                        <Star size={9} className="fill-current" /> Cover
                      </span>
                    )}

                    {/* Hover Overlay Controls */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => setPrimary(idx)}
                          className="px-2 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-[9px] font-black tracking-wider uppercase transition-transform active:scale-95 shadow-xs flex items-center gap-1"
                          title="Make Cover Photo"
                        >
                          <Star size={10} className="text-[#FA9411]" /> Set Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-transform active:scale-95 shadow-xs"
                        title="Remove image"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Methods Tabs */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl max-w-sm mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'upload' 
                    ? 'bg-white text-[#08047D] shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload size={13} /> Upload Files
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'url' 
                    ? 'bg-white text-[#08047D] shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LinkIcon size={13} /> Paste URL
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'presets' 
                    ? 'bg-white text-[#08047D] shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles size={13} /> Presets
              </button>
            </div>

            {/* Tab 1: Upload Files */}
            {activeTab === 'upload' && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                  isDragging 
                    ? 'border-[#08047D] bg-indigo-50/50 scale-[1.01]' 
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <label className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-2xl bg-[#08047D]/10 text-[#08047D] flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Upload size={22} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    Click to browse or drag photos here
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports JPG, PNG, WEBP (multiple images allowed)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#08047D] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#060361] transition-colors">
                    <Plus size={14} /> Choose Photos
                  </div>
                </label>
              </div>
            )}

            {/* Tab 2: Paste URL */}
            {activeTab === 'url' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/... or Google Drive URL"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:border-[#08047D] focus:bg-white outline-none transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addImageToList(urlInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addImageToList(urlInput)}
                    disabled={!urlInput.trim()}
                    className="px-4 py-2.5 bg-[#08047D] hover:bg-[#060361] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                  >
                    <Plus size={14} /> Add Image
                  </button>
                </div>

                {urlInput.trim() && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                    <img 
                      src={urlInput.trim()} 
                      alt="URL Preview" 
                      className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-black uppercase text-emerald-600 block">Live Preview</span>
                      <p className="text-xs text-slate-600 truncate">{urlInput.trim()}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Curated Presets */}
            {activeTab === 'presets' && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 font-medium">
                  Tap any authentic uniform or textile photo to add it to this product:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {PRESET_UNIFORM_IMAGES.map((preset) => {
                    const alreadyAdded = images.includes(preset.url);
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => !alreadyAdded && addImageToList(preset.url)}
                        disabled={alreadyAdded}
                        className={`p-2 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                          alreadyAdded 
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 opacity-60' 
                            : 'bg-white border-slate-200 hover:border-[#FA9411] hover:shadow-xs active:scale-95'
                        }`}
                      >
                        <img 
                          src={preset.url} 
                          alt={preset.name} 
                          className="w-11 h-11 rounded-xl object-cover shrink-0 bg-slate-100" 
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-800 line-clamp-1 block">
                            {preset.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                            {alreadyAdded ? (
                              <><Check size={11} className="text-emerald-600" /> Added</>
                            ) : (
                              <><Plus size={11} className="text-[#FA9411]" /> Add</>
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Total photos: <strong className="text-slate-800 font-bold">{images.length}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#08047D] to-[#0A059E] hover:from-[#060361] hover:to-[#08047D] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>Save Product Images</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
