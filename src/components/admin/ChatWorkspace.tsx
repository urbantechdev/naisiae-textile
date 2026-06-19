import React, { useState, useEffect, useRef } from 'react';
import { 
  Headset, 
  Search, 
  MoreVertical, 
  Send, 
  User, 
  Clock, 
  ShieldCheck, 
  Zap,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Phone,
  ArrowLeft
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatWorkspace({ setToast, handleFirestoreError }: any) {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync Chats List
  useEffect(() => {
    const q = query(collection(db, 'chats'), orderBy('lastUpdate', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'READ', 'chats');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Sync Selected Chat Messages
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chats', selectedChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsub();
  }, [selectedChatId]);

  const handleSendReply = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!reply.trim() || !selectedChatId || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'chats', selectedChatId, 'messages'), {
        text: reply,
        sender: 'admin',
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', selectedChatId), {
        lastMessage: reply,
        lastUpdate: serverTimestamp(),
        status: 'responded'
      });

      setReply('');
    } catch (error) {
      handleFirestoreError(error, 'WRITE', `chats/${selectedChatId}/messages`);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-slate-400 gap-4">
        <Loader2 className="animate-spin text-[#C8961A]" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[4px]">Initializing Live Support Workspace...</p>
      </div>
    );
  }

  const selectedChat = chats.find(c => c.id === selectedChatId);

  // Apply real-time search term filtering to Support queue
  const filteredChats = chats.filter(chat => {
    const term = searchTerm.toLowerCase();
    const matchesId = chat.id.toLowerCase().includes(term);
    const matchesMsg = chat.lastMessage && chat.lastMessage.toLowerCase().includes(term);
    return matchesId || matchesMsg;
  });

  return (
    <div className="bg-white rounded-[24px] md:rounded-[40px] shadow-sm border border-[#E2E8F0] overflow-hidden flex h-[650px] md:h-[750px] relative">
      {/* Sidebar: Chat List */}
      <div className={`w-full md:w-[360px] lg:w-[380px] border-r border-slate-100 flex flex-col bg-[#F8FAFC] h-full ${
        selectedChatId ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 md:p-8 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-display text-[#0A1628]">Support Queue</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Live</span>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Filter sessions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl pl-12 pr-4 py-2.5 md:py-3.5 text-xs font-bold focus:border-[#C8961A] outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 custom-scrollbar">
          {filteredChats.length === 0 ? (
            <div className="py-20 text-center opacity-40">
              <MessageSquare size={32} className="mx-auto mb-4 text-slate-300" />
              <p className="text-[10px] font-black uppercase tracking-widest">No active sessions</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`w-full text-left p-4 md:p-5 rounded-2xl md:rounded-[28px] transition-all group relative ${
                  selectedChatId === chat.id 
                    ? 'bg-[#0A1628] text-white shadow-xl' 
                    : 'bg-white hover:bg-slate-50 text-[#0A1628] border border-slate-100'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${
                      selectedChatId === chat.id ? 'bg-[#C8961A]/20' : 'bg-[#F1F5F9]'
                    }`}>
                      <User size={16} className={selectedChatId === chat.id ? 'text-[#C8961A]' : 'text-slate-400'} />
                    </div>
                    <div>
                      <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">{chat.id.replace('user_', 'ID-')}</h4>
                      <div className="flex items-center gap-1.5 opacity-60">
                        <Clock size={10} />
                        <span className="text-[9px] font-bold">
                          {chat.lastUpdate?.toDate ? chat.lastUpdate.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {chat.status === 'active' && (
                    <div className="w-2 h-2 rounded-full bg-[#C8102E] shadow-[0_0_10px_rgba(200,16,46,0.5)] animate-pulse"></div>
                  )}
                </div>
                <p className={`text-[10px] md:text-[11px] line-clamp-1 opacity-60 ${selectedChatId === chat.id ? 'text-white' : 'text-slate-500'}`}>
                  {chat.lastMessage || 'No messages yet...'}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className={`flex-1 flex flex-col bg-white h-full ${
        !selectedChatId ? 'hidden md:flex' : 'flex'
      }`}>
        {selectedChatId ? (
          <>
            {/* Header */}
            <div className="p-4 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3 md:gap-4">
                {/* Mobile back trigger */}
                <button 
                  onClick={() => setSelectedChatId(null)}
                  className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-700 active:scale-95 transition-all shrink-0"
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[#0A1628] flex items-center justify-center text-[#C8961A] shrink-0">
                  <Headset size={20} className="md:hidden" />
                  <Headset size={28} className="hidden md:block" />
                </div>
                <div>
                  <h4 className="text-base md:text-2xl font-display text-[#0A1628] tracking-tight truncate max-w-[180px] md:max-w-none">
                    Support Session
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded-md text-[8px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200 truncate max-w-[120px]">
                      {selectedChatId.replace('user_', 'ID-')}
                    </span>
                    <span className="hidden sm:inline-flex text-[9px] font-bold text-[#C8961A]/80 items-center gap-1">
                      <ShieldCheck size={10} /> Secure Live Link
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedChatId(null)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all shrink-0"
              >
                <MoreVertical size={16} />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto space-y-4 md:space-y-6 bg-slate-50/20 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                  <MessageSquare size={32} className="mb-2 text-slate-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No conversation history yet</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex flex-col gap-1 max-w-[85%] md:max-w-[70%]">
                      <div className={`flex items-center gap-2 mb-0.5 ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                         <span className="text-[7px] md:text-[8px] font-black uppercase tracking-wider text-slate-400">
                           {msg.sender === 'admin' ? 'Support Lead' : 'Client Representative'}
                         </span>
                      </div>
                      <div className={`px-4 py-3 md:p-5 rounded-2xl md:rounded-[32px] text-xs md:text-sm leading-relaxed shadow-sm ${
                        msg.sender === 'admin' 
                          ? 'bg-[#0A1628] text-white rounded-tr-none' 
                          : 'bg-white text-[#0A1628] border border-[#E2E8F0]/60 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Area */}
            <div className="p-3 md:p-6 border-t border-slate-100 bg-white shrink-0">
              <form onSubmit={handleSendReply} className="flex gap-2 items-end">
                <textarea 
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Direct reply to client session..."
                  rows={2}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl px-4 md:px-6 py-2.5 text-xs md:text-sm font-medium focus:border-[#C8961A] outline-none transition-all resize-none shadow-inner bg-slate-50/60"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                />
                <button 
                  type="submit"
                  disabled={!reply.trim() || isSending}
                  className="flex items-center justify-center w-10 h-10 md:w-14 md:h-12 bg-[#0A1628] hover:bg-[#C8961A] text-white rounded-xl md:rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-30 shrink-0"
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
              <div className="mt-3 hidden md:flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-green-500" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Delivery Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={12} className="text-[#C8961A]" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Syncing Real-time</span>
                  </div>
                </div>
                <span className="text-[9px] font-black text-slate-200 uppercase tracking-[4px]">Naisiae Textiles Sourcing Protocol v4.0</span>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 md:p-20 gap-6 md:gap-8">
            <div className="relative">
              <div className="absolute inset-0 bg-[#C8961A]/5 blur-3xl rounded-full"></div>
              <div className="w-24 h-24 md:w-32 md:h-32 bg-[#0A1628] rounded-[36px] md:rounded-[48px] flex items-center justify-center text-[#C8961A] relative z-10 shadow-2xl">
                 <Headset size={44} className="md:hidden" />
                 <Headset size={64} className="hidden md:block" />
              </div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-6 md:-inset-10 border border-dashed border-[#C8961A]/10 rounded-full"
              />
            </div>
            <div className="max-w-md space-y-3">
              <h4 className="text-xl md:text-3xl font-display text-[#0A1628]">Support Command Center</h4>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                Connect with clients in real-time. Manage manufacturing enquiries, direct textile sourcing, and logistics support from a single expansive interface.
              </p>
            </div>
            <div className="flex items-center gap-8 md:gap-10">
               <div className="text-center">
                 <div className="text-xl md:text-2xl font-display text-[#C8961A]">{chats.filter(c => c.status === 'active').length}</div>
                 <div className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-1">Pending</div>
               </div>
               <div className="w-[1px] h-8 md:h-10 bg-slate-100"></div>
               <div className="text-center">
                 <div className="text-xl md:text-2xl font-display text-[#0A1628]">{chats.length}</div>
                 <div className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-1">Total History</div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
