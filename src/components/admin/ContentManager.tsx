import React, { useState } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../../services/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Package, Plus, Trash2, Edit2, Link as LinkIcon, RotateCcw, ImageIcon, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove as dndArrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, children }: { id: string, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm relative group mb-3">
      <div {...attributes} {...listeners} className="cursor-grab hover:text-[#08047D] text-slate-300">
        <GripVertical size={20} />
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function ContentManager({ categories, services, portfolio, setToast, handleFirestoreError, initialTab }: any) {
  const [activeTab, setActiveTab] = useState(initialTab || 'categories');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const handleSave = async () => {
    if (!editingItem || !editingItem.title) return;
    try {
      const collectionName = activeTab; // 'categories', 'services', 'portfolio'
      const docRef = editingItem.id ? doc(db, collectionName, editingItem.id) : doc(collection(db, collectionName));
      await setDoc(docRef, {
        ...editingItem,
        sortOrder: editingItem.sortOrder || 999
      });
      setToast({ message: `${activeTab} item saved successfully!`, type: 'success' });
      setEditingItem(null);
    } catch (error) {
      console.error(error);
      setToast({ message: `Error saving ${activeTab} item.`, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, activeTab, id));
      setToast({ message: 'Item deleted.', type: 'success' });
    } catch (error) {
      console.error(error);
      setToast({ message: 'Error deleting item.', type: 'error' });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: any, items: any[]) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((i: any) => i.id === active.id);
      const newIndex = items.findIndex((i: any) => i.id === over.id);
      const reordered = dndArrayMove(items, oldIndex, newIndex);
      
      // Update all sortOrders in DB
      try {
        await Promise.all(reordered.map((item, idx) => 
          setDoc(doc(db, activeTab, item.id), { ...item, sortOrder: idx }, { merge: true })
        ));
        setToast({ message: 'Order updated.', type: 'success' });
      } catch (error) {
        console.error(error);
        setToast({ message: 'Error updating order.', type: 'error' });
      }
    }
  };

  const currentItems = activeTab === 'categories' ? categories : activeTab === 'services' ? services : portfolio;

  const resolveImageUrl = async () => {
    if (!urlInput) return;
    try {
      setToast({ message: 'Fetching image...', type: 'info' });
      const response = await fetch(`/api/resolve-image?url=${encodeURIComponent(urlInput)}`);
      const data = await response.json();
      if (data.resolvedUrl) {
         setEditingItem({ ...editingItem, image: data.resolvedUrl });
         setToast({ message: 'Image fetched successfully!', type: 'success' });
      } else {
         throw new Error("Could not find image.");
      }
    } catch (error) {
      setEditingItem({ ...editingItem, image: urlInput }); // Fallback to raw URL
      setToast({ message: 'Used direct URL.', type: 'success' });
    }
    setIsUrlModalOpen(false);
    setUrlInput('');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="p-8 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-display text-[#08047D] tracking-wide">Content Management</h3>
            <p className="text-xs text-slate-500 mt-1">Manage Categories, Services and Portfolio items</p>
          </div>
          <button 
            onClick={() => setEditingItem({ title: '' })}
            className="bg-[#08047D] hover:bg-[#050259] text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold text-sm transition-colors"
          >
            <Plus size={16} /> Add New Item
          </button>
        </div>

        <div className="border-b border-slate-100 flex overflow-x-auto">
          {['categories', 'services', 'portfolio'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setEditingItem(null); }}
              className={`px-8 py-4 font-bold text-sm tracking-wider uppercase whitespace-nowrap transition-colors border-b-2 ${activeTab === tab ? 'border-[#08047D] text-[#08047D]' : 'border-transparent text-slate-500 hover:text-[#08047D]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8 flex gap-8">
          {/* List View */}
          <div className="flex-1 min-w-[300px]">
             {currentItems.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-500 text-sm">No items found for {activeTab}.</p>
                </div>
             ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, currentItems)}>
                  <SortableContext items={currentItems} strategy={verticalListSortingStrategy}>
                    {currentItems.map((item: any) => (
                      <SortableItem key={item.id} id={item.id}>
                        <div className="flex items-center gap-4 py-2">
                           {item.image ? (
                             <img src={item.image} className="w-12 h-12 rounded-lg object-cover" />
                           ) : (
                             <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center"><Package size={20} className="text-slate-300"/></div>
                           )}
                           <div className="flex-1">
                             <h4 className="font-bold text-[#08047D] text-sm truncate">{item.title}</h4>
                             {item.description && <p className="text-[10px] text-slate-500 truncate mt-1">{item.description}</p>}
                           </div>
                           <div className="flex gap-2">
                             <button onClick={() => setEditingItem(item)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"><Edit2 size={14}/></button>
                             <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"><Trash2 size={14}/></button>
                           </div>
                        </div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
             )}
          </div>

          {/* Edit View */}
          {editingItem && (
            <div className="w-[400px] shrink-0 bg-slate-50 rounded-2xl border border-slate-200 p-6">
               <h3 className="font-bold text-lg mb-6">{editingItem.id ? 'Edit' : 'New'} Item in {activeTab}</h3>
               
               <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
                    <input type="text" value={editingItem.title || ''} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full mt-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#08047D]" />
                  </div>

                  {activeTab === 'categories' && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Subtitle</label>
                        <input type="text" value={editingItem.subtitle || ''} onChange={e => setEditingItem({...editingItem, subtitle: e.target.value})} className="w-full mt-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#08047D]" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Redirect Link</label>
                        <input type="text" value={editingItem.link || ''} onChange={e => setEditingItem({...editingItem, link: e.target.value})} className="w-full mt-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#08047D]" placeholder="/?tab=Category#shop" />
                      </div>
                    </>
                  )}

                  {activeTab === 'portfolio' && (
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Tag (e.g. Education)</label>
                        <input type="text" value={editingItem.tag || ''} onChange={e => setEditingItem({...editingItem, tag: e.target.value})} className="w-full mt-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#08047D]" />
                     </div>
                  )}

                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                     <textarea rows={3} value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full mt-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#08047D]" />
                  </div>

                  {activeTab === 'services' && (
                     <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">Features (Comma separated)</label>
                       <textarea rows={2} value={editingItem.features?.join(', ') || ''} onChange={e => setEditingItem({...editingItem, features: e.target.value.split(',').map((s: string) => s.trim())})} className="w-full mt-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#08047D]" placeholder="Feature 1, Feature 2" />
                     </div>
                  )}

                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Image</label>
                     <div className="flex gap-2 mb-2 mt-1">
                        <button onClick={() => setIsUrlModalOpen(true)} className="flex-1 bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50"><LinkIcon size={14} /> Update via URL</button>
                     </div>
                     {editingItem.image ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group">
                           <img src={editingItem.image} className="w-full h-full object-cover" />
                           <button onClick={() => setEditingItem({...editingItem, image: ''})} className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-lg text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                        </div>
                     ) : (
                        <div className="aspect-video rounded-lg bg-white border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                           No Image
                        </div>
                     )}
                  </div>
               </div>

               <div className="mt-8 flex gap-3">
                  <button onClick={handleSave} className="flex-1 bg-[#050259] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#08047D] transition-colors">Save Item</button>
                  <button onClick={() => setEditingItem(null)} className="w-[30%] bg-white border border-slate-200 text-[#050259] py-3 rounded-lg font-bold text-sm hover:bg-slate-50">Cancel</button>
               </div>
            </div>
          )}
        </div>
      </div>

      {isUrlModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-2xl font-display font-bold text-[#08047D]">Import Image</h3>
              <p className="text-sm text-slate-500 mt-2">Paste a website or image URL. The platform will automatically extract the image.</p>
            </div>
            <div className="p-8">
              <div className="relative">
                <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-sm font-bold text-[#08047D] focus:border-[#FA9411] outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setIsUrlModalOpen(false)}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={resolveImageUrl}
                className="flex-1 px-4 py-3 bg-[#08047D] text-white rounded-xl font-bold flex flex-col items-center justify-center hover:bg-[#050259]"
              >
                Import Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
