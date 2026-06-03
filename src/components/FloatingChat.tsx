import React, { useState, useEffect, useRef } from 'react';
import { Headset, X, Send, Zap, User, Loader2, Phone, Minus, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  doc, 
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp, 
  setDoc,
  limit
} from 'firebase/firestore';
import { db } from '../services/firebase';

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatMode, setChatMode] = useState<'direct' | 'ai'>('direct');
  const [chatSettings, setChatSettings] = useState<any>(null);
  const [showPulse, setShowPulse] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or retrieve Session ID
  useEffect(() => {
    let sId = localStorage.getItem('naisiae_chat_session');
    if (!sId) {
      sId = 'user_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('naisiae_chat_session', sId);
    }
    setSessionId(sId);

    const unsubSettings = onSnapshot(doc(db, 'settings', 'chat'), (snapshot) => {
      if (snapshot.exists()) {
        setChatSettings(snapshot.data());
      } else {
        setChatSettings({
          title: 'Direct Manufacturing Support',
          subtitle: 'Available 24/7 for bulk enquiries',
          enabled: true
        });
      }
    });

    const pulseTimer = setTimeout(() => setShowPulse(false), 10000);

    return () => {
      unsubSettings();
      clearTimeout(pulseTimer);
    };
  }, []);

  // Sync Messages
  useEffect(() => {
    if (!sessionId || !isOpen) return;

    const messagesRef = collection(db, 'chats', sessionId, 'messages');
    // Using a query that is more likely to work without complex indices initially
    // and correctly handles the real-time sync of messages
    const q = query(
      messagesRef,
      orderBy('createdAt', 'asc')
    );

    const unsubMessages = onSnapshot(q, (snapshot) => {
      // Use local state for pending writes if needed, but onSnapshot usually handles this
      const msgs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      setMessages(msgs);
      setIsLoadingMessages(false);
      
      // Auto scroll to bottom
      if (msgs.length > 0) {
        // Use requestAnimationFrame for smoother scroll after render
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
      }
    }, (error) => {
      console.error("Messages sync error details:", error);
      // If permission fails, we might be hitting a rule issue or index issue
    });

    return () => unsubMessages();
  }, [sessionId, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !sessionId || isSending) return;

    const userMessage = newMessage;
    setNewMessage('');
    setIsSending(true);

    try {
      // 1. Save user message to Firestore
      await setDoc(doc(db, 'chats', sessionId), {
        lastMessage: userMessage,
        lastUpdate: serverTimestamp(),
        unreadCount: 0,
        status: 'active',
        userType: 'guest'
      }, { merge: true });

      await addDoc(collection(db, 'chats', sessionId, 'messages'), {
        text: userMessage,
        sender: 'user',
        createdAt: serverTimestamp()
      });

      // 2. Handle Logic based on Mode
      if (chatMode === 'ai') {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messages: [...messages, { sender: 'user', text: userMessage }]
          })
        });

        const data = await response.json();
        
        if (data.text) {
          await addDoc(collection(db, 'chats', sessionId, 'messages'), {
            text: data.text,
            sender: 'ai',
            createdAt: serverTimestamp()
          });
        }
      } else {
        // Forward to WhatsApp if setting is enabled in direct mode
        if (chatSettings?.forwardToWhatsApp) {
          const number = chatSettings.whatsapp || '254792021795';
          const text = encodeURIComponent(`[Ref: ${sessionId}]\n${userMessage}`);
          window.open(`https://wa.me/${number.replace(/\+/g, '')}?text=${text}`, '_blank');
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (chatSettings?.enabled === false) return null;

  return (
    <div className="fixed right-10 bottom-10 z-[90] hidden lg:block">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
            style={{ 
              transformOrigin: 'bottom right'
            }}
            className={`absolute bottom-10 right-0 w-[310px] bg-white rounded-[32px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden flex flex-col transition-all duration-300 ${
              isMinimized ? 'h-[80px]' : 'h-[400px]'
            } flex flex-col`}
          >
            {/* Header */}
            <div className={`p-4 transition-colors duration-500 relative overflow-hidden shrink-0 ${
              chatMode === 'ai' ? 'bg-[#C8961A]' : 'bg-[#0A1628]'
            }`}>
               <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
               </div>
               
               <div className="relative z-10 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                     chatMode === 'ai' ? 'bg-white/20 border border-white/30' : 'bg-[#C8961A]/10 border border-[#C8961A]/20'
                   }`}>
                     <div className="relative">
                       <Headset className={chatMode === 'ai' ? 'text-white' : 'text-[#C8961A]'} size={24} />
                       <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0A1628]"></span>
                     </div>
                   </div>
                   <div>
                     <h4 className="text-white text-xs font-black uppercase tracking-widest">
                       {chatMode === 'ai' ? 'OpenHuman Intelligence' : (chatSettings?.title || 'Production Support')}
                     </h4>
                     <p className={`text-[10px] font-bold ${chatMode === 'ai' ? 'text-[#0A1628]' : 'text-[#C8961A]'}`}>
                       {chatMode === 'ai' ? 'Real-time Production AI' : (chatSettings?.subtitle || 'Live Support')}
                     </p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setIsMinimized(!isMinimized)}
                     className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white transition-all"
                     title={isMinimized ? "Restore" : "Minimize"}
                   >
                     {isMinimized ? <ChevronUp size={18} /> : <Minus size={18} />}
                   </button>
                   <button 
                     onClick={() => {
                        const number = chatSettings?.whatsapp || '254792021795';
                        const text = encodeURIComponent(`Hi! I'm reaching out from the web portal. (Session: ${sessionId})`);
                        window.open(`https://wa.me/${number.replace(/\+/g, '')}?text=${text}`, '_blank');
                     }}
                     className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-lg"
                     title="Direct WhatsApp"
                   >
                     <Phone size={18} />
                   </button>
                   <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white transition-all">
                     <X size={18} />
                   </button>
                 </div>
               </div>
            </div>

            {/* Mode Switcher */}
            {!isMinimized && (
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Mode</span>
                <div className="flex items-center bg-slate-200/50 p-1 rounded-xl">
                  <button 
                    onClick={() => setChatMode('direct')}
                    className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                      chatMode === 'direct' ? 'bg-[#0A1628] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {chatSettings?.directLabel || 'Direct'}
                  </button>
                  <button 
                    onClick={() => setChatMode('ai')}
                    className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${
                      chatMode === 'ai' ? 'bg-[#C8961A] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {chatSettings?.aiLabel || 'OpenHuman'}
                  </button>
                </div>
              </div>
            )}

            {/* Chat Body */}
            {!isMinimized && (
              <>
                <div className="flex-1 bg-white p-4 overflow-y-auto space-y-4 custom-scrollbar">
                  {isLoadingMessages ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 size={24} className="text-[#C8961A] animate-spin opacity-20" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                      <div className="w-14 h-14 bg-slate-50 rounded-3xl flex items-center justify-center">
                        {chatMode === 'ai' ? <Zap size={24} className="text-[#C8961A]" /> : <Headset size={24} className="text-slate-400" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#0A1628]">
                          {chatMode === 'ai' ? 'AI Sourcing Active' : 'Manufacturing Support'}
                        </p>
                        <p className="text-[9px] font-medium max-w-[180px] mt-1">
                          {chatMode === 'ai' 
                            ? 'Ask me about bulk production, textile specs, or lead times.' 
                            : 'Direct channel to our production managers in Uhuru Market.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                      messages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] p-3 rounded-2xl text-[12px] leading-relaxed shadow-sm ${
                            msg.sender === 'user' 
                              ? (chatMode === 'ai' ? 'bg-[#C8961A] text-white' : 'bg-[#0A1628] text-white') + ' rounded-br-none shadow-lg'
                              : msg.sender === 'ai'
                                ? 'bg-slate-900 text-white rounded-bl-none border-l-4 border-[#C8961A]'
                                : 'bg-slate-100 text-[#0A1628] border border-slate-100 rounded-bl-none'
                          }`}>
                            {(msg.sender === 'ai' || msg.sender === 'admin' || msg.sender === 'system') && (
                              <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-black/5">
                                <Zap size={10} className={msg.sender === 'ai' ? 'text-[#C8961A]' : 'text-[#0A1628]'} />
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-70">
                                  {msg.sender === 'ai' ? 'Intelligence' : (msg.sender === 'admin' ? 'Support Lead' : 'System')}
                                </span>
                              </div>
                            )}
                            {msg.text}
                          </div>
                        </div>
                      ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Input */}
                <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                  <form 
                    onSubmit={handleSendMessage}
                    className="relative"
                  >
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type message..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-12 py-3 text-[11px] font-bold focus:border-[#C8961A] outline-none transition-all placeholder:text-slate-300"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim() || isSending}
                      className="absolute right-1.5 top-1.5 bottom-1.5 w-8 h-8 bg-[#0A1628] hover:bg-[#C8102E] text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-30 active:scale-95"
                    >
                      {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </form>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <Zap size={10} className="text-[#C8961A]" />
                      <span className="text-[8px] font-black uppercase tracking-[3px] text-slate-300">
                        {chatMode === 'ai' ? 'OpenHuman AI Active' : 'Sync Protocols Active'}
                      </span>
                    </div>
                    {chatMode === 'direct' && chatSettings?.forwardToWhatsApp && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-md border border-green-100 animate-pulse">
                        <Phone size={8} className="text-green-500" />
                        <span className="text-[7px] font-black text-green-600 uppercase tracking-widest">WhatsApp Direct Active</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowPulse(false);
        }}
        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.35)] border ${
          isOpen 
            ? 'bg-white border-white text-[#0A1628] rotate-90 scale-90 pl-0' 
            : 'bg-[#C8961A] border-[#C8961A]/50 text-white pr-2.5'
        }`}
      >
        {/* Continuous Staggered Signal Transmission Waves when closed */}
        {!isOpen && (
          <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-visible">
            {/* Base radiant glow */}
            <span className="absolute inset-0 rounded-2xl bg-[#C8961A]/5 animate-pulse"></span>
            {/* Wave 1 */}
            <span className="absolute inset-0 rounded-2xl border border-[#C8961A]/50 bg-[#C8961A]/10 animate-[ping_3s_infinite_ease-out]"></span>
            {/* Wave 2 */}
            <span className="absolute inset-0 rounded-2xl border border-[#C8961A]/30 bg-transparent animate-[ping_3s_infinite_ease-out] [animation-delay:1s]"></span>
            {/* Wave 3 */}
            <span className="absolute inset-0 rounded-2xl border border-[#C8961A]/10 bg-transparent animate-[ping_3s_infinite_ease-out] [animation-delay:2s]"></span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative flex items-center gap-2 pl-2"
            >
              <Headset size={18} className="animate-pulse" />
              
              {/* Pulsing signal transmitter bar icons */}
              <div className="flex items-end gap-[1.5px] h-3.5 select-none opacity-85">
                <span className="w-[1.5px] h-[3.5px] bg-white rounded-full animate-[pulse_1.2s_infinite_ease-in-out_0s]"></span>
                <span className="w-[1.5px] h-[7px] bg-white rounded-full animate-[pulse_1.2s_infinite_ease-in-out_0.2s]"></span>
                <span className="w-[1.5px] h-[10.5px] bg-white rounded-full animate-[pulse_1.2s_infinite_ease-in-out_0.4s]"></span>
              </div>

              {/* Red Transmitter LED Indicator */}
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8102E] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8102E]"></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

