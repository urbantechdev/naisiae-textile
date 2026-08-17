import React, { useState, useEffect } from 'react';
import { Headset, Save, Zap, Phone, MessageSquare, Info, ShieldCheck } from 'lucide-react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { motion } from 'motion/react';

export default function ChatSettings({ setToast, handleFirestoreError }: any) {
  const [settings, setSettings] = useState<any>({
    whatsapp: '254792021795',
    message: 'Hello! I need assistance with uniform sourcing.',
    title: 'Direct Manufacturing Support',
    subtitle: 'Available 24/7 for bulk enquiries',
    enabled: true,
    forwardToWhatsApp: false,
    aiLabel: 'AI Sourcing',
    directLabel: 'Direct Support'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'chat'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data());
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'READ', 'settings/chat');
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'chat'), {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setToast({ message: 'Messaging settings deployed successfully!', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, 'WRITE', 'settings/chat');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
        <div className="w-8 h-8 border-2 border-[#FA9411] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest">Accessing Secure Communication Protocols...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-white rounded-[32px] shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="p-8 border-b border-[#E2E8F0] flex items-center justify-between bg-gradient-to-r from-white to-[#F8FAFC]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#08047D] rounded-2xl flex items-center justify-center text-[#FA9411]">
              <Headset size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-display text-[#08047D] tracking-wide">Direct Messaging Nexus</h3>
              <p className="text-[10px] font-black text-[#FA9411] border-l-2 border-[#FA9411] pl-3 uppercase tracking-[3px] mt-1">Configuring Real-Time Sourcing Channels</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-3 px-8 py-4 bg-[#FA9411] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#08047D] transition-all shadow-xl disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
            Synchronize Settings
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Configuration Column */}
          <div className="space-y-10">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[4px] text-[#08047D] flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#FA9411]" />
                Protocol Configuration
              </h4>
              
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                   <p className="text-xs font-bold text-[#08047D]">Enabled Messaging Portal</p>
                   <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Toggle visibility of the floating chat widget</p>
                </div>
                <button 
                  onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                  className={`w-14 h-8 rounded-full relative transition-all duration-300 ${settings.enabled ? 'bg-[#FA9411]' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${settings.enabled ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-6 bg-[#25D366]/5 rounded-2xl border border-[#25D366]/20">
                <div>
                   <p className="text-xs font-bold text-[#075E54]">WhatsApp Auto-Forwarding</p>
                   <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Automatically prompt WhatsApp on every web message</p>
                </div>
                <button 
                  onClick={() => setSettings({ ...settings, forwardToWhatsApp: !settings.forwardToWhatsApp })}
                  className={`w-14 h-8 rounded-full relative transition-all duration-300 ${settings.forwardToWhatsApp ? 'bg-[#25D366]' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${settings.forwardToWhatsApp ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[4px] text-[#08047D] flex items-center gap-2">
                <Phone size={14} className="text-[#FA9411]" />
                WhatsApp Linkage
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">WhatsApp Number (incl. country code)</label>
                  <input 
                    type="text" 
                    value={settings.whatsapp} 
                    onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                    placeholder="e.g. 254792021795"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold focus:border-[#FA9411] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Initial Context Message</label>
                  <textarea 
                    value={settings.message} 
                    onChange={(e) => setSettings({ ...settings, message: e.target.value })}
                    placeholder="Message pre-filled in their WhatsApp..."
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold focus:border-[#FA9411] outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Visual Column */}
          <div className="space-y-10">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[4px] text-[#08047D] flex items-center gap-2">
                <Zap size={14} className="text-[#FA9411]" />
                Visual Identity
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Interface Title</label>
                  <input 
                    type="text" 
                    value={settings.title} 
                    onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold focus:border-[#FA9411] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Sub-header Tagline</label>
                  <input 
                    type="text" 
                    value={settings.subtitle} 
                    onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold focus:border-[#FA9411] outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">AI Mode Label</label>
                    <input 
                      type="text" 
                      value={settings.aiLabel} 
                      onChange={(e) => setSettings({ ...settings, aiLabel: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-[10px] font-bold focus:border-[#FA9411] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Direct Mode Label</label>
                    <input 
                      type="text" 
                      value={settings.directLabel} 
                      onChange={(e) => setSettings({ ...settings, directLabel: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-[10px] font-bold focus:border-[#FA9411] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="p-8 bg-[#08047D] rounded-[40px] border border-white/10 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-[#FA9411]/5 to-transparent"></div>
               <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                 <div className="w-16 h-16 rounded-2xl bg-[#FA9411] flex items-center justify-center text-white shadow-2xl">
                    <Headset size={32} />
                 </div>
                 <div className="space-y-1">
                   <h5 className="text-white text-sm font-black uppercase tracking-[4px]">{settings.title}</h5>
                   <p className="text-[10px] font-bold text-[#FA9411] uppercase tracking-widest opacity-80">{settings.subtitle}</p>
                 </div>
                 <div className="w-full h-[1px] bg-white/10"></div>
                 <div className="flex items-center gap-2 text-white/40">
                   <Info size={12} />
                   <span className="text-[8px] font-black uppercase tracking-[2px]">Live Preview of Desktop Nexus</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
