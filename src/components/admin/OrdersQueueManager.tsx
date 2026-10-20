import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  ChevronRight, 
  Phone, 
  User, 
  MapPin, 
  CreditCard, 
  Smartphone, 
  Tag, 
  ArrowRight, 
  Trash2, 
  X, 
  Sparkles, 
  Volume2, 
  VolumeX,
  ExternalLink,
  Store,
  Globe
} from 'lucide-react';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../services/firebase';
import { appExperience } from '../../utils/haptics';

export interface AdminOrderRecord {
  id: string;
  orderNumber: string;
  type: 'pos' | 'online';
  source?: string;
  status: 'queued' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerType?: string;
  institution?: string;
  deliveryMethod?: string;
  shippingCountry?: string;
  shippingCity?: string;
  shippingAddress?: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
    customization?: string;
  }[];
  subtotal: number;
  discount?: number;
  deliveryFee?: number;
  tax?: number;
  total: number;
  paymentMethod: string;
  paymentRef?: string;
  paymentStatus?: string;
  mpesaTransactionCode?: string;
  amountTendered?: number;
  changeDue?: number;
  cashier?: string;
  station?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface OrdersQueueManagerProps {
  orders: AdminOrderRecord[];
  setToast: (toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null) => void;
  formatPrice?: (amount: number) => string;
}

export function OrdersQueueManager({
  orders,
  setToast,
  formatPrice = (amount) => `KES ${amount.toLocaleString()}`
}: OrdersQueueManagerProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'queued' | 'preparing' | 'ready' | 'completed'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'pos' | 'online'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Status counts
  const stats = useMemo(() => {
    const queued = orders.filter(o => o.status === 'queued' || !o.status).length;
    const preparing = orders.filter(o => o.status === 'preparing').length;
    const ready = orders.filter(o => o.status === 'ready').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const queuedValuation = orders
      .filter(o => o.status === 'queued' || o.status === 'preparing')
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    return { queued, preparing, ready, completed, queuedValuation };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Tab filter
      if (activeTab === 'queued' && order.status !== 'queued' && order.status) return false;
      if (activeTab === 'preparing' && order.status !== 'preparing') return false;
      if (activeTab === 'ready' && order.status !== 'ready') return false;
      if (activeTab === 'completed' && order.status !== 'completed') return false;

      // Source filter
      if (sourceFilter === 'pos' && order.type !== 'pos') return false;
      if (sourceFilter === 'online' && order.type !== 'online') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesOrderNum = (order.orderNumber || '').toLowerCase().includes(query);
        const matchesName = (order.customerName || '').toLowerCase().includes(query);
        const matchesPhone = (order.customerPhone || '').toLowerCase().includes(query);
        const matchesSchool = (order.institution || '').toLowerCase().includes(query);
        const matchesItems = order.items?.some(i => i.name.toLowerCase().includes(query));
        const matchesRef = (order.paymentRef || order.mpesaTransactionCode || '').toLowerCase().includes(query);

        return matchesOrderNum || matchesName || matchesPhone || matchesSchool || matchesItems || matchesRef;
      }

      return true;
    });
  }, [orders, activeTab, sourceFilter, searchQuery]);

  // Advance Order Status
  const handleAdvanceStatus = async (order: AdminOrderRecord, nextStatus: AdminOrderRecord['status']) => {
    try {
      appExperience.triggerFeedback('tap');
      await updateDoc(doc(db, 'orders', order.id), {
        status: nextStatus,
        updatedAt: serverTimestamp()
      });

      if (soundEnabled) {
        appExperience.playSound('success');
      }

      const statusLabels: Record<string, string> = {
        preparing: 'Sewing / In Production',
        ready: 'Ready for Pickup / Dispatch',
        completed: 'Completed & Fulfilled',
        cancelled: 'Cancelled'
      };

      setToast({
        message: `Order #${order.orderNumber} updated to ${statusLabels[nextStatus] || nextStatus}!`,
        type: 'success'
      });

      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status: nextStatus });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
      setToast({ message: 'Could not update order status.', type: 'error' });
    }
  };

  // Delete / Archive Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order record?')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      if (selectedOrder?.id === orderId) {
        setIsDetailModalOpen(false);
        setSelectedOrder(null);
      }
      setToast({ message: 'Order removed from queue.', type: 'info' });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
      setToast({ message: 'Failed to delete order.', type: 'error' });
    }
  };

  // Format timestamp safely
  const formatTimestamp = (ts: any) => {
    if (!ts) return 'Just now';
    if (ts.toDate) {
      const d = ts.toDate();
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (typeof ts === 'string') return ts;
    return 'Recently';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
            Queued (Pending)
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            In Production
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
            Ready for Pickup
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
            Queued
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Stats & Live Queue Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Queued Active Orders */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Live Active Queue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Clock size={16} className="animate-spin-slow" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.queued}</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Pending initial preparation</p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full pointer-events-none" />
        </div>

        {/* In Workshop / Sewing */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">In Production / Sewing</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Sparkles size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.preparing}</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Stitching & cutting batches</p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full pointer-events-none" />
        </div>

        {/* Ready for Pickup / Dispatch */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Ready for Pickup</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Store size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.ready}</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">At Uhuru Market Stall or packed</p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full pointer-events-none" />
        </div>

        {/* Queued Order Valuation */}
        <div className="bg-gradient-to-br from-[#08047D] to-[#120a8f] text-white p-5 rounded-2xl shadow-lg shadow-[#08047D]/20 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">Active Queue Value</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 text-[#FA9411] flex items-center justify-center font-bold">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-2xl xl:text-3xl font-black text-white">{formatPrice(stats.queuedValuation)}</p>
          <p className="text-[11px] font-semibold text-blue-200 mt-1">{orders.length} lifetime orders placed</p>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
        </div>
      </div>

      {/* 2. Controls & Search Filter Bar */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Status Tabs & Sound Control */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-[#08047D] text-white shadow-md' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('queued')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'queued' 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTab === 'queued' ? 'bg-white' : 'bg-amber-500 animate-ping'}`} />
              Queued ({stats.queued})
            </button>
            <button
              onClick={() => setActiveTab('preparing')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'preparing' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              In Production ({stats.preparing})
            </button>
            <button
              onClick={() => setActiveTab('ready')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'ready' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              Ready ({stats.ready})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'completed' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Completed ({stats.completed})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              {soundEnabled ? <Volume2 size={16} className="text-emerald-600" /> : <VolumeX size={16} className="text-slate-400" />}
              <span>{soundEnabled ? 'Audio Alerts: ON' : 'Audio Muted'}</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Source Selector */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input 
              type="text"
              placeholder="Search by Order #, Customer Name, Phone, School, or Items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#08047D] outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Source Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0">
            <button
              onClick={() => setSourceFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sourceFilter === 'all' ? 'bg-white text-[#08047D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Sources
            </button>
            <button
              onClick={() => setSourceFilter('pos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                sourceFilter === 'pos' ? 'bg-white text-[#08047D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store size={13} className="text-[#08047D]" />
              <span>POS Till</span>
            </button>
            <button
              onClick={() => setSourceFilter('online')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                sourceFilter === 'online' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe size={13} className="text-emerald-600" />
              <span>Online Store</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Orders List Table & Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <ShoppingBag size={28} />
            </div>
            <h4 className="text-base font-bold text-slate-800">No Orders in this Queue</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery 
                ? `No orders matching "${searchQuery}". Clear your search query to see all queued orders.` 
                : 'When new orders are made in the POS checkout or online store, they will automatically appear in this live queue!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Ticket / Order #</th>
                  <th className="px-5 py-4">Source</th>
                  <th className="px-5 py-4">Customer Details</th>
                  <th className="px-5 py-4">Items Summary</th>
                  <th className="px-5 py-4">Amount & Payment</th>
                  <th className="px-5 py-4">Queue Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredOrders.map((order) => {
                  const isQueued = order.status === 'queued' || !order.status;
                  const isPreparing = order.status === 'preparing';
                  const isReady = order.status === 'ready';

                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isQueued ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Ticket # & Timestamp */}
                      <td className="px-5 py-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{order.orderNumber || order.id.slice(0, 8)}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {formatTimestamp(order.createdAt)}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="px-5 py-4">
                        {order.type === 'pos' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#08047D] text-[10px] font-bold border border-blue-100">
                            <Store size={12} />
                            <span>Uhuru Stall Till</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-100">
                            <Globe size={12} />
                            <span>Online Checkout</span>
                          </span>
                        )}
                      </td>

                      {/* Customer Details */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{order.customerName || 'Walk-in Customer'}</div>
                        {order.customerPhone && (
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone size={11} className="text-slate-400" />
                            <span>{order.customerPhone}</span>
                          </div>
                        )}
                        {order.institution && (
                          <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                            🏛️ {order.institution}
                          </div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black">
                            {order.items?.length || 0} {order.items?.length === 1 ? 'line' : 'lines'}
                          </span>
                          <span className="text-slate-600 font-bold truncate max-w-[180px]">
                            {order.items?.[0]?.name || 'Apparel item'}
                          </span>
                        </div>
                        {order.items && order.items.length > 1 && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            +{order.items.length - 1} more items
                          </span>
                        )}
                      </td>

                      {/* Amount & Payment */}
                      <td className="px-5 py-4">
                        <div className="font-black text-slate-900">{formatPrice(order.total)}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          {order.paymentMethod?.toLowerCase().includes('mpesa') ? (
                            <span className="text-emerald-600 font-bold">🟢 M-Pesa</span>
                          ) : (
                            <span className="text-slate-600 font-bold">💵 Cash</span>
                          )}
                          {(order.paymentRef || order.mpesaTransactionCode) && (
                            <span className="font-mono text-[9px] bg-slate-100 px-1 rounded">
                              {order.paymentRef || order.mpesaTransactionCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Queue Status */}
                      <td className="px-5 py-4">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Workflow Transition Button */}
                          {isQueued && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceStatus(order, 'preparing')}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                              title="Start sewing / preparation"
                            >
                              <span>Start Prep</span>
                              <ArrowRight size={12} />
                            </button>
                          )}

                          {isPreparing && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceStatus(order, 'ready')}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                              title="Mark as ready for customer pickup"
                            >
                              <span>Mark Ready</span>
                              <ArrowRight size={12} />
                            </button>
                          )}

                          {isReady && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceStatus(order, 'completed')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                              title="Mark as completed & fulfilled"
                            >
                              <span>Complete</span>
                              <CheckCircle2 size={12} />
                            </button>
                          )}

                          {/* View Full Job Card / Details */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-[#08047D] hover:bg-slate-100 transition-all cursor-pointer"
                            title="Inspect Order Details & Items"
                          >
                            <ExternalLink size={16} />
                          </button>

                          {/* Delete Order */}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                            title="Archive / Delete Order"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Order Details & Workshop Card Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setIsDetailModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-[#08047D] to-[#120a8f] text-white flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-base font-black">
                      Order #{selectedOrder.orderNumber || selectedOrder.id}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold">
                      {selectedOrder.type === 'pos' ? 'POS Till' : 'Online'}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200 mt-0.5">
                    Placed: {formatTimestamp(selectedOrder.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                    title="Print Workshop Ticket"
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Status Switcher Bar */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Current Status:</span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {selectedOrder.status !== 'queued' && (
                      <button
                        onClick={() => handleAdvanceStatus(selectedOrder, 'queued')}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                      >
                        Queue
                      </button>
                    )}
                    {selectedOrder.status !== 'preparing' && (
                      <button
                        onClick={() => handleAdvanceStatus(selectedOrder, 'preparing')}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                      >
                        Prep
                      </button>
                    )}
                    {selectedOrder.status !== 'ready' && (
                      <button
                        onClick={() => handleAdvanceStatus(selectedOrder, 'ready')}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                      >
                        Ready
                      </button>
                    )}
                    {selectedOrder.status !== 'completed' && (
                      <button
                        onClick={() => handleAdvanceStatus(selectedOrder, 'completed')}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer Information Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Customer Profile</span>
                    <p className="font-bold text-slate-900 text-sm">{selectedOrder.customerName || 'Walk-in Customer'}</p>
                    {selectedOrder.customerPhone && (
                      <p className="text-xs text-slate-600 font-mono flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400" />
                        <a href={`tel:${selectedOrder.customerPhone}`} className="hover:underline text-blue-600">
                          {selectedOrder.customerPhone}
                        </a>
                      </p>
                    )}
                    {selectedOrder.customerEmail && (
                      <p className="text-xs text-slate-500 truncate">{selectedOrder.customerEmail}</p>
                    )}
                    {selectedOrder.institution && (
                      <p className="text-xs font-semibold text-indigo-700">School: {selectedOrder.institution}</p>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Fulfillment / Station</span>
                    <p className="font-bold text-slate-900 text-sm">
                      {selectedOrder.source || 'Uhuru Market Stall 4B'}
                    </p>
                    {selectedOrder.shippingAddress && (
                      <p className="text-xs text-slate-600 flex items-start gap-1.5 leading-snug">
                        <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>{selectedOrder.shippingAddress}, {selectedOrder.shippingCity}</span>
                      </p>
                    )}
                    {selectedOrder.paymentRef && (
                      <p className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                        Tx Ref: {selectedOrder.paymentRef}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Ordered List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Ordered Garments & Tailoring Lines ({selectedOrder.items?.length || 0})
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-xs truncate">{item.name}</p>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                            {item.variant && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold">
                                {item.variant}
                              </span>
                            )}
                            {item.customization && (
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-medium border border-amber-200">
                                ✏️ {item.customization}
                              </span>
                            )}
                            <span>{formatPrice(item.price)} each</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-slate-900 font-mono">
                            Qty: {item.quantity}
                          </span>
                          <span className="text-xs font-bold text-slate-700 block font-mono">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount ? (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount:</span>
                      <span>-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  ) : null}
                  {selectedOrder.deliveryFee ? (
                    <div className="flex justify-between text-slate-300">
                      <span>Courier Delivery Fee:</span>
                      <span>{formatPrice(selectedOrder.deliveryFee)}</span>
                    </div>
                  ) : null}
                  <div className="border-t border-white/10 pt-2 flex justify-between items-center text-sm font-black text-white">
                    <span className="text-[#FA9411]">Total Charged:</span>
                    <span className="text-xl text-emerald-400">{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <strong>Special Instructions:</strong> {selectedOrder.notes}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  className="px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Delete Order
                </button>
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#08047D] hover:bg-[#050259] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
