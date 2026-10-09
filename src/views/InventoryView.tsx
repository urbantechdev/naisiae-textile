import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../api';
import { InventoryItem } from '../types';
import {
  Layers,
  Search,
  Filter,
  AlertTriangle,
  History,
  SlidersHorizontal,
  Package,
  ArrowDownRight,
  ArrowUpRight,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Edit3,
  Camera,
  Upload,
  Link as LinkIcon,
  Trash2,
  Check,
  ExternalLink,
  RefreshCw,
  Sparkles,
  DollarSign,
  Tag,
  Info
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { SkuImageManagerModal } from '../components/SkuImageManagerModal';
import { normalizeImageUrl } from './ProductsView';

// High-speed client-side image compression for mobile camera & desktop file uploads
export const compressImageFile = (file: File, maxWidth = 1200, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(e.target?.result as string);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const SKU_IMAGE_CATEGORIES = [
  { id: 'FRONT', label: 'Front View (Catalog)', badgeClass: 'bg-blue-100 text-[#030A91]' },
  { id: 'BACK', label: 'Back / Profile View', badgeClass: 'bg-indigo-100 text-indigo-900' },
  { id: 'FABRIC', label: 'Fabric & Weave Swatch', badgeClass: 'bg-emerald-100 text-emerald-900' },
  { id: 'BADGE', label: 'Badge & School Crest', badgeClass: 'bg-amber-100 text-amber-900' },
  { id: 'SIZE_CHART', label: 'Size & Fit Chart', badgeClass: 'bg-purple-100 text-purple-900' },
  { id: 'PACKAGING', label: 'Tag & Packaging Label', badgeClass: 'bg-slate-100 text-slate-800' },
  { id: 'OTHER', label: 'Other / Accessory', badgeClass: 'bg-stone-100 text-stone-800' },
];

export const InventoryView: React.FC = () => {
  const { branches, activeBranchId, canAccessFinancials, user } = useAuth();
  const { notify } = useNotification();

  const [activeTab, setActiveTab] = useState<'STOCK' | 'ALERTS' | 'MOVEMENTS'>('STOCK');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(activeBranchId);
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('ALL');

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustNewStock, setAdjustNewStock] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('PHYSICAL_COUNT');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Quick Change Product Image Modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalItem, setImageModalItem] = useState<InventoryItem | null>(null);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageCategorySelection, setImageCategorySelection] = useState<string>('FRONT');
  const [applyImageToAllVariants, setApplyImageToAllVariants] = useState<boolean>(true);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Full Edit Product & Inventory Item Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState<number>(0);
  const [editCostPrice, setEditCostPrice] = useState<number>(0);
  const [editCurrentStock, setEditCurrentStock] = useState<number>(0);
  const [editReorderLevel, setEditReorderLevel] = useState<number>(0);
  const [editReorderQuantity, setEditReorderQuantity] = useState<number>(0);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImageCategory, setEditImageCategory] = useState<string>('FRONT');
  const [editApplyImageToAll, setEditApplyImageToAll] = useState<boolean>(true);
  const [editStockNotes, setEditStockNotes] = useState<string>('');
  const [editImageInputMode, setEditImageInputMode] = useState<'upload' | 'url'>('upload');
  const [editImageUrlInput, setEditImageUrlInput] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // SKU Image Files Modal
  const [isSkuImageModalOpen, setIsSkuImageModalOpen] = useState(false);
  const [selectedSkuForModal, setSelectedSkuForModal] = useState<string | undefined>(undefined);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  const handleOpenSkuModal = async (sku?: string) => {
    setSelectedSkuForModal(sku);
    if (allProducts.length === 0) {
      try {
        const prods = await api.getProducts();
        setAllProducts(prods);
      } catch (e) {
        // fallback
      }
    }
    setIsSkuImageModalOpen(true);
  };

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const [invData, alertData, moveData] = await Promise.all([
        api.getInventory({ branchId: selectedBranchFilter }),
        api.getInventoryAlerts(),
        api.getInventoryMovements({ branchId: selectedBranchFilter }),
      ]);
      setInventory(invData);
      setAlerts(alertData);
      setMovements(moveData);
    } catch (err: any) {
      notify({ type: 'ERROR', title: 'Error loading inventory', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedBranchFilter]);

  const schools = Array.from(new Set(inventory.map((i) => i.school))).filter(Boolean);

  const filteredInventory = inventory.filter((item) => {
    if (selectedSchoolFilter !== 'ALL' && item.school !== selectedSchoolFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.school.toLowerCase().includes(q) ||
        item.barcode.includes(q)
      );
    }
    return true;
  });

  // Stock Adjustment Handlers
  const openAdjustModal = (item: InventoryItem) => {
    setAdjustItem(item);
    setAdjustNewStock(item.currentStock);
    setAdjustReason('PHYSICAL_COUNT');
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;

    setIsSubmittingAdjust(true);
    try {
      await api.adjustInventory({
        productId: adjustItem.productId,
        variantId: adjustItem.variantId,
        branchId: adjustItem.branchId,
        newStock: Number(adjustNewStock),
        reason: adjustReason,
        notes: adjustNotes,
      });

      notify({
        type: 'SUCCESS',
        title: 'Stock Adjusted',
        message: `${adjustItem.sku} stock updated to ${adjustNewStock} at ${adjustItem.branchName}`,
      });

      setIsAdjustModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      notify({ type: 'ERROR', title: 'Adjustment Failed', message: err.message });
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Quick Change Image Handlers
  const openChangeImageModal = (item: InventoryItem) => {
    setImageModalItem(item);
    setImagePreviewUrl(item.imageUrl || '');
    setImageUrlInput(item.imageUrl || '');
    setImageCategorySelection((item.imageCategory as string) || 'FRONT');
    setApplyImageToAllVariants(true);
    setImageInputMode('upload');
    setIsImageModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1200, 0.85);
      setImagePreviewUrl(compressed);
      setImageUrlInput(compressed);
      notify({ type: 'SUCCESS', title: 'Image Prepared', message: `${file.name} ready to save.` });
    } catch (err: any) {
      notify({ type: 'ERROR', title: 'File Error', message: err.message || 'Could not load image' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmSaveImage = async () => {
    if (!imageModalItem) return;
    setIsSavingImage(true);
    try {
      const finalUrl = imageInputMode === 'url' ? normalizeImageUrl(imageUrlInput) : imagePreviewUrl;

      await api.editInventoryItem({
        productId: imageModalItem.productId,
        variantId: imageModalItem.variantId,
        imageUrl: finalUrl,
        imageCategory: imageCategorySelection,
        applyImageToAllVariants: applyImageToAllVariants,
        notes: `Product image updated for ${imageModalItem.sku}`,
      });

      // Update in-memory inventory for instant feedback
      setInventory((prev) =>
        prev.map((inv) => {
          if (applyImageToAllVariants && inv.productId === imageModalItem.productId) {
            return { ...inv, imageUrl: finalUrl, imageCategory: imageCategorySelection };
          }
          if (inv.variantId === imageModalItem.variantId) {
            return { ...inv, imageUrl: finalUrl, imageCategory: imageCategorySelection };
          }
          return inv;
        })
      );

      notify({
        type: 'SUCCESS',
        title: 'Product Image Saved',
        message: `Image updated for ${imageModalItem.productName} (${applyImageToAllVariants ? 'all sizes' : imageModalItem.sku}).`,
      });

      setIsImageModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      notify({ type: 'ERROR', title: 'Image Update Failed', message: err.message || 'Could not update image' });
    } finally {
      setIsSavingImage(false);
    }
  };

  // Full Edit Product & Inventory Item Handlers
  const openEditModal = (item: InventoryItem) => {
    setEditItem(item);
    setEditProductName(item.productName);
    setEditSchool(item.school);
    setEditCategory(item.category);
    setEditSize(item.size);
    setEditSku(item.sku);
    setEditBarcode(item.barcode || '');
    setEditSellingPrice(item.sellingPrice);
    setEditCostPrice(item.costPrice);
    setEditCurrentStock(item.currentStock);
    setEditReorderLevel(item.reorderLevel);
    setEditReorderQuantity(item.reorderQuantity);
    setEditImageUrl(item.imageUrl || '');
    setEditImageUrlInput(item.imageUrl || '');
    setEditImageCategory((item.imageCategory as string) || 'FRONT');
    setEditApplyImageToAll(true);
    setEditStockNotes('');
    setEditImageInputMode('upload');
    setIsEditModalOpen(true);
  };

  const handleEditImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1200, 0.85);
      setEditImageUrl(compressed);
      setEditImageUrlInput(compressed);
      notify({ type: 'SUCCESS', title: 'New Photo Selected', message: `${file.name} ready for saving.` });
    } catch (err: any) {
      notify({ type: 'ERROR', title: 'File Error', message: err.message || 'Could not load image' });
    } finally {
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    setIsSubmittingEdit(true);
    try {
      const finalImage = editImageInputMode === 'url' && editImageUrlInput.trim()
        ? normalizeImageUrl(editImageUrlInput)
        : editImageUrl;

      await api.editInventoryItem({
        productId: editItem.productId,
        variantId: editItem.variantId,
        branchId: editItem.branchId,
        productName: editProductName,
        school: editSchool,
        category: editCategory,
        size: editSize,
        sku: editSku,
        barcode: editBarcode,
        costPrice: Number(editCostPrice),
        sellingPrice: Number(editSellingPrice),
        reorderLevel: Number(editReorderLevel),
        reorderQuantity: Number(editReorderQuantity),
        currentStock: Number(editCurrentStock),
        imageUrl: finalImage,
        imageCategory: editImageCategory,
        applyImageToAllVariants: editApplyImageToAll,
        notes: editStockNotes || 'Inventory item edited from inventory table',
      });

      notify({
        type: 'SUCCESS',
        title: 'Inventory Item Updated',
        message: `${editProductName} (${editSku}) updated successfully.`,
      });

      setIsEditModalOpen(false);
      await fetchInventory();
    } catch (err: any) {
      notify({ type: 'ERROR', title: 'Update Failed', message: err.message || 'Could not update inventory item' });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Live margin preview for edit modal
  const editMarginKES = Math.max(0, editSellingPrice - editCostPrice);
  const editMarginPercent = editSellingPrice > 0 ? Math.round((editMarginKES / editSellingPrice) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={editFileInputRef}
        onChange={handleEditImageFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Multi-Branch Inventory & Garment Catalog
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock tracking, product image management, and instant catalog adjustments.
          </p>
        </div>

        {/* Header Actions & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenSkuModal()}
            className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-blue-700 to-[#030A91] hover:from-blue-800 hover:to-blue-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-[#FACB00]" />
            <span>SKU Photo Manager & Batch Upload</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl shadow-xs text-xs font-bold">
            <button
              onClick={() => setActiveTab('STOCK')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'STOCK'
                  ? 'bg-[#030A91] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stock Levels ({filteredInventory.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ALERTS')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'ALERTS'
                  ? 'bg-[#030A91] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Low Stock Alerts ({alerts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('MOVEMENTS')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'MOVEMENTS'
                  ? 'bg-[#030A91] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Stock Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: STOCK LEVELS & DIRECT EDIT / IMAGE MANAGEMENT  */}
      {/* ==================================================== */}
      {activeTab === 'STOCK' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search garment, SKU, school, size, or barcode..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#030A91]"
              >
                <option value="all">All Branches (Consolidated)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#030A91]"
              >
                <option value="ALL">All Schools</option>
                {schools.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">School & Garment</th>
                    <th className="py-3 px-3">Size / SKU</th>
                    <th className="py-3 px-3">Branch</th>
                    <th className="py-3 px-3 text-center">Available Stock</th>
                    <th className="py-3 px-3">Threshold</th>
                    {canAccessFinancials && <th className="py-3 px-3 text-right">Cost Value</th>}
                    <th className="py-3 px-3 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map((item) => (
                    <tr key={`${item.variantId}-${item.branchId}`} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product & Image with Click-to-Change */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {/* Image Box with Camera Overlay */}
                          <div
                            onClick={() => openChangeImageModal(item)}
                            className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer group shadow-2xs hover:border-[#030A91] transition-all"
                            title="Click to view or change product photo"
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.sku}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 group-hover:text-amber-600 group-hover:bg-amber-50">
                                <ImageIcon className="w-4 h-4" />
                                <span className="text-[8px] font-bold mt-0.5 text-slate-400 group-hover:text-amber-700">Add</span>
                              </div>
                            )}
                            {/* Hover Camera Overlay */}
                            <div className="absolute inset-0 bg-[#030A91]/80 backdrop-blur-2xs opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-150">
                              <Camera className="w-4 h-4 text-[#FACB00]" />
                              <span className="text-[9px] font-black uppercase tracking-wider mt-0.5 text-white">Change</span>
                            </div>
                          </div>

                          <div>
                            <span className="font-bold text-slate-900 block">{item.productName}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">
                              {item.school} • {item.category}
                            </span>
                            {item.imageCategory && item.imageUrl && (
                              <span className="inline-block mt-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-50 text-[#030A91] border border-blue-100">
                                {item.imageCategory}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Size / SKU */}
                      <td className="py-3 px-3">
                        <span className="font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          Size {item.size}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {item.sku}
                        </span>
                      </td>

                      {/* Branch */}
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {item.branchName}
                      </td>

                      {/* Available Stock */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-full inline-block ${
                            item.currentStock === 0
                              ? 'bg-rose-100 text-rose-800'
                              : item.isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.currentStock} units
                        </span>
                      </td>

                      {/* Threshold */}
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        Min: <strong>{item.reorderLevel}</strong> | Reorder: <strong>{item.reorderQuantity}</strong>
                      </td>

                      {/* Cost Value */}
                      {canAccessFinancials && (
                        <td className="py-3 px-3 text-right font-medium text-slate-600">
                          KES {item.totalValuationCost.toLocaleString()}
                        </td>
                      )}

                      {/* Selling Price */}
                      <td className="py-3 px-3 text-right font-bold text-[#030A91]">
                        KES {item.sellingPrice.toLocaleString()}
                      </td>

                      {/* Action Buttons: Edit, Change Image, Adjust */}
                      <td className="py-3 px-4 text-center">
                        {canAccessFinancials ? (
                          <div className="flex items-center justify-center space-x-1.5">
                            {/* Full Edit Button */}
                            <button
                              onClick={() => openEditModal(item)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-[#030A91] text-[#030A91] hover:text-white text-[11px] font-bold border border-blue-200 hover:border-[#030A91] transition-all flex items-center shadow-2xs"
                              title="Edit product details, pricing, reorder thresholds and image"
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              Edit
                            </button>

                            {/* Direct Change Image Button */}
                            <button
                              onClick={() => openChangeImageModal(item)}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 text-[11px] font-bold border border-slate-200 transition-all shadow-2xs"
                              title="Change product image photo"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>

                            {/* Stocktake Adjust Button */}
                            <button
                              onClick={() => openAdjustModal(item)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 text-[11px] font-bold transition-colors"
                              title="Physical audit stock adjustment"
                            >
                              Adjust
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openChangeImageModal(item)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 text-[11px] font-semibold flex items-center mx-auto"
                            title="View / inspect photo"
                          >
                            <ImageIcon className="w-3 h-3 mr-1" />
                            Photo
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredInventory.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No uniform inventory records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: AUTOMATED RESTOCK ALERTS                      */}
      {/* ==================================================== */}
      {activeTab === 'ALERTS' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-950">
                  Automated Low Stock & Replenishment Monitor
                </h4>
                <p className="text-[11px] text-amber-800">
                  Items currently at or below minimum threshold. You can edit threshold values or adjust inventory directly.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((a) => {
              const matchedItem = inventory.find(
                (i) => i.productId === a.productId && i.variantId === a.variantId && i.branchId === a.branchId
              ) || inventory.find((i) => i.variantId === a.variantId);

              return (
                <div
                  key={a.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{a.school}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          a.urgency === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {a.urgency}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 mt-2">
                      {matchedItem && (
                        <div
                          onClick={() => openChangeImageModal(matchedItem)}
                          className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer group hover:border-[#030A91]"
                          title="Click to change photo"
                        >
                          {matchedItem.imageUrl ? (
                            <img src={matchedItem.imageUrl} alt={a.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{a.productName}</h4>
                        <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                          Branch: <strong>{a.branchName}</strong> | Size: <strong>{a.size}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current Available:</span>
                        <span className="font-black text-rose-600 text-sm">{a.currentStock} units</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Suggested Reorder:</span>
                        <span className="font-bold text-slate-800">{a.suggestedReorder} units</span>
                      </div>
                    </div>

                    {matchedItem && canAccessFinancials && (
                      <div className="flex items-center space-x-2 pt-2 border-t border-slate-50">
                        <button
                          onClick={() => openEditModal(matchedItem)}
                          className="flex-1 py-1 px-2 rounded-lg bg-blue-50 hover:bg-[#030A91] text-[#030A91] hover:text-white text-[11px] font-bold border border-blue-200 transition-colors flex items-center justify-center"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit Item
                        </button>
                        <button
                          onClick={() => openChangeImageModal(matchedItem)}
                          className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors flex items-center justify-center"
                        >
                          <Camera className="w-3 h-3 mr-1 text-[#030A91]" />
                          Photo
                        </button>
                        <button
                          onClick={() => openAdjustModal(matchedItem)}
                          className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 text-[11px] font-bold transition-colors"
                        >
                          Adjust
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {alerts.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">All uniform stocks are healthy!</p>
                <p className="text-xs text-slate-500">No items are currently below their reorder threshold.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: STOCK MOVEMENTS LEDGER                        */}
      {/* ==================================================== */}
      {activeTab === 'MOVEMENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Immutable Stock Movement Ledger
            </h3>
            <span className="text-xs text-slate-500">Last 200 physical inventory transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase bg-white">
                  <th className="py-3 px-4">Date/Time</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Item / SKU</th>
                  <th className="py-3 px-3">Branch</th>
                  <th className="py-3 px-3 text-center">Movement</th>
                  <th className="py-3 px-3 text-center">Balance</th>
                  <th className="py-3 px-3">Ref & Reason</th>
                  <th className="py-3 px-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(m.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          m.type === 'SALE'
                            ? 'bg-blue-100 text-blue-800'
                            : m.type === 'PURCHASE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.type === 'TRANSFER_IN' || m.type === 'TRANSFER_OUT'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                        {m.productName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{m.sku}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{m.branchName}</td>
                    <td className="py-3 px-3 text-center font-bold">
                      <span
                        className={`inline-flex items-center ${
                          m.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {m.newStock} units
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="font-mono text-xs font-bold text-slate-900 block">
                        {m.referenceNumber}
                      </span>
                      <span className="text-[10px] text-slate-500">{m.reason || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{m.userName}</td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: QUICK CHANGE PRODUCT IMAGE                  */}
      {/* ==================================================== */}
      {isImageModalOpen && imageModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#030A91] to-blue-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-[#FACB00]/20 flex items-center justify-center text-[#FACB00]">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#FACB00] tracking-wider block">
                    Product Image & Catalog Photo
                  </span>
                  <h3 className="font-black text-sm text-white truncate max-w-[320px]">
                    {imageModalItem.productName}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Item Info Summary */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">
                    {imageModalItem.school} • {imageModalItem.category}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    SKU: {imageModalItem.sku} | Size: {imageModalItem.size}
                  </span>
                </div>
                <span className="text-[11px] font-extrabold bg-[#030A91] text-white px-2 py-0.5 rounded-lg">
                  {imageModalItem.branchName}
                </span>
              </div>

              {/* Image Preview Box */}
              <div className="flex flex-col items-center justify-center bg-slate-100 rounded-xl p-4 border border-slate-200">
                {imagePreviewUrl ? (
                  <div className="relative group w-44 h-44 rounded-xl overflow-hidden shadow-md border-2 border-white bg-white">
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button
                        onClick={() => {
                          setImagePreviewUrl('');
                          setImageUrlInput('');
                        }}
                        className="p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
                        title="Remove current image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold py-1 px-2 rounded text-center">
                      {SKU_IMAGE_CATEGORIES.find((c) => c.id === imageCategorySelection)?.label || 'Product Image'}
                    </div>
                  </div>
                ) : (
                  <div className="w-44 h-44 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-white">
                    <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                    <span className="text-xs font-bold text-slate-600">No Image Assigned</span>
                    <span className="text-[10px] text-slate-400 text-center px-4 mt-0.5">
                      Upload from phone/PC or paste web link
                    </span>
                  </div>
                )}
              </div>

              {/* Mode Switcher: Upload vs URL */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-colors ${
                    imageInputMode === 'upload'
                      ? 'bg-white text-[#030A91] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File / Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-colors ${
                    imageInputMode === 'url'
                      ? 'bg-white text-[#030A91] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Web Link / Google Drive</span>
                </button>
              </div>

              {/* Tab 1: File Upload */}
              {imageInputMode === 'upload' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 px-4 border-2 border-dashed border-blue-300 hover:border-[#030A91] rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <Upload className="w-6 h-6 text-[#030A91] group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-[#030A91]">
                      Click to choose photo from device
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      Supports JPG, PNG, WEBP, HEIC (Auto-optimized)
                    </span>
                  </button>
                </div>
              )}

              {/* Tab 2: URL Link */}
              {imageInputMode === 'url' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Direct Image URL or Google Drive Link:
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => {
                        setImageUrlInput(e.target.value);
                        setImagePreviewUrl(normalizeImageUrl(e.target.value));
                      }}
                      placeholder="https://images.unsplash.com/... or drive.google.com/file/d/..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreviewUrl(normalizeImageUrl(imageUrlInput))}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                    >
                      Preview
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Google Drive share links are automatically transformed into direct image previews.
                  </p>
                </div>
              )}

              {/* Image Category Tag Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Photo View / Category Tag:
                </label>
                <select
                  value={imageCategorySelection}
                  onChange={(e) => setImageCategorySelection(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                >
                  {SKU_IMAGE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope Radio: All variants vs this SKU only */}
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200/60 space-y-2 text-xs">
                <span className="font-bold text-[#030A91] block">
                  Where should this photo be applied?
                </span>
                <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="radio"
                    name="imageScope"
                    checked={applyImageToAllVariants}
                    onChange={() => setApplyImageToAllVariants(true)}
                    className="text-[#030A91] focus:ring-[#030A91]"
                  />
                  <span>
                    Apply to <strong>all sizes / variants</strong> of this garment (Recommended for catalog)
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="radio"
                    name="imageScope"
                    checked={!applyImageToAllVariants}
                    onChange={() => setApplyImageToAllVariants(false)}
                    className="text-[#030A91] focus:ring-[#030A91]"
                  />
                  <span>
                    Apply to <strong>this size only</strong> ({imageModalItem.sku} - Size {imageModalItem.size})
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex space-x-2">
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveImage}
                disabled={isSavingImage}
                className="flex-1 py-2 rounded-xl bg-[#030A91] hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {isSavingImage ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Photo...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Product Image</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: FULL EDIT PRODUCT & INVENTORY ITEM          */}
      {/* ==================================================== */}
      {isEditModalOpen && editItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 bg-[#030A91] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FACB00]/20 flex items-center justify-center text-[#FACB00]">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#FACB00] tracking-wider block">
                    Edit Product & Inventory Item
                  </span>
                  <h3 className="font-bold text-sm text-white">
                    {editItem.productName} (Size {editItem.size})
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEdit} className="p-5 space-y-5 max-h-[82vh] overflow-y-auto">
              {/* Top Banner: Branch & SKU Badge */}
              <div className="flex flex-wrap items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs gap-2">
                <div>
                  <span className="text-slate-400 font-medium">Branch Location:</span>
                  <span className="font-black text-slate-800 ml-1.5">{editItem.branchName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono font-bold text-[11px]">
                    {editSku}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-[#030A91] font-bold text-[11px]">
                    Size {editSize}
                  </span>
                </div>
              </div>

              {/* Section 1: Product Master Info */}
              <div>
                <h4 className="text-xs font-bold text-[#030A91] uppercase tracking-wider mb-2 flex items-center">
                  <Tag className="w-3.5 h-3.5 mr-1" />
                  Product Master Identification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Product Name:</label>
                    <input
                      type="text"
                      value={editProductName}
                      onChange={(e) => setEditProductName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">School / Institution:</label>
                    <input
                      type="text"
                      value={editSchool}
                      onChange={(e) => setEditSchool(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Garment Category:</label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Size:</label>
                      <input
                        type="text"
                        value={editSize}
                        onChange={(e) => setEditSize(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Barcode:</label>
                      <input
                        type="text"
                        value={editBarcode}
                        onChange={(e) => setEditBarcode(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing & Financial Valuation */}
              <div>
                <h4 className="text-xs font-bold text-[#030A91] uppercase tracking-wider mb-2 flex items-center">
                  <DollarSign className="w-3.5 h-3.5 mr-1" />
                  Pricing & Profit Margins
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Selling Price (KES):</label>
                    <input
                      type="number"
                      min="0"
                      value={editSellingPrice}
                      onChange={(e) => setEditSellingPrice(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-[#030A91] focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Cost Price (KES):</label>
                    <input
                      type="number"
                      min="0"
                      value={editCostPrice}
                      onChange={(e) => setEditCostPrice(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                    />
                  </div>

                  <div className="flex flex-col justify-center bg-blue-100/60 p-2.5 rounded-lg border border-blue-200">
                    <span className="text-[10px] text-blue-900 font-bold block">Gross Margin Preview:</span>
                    <span className="text-sm font-black text-[#030A91] mt-0.5">
                      KES {editMarginKES.toLocaleString()} ({editMarginPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Stock Counts & Reorder Thresholds */}
              <div>
                <h4 className="text-xs font-bold text-[#030A91] uppercase tracking-wider mb-2 flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  Stock Levels & Reorder Thresholds
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Available Stock ({editItem.branchName}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editCurrentStock}
                      onChange={(e) => setEditCurrentStock(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Minimum Alert Threshold:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editReorderLevel}
                      onChange={(e) => setEditReorderLevel(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-amber-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Suggested Reorder Qty:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editReorderQuantity}
                      onChange={(e) => setEditReorderQuantity(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="font-bold text-slate-700 block mb-1 text-xs">
                    Audit Notes / Reason for change (Optional):
                  </label>
                  <input
                    type="text"
                    value={editStockNotes}
                    onChange={(e) => setEditStockNotes(e.target.value)}
                    placeholder="e.g. Price review for Term 1, stock audit correction..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                  />
                </div>
              </div>

              {/* Section 4: Product Image in Edit Modal */}
              <div>
                <h4 className="text-xs font-bold text-[#030A91] uppercase tracking-wider mb-2 flex items-center">
                  <Camera className="w-3.5 h-3.5 mr-1" />
                  Product Image & Catalog Photo
                </h4>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-300 shrink-0 shadow-2xs">
                      {editImageUrl ? (
                        <img src={editImageUrl} alt="Product" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-[#030A91] text-white text-xs font-bold hover:bg-blue-900 transition-colors flex items-center"
                        >
                          <Upload className="w-3 h-3 mr-1.5" />
                          Upload New Photo
                        </button>
                        {editImageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditImageUrl('');
                              setEditImageUrlInput('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors border border-rose-200"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {/* URL input fallback */}
                      <input
                        type="url"
                        value={editImageUrlInput}
                        onChange={(e) => {
                          setEditImageUrlInput(e.target.value);
                          setEditImageUrl(normalizeImageUrl(e.target.value));
                        }}
                        placeholder="Or paste web image URL / Google Drive link..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-600">Category Tag:</span>
                      <select
                        value={editImageCategory}
                        onChange={(e) => setEditImageCategory(e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                      >
                        {SKU_IMAGE_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center space-x-2 font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editApplyImageToAll}
                        onChange={(e) => setEditApplyImageToAll(e.target.checked)}
                        className="text-[#030A91] rounded focus:ring-[#030A91]"
                      />
                      <span>Apply this photo to all sizes of this product</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-[#030A91] hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {isSubmittingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save All Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: AUDIT STOCK ADJUSTMENT MODAL                */}
      {/* ==================================================== */}
      {isAdjustModalOpen && adjustItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-[#030A91] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#FACB00]">
                  Audit Stock Adjustment
                </span>
                <h3 className="font-bold text-sm">{adjustItem.productName}</h3>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-white/70 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Branch:</span>
                  <span className="font-bold">{adjustItem.branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SKU / Size:</span>
                  <span className="font-bold">
                    {adjustItem.sku} (Size: {adjustItem.size})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Stock:</span>
                  <span className="font-black text-slate-900">{adjustItem.currentStock} units</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  New Physical Stock Count:
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustNewStock}
                  onChange={(e) => setAdjustNewStock(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Mandatory Audit Reason:
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                >
                  <option value="PHYSICAL_COUNT">Routine Stocktake / Cycle Count</option>
                  <option value="DAMAGED_GOODS">Damaged / Stained / Defective Fabric</option>
                  <option value="OPENING_BALANCE">Initial Opening Balance Entry</option>
                  <option value="CORRECTION">Data Entry Discrepancy Correction</option>
                  <option value="RETURN">Customer Return Reconciliation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Notes & Authorization Reference:
                </label>
                <textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Audit conducted with store manager..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91]"
                  rows={2}
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="flex-1 py-2 rounded-xl bg-[#030A91] text-white text-xs font-bold hover:bg-blue-900 disabled:opacity-50"
                >
                  {isSubmittingAdjust ? 'Updating...' : 'Commit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SKU Image Files & Category Uploader Modal            */}
      {/* ==================================================== */}
      {isSkuImageModalOpen && (
        <SkuImageManagerModal
          isOpen={isSkuImageModalOpen}
          onClose={() => setIsSkuImageModalOpen(false)}
          products={allProducts}
          onRefresh={async () => {
            const prods = await api.getProducts();
            setAllProducts(prods);
            await fetchInventory();
          }}
          initialSku={selectedSkuForModal}
        />
      )}
    </div>
  );
};
