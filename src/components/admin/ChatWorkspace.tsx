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
  Phone
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

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-[#E2E8F0] overflow-hidden flex h-[750px]">
      {/* Sidebar: Chat List */}
      <div className="w-[380px] border-r border-slate-100 flex flex-col bg-[#F8FAFC]">
        <div className="p-8 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-display text-[#0A1628]">Support Queue</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Filter sessions..." 
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold focus:border-[#C8961A] outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {chats.length === 0 ? (
            <div className="py-20 text-center opacity-40">
              <MessageSquare size={32} className="mx-auto mb-4 text-slate-300" />
              <p className="text-[10px] font-black uppercase tracking-widest">No active sessions</p>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`w-full text-left p-5 rounded-[28px] transition-all group relative ${
                  selectedChatId === chat.id 
                    ? 'bg-[#0A1628] text-white shadow-2xl' 
                    : 'bg-white hover:bg-slate-50 text-[#0A1628]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedChatId === chat.id ? 'bg-[#C8961A]/20' : 'bg-[#F1F5F9]'
                    }`}>
                      <User size={18} className={selectedChatId === chat.id ? 'text-[#C8961A]' : 'text-slate-400'} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-widest">{chat.id.replace('user_', 'ID-')}</h4>
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
                <p className={`text-[11px] line-clamp-1 opacity-60 ${selectedChatId === chat.id ? 'text-white' : 'text-slate-500'}`}>
                  {chat.lastMessage || 'No messages yet...'}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChatId ? (
          <>
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0A1628] flex items-center justify-center text-[#C8961A]">
                  <Headset size={28} />
                </div>
                <div>
                  <h4 className="text-2xl font-display text-[#0A1628] tracking-tight">Active Support Session</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">
                      Target: {selectedChatId}
                    </span>
                    <span className="text-[10px] font-bold text-[#C8961A] flex items-center gap-1.5">
                      <ShieldCheck size={12} /> Secure Internal Link
                    </span>
                  </div>
                </div>
              </div>
              <button className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 p-10 overflow-y-auto space-y-6 bg-slate-50/30 custom-scrollbar">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col gap-2 max-w-[70%]">
                    <div className={`flex items-center gap-2 mb-1 ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                       <span className="text-[8px] font-black uppercase tracking-[2px] text-slate-400">
                         {msg.sender === 'admin' ? 'Support Lead' : 'Client Representative'}
                       </span>
                    </div>
                    <div className={`p-5 rounded-[32px] text-sm leading-relaxed shadow-sm ${
                      msg.sender === 'admin' 
                        ? 'bg-[#0A1628] text-white rounded-tr-none' 
                        : 'bg-white text-[#0A1628] border border-slate-100 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Area */}
            <div className="p-8 border-t border-slate-100 shrink-0">
              <form onSubmit={handleSendReply} className="relative">
                <textarea 
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Direct reply to client session..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl pl-8 pr-32 py-5 text-sm font-medium focus:border-[#C8961A] outline-none transition-all resize-none shadow-inner"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                   <button 
                    type="submit"
                    disabled={!reply.trim() || isSending}
                    className="flex items-center gap-3 px-8 py-3.5 bg-[#C8961A] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0A1628] transition-all shadow-xl active:scale-95 disabled:opacity-30"
                  >
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Send</>}
                  </button>
                </div>
              </form>
              <div className="mt-4 flex items-center justify-between px-2">
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
          <div className="h-full flex flex-col items-center justify-center text-center p-20 gap-8">
            <div className="relative">
              <div className="absolute inset-0 bg-[#C8961A]/5 blur-3xl rounded-full"></div>
              <div className="w-32 h-32 bg-[#0A1628] rounded-[48px] flex items-center justify-center text-[#C8961A] relative z-10 shadow-2xl">
                 <Headset size={64} />
              </div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-10 border border-dashed border-[#C8961A]/10 rounded-full"
              />
            </div>
            <div className="max-w-md space-y-4">
              <h4 className="text-3xl font-display text-[#0A1628]">Support Command Center</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Connect with clients in real-time. Manage manufacturing enquiries, direct textile sourcing, and logistics support from a single expansive interface.
              </p>
            </div>
            <div className="flex items-center gap-10">
               <div className="text-center">
                 <div className="text-2xl font-display text-[#C8961A]">{chats.filter(c => c.status === 'active').length}</div>
                 <div className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-1">Pending</div>
               </div>
               <div className="w-[1px] h-10 bg-slate-100"></div>
               <div className="text-center">
                 <div className="text-2xl font-display text-[#0A1628]">{chats.length}</div>
                 <div className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-1">Total History</div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
