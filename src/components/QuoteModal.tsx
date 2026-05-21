import React, { useState } from 'react';
import { X, Image as ImageIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useCart } from '../context/CartContext';

export function QuoteModal() {
  const { isQuoteModalOpen, setIsQuoteModalOpen } = useCart();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    service: 'School Uniforms', 
    details: '',
    customLogoUrl: '',
    customLogoName: ''
  });

  return (
    <AnimatePresence>
      {isQuoteModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsQuoteModalOpen(false)}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between bg-[#F8FAFC] shrink-0">
              <div>
                <h2 className="font-display text-3xl text-[#0A1628] leading-none mb-1">Get Custom Quote</h2>
                <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">Expert branding & uniform consultations</p>
              </div>
              <button onClick={() => setIsQuoteModalOpen(false)} className="text-slate-400 p-2 hover:text-[#C8102E] transition-colors"><X size={20} /></button>
            </div>

            <form 
              onSubmit={async (e) => { 
                e.preventDefault();
                try {
                  await addDoc(collection(db, 'quotes'), { 
                    name: quoteForm.name,
                    email: quoteForm.email,
                    phone: quoteForm.phone,
                    service: quoteForm.service,
                    details: quoteForm.details,
                    customLogoUrl: quoteForm.customLogoUrl || null,
                    customLogoName: quoteForm.customLogoName || null,
                    status: 'pending', 
                    createdAt: serverTimestamp(), 
                    uid: auth.currentUser?.uid || 'guest' 
                  });
                  setOrderSuccess(true);
                  setTimeout(() => { 
                    setOrderSuccess(false); 
                    setIsQuoteModalOpen(false);
                    setQuoteForm({ 
                      name: '', 
                      email: '', 
                      phone: '', 
                      service: 'School Uniforms', 
                      details: '',
                      customLogoUrl: '',
                      customLogoName: ''
                    });
                  }, 2000);
                } catch (err) {
                  handleFirestoreError(err, OperationType.WRITE, 'quotes');
                }
              }}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Full Name</label>
                  <input 
                    required 
                    placeholder="e.g. John Doe"
                    value={quoteForm.name} 
                    onChange={e => setQuoteForm({...quoteForm, name: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#C8102E] transition-all font-semibold" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Phone Number</label>
                  <input 
                    required 
                    placeholder="+254..."
                    value={quoteForm.phone} 
                    onChange={e => setQuoteForm({...quoteForm, phone: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#C8102E] transition-all font-semibold" 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Email Address</label>
                <input 
                  required 
                  type="email" 
                  placeholder="name@example.com"
                  value={quoteForm.email} 
                  onChange={e => setQuoteForm({...quoteForm, email: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#C8102E] transition-all font-semibold" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Service Type</label>
                <select 
                  value={quoteForm.service} 
                  onChange={e => setQuoteForm({...quoteForm, service: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#C8102E] transition-all font-semibold"
                >
                  <option>School Uniforms</option>
                  <option>Corporate Branding</option>
                  <option>Custom Knitwear</option>
                  <option>Screen Printing</option>
                  <option>General Enquiry</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Request Details</label>
                <textarea 
                  rows={4} 
                  value={quoteForm.details} 
                  onChange={e => setQuoteForm({...quoteForm, details: e.target.value})} 
                  placeholder="Tell us what you need in detail..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#C8102E] resize-none transition-all font-semibold" 
                />
              </div>

              {/* Optional Company / School Logo Upload */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Attach Your Logo (Optional)</label>
                
                {!quoteForm.customLogoUrl ? (
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#C8102E]/40 bg-[#F8FAFC] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setQuoteForm({
                                ...quoteForm,
                                customLogoUrl: event.target.result as string,
                                customLogoName: file.name
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <ImageIcon size={22} className="text-slate-300 group-hover:text-[#C8102E]/60 transition-colors mb-1.5" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Image File</span>
                    <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest mt-0.5">PNG, JPG, SVG up to 5MB</span>
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-150 p-0.5 overflow-hidden flex items-center justify-center shrink-0">
                        <img src={quoteForm.customLogoUrl} className="max-w-full max-h-full object-contain" alt="Selected branding logo" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-700 truncate max-w-[170px] uppercase select-none">{quoteForm.customLogoName}</p>
                        <p className="text-[8px] font-bold text-green-500 uppercase tracking-widest">Attached</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQuoteForm({
                          ...quoteForm,
                          customLogoUrl: '',
                          customLogoName: ''
                        });
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Clear Image"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                type="submit"
                disabled={orderSuccess}
                className="w-full bg-[#0A1628] hover:bg-[#C8102E] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-xl shadow-black/10 disabled:bg-green-600 active:scale-[0.98] cursor-pointer"
              >
                {orderSuccess ? 'Message Sent Successfully!' : 'Send Request'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
