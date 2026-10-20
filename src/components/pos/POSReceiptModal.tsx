import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  CheckCircle2, 
  X, 
  Share2, 
  Download, 
  RotateCcw, 
  ShoppingBag, 
  Receipt,
  Phone,
  Check
} from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';

export interface POSSaleRecord {
  ticketNumber: string;
  timestamp: string;
  cashier: string;
  station: string;
  customerName: string;
  customerPhone?: string;
  customerType: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
    customization?: string;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'mpesa' | 'card' | 'credit';
  amountTendered?: number;
  changeDue?: number;
  paymentRef?: string;
}

interface POSReceiptModalProps {
  sale: POSSaleRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onNewSale: () => void;
}

export function POSReceiptModal({ sale, isOpen, onClose, onNewSale }: POSReceiptModalProps) {
  const { formatPrice } = useLocalization();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copiedLink, setCopiedLink] = React.useState(false);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const summary = `*NAISIAE TEXTILES - UHURU MARKET*\nReceipt #${sale.ticketNumber}\nDate: ${sale.timestamp}\nTotal: ${formatPrice(sale.total)}\nPayment: ${sale.paymentMethod.toUpperCase()}\nItems: ${sale.items.length}\nThank you for choosing Naisiae Textiles!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt #${sale.ticketNumber} - Naisiae Textiles`,
          text: summary,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(summary);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#04023D]/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col my-auto border border-slate-200"
        >
          {/* Top Banner */}
          <div className="bg-[#08047D] text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Sale Completed</h3>
                <p className="text-[10px] text-white/70 font-semibold tracking-wide">
                  Receipt #{sale.ticketNumber} · Paid via {sale.paymentMethod.toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Printable Thermal Slip Area */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] bg-slate-50/50">
            <div 
              ref={receiptRef}
              className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-sm font-mono text-[11px] leading-relaxed text-slate-800 print:shadow-none print:border-none print:p-0"
            >
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h2 className="text-base font-black tracking-tight font-sans text-[#08047D]">
                  NAISIAE TEXTILES
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Uhuru Market · Stall 4B, Jogoo Rd, Nairobi</p>
                <p className="text-[10px] text-slate-500">Tel: +254 712 345 678 · PIN: P051892301Z</p>
                <div className="inline-block mt-2 px-2.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                  Official Retail Tax Receipt
                </div>
              </div>

              {/* Receipt Meta */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-bold">{sale.ticketNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date/Time:</span>
                  <span>{sale.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cashier:</span>
                  <span>{sale.cashier} (Station: {sale.station})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold">{sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ''}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-3 border-b border-dashed border-slate-300">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 pb-1.5 border-b border-slate-100">
                  <span>ITEM</span>
                  <span>QTY · PRICE · TOTAL</span>
                </div>
                <div className="space-y-2 mt-2">
                  {sale.items.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex justify-between items-start text-[10.5px]">
                      <div className="pr-2 max-w-[65%]">
                        <div className="font-bold text-slate-900 leading-snug">{item.name}</div>
                        {item.variant && (
                          <div className="text-[9.5px] text-slate-500">{item.variant}</div>
                        )}
                        {item.customization && (
                          <div className="text-[9px] text-[#FA9411] italic">{item.customization}</div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</div>
                        <div className="text-[9.5px] text-slate-500">
                          {item.quantity} × {formatPrice(item.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculation Totals */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatPrice(sale.subtotal)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount:</span>
                    <span>-{formatPrice(sale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>VAT (16% Incl):</span>
                  <span>{formatPrice(sale.tax)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>TOTAL DUE:</span>
                  <span className="text-[#08047D]">{formatPrice(sale.total)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[10.5px]">
                <div className="flex justify-between font-bold">
                  <span>Paid By:</span>
                  <span className="uppercase text-[#08047D]">{sale.paymentMethod}</span>
                </div>
                {sale.amountTendered !== undefined && (
                  <div className="flex justify-between text-slate-600">
                    <span>Amount Tendered:</span>
                    <span>{formatPrice(sale.amountTendered)}</span>
                  </div>
                )}
                {sale.changeDue !== undefined && sale.changeDue > 0 && (
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Change Returned:</span>
                    <span>{formatPrice(sale.changeDue)}</span>
                  </div>
                )}
                {sale.paymentRef && (
                  <div className="flex justify-between text-slate-600">
                    <span>Reference / Code:</span>
                    <span className="font-mono font-bold">{sale.paymentRef}</span>
                  </div>
                )}
              </div>

              {/* Simulated Barcode */}
              <div className="pt-4 text-center">
                <div className="inline-block bg-slate-900 text-white px-6 py-2 rounded text-[10px] tracking-[6px] font-mono">
                  ||||| |||| || ||||| |||||
                </div>
                <p className="text-[9px] text-slate-400 mt-1">*{sale.ticketNumber}*</p>
                <p className="text-[10px] text-slate-600 font-sans font-medium mt-2">
                  Quality uniforms guaranteed. Keep receipt for warranty & fittings.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-3 gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
            >
              <Printer size={15} />
              <span>Print</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
            >
              {copiedLink ? <Check size={15} className="text-emerald-600" /> : <Share2 size={15} />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
            <button
              onClick={onNewSale}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#08047D] hover:bg-[#050259] text-white font-bold text-xs transition-colors shadow-sm"
            >
              <RotateCcw size={15} />
              <span>New Sale</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
